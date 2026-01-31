import { generateId } from '../models/constants.js';

/**
 * BANKING-GRADE INTEREST SCHEDULE GENERATOR
 * 
 * STRICT RULES:
 * 1. Quarterly periods ONLY on calendar quarter ends (31 Mar, 30 Jun, 30 Sep, 31 Dec)
 * 2. One result per period: confirmed XOR accrued XOR expected
 * 3. Accrued = earned but unpaid, only at FY end (31 Mar) or maturity
 * 4. If confirmed exists for period → suppress accrued and expected
 * 5. Timeline ordered by: date → type priority (confirmed → accrued → expected)
 * 
 * @param {Object} investment
 * @param {Array} confirmedCashflows
 * @returns {Array} Strict ordering: date first, type second
 */
export function generateExpectedInterestSchedule(investment, confirmedCashflows = []) {
  if (!investment || !investment.principal || !investment.interestRate) {
    return [];
  }

  const { id, principal, interestRate, startDate, maturityDate, interestCalculationFrequency = 'yearly', interestPayoutFrequency = 'maturity', externalInvestmentId } = investment;

  const schedule = [];
  const start = new Date(startDate);
  const maturity = new Date(maturityDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ========== HELPERS ==========
  
  const getMonthEnd = (year, month) => {
    const firstOfNext = new Date(Date.UTC(year, month + 1, 1));
    firstOfNext.setUTCSeconds(firstOfNext.getUTCSeconds() - 1);
    return firstOfNext;
  };

  const getNextQuarterEnd = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month < 2) return getMonthEnd(year, 2); // Mar 31
    if (month < 5) return getMonthEnd(year, 5); // Jun 30
    if (month < 8) return getMonthEnd(year, 8); // Sep 30
    if (month < 11) return getMonthEnd(year, 11); // Dec 31
    return getMonthEnd(year + 1, 2); // Next Mar 31
  };

  const getFYEnd = (year) => getMonthEnd(year, 2); // 31 Mar

  const getFinancialYear = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month >= 3) return `FY${year}-${String(year + 1).slice(-2)}`;
    return `FY${year - 1}-${String(year).slice(-2)}`;
  };

  const isConfirmedForPeriod = (periodEnd, type = 'interest') => {
    const dateStr = periodEnd.toISOString().split('T')[0];
    return confirmedCashflows.some((cf) => {
      const cfDate = cf.date.split('T')[0];
      return cfDate === dateStr && cf.type === type && cf.status === 'confirmed';
    });
  };

  const calculateInterestForPeriod = (periodStart, periodEnd, basePrincipal = principal) => {
    const days = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
    return (basePrincipal * interestRate * days) / (100 * 365);
  };

  // ========== GENERATE CALENDAR PERIODS ==========
  
  const generateCalendarPeriods = () => {
    const periods = [];
    let periodStart = new Date(start);

    if (interestCalculationFrequency === 'quarterly') {
      // Dev logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`[InterestEngine] ${externalInvestmentId || id} - Quarterly periods from ${start.toISOString().split('T')[0]}:`);
      }

      while (periodStart < maturity) {
        let periodEnd = getNextQuarterEnd(periodStart);
        if (periodEnd > maturity) periodEnd = new Date(maturity);

        if (process.env.NODE_ENV === 'development') {
          console.log(`  → ${periodEnd.toISOString().split('T')[0]}`);
        }

        periods.push({
          start: new Date(periodStart),
          end: new Date(periodEnd),
          isProrated: periodStart.getTime() !== start.getTime() ? false : true, // First period is prorated
        });

        if (periodEnd >= maturity) break;
        periodStart = new Date(periodEnd);
        periodStart.setDate(periodStart.getDate() + 1);
      }
    } else if (interestCalculationFrequency === 'monthly') {
      while (periodStart < maturity) {
        const year = periodStart.getFullYear();
        const month = periodStart.getMonth();
        let periodEnd = getMonthEnd(year, month);
        if (periodEnd > maturity) periodEnd = new Date(maturity);

        periods.push({
          start: new Date(periodStart),
          end: new Date(periodEnd),
          isProrated: periodStart.getTime() !== start.getTime() ? false : true,
        });

        if (periodEnd >= maturity) break;
        periodStart = new Date(periodEnd);
        periodStart.setDate(periodStart.getDate() + 1);
      }
    } else if (interestCalculationFrequency === 'yearly') {
      while (periodStart < maturity) {
        const year = periodStart.getFullYear();
        let periodEnd = getFYEnd(year);
        if (periodEnd <= periodStart) periodEnd = getFYEnd(year + 1);
        if (periodEnd > maturity) periodEnd = new Date(maturity);

        periods.push({
          start: new Date(periodStart),
          end: new Date(periodEnd),
          isProrated: periodStart.getTime() !== start.getTime() ? false : true,
        });

        if (periodEnd >= maturity) break;
        periodStart = new Date(periodEnd);
        periodStart.setDate(periodStart.getDate() + 1);
      }
    }

    return periods;
  };

  // ========== ACCRUAL GENERATION (ONLY AT FY END) ==========
  
  const generateAccrualIfEarned = (periodEnd, periodStart, basePrincipal = principal) => {
    if (periodEnd > today) return null; // Future periods: no accrual
    if (isConfirmedForPeriod(periodEnd, 'interest')) return null; // Confirmed exists: suppress accrual

    // CRITICAL: Accrual ONLY at FY end (31 Mar) or maturity
    const isFYEnd = periodEnd.getMonth() === 2 && periodEnd.getDate() === 31;
    const isMaturity = periodEnd.getTime() === maturity.getTime();

    if (!isFYEnd && !isMaturity) return null; // Not FY end, not maturity: no accrual

    const fy = getFinancialYear(periodEnd);
    const amount = calculateInterestForPeriod(periodStart, periodEnd, basePrincipal);

    return {
      id: `accrued-${generateId()}`,
      investmentId: id,
      date: periodEnd.toISOString().split('T')[0],
      type: 'accrued',
      amount: Math.round(amount * 100) / 100,
      source: 'system',
      status: 'planned',
      isPreview: false,
      label: 'Accrued Interest',
      fy,
      typePriority: 2, // For sorting: confirmed (1) → accrued (2) → expected (3)
    };
  };

  // ========== MAIN LOGIC ==========

  const periods = generateCalendarPeriods();

  if (interestPayoutFrequency === 'maturity') {
    // MATURITY PAYOUT: enforce compounding guardrail for cumulative investments
    // Running principal compounds every calculation period (even if interest is not paid out)
    let runningPrincipal = principal;
    let previousInterest = null;

    periods.forEach((period, idx) => {
      const periodEnd = new Date(period.end);
      periodEnd.setHours(0, 0, 0, 0);

      const periodStart = new Date(period.start);

      // Check for a confirmed interest entry for this period
      const confirmedCf = confirmedCashflows.find((cf) => {
        const cfDate = cf.date.split('T')[0];
        return cf.investmentId === id && cf.type === 'interest' && cf.status === 'confirmed' && cfDate === periodEnd.toISOString().split('T')[0];
      });

      // Calculate interest based on current runningPrincipal (compounding)
      const calculatedInterest = Math.round(calculateInterestForPeriod(periodStart, periodEnd, runningPrincipal) * 100) / 100;

      // DEV guard: detect flat interest across consecutive periods
      if (process.env.NODE_ENV === 'development' && previousInterest !== null && calculatedInterest === previousInterest) {
        console.warn(`[InterestEngine] ⚠ ${externalInvestmentId || id}: Compounding broken - equal interest ${calculatedInterest} in consecutive periods`);
      }
      // DEV guard: detect decreasing interest across periods (can indicate day-count variance or mock-data mismatch)
      if (process.env.NODE_ENV === 'development' && previousInterest !== null && calculatedInterest < previousInterest) {
        console.warn(`[InterestEngine] ⚠ ${externalInvestmentId || id}: Compounding produced smaller interest (${calculatedInterest}) than previous period (${previousInterest}). This can occur due to shorter day-counts; verify mock confirmed amounts.`);
      }

      // If a confirmed cashflow exists, use its amount and suppress accrual/expected
      if (confirmedCf) {
        // Do NOT push confirmed cashflows into schedule here to avoid duplication
        // The UI / caller is expected to supply confirmed cashflows separately.
        // Update runningPrincipal using confirmed amount for compounding only.
        runningPrincipal = Math.round((runningPrincipal + Number(confirmedCf.amount)) * 100) / 100;
        previousInterest = Number(confirmedCf.amount);
        return; // skip accrual/expected generation for this period
      }

      // No confirmed cashflow: generate accrual if past FY-end/maturity, else expected if future
      const isFuture = periodEnd > today;
      const accrual = generateAccrualIfEarned(periodEnd, periodStart, runningPrincipal);
      if (accrual) {
        schedule.push(accrual);
      }

      if (isFuture) {
        // Expected should reflect compounding base (runningPrincipal)
        schedule.push({
          id: `expected-${generateId()}`,
          investmentId: id,
          date: periodEnd.toISOString().split('T')[0],
          type: 'interest',
          amount: calculatedInterest,
          source: 'system',
          status: 'planned',
          isPreview: true,
          label: 'Expected Interest',
          fy: getFinancialYear(periodEnd),
          typePriority: 3,
          periodNote: idx === 0 && period.isProrated
            ? `Prorated: ${period.start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${periodEnd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
            : undefined,
        });
      }

      // After reporting (accrual/expected), update running principal — compounding continues regardless of payout
      const previousRunning = runningPrincipal;
      runningPrincipal = Math.round((runningPrincipal + calculatedInterest) * 100) / 100;

      // DEV guard: ensure runningPrincipal updated
      if (process.env.NODE_ENV === 'development' && runningPrincipal === previousRunning) {
        throw new Error(`[InterestEngine] Compounding guardrail violated for ${externalInvestmentId || id}: runningPrincipal did not update for period ending ${periodEnd.toISOString().split('T')[0]}`);
      }

      previousInterest = calculatedInterest;
    });

    // Maturity payout: final runningPrincipal (principal + all compounded interest)
    if (maturity > today && !isConfirmedForPeriod(maturity, 'interest')) {
      const fy = getFinancialYear(maturity);
      schedule.push({
        id: `maturity-${generateId()}`,
        investmentId: id,
        date: maturity.toISOString().split('T')[0],
        type: 'maturity',
        amount: Math.round(runningPrincipal * 100) / 100,
        source: 'system',
        status: 'planned',
        isPreview: true,
        label: 'Maturity Payout (Principal + Compounded Interest)',
        fy,
        typePriority: 3,
      });
    }
  } else {
    // PERIODIC PAYOUT: Interest every period
    periods.forEach((period, idx) => {
      const periodEnd = new Date(period.end);
      periodEnd.setHours(0, 0, 0, 0);

      // If confirmed exists, use it (already in mock data)
      if (isConfirmedForPeriod(periodEnd, 'interest')) {
        // Don't generate, confirmed already in schedule
        return;
      }

      // Generate expected for future periods
      if (periodEnd >= today) {
        const amount = calculateInterestForPeriod(period.start, period.end);
        const fy = getFinancialYear(periodEnd);

        schedule.push({
          id: `expected-periodic-${generateId()}`,
          investmentId: id,
          date: periodEnd.toISOString().split('T')[0],
          type: 'interest',
          amount: Math.round(amount * 100) / 100,
          source: 'system',
          status: 'planned',
          isPreview: true,
          label: `Expected (${interestCalculationFrequency})`,
          fy,
          typePriority: 3,
          periodNote: idx === 0 && period.isProrated
            ? `Prorated: ${period.start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${periodEnd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
            : undefined,
        });
      }
    });
  }

  // ========== STRICT ORDERING: DATE THEN TYPE PRIORITY ==========
  schedule.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    // Same date: sort by type priority (confirmed=1, accrued=2, expected=3)
    const priorityA = a.typePriority || 3;
    const priorityB = b.typePriority || 3;
    return priorityA - priorityB;
  });

  // ========== GUARDRAILS: DETECT VIOLATIONS ==========
  if (process.env.NODE_ENV === 'development') {
    // Check for confirmed interest dates that are not valid period ends
    const confirmedInterest = confirmedCashflows.filter(cf => cf.investmentId === id && cf.type === 'interest' && cf.status === 'confirmed');
    confirmedInterest.forEach((cf) => {
      const date = new Date(cf.date);
      const isFYEnd = date.getMonth() === 2 && date.getDate() === 31;
      const isQuarterEnd = 
        (date.getDate() === 31 && date.getMonth() === 2) || // 31 Mar
        (date.getDate() === 30 && date.getMonth() === 5) || // 30 Jun
        (date.getDate() === 30 && date.getMonth() === 8) || // 30 Sep
        (date.getDate() === 31 && date.getMonth() === 11);  // 31 Dec
      const isMonthEnd = date.getDate() === new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      
      const isValidEnd = isQuarterEnd || isMonthEnd || isFYEnd || date.getTime() === maturity.getTime();
      
      if (!isValidEnd && interestCalculationFrequency === 'quarterly') {
        console.warn(`[InterestEngine] ⚠ ${externalInvestmentId || id}: Confirmed interest on ${cf.date} is NOT a quarter end (expected 31 Mar, 30 Jun, 30 Sep, or 31 Dec)`);
      }
    });

    // Check for accrued in future
    schedule.forEach((row) => {
      if (row.type === 'accrued' && new Date(row.date) > today) {
        console.warn(`[InterestEngine] ⚠ ${externalInvestmentId || id}: Accrued interest generated for future date ${row.date}`);
      }
    });

    // Check for duplicate periods
    const periodMap = new Map();
    schedule.forEach((row) => {
      if (row.type === 'interest' || row.type === 'accrued') {
        const key = `${row.date}-${row.type}`;
        if (periodMap.has(key)) {
          console.warn(`[InterestEngine] ⚠ ${externalInvestmentId || id}: Duplicate period ${row.date} type ${row.type}`);
        }
        periodMap.set(key, true);
      }
    });
  }

  return schedule;
}
