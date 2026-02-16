/**
 * Cashflow Adjustment Utilities
 * Handles creation of adjustment entries for system-generated cashflows
 */

import { createCashFlow } from '../models/CashFlow.js';
import { CASHFLOW_TYPES } from '../models/constants.js';

/**
 * Get total TDS deducted for an investment across all cashflows
 * 
 * @param {string} investmentId - Investment ID
 * @param {Array} cashflows - List of all cashflows
 * @returns {number} Total TDS deducted (absolute value, positive number)
 */
export const getTotalTDSForInvestment = (investmentId, cashflows) => {
  if (!investmentId || !cashflows || !Array.isArray(cashflows)) return 0;

  const tdsCashflows = cashflows.filter(
    (cf) => (cf.type === 'tds_deduction' || cf.type === 'tds') &&
            cf.investmentId === investmentId
  );

  let totalTDS = 0;
  tdsCashflows.forEach((cf) => {
    totalTDS += Math.abs(cf.amount); // TDS amounts are negative, convert to positive
  });

  return totalTDS;
};

/**
 * Get gross maturity amount (before TDS)
 * 
 * Calculated as:
 * - Base: investment.calculatedMaturityAmount or investment.expectedMaturityAmount
 * - Plus: SUM of adjustment cashflows linkedTo "MATURITY"
 * 
 * @param {Object} investment - Investment object
 * @param {Array} cashflows - List of all cashflows
 * @returns {number} Gross maturity amount (before TDS)
 */
export const getGrossMaturityAmount = (investment, cashflows) => {
  if (!investment) return 0;

  // Start with base calculated/expected maturity amount
  let grossAmount = investment.calculatedMaturityAmount ?? 
                    investment.expectedMaturityAmount ?? 
                    0;

  if (!cashflows || !Array.isArray(cashflows)) {
    return grossAmount;
  }

  // Add maturity-specific adjustments
  const maturityAdjustments = cashflows.filter(
    (cf) => cf.type === 'adjustment' && 
            cf.linkedTo === 'MATURITY' &&
            cf.investmentId === investment.id
  );

  maturityAdjustments.forEach((cf) => {
    grossAmount += cf.amount;
  });

  return grossAmount;
};

/**
 * Get net maturity amount (after TDS)
 * 
 * Calculated as:
 * - Gross maturity amount - Total TDS deductions
 * 
 * @param {Object} investment - Investment object
 * @param {Array} cashflows - List of all cashflows
 * @returns {number} Net maturity amount (after TDS)
 */
export const getNetMaturityAmount = (investment, cashflows) => {
  if (!investment) return 0;

  const grossAmount = getGrossMaturityAmount(investment, cashflows);
  const totalTDS = getTotalTDSForInvestment(investment.id, cashflows);

  return grossAmount - totalTDS;
};

/**
 * Get the effective maturity amount for an investment
 * 
 * Comprehensive logic that derives maturity from the cashflow ledger:
 * - If investment.closure.isClosed: return actualPayoutAmount
 * - If investment.actualMaturityAmount is set: return it (user override)
 * - If premature closure: return the final payout
 * - Otherwise: return net maturity amount
 * 
 * @param {Object} investment - Investment object
 * @param {Array} cashflows - List of all cashflows
 * @returns {number} Effective maturity amount (or null if not available)
 */
export const getEffectiveMaturityAmount = (investment, cashflows) => {
  if (!investment) return null;

  // If manually closed with actual payout, use it
  if (investment.closure && investment.closure.isClosed) {
    return investment.closure.actualPayoutAmount || null;
  }

  // If investment was prematurely closed, return the closure payout
  if (investment.prematureClosure && investment.prematureClosure.isClosed) {
    return investment.prematureClosure.finalPayout || null;
  }

  // If user has explicitly set an actual maturity amount, use it (override)
  if (investment.actualMaturityAmount != null) {
    return investment.actualMaturityAmount;
  }

  // Otherwise return net maturity amount from ledger
  return getNetMaturityAmount(investment, cashflows) || null;
};

/**
 * Calculate and create adjustment entry for maturity override
 * 
 * When user enters actual maturity amount that differs from calculated:
 * delta = actual - calculated
 * Auto-generate adjustment entry linked to maturity cashflow
 * 
 * @param {Object} maturityCashflow - The system-generated maturity cashflow
 * @param {number} calculatedMaturityAmount - The calculated maturity amount
 * @param {number} actualMaturityAmount - The user-entered actual maturity amount
 * @returns {Object} Adjustment cashflow entry or null if no delta
 */
