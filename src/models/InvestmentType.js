import { generateId, INVESTMENT_TYPE_CODES, INTEREST_FREQUENCIES } from './constants.js';

/**
 * Factory function to create an InvestmentType object
 * @param {Object} data
 * @param {string} data.code - Investment type code (FD, SCSS, NSC, 54EC)
 * @param {string} data.name - Human-readable name
 * @param {string[]} data.supportedCalculationFrequencies - Array of supported calculation frequencies
 * @param {string[]} data.supportedPayoutFrequencies - Array of supported payout frequencies
 * @param {boolean} data.supportsReinvestment - Whether reinvestment is supported
 * @param {string} [data.notes] - Optional notes
 * @param {string} [data.id] - Optional custom ID, generates UUID if not provided
 * @returns {Object} InvestmentType object
 */
export const createInvestmentType = (data) => {
  return {
    id: data.id || generateId(),
    code: data.code,
    name: data.name,
    supportedCalculationFrequencies: data.supportedCalculationFrequencies,
    supportedPayoutFrequencies: data.supportedPayoutFrequencies,
    supportsReinvestment: data.supportsReinvestment,
    notes: data.notes || '',
  };
};
