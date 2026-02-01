import { generateId, INVESTMENT_STATUS, INTEREST_FREQUENCIES } from './constants.js';

/**
 * Factory function to create an Investment object
 * @param {Object} data
 * @param {string} data.name - Investment name/description
 * @param {string} data.investmentTypeId - Reference to InvestmentType.id
 * @param {string} data.bankId - Reference to Bank.id
 * @param {string} data.ownerId - Reference to Owner.id
 * @param {string} data.startDate - ISO 8601 date string (YYYY-MM-DD)
 * @param {string} data.maturityDate - ISO 8601 date string (YYYY-MM-DD)
 * @param {number} data.principal - Principal amount in currency (e.g., 100000 for ₹1,00,000)
 * @param {number} data.interestRate - Annual interest rate as percentage (e.g., 6.5 for 6.5%)
 * @param {string} data.interestCalculationFrequency - Frequency of interest calculation (monthly, quarterly, yearly, maturity)
 * @param {string} data.interestPayoutFrequency - Frequency of interest payout (monthly, quarterly, yearly, maturity)
 * @param {string} data.externalInvestmentId - External/legacy investment identifier (e.g., FD123456)
 * @param {number} [data.expectedMaturityAmount] - Expected amount at maturity (currency)
 * @param {string} [data.status] - Status of investment (active | closed), defaults to active
 * @param {string} [data.id] - Optional custom ID, generates UUID if not provided
 * @returns {Object} Investment object
 */
export const createInvestment = (data) => {
  return {
    id: data.id || generateId(),
    externalInvestmentId: data.externalInvestmentId || null,
    expectedMaturityAmount: data.expectedMaturityAmount == null ? null : data.expectedMaturityAmount,
    name: data.name,
    investmentTypeId: data.investmentTypeId,
    bankId: data.bankId,
    ownerId: data.ownerId,
    startDate: data.startDate,
    maturityDate: data.maturityDate,
    principal: data.principal,
    interestRate: data.interestRate,
    interestCalculationFrequency: data.interestCalculationFrequency,
    interestPayoutFrequency: data.interestPayoutFrequency,
    status: data.status || INVESTMENT_STATUS.ACTIVE,
  };
};
