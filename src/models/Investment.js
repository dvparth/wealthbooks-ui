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

/**
 * Example: ICICI Bank FD for 2 years at 6.5% annual interest, quarterly calculation, maturity payout
 */
export const exampleInvestmentFD = createInvestment({
  id: '550e8400-e29b-41d4-a716-446655440301',
  externalInvestmentId: 'FD123456',
  name: 'ICICI FD - Quarterly Calculation, Maturity Payout',
  investmentTypeId: '550e8400-e29b-41d4-a716-446655440001', // FD type ID
  bankId: '550e8400-e29b-41d4-a716-446655440101', // ICICI Bank ID
  ownerId: '550e8400-e29b-41d4-a716-446655440201', // Ajay Kumar ID
  startDate: '2024-01-15',
  maturityDate: '2026-01-15',
  principal: 500000,
  interestRate: 6.5,
  interestCalculationFrequency: INTEREST_FREQUENCIES.QUARTERLY,
  interestPayoutFrequency: INTEREST_FREQUENCIES.MATURITY,
  expectedMaturityAmount: 565000, // realistic estimate: principal + approx interest
  status: INVESTMENT_STATUS.ACTIVE,
});