export const createMaturityAdjustment = (
  maturityCashflow,
  calculatedMaturityAmount,
  actualMaturityAmount
) => {
  if (!maturityCashflow || calculatedMaturityAmount == null || actualMaturityAmount == null) {
    return null;
  }

  const delta = actualMaturityAmount - calculatedMaturityAmount;
  
  // No adjustment needed if amounts match
  if (delta === 0) {
    return null;
  }

  // Create adjustment entry with linkedTo field for tracking
  return createCashFlow({
    type: 'adjustment',
    amount: delta,
    date: maturityCashflow.date,
    source: 'manual',
    reason: 'Actual maturity override - reconciliation with bank statement',
    adjustsCashflowId: maturityCashflow.id,
    linkedTo: 'MATURITY',
    investmentId: maturityCashflow.investmentId,
    financialYear: maturityCashflow.financialYear,
    status: 'confirmed',
  });
};

/**
 * Find the maturity cashflow for an investment from cashflow list
 * 
 * @param {Array} cashflows - List of cashflows
 * @param {string} investmentId - Investment ID to search for
 * @returns {Object} Maturity cashflow or null
 */
export const findMaturityCashflow = (cashflows, investmentId) => {
  if (!cashflows || !investmentId) return null;
  
  return cashflows.find(
    (cf) => cf.investmentId === investmentId && 
    (cf.type === CASHFLOW_TYPES.MATURITY || 
     cf.type === CASHFLOW_TYPES.MATURITY_PAYOUT)
  );
};

/**
 * Process maturity override and return any adjustment entry to create
 * 
 * @param {Object} investment - Investment object
 * @param {Array} cashflows - List of cashflows
 * @returns {Object} Adjustment cashflow or null
 */
export const processMaturityOverride = (investment, cashflows) => {
  if (!investment || 
      investment.actualMaturityAmount == null || 
      investment.expectedMaturityAmount == null) {
    return null;
  }

  const maturityCashflow = findMaturityCashflow(cashflows, investment.id);
  if (!maturityCashflow) {
    return null;
  }

  // Create adjustment if there's a difference
  return createMaturityAdjustment(
    maturityCashflow,
    investment.expectedMaturityAmount,
    investment.actualMaturityAmount
  );
};

/**
 * Get all adjustment entries for a cashflow
 * 
 * @param {Array} cashflows - List of all cashflows
 * @param {string} cashflowId - ID of the cashflow to find adjustments for
 * @returns {Array} Array of adjustment cashflows
 */
export const getAdjustmentsForCashflow = (cashflows, cashflowId) => {
  if (!cashflows || !cashflowId) return [];
  
  return cashflows.filter(
    (cf) => cf.type === CASHFLOW_TYPES.ADJUSTMENT && 
    cf.adjustsCashflowId === cashflowId
  );
};

/**
 * Calculate net effect of a cashflow including all linked adjustments
 * 
 * @param {Object} cashflow - The base cashflow
 * @param {Array} cashflows - List of all cashflows
 * @returns {number} Net amount (base + adjustments)
 */
export const getNetCashflowAmount = (cashflow, cashflows) => {
  if (!cashflow) return 0;
  
  let net = cashflow.amount;
  const adjustments = getAdjustmentsForCashflow(cashflows, cashflow.id);
  
  adjustments.forEach((adj) => {
    net += adj.amount;
  });
  
  return net;
};

/**
 * Preserve manual cashflows when regenerating system cashflows
 * 
 * When system cashflows are regenerated (e.g., due to changed parameters),
 * manual adjustments and entries must be preserved and merged with the new system cashflows.
 * 
 * @param {Array} existingCashflows - All existing cashflows (system + manual)
 * @param {Array} newSystemCashflows - Newly generated system cashflows
 * @returns {Array} Merged cashflows (new system + preserved manual)
 */
export const preserveManualCashflows = (existingCashflows, newSystemCashflows) => {
  if (!existingCashflows || !newSystemCashflows) {
    return newSystemCashflows || [];
  }

  // Extract manual cashflows (source === 'manual')
  const manualCashflows = existingCashflows.filter(cf => cf.source === 'manual');
  
  // Extract ADJUSTMENT type cashflows (these are manual corrections)
  const adjustmentCashflows = existingCashflows.filter(cf => cf.type === 'ADJUSTMENT');
  
  // Combine new system cashflows with preserved manual ones
  const combined = [
    ...newSystemCashflows,
    ...manualCashflows,
    ...adjustmentCashflows.filter(adj => !manualCashflows.some(m => m.id === adj.id))
  ];
  
  return combined;
};

