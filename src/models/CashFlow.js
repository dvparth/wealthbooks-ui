import { generateId, CASHFLOW_TYPES, CASHFLOW_STATUS, CASHFLOW_SOURCE } from './constants.js';

/**
 * Factory function to create a CashFlow object
 * @param {Object} data
 * @param {string} data.investmentId - Reference to Investment.id
 * @param {string} data.date - ISO 8601 date string (YYYY-MM-DD)
 * @param {string} data.type - Type of cash flow (principal, interest, tds, maturity, reinvestment, adjustment)
 * @param {number} data.amount - Amount in currency (positive for inflows, negative for outflows)
 * @param {string} data.financialYear - Financial year in format YYYY-YY (e.g., 2024-25)
 * @param {string} [data.source] - Source of cash flow (system | manual), defaults to system
 * @param {string} [data.status] - Status (planned | confirmed | adjusted), defaults to planned
 * @param {string} [data.adjustsCashflowId] - Optional ID of cash flow being adjusted (for adjustment type)
 * @param {string} [data.id] - Optional custom ID, generates UUID if not provided
 * @returns {Object} CashFlow object
 */
export const createCashFlow = (data) => {
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
    reinvestedInvestmentId: data.reinvestedInvestmentId || null,
  };
};
