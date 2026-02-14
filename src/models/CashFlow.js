import { generateId, CASHFLOW_TYPES, CASHFLOW_STATUS, CASHFLOW_SOURCE } from './constants.js';

/**
 * Cash flow relationship notes:
 * - A cash flow represents a single money movement tied to an `investmentId`.
 * - For reinvestments: create a cashflow with `type: 'reinvestment'`, `sourceInvestmentId` pointing
 *   to the investment that produced the cash, and `targetInvestmentId` pointing to the receiving investment.
 * - For closures: a `closure` cashflow documents funds moved due to closing an investment.
 * - For unallocated funds: use `type: 'unallocated'` to represent cash held outside any investment.
 * - For adjustments: `linkedTo` field specifies what the adjustment applies to (e.g., 'MATURITY')
 * These fields make money flow explicit and traceable for future backend processing.
 *
 * Factory function to create a CashFlow object
 * @param {Object} data
 * @param {string} data.investmentId - Reference to Investment.id (the investment this cashflow is recorded under)
 * @param {string} data.date - ISO 8601 date string (YYYY-MM-DD)
 * @param {string} data.type - Type of cash flow (principal, interest, tds, maturity, reinvestment, adjustment, unallocated, closure)
 * @param {number} data.amount - Amount in currency (positive for inflows, negative for outflows)
 * @param {string} data.financialYear - Financial year in format YYYY-YY (e.g., 2024-25)
 * @param {string} [data.source] - Source of cash flow (system | manual), defaults to system
 * @param {string} [data.status] - Status (planned | confirmed | adjusted), defaults to planned
 * @param {string} [data.adjustsCashflowId] - Optional ID of cash flow being adjusted (for adjustment type)
 * @param {string} [data.linkedTo] - Optional field indicating what this adjustment is linked to (e.g., 'MATURITY')
 * @param {string} [data.reason] - Optional reason/note for manual adjustments
 * @param {string} [data.sourceInvestmentId] - Investment ID that supplied the funds (for reinvestment/transfer)
 * @param {string} [data.targetInvestmentId] - Investment ID that receives the funds (for reinvestment/transfer)
 * @param {string} [data.id] - Optional custom ID, generates UUID if not provided
 * @returns {Object} CashFlow object
 */
export const createCashFlow = (data) => {
  // System cashflows are immutable. Corrections are modeled via adjustment entries.
  return {
    id: data.id || generateId(),
    investmentId: data.investmentId,
    date: data.date,
    type: data.type,
    amount: data.amount,
    financialYear: data.financialYear,
    source: data.source || CASHFLOW_SOURCE.SYSTEM,
    status: data.status || CASHFLOW_STATUS.PLANNED,
    adjustsCashflowId: data.adjustsCashflowId || null,
    linkedTo: data.linkedTo || null,
    reason: data.reason || null,
    isManual: data.source === 'manual' || data.type === 'ADJUSTMENT',
    // For reinvestments/transfers: explicit source and target investment references
    sourceInvestmentId: data.sourceInvestmentId || null,
    targetInvestmentId: data.targetInvestmentId || null,
  };
};

/**
 * Preserve manual cashflows when regenerating system cashflows
 * 
 * @param {Array} existingCashflows - All existing cashflows (system + manual)
 * @param {Array} newSystemCashflows - Newly generated system cashflows
 * @returns {Array} Merged cashflows (new system + preserved manual)
 */
export const preserveManualCashflows = (existingCashflows, newSystemCashflows) => {
  if (!existingCashflows || !newSystemCashflows) {
    return newSystemCashflows || [];
  }

  // Extract manual cashflows and adjustments
  const manualCashflows = existingCashflows.filter(cf => cf.isManual === true);
  
  // Combine new system cashflows with preserved manual ones
  const combined = [
    ...newSystemCashflows,
    ...manualCashflows
  ];
  
  return combined;
};