/**
 * Filter cashflows to remove future entries after a closure date
 * 
 * Used for premature closure: removes system-generated interest and maturity
 * cashflows that would have occurred after the closure date.
 * 
 * @param {Array} cashflows - All existing cashflows
 * @param {string} closureDate - ISO 8601 date string (closure cutoff)
 * @returns {Array} Filtered cashflows (keeping only those on or before closureDate)
 */
export const removeFutureCashflows = (cashflows, closureDate) => {
  if (!cashflows || !closureDate) return cashflows || [];

  // Parse closure date
  const closureDateObj = new Date(closureDate);

  // Keep cashflows that are:
  // - On or before closure date, OR
  // - Are manual cashflows (preserve all manual entries)
  return cashflows.filter(cf => {
    if (cf.source === 'manual' || cf.isManual) return true; // Always keep manual
    
    const cfDateObj = new Date(cf.date);
    return cfDateObj <= closureDateObj;
  });
};

/**
 * Generate premature closure cashflows
 * 
 * Creates the necessary system cashflows for a premature closure:
 * - MATURITY_PAYOUT on closure date (the final payout)
 * - PENALTY cashflow if penalty amount is set
 * - Updated TDS_DEDUCTION based on recalculated interest
 * 
 * @param {Object} investment - Investment object
 * @param {Object} prematureClosure - Premature closure data
 * @param {string} financialYear - Financial year of closure
 * @returns {Array} Generated cashflows
 */
export const generatePrematureClosureCashflows = (investment, prematureClosure, financialYear) => {
  const cashflows = [];

  if (!investment || !prematureClosure || !prematureClosure.isClosed) {
    return cashflows;
  }

  const { closureDate, recalculatedInterest, penaltyAmount, finalPayout } = prematureClosure;

  // 1. Generate MATURITY_PAYOUT on closure date
  let maturityCf = null;
  if (finalPayout !== undefined && finalPayout !== null) {
    maturityCf = createCashFlow({
      investmentId: investment.id,
      date: closureDate,
      type: 'maturity_payout',
      amount: finalPayout,
      financialYear: financialYear,
      status: 'confirmed',
      source: 'system',
    });

    cashflows.push(maturityCf);
  }

  // 2. Generate PENALTY cashflow if penalty was applied
  let penaltyCf = null;
  if (penaltyAmount && penaltyAmount > 0) {
    penaltyCf = createCashFlow({
      investmentId: investment.id,
      date: closureDate,
      type: 'penalty',
      amount: -penaltyAmount, // Negative (outflow)
      financialYear: financialYear,
      status: 'confirmed',
      source: 'system',
      reason: 'Premature closure penalty',
    });

    cashflows.push(penaltyCf);
  }

  // 3. Generate TDS_DEDUCTION if applicable and recalculated interest > 0
  if (investment.compounding !== 'no' && recalculatedInterest > 0) {
    // Only if the investment had TDS applicable
    // For now, we generate it if there's recalculated interest
    const tdsRate = 10; // Standard TDS rate (can be parametrized)
    const tdsAmount = Math.round((recalculatedInterest * tdsRate) / 100);

    let tdsCf = null;
    if (tdsAmount > 0) {
      tdsCf = createCashFlow({
        investmentId: investment.id,
        date: closureDate,
        type: 'tds_deduction',
        amount: -tdsAmount,
        financialYear: financialYear,
        status: 'confirmed',
        source: 'system',
      });

      cashflows.push(tdsCf);
    }
  }

  // 4. Mark closure with a PREMATURE_CLOSURE type cashflow for audit trail
  // 4. Mark closure with a PREMATURE_CLOSURE type cashflow for audit trail
  // Attach metadata to help link generated entries and make UI/reporting actionable
  const linkedIds = [];
  if (maturityCf) linkedIds.push(maturityCf.id);
  if (penaltyCf) linkedIds.push(penaltyCf.id);
  if (typeof tdsCf !== 'undefined' && tdsCf && tdsCf.id) linkedIds.push(tdsCf.id);

  cashflows.push(createCashFlow({
    investmentId: investment.id,
    date: closureDate,
    type: 'premature_closure',
    amount: 0, // No cash flow, just audit entry
    financialYear: financialYear,
    status: 'confirmed',
    source: 'system',
    reason: `Investment closed prematurely. Original maturity: ${investment.maturityDate}`,
    metadata: {
      originalMaturityDate: investment.maturityDate,
      finalPayout: finalPayout,
      penaltyAmount: penaltyAmount || 0,
      recalculatedInterest: recalculatedInterest || 0,
      linkedCashflowIds: linkedIds,
      performedBy: 'system',
    }
  }));

  return cashflows;
};

