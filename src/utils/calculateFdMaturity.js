/**
 * Fixed Deposit (FD) Maturity Calculator Module
 *
 * Goal:
 * - Compute FD maturity amount and interest using fractional quarterly compounding
 *   tuned to match Indian bank FD rules as closely as possible.
 * - Reference case: Principal ₹457,779, Rate 7.75%, Start 2024-09-19, Maturity 2025-12-07
 *   Expected maturity ≈ ₹502,593.00, interest ≈ ₹44,814.00
 *
 * Algorithm choices (explicit):
 * 1. Day-count convention: ACT/365 (daysInYear = 365).
 *    Indian banks typically use ACT/365 for FD interest calculations.
 *    This means we divide actual elapsed days by 365 to get fractional years.
 *
 * 2. Compounding frequency: Quarterly (4 times per year).
 *    Fractional number of periods is computed directly:
 *      fractionalPeriods = (durationDays / daysInYear) * compoundingFrequencyPerYear
 *    We do NOT split into integer full quarters + remainder simple interest.
 *    Instead, we raise the per-period factor to a fractional exponent.
 *
 * 3. Growth factor:
 *      periodRate = (annualRatePercent / 100) / compoundingFrequencyPerYear
 *      lnFactor = fractionalPeriods * Math.log(1 + periodRate)
 *      rawFactor = Math.exp(lnFactor)
 *      growthFactor = rawFactor
 *
 * 4. Maturity amount:
 *      maturityAmountRaw = principal * growthFactor
 *      interestRaw = maturityAmountRaw - principal
 *
 * 5. Rounding:
 *    - Final monetary outputs are rounded to 2 decimals using bank-style rounding
 *      (round half away from zero).
 *    - Intermediate values are kept in full precision.
 *
 * 6. Day difference:
 *    - DurationDays = floor((maturityDateUTC - startDateUTC) / MS_PER_DAY)
 *    - Exclusive difference (do not add 1).
 *    - For reference case (2024-09-19 to 2025-12-07) this yields 444 days.
 *
 * Output:
 * {
 *   maturityAmount: number,   // rounded to 2 decimals
 *   interestEarned: number,   // rounded to 2 decimals
 *   explanation: { ... }      // detailed intermediate values
 * }
 */

/* -------------------------
   Helper utilities
   ------------------------- */

/** Bank-style rounding: round half away from zero to 2 decimals. */
function roundHalfAwayFromZeroToTwo(value) {
  if (!isFinite(value)) return value;
  const sign = Math.sign(value) || 1;
  const abs = Math.abs(value);
  const scaled = abs * 100;
  const eps = 1e-9;
  const roundedScaled = Math.floor(scaled + 0.5 + eps);
  return (roundedScaled / 100) * sign;
}

/** Normalize input to UTC midnight Date object. */
function toUtcMidnight(dateLike) {
  if (dateLike instanceof Date) {
    return new Date(Date.UTC(dateLike.getUTCFullYear(), dateLike.getUTCMonth(), dateLike.getUTCDate()));
  }
  const parsed = new Date(dateLike);
  if (Number.isNaN(parsed.getTime())) {
    throw new TypeError(`Invalid date: ${dateLike}`);
  }
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

/** Compute exclusive day difference between two dates. */
function daysBetweenExclusive(startDateLike, endDateLike) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const s = toUtcMidnight(startDateLike);
  const e = toUtcMidnight(endDateLike);
  const diffMs = e.getTime() - s.getTime();
  if (!isFinite(diffMs)) throw new TypeError('Invalid date difference');
  return Math.floor(diffMs / MS_PER_DAY);
}

/* -------------------------
   Core calculation function
   ------------------------- */

export function calculateFdMaturity({ principal, annualRatePercent, startDate, maturityDate, durationDays }) {
  // Validate inputs
  if (typeof principal !== 'number' || !isFinite(principal) || principal <= 0) {
    throw new TypeError('principal must be a positive number');
  }
  if (typeof annualRatePercent !== 'number' || !isFinite(annualRatePercent) || annualRatePercent < 0) {
    throw new TypeError('annualRatePercent must be a non-negative number');
  }

  // Determine durationDays
  let computedDurationDays = null;
  if (typeof durationDays === 'number') {
    if (!Number.isInteger(durationDays) || durationDays < 0) {
      throw new TypeError('durationDays must be a non-negative integer if provided');
    }
    computedDurationDays = durationDays;
  } else {
    if (!startDate || !maturityDate) {
      throw new TypeError('Either durationDays or both startDate and maturityDate must be provided');
    }
    computedDurationDays = daysBetweenExclusive(startDate, maturityDate);
    if (computedDurationDays < 0) {
      throw new RangeError('maturityDate must be after startDate');
    }
  }

  // Parameters
  const daysInYear = 365; // ACT/365
  const compoundingFrequencyPerYear = 4; // Quarterly
  const payoutAtMaturity = true; // cumulative FD

  // Edge case: zero duration
  if (computedDurationDays === 0) {
    const maturityAmount = roundHalfAwayFromZeroToTwo(principal);
    const interestEarned = roundHalfAwayFromZeroToTwo(maturityAmount - principal);
    return {
      maturityAmount,
      interestEarned,
      explanation: {
        note: 'Zero duration: maturity equals principal',
        principal,
        annualRatePercent,
        durationDays: computedDurationDays,
        daysInYear,
        compoundingFrequencyPerYear,
        periodRate: 0,
        fractionalPeriods: 0,
        lnFactor: 0,
        rawFactor: 1,
        growthFactorRaw: 1,
        maturityAmountRaw: principal,
        interestRaw: 0,
        roundingMethod: 'bank-style round half away from zero'
      }
    };
  }

  // Step 1: period rate
  const periodRate = (annualRatePercent / 100) / compoundingFrequencyPerYear;

  // Step 2: fractional periods
  const fractionalPeriods = (computedDurationDays / daysInYear) * compoundingFrequencyPerYear;

  // Step 3: growth factor
  const lnFactor = fractionalPeriods * Math.log(1 + periodRate);
  const rawFactor = Math.exp(lnFactor);
  const growthFactorRaw = rawFactor;

  // Step 4: maturity raw
  const maturityAmountRaw = payoutAtMaturity ? principal * growthFactorRaw : principal;
  const interestRaw = maturityAmountRaw - principal;

  // Step 5: rounding
  const maturityAmount = roundHalfAwayFromZeroToTwo(maturityAmountRaw);
  const interestEarned = roundHalfAwayFromZeroToTwo(interestRaw);

  // Explanation
  const explanation = {
    principal,
    annualRatePercent,
    durationDays: computedDurationDays,
    daysInYear,
    compoundingFrequencyPerYear,
    payoutAtMaturity,
    periodRate,
    fractionalPeriods,
    lnFactor,
    rawFactor,
    growthFactorRaw,
    maturityAmountRaw,
    interestRaw,
    roundingMethod: 'bank-style round half away from zero (2 decimals)',
    note:
      'Using ACT/365 and fractional quarterly compounding: growthFactor = (1 + periodRate) ^ fractionalPeriods computed via ln/exp. ' +
      'Only final monetary outputs are rounded.'
  };

  return {
    maturityAmount,
    interestEarned,
    explanation
  };
}

