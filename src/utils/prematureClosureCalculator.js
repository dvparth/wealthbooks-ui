/**
 * Premature Closure Calculator
 * 
 * Handles interest recalculation and payout computation for investments
 * closed before their maturity date.
 */

import { calculateFdMaturity } from './calculateFdMaturity.js';

/**
 * Calculate recalculated interest for premature closure
 * 
 * @param {Object} investment - Investment object
 * @param {string} closureDate - ISO 8601 date string (YYYY-MM-DD)
 * @param {number} [penaltyRate] - Optional interest rate reduction (percentage)
 * @returns {Object} { interestEarned, effectiveRate, explanation }
 */
export const calculatePrematureInterest = (investment, closureDate, penaltyRate = 0) => {
  if (!investment || !investment.startDate || !closureDate) {
    return { interestEarned: 0, effectiveRate: 0, explanation: 'Missing dates' };
  }

  const { principal, interestRate, calculationMode = 'fractional', compounding = 'no', interestCalculationFrequency } = investment;

  // Effective rate after penalty
  const effectiveRate = Math.max(0, interestRate - (penaltyRate || 0));

  if (effectiveRate === 0) {
    return {
      interestEarned: 0,
      effectiveRate: 0,
      explanation: 'Effective rate is 0 after penalty',
    };
  }

  // Helper: parse YYYY-MM-DD to Date
  const parseDate = (dateStr) => {
    const parts = dateStr.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  // Calculate days held from start to closure
  const startDateObj = parseDate(investment.startDate);
  const closureDateObj = parseDate(closureDate);

  if (closureDateObj <= startDateObj) {
    return {
      interestEarned: 0,
      effectiveRate: effectiveRate,
      explanation: 'Closure date is not after start date',
    };
  }

  const daysHeld = Math.floor((closureDateObj - startDateObj) / (24 * 60 * 60 * 1000));

  // Interest calculation logic based on compounding setting
  if (compounding === 'no') {
    // Simple interest: principal × rate × (daysHeld / 365)
    const interestEarned = principal * (effectiveRate / 100) * (daysHeld / 365);
    return {
      interestEarned: Math.round(interestEarned * 100) / 100,
      effectiveRate: effectiveRate,
      explanation: {
        method: 'Simple Interest',
        principal,
        rate: effectiveRate,
        daysHeld,
        formula: `${principal} × ${effectiveRate}% × (${daysHeld} / 365)`,
      },
    };
  } else {
    // Compound interest: use fractional compounding up to closure date
    // Try to use the same calculation as FD maturity but with closure date
    try {
      const compoundingFreq = 
        interestCalculationFrequency === 'quarterly' ? 4 :
        interestCalculationFrequency === 'monthly' ? 12 :
        interestCalculationFrequency === 'yearly' ? 1 :
        4; // Default to quarterly

      const result = calculateFdMaturity({
        principal,
        annualRatePercent: effectiveRate,
        startDate: investment.startDate,
        maturityDate: closureDate,
        compoundingFrequencyPerYear: compoundingFreq,
      });

      return {
        interestEarned: result.interestEarned,
        effectiveRate: effectiveRate,
        explanation: {
          method: 'Compound Interest',
          principal,
          rate: effectiveRate,
          daysHeld,
          compoundingFreq,
          maturityAmount: result.maturityAmount,
          formula: `Principal × (1 + rate/freq)^(daysHeld/365 × freq)`,
        },
      };
    } catch (e) {
      // Fallback to simple interest if compounding calculation fails
      const interestEarned = principal * (effectiveRate / 100) * (daysHeld / 365);
      return {
        interestEarned: Math.round(interestEarned * 100) / 100,
        effectiveRate: effectiveRate,
        explanation: `Fallback to simple interest: ${e.message}`,
      };
    }
  }
};

/**
 * Calculate final payout for premature closure
 * 
 * @param {Object} investment - Investment object
 * @param {string} closureDate - ISO 8601 date string (YYYY-MM-DD)
 * @param {number} [penaltyRate] - Optional interest rate reduction (percentage)
 * @param {number} [penaltyAmount] - Optional fixed penalty to deduct
 * @returns {Object} { finalPayout, recalculatedInterest, penalties, explanation }
 */
export const calculatePrematureClosurePayout = (investment, closureDate, penaltyRate = 0, penaltyAmount = 0) => {
  if (!investment || !investment.principal) {
    return {
      finalPayout: 0,
      recalculatedInterest: 0,
      penalties: 0,
      explanation: 'Invalid investment',
    };
  }

  const { principal } = investment;

  // Step 1: Calculate recalculated interest
  const interestCalc = calculatePrematureInterest(investment, closureDate, penaltyRate);
  const recalculatedInterest = interestCalc.interestEarned || 0;

  // Step 2: Calculate total penalties
  const totalPenalty = (penaltyAmount || 0);

  // Step 3: Calculate final payout
  // finalPayout = principal + recalculatedInterest - totalPenalty
  const finalPayout = principal + recalculatedInterest - totalPenalty;

  return {
    finalPayout: Math.max(0, finalPayout), // Never negative
    recalculatedInterest: Math.max(0, recalculatedInterest),
    penalties: totalPenalty,
    effectiveRate: interestCalc.effectiveRate,
    explanation: {
      principal,
      recalculatedInterest: Math.max(0, recalculatedInterest),
      penaltyRate: penaltyRate || 0,
      penaltyAmount: penaltyAmount || 0,
      totalPenalty,
      finalPayout: Math.max(0, finalPayout),
      formula: `${principal} + ${Math.max(0, recalculatedInterest)} - ${totalPenalty} = ${Math.max(0, finalPayout)}`,
    },
  };
};

/**
 * Validate premature closure inputs
 * 
 * @param {Object} investment - Investment object
 * @param {string} closureDate - ISO 8601 date string
 * @param {number} [penaltyRate] - Optional penalty rate
 * @param {number} [penaltyAmount] - Optional penalty amount
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validatePrematureClosure = (investment, closureDate, penaltyRate, penaltyAmount) => {
  const errors = [];

  if (!investment) {
    errors.push('Investment is required');
    return { isValid: false, errors };
  }

  if (!closureDate) {
    errors.push('Closure date is required');
  }

  const parseDate = (dateStr) => {
    const parts = dateStr.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  if (closureDate && investment.startDate) {
    const closureDateObj = parseDate(closureDate);
    const startDateObj = parseDate(investment.startDate);

    if (closureDateObj <= startDateObj) {
      errors.push(`Closure date (${closureDate}) must be after start date (${investment.startDate})`);
    }
  }

  if (closureDate && investment.maturityDate) {
    const closureDateObj = parseDate(closureDate);
    const maturityDateObj = parseDate(investment.maturityDate);

    if (closureDateObj >= maturityDateObj) {
      errors.push(`Closure date (${closureDate}) must be before maturity date (${investment.maturityDate})`);
    }
  }

  if (penaltyRate !== undefined && penaltyRate < 0) {
    errors.push('Penalty rate cannot be negative');
  }

  if (penaltyRate !== undefined && penaltyRate > 100) {
    errors.push('Penalty rate cannot exceed 100%');
  }

  if (penaltyAmount !== undefined && penaltyAmount < 0) {
    errors.push('Penalty amount cannot be negative');
  }

  // Check that final payout is not negative
  if (!errors.length && closureDate) {
    const payout = calculatePrematureClosurePayout(investment, closureDate, penaltyRate, penaltyAmount);
    if (payout.finalPayout < 0) {
      errors.push(`Final payout cannot be negative (current: ${payout.finalPayout})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get closure diagnostics for display/debugging
 * 
 * @param {Object} investment - Investment object
 * @param {Object} prematureClosure - Premature closure data
 * @returns {Object} Diagnostics info
 */
export const getClosureDiagnostics = (investment, prematureClosure) => {
  if (!investment || !prematureClosure || !prematureClosure.isClosed) {
    return null;
  }

  const parseDate = (dateStr) => {
    const parts = dateStr.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  const startDate = parseDate(investment.startDate);
  const closureDate = parseDate(prematureClosure.closureDate);
  const maturityDate = parseDate(investment.maturityDate);

  const daysHeld = Math.floor((closureDate - startDate) / (24 * 60 * 60 * 1000));
  const daysToMaturity = Math.floor((maturityDate - startDate) / (24 * 60 * 60 * 1000));
  const percentageHeld = (daysHeld / daysToMaturity * 100).toFixed(2);

  return {
    originalStartDate: investment.startDate,
    originalMaturityDate: investment.maturityDate,
    closureDate: prematureClosure.closureDate,
    daysHeld,
    daysToMaturity,
    percentageHeld: `${percentageHeld}%`,
    principal: investment.principal,
    originalRate: investment.interestRate,
    penaltyRate: prematureClosure.penaltyRate || 0,
    effectiveRate: (investment.interestRate - (prematureClosure.penaltyRate || 0)),
    recalculatedInterest: prematureClosure.recalculatedInterest || 0,
    penaltyAmount: prematureClosure.penaltyAmount || 0,
    finalPayout: prematureClosure.finalPayout || 0,
  };
};
