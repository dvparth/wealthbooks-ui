/**
 * Cashflow Adjustment Utilities
 * Handles creation of adjustment entries for system-generated cashflows
 */

import { createCashFlow } from '../models/CashFlow.js';
import { CASHFLOW_TYPES } from '../models/constants.js';

/**
 * Get the effective maturity amount for an investment
 * 
 * This reflects the actual maturity amount that should be displayed:
 * - Base: expectedMaturityAmount (system calculated)
 * - Plus: all ADJUSTMENT cashflows linked to MATURITY
 * 
 * @param {Object} investment - Investment object
 * @param {Array} cashflows - List of all cashflows
 * @returns {number} Effective maturity amount (or null if not available)
 */
export const getEffectiveMaturityAmount = (investment, cashflows) => {
  if (!investment) return null;

  // Start with expected (calculated) maturity amount
  let effectiveAmount = investment.expectedMaturityAmount ?? 0;

  // Add all ADJUSTMENT cashflows linked to MATURITY for this investment
  if (cashflows && Array.isArray(cashflows)) {
    const maturityAdjustments = cashflows.filter(
      (cf) => cf.type === 'ADJUSTMENT' && 
              cf.linkedTo === 'MATURITY' &&
              cf.investmentId === investment.id
    );

    maturityAdjustments.forEach((cf) => {
      effectiveAmount += cf.amount;
    });
  }

  return effectiveAmount || null;
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
    type: 'ADJUSTMENT',
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