/* =========================================================================
   ALTERNATIVE: Bank-Style FD Calculation (Quarterly + Remainder)
   ========================================================================= */

/**
 * Bank-style FD maturity calculation (quarterly compounding + remainder days).
 *
 * Algorithm:
 * 1. Compute durationDays (exclusive day difference).
 * 2. Identify how many full quarters fit into durationDays:
 *      fullQuarters = Math.floor(durationDays / (365/4))
 *    (approximate quarter length = 365/4 = 91.25 days).
 *
 * 3. For each full quarter:
 *      amount = roundBank(amount * (1 + rate/4/100))
 *    Round after each quarter (bank-style).
 *
 * 4. Compute remainderDays = durationDays - fullQuarters * 91.25 (rounded down).
 *    Apply simple interest on current amount:
 *      remainderInterest = amount * (rate/100) * (remainderDays / 365)
 *    Add to amount.
 *
 * 5. Round final maturity amount and compute interest.
 *
 * This method matches traditional bank FD calculations with per-quarter rounding.
 *
 * @param {Object} params
 * @param {number} params.principal - Investment amount
 * @param {number} params.annualRatePercent - Annual rate
 * @param {Date|string} params.startDate - Start date
 * @param {Date|string} params.maturityDate - Maturity date
 * @param {number} [params.durationDays] - Optional: pre-computed duration in days
 * @returns {Object} { maturityAmount, interestEarned, explanation }
 */
export function calculateFdMaturityBankStyle({ principal, annualRatePercent, startDate, maturityDate, durationDays }) {
  if (typeof principal !== 'number' || !isFinite(principal) || principal <= 0) {
    throw new TypeError('principal must be a positive number');
  }
  if (typeof annualRatePercent !== 'number' || !isFinite(annualRatePercent) || annualRatePercent < 0) {
    throw new TypeError('annualRatePercent must be a non-negative number');
  }

  // Determine durationDays
  let computedDurationDays = durationDays;
  if (!computedDurationDays) {
    if (!startDate || !maturityDate) {
      throw new TypeError('Either durationDays or both startDate and maturityDate must be provided');
    }
    computedDurationDays = daysBetweenExclusive(startDate, maturityDate);
    if (computedDurationDays < 0) {
      throw new RangeError('maturityDate must be after startDate');
    }
  }

  const daysInYear = 365;
  const freq = 4; // quarterly
  const periodRate = (annualRatePercent / 100) / freq;
  const approxQuarterDays = daysInYear / freq; // 91.25

  // Step 1: Count full quarters (using approximate quarter length)
  const fullQuarters = Math.floor(computedDurationDays / approxQuarterDays);

  // Step 2: Apply quarterly compounding with rounding after each quarter
  let amount = principal;
  for (let i = 0; i < fullQuarters; i++) {
    amount = roundHalfAwayFromZeroToTwo(amount * (1 + periodRate));
  }

  // Step 3: Calculate remainder days and apply simple interest
  const remainderDays = computedDurationDays - Math.floor(fullQuarters * approxQuarterDays);
  const remainderInterest = amount * (annualRatePercent / 100) * (remainderDays / daysInYear);
  amount = amount + remainderInterest;

  // Step 4: Final rounding
  const maturityAmount = roundHalfAwayFromZeroToTwo(amount);
  const interestEarned = roundHalfAwayFromZeroToTwo(maturityAmount - principal);

  const explanation = {
    principal,
    annualRatePercent,
    durationDays: computedDurationDays,
    daysInYear,
    compoundingFrequencyPerYear: freq,
    periodRate,
    approxQuarterDays,
    fullQuarters,
    remainderDays,
    roundingMethod: 'bank-style: round after each quarter + final round',
    maturityAmountRaw: amount,
    interestRaw: amount - principal,
    note:
      'Quarterly compounding with per-quarter rounding (traditional bank method) + simple interest on remainder days.'
  };

  return {
    maturityAmount,
    interestEarned,
    explanation
  };
}
