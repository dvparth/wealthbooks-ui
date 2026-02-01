import { generateId } from '../models/constants.js'

/**
 * INDIAN BANK FIXED DEPOSIT INTEREST CALCULATOR
 *
 * Implements quarterly compounding per RBI guidelines:
 * - Compounding happens at each quarter end (31 Mar, 30 Jun, 30 Sep, 31 Dec)
 * - Formula: For each full quarter: Amount = Amount × (1 + rate/400)
 * - Remainder: simpleInterest = Amount × rate × (remainingDays / 36500)
 * - Maturity = Amount after all quarters + remainder interest
 *
 * Accrual timing (for tax): Amount earned by 31 Mar of each FY
 */

export function calculateQuarterlyCompoundedMaturity(principal, rate, startDate, maturityDate) {
  // Parse dates as local dates (YYYY-MM-DD format)
  const parseLocalDate = (dateStr) => {
    const parts = dateStr.split('-')
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  }

  const start = parseLocalDate(startDate)
  const maturity = parseLocalDate(maturityDate)
  
  // Helper to get actual month-end date (correctly handles month boundaries)
  const getMonthEnd = (year, month) => {
    // month is 0-indexed
    const d = new Date(year, month + 1, 1)
    d.setDate(0) // Go back 1 day to last day of previous month
    return d
  }

  // Find all quarter ends strictly between start and maturity
  // Quarter months: 2=Mar, 5=Jun, 8=Sep, 11=Dec (0-indexed)
  const fullQuarters = []
  const quarterMonths = [2, 5, 8, 11]

  let y = start.getFullYear()
  while (y <= maturity.getFullYear() + 1) {
    for (const m of quarterMonths) {
      const qDate = getMonthEnd(y, m)
      // Count quarter only if it's strictly between start (exclusive) and maturity (exclusive)
      if (qDate > start && qDate < maturity) {
        fullQuarters.push(qDate)
      }
    }
    y++
  }

  // Sort quarter ends chronologically (should already be sorted, but just in case)
  fullQuarters.sort((a, b) => a.getTime() - b.getTime())

  // Apply compounding for each full quarter crossed
  let amount = principal
  for (const quarter of fullQuarters) {
    // Quarterly rate = annual rate / 4 / 100 = annual rate / 400
    amount = amount * (1 + rate / 400)
  }

  // Calculate remainder days and interest after last full quarter
  let remainderStart = start
  if (fullQuarters.length > 0) {
    remainderStart = fullQuarters[fullQuarters.length - 1]
  }

  const remainderDays = Math.floor((maturity - remainderStart) / (1000 * 60 * 60 * 24))
  // Simple interest for remainder: P × R × T where T = days/365
  const remainderInterest = amount * rate * (remainderDays / 36500)

  const maturityAmount = amount + remainderInterest

  return {
    maturityAmount: Math.round(maturityAmount),
    totalInterest: Math.round(maturityAmount - principal),
    fullQuarters,
    remainderDays,
    remainderInterest: Math.round(remainderInterest),
    compoundedAmount: Math.round(amount),
  }
}

/**
 * Calculate accrued interest for a given FY
 * Accrued interest = amount earned by 31 Mar of that FY
 */
export function calculateAccruedInterestPerFY(principal, rate, startDate, maturityDate) {
  const parseLocalDate = (dateStr) => {
    const parts = dateStr.split('-')
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  }

  const start = parseLocalDate(startDate)
  const maturity = parseLocalDate(maturityDate)
  
  const accrualByFY = {}

  // Determine all FYs involved (FY = Apr-Mar)
  let currentFYStart = new Date(start.getFullYear(), 3, 1) // 1 Apr
  if (start < currentFYStart) {
    currentFYStart = new Date(start.getFullYear() - 1, 3, 1)
  }

  while (currentFYStart <= maturity) {
    const fy = `FY${currentFYStart.getFullYear() - 1}-${String(currentFYStart.getFullYear()).slice(-2)}`
    const fyEnd = new Date(currentFYStart.getFullYear(), 2, 31) // 31 Mar

    // Period for this FY accrual: from investment start (or FY start) to FY end
    const periodStart = currentFYStart > start ? currentFYStart : start
    const periodEnd = fyEnd < maturity ? fyEnd : maturity

    if (periodStart <= periodEnd) {
      // Calculate amount by periodEnd using quarterly compounding
      const periodEndStr = `${periodEnd.getFullYear()}-${String(periodEnd.getMonth() + 1).padStart(2, '0')}-${String(periodEnd.getDate()).padStart(2, '0')}`
      const result = calculateQuarterlyCompoundedMaturity(principal, rate, startDate, periodEndStr)
      const amountByFYEnd = result.maturityAmount

      // Accrued interest this FY = total amount by FY end - principal
      accrualByFY[fy] = amountByFYEnd - principal
    }

    currentFYStart = new Date(currentFYStart.getFullYear() + 1, 3, 1)
  }

  return accrualByFY
}

/**
 * Generate preview schedule for Step 3 preview
 * Returns array of cashflow objects for display
 */
export function generatePreviewScheduleV2(investment) {
  if (!investment?.principal || !investment?.interestRate) {
    return []
  }

  const { id, principal, interestRate, startDate, maturityDate } = investment

  // Calculate quarterly compounded maturity
  const result = calculateQuarterlyCompoundedMaturity(principal, interestRate, startDate, maturityDate)

  // Calculate accrual by FY
  const accrualByFY = calculateAccruedInterestPerFY(principal, interestRate, startDate, maturityDate)

  const schedule = []
  const maturity = new Date(maturityDate.split('-')[0], parseInt(maturityDate.split('-')[1]) - 1, parseInt(maturityDate.split('-')[2]))

  // Add FY accrual rows (for tax purposes, at FY end = 31 Mar)
  Object.entries(accrualByFY).forEach(([fy, accrued]) => {
    const [, fyYear] = fy.split('-')
    const fyEndYear = parseInt('20' + fyYear)
    const fyEndDate = new Date(fyEndYear, 2, 31) // 31 Mar of FY end year
    
    if (fyEndDate < maturity) {
      schedule.push({
        id: `accrual-${fy}`,
        investmentId: id,
        date: `${fyEndDate.getFullYear()}-${String(fyEndDate.getMonth() + 1).padStart(2, '0')}-${String(fyEndDate.getDate()).padStart(2, '0')}`,
        type: 'interest',
        amount: Math.round(accrued),
        fy,
        status: 'planned',
        source: 'system',
        isPreview: true,
        label: 'Accrued Interest (taxable, paid at maturity)',
      })
    }
  })

  // Add final maturity entry
  const maturityFY = getFinancialYear(maturity)
  schedule.push({
    id: `maturity-${id}`,
    investmentId: id,
    date: maturityDate,
    type: 'interest',
    amount: result.totalInterest,
    fy: maturityFY,
    status: 'planned',
    source: 'system',
    isPreview: true,
    label: 'Accrued Interest (paid at maturity)',
  })

  return schedule
}

/**
 * Get financial year string for a date
 * FY is Apr-Mar: FY2024-25 means Apr 2024 to Mar 2025
 */
function getFinancialYear(date) {
  const year = date.getFullYear()
  const month = date.getMonth()

  if (month >= 3) {
    // Apr-Dec: year + next year
    return `FY${year}-${String(year + 1).slice(-2)}`
  } else {
    // Jan-Mar: previous year + current year
    return `FY${year - 1}-${String(year).slice(-2)}`
  }
}
