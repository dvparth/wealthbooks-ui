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

/**
 * Example: Fixed Deposit (FD)
 * Calculation: quarterly | Payout: maturity
 */
export const exampleFixedDeposit = createInvestmentType({
  id: '550e8400-e29b-41d4-a716-446655440001',
  code: INVESTMENT_TYPE_CODES.FD,
  name: 'Fixed Deposit (FD)',
  supportedCalculationFrequencies: [
    INTEREST_FREQUENCIES.QUARTERLY,
  ],
  supportedPayoutFrequencies: [
    INTEREST_FREQUENCIES.MATURITY,
  ],
  supportsReinvestment: true,
  notes: 'Bank Fixed Deposit with quarterly compounding, maturity payout',
});

/**
 * Example: Senior Citizen Savings Scheme (SCSS)
 * Calculation: quarterly | Payout: quarterly
 */
export const exampleSeniorCitizenSavingsScheme = createInvestmentType({
  id: '550e8400-e29b-41d4-a716-446655440002',
  code: INVESTMENT_TYPE_CODES.SCSS,
  name: 'Senior Citizen Savings Scheme (SCSS)',
  supportedCalculationFrequencies: [INTEREST_FREQUENCIES.QUARTERLY],
  supportedPayoutFrequencies: [INTEREST_FREQUENCIES.QUARTERLY],
  supportsReinvestment: false,
  notes: 'Government scheme for senior citizens (60+), quarterly interest calculation and payout',
});

/**
 * Example: National Savings Certificate (NSC)
 * Calculation: yearly | Payout: maturity
 */
export const exampleNationalSavingsCertificate = createInvestmentType({
  id: '550e8400-e29b-41d4-a716-446655440003',
  code: INVESTMENT_TYPE_CODES.NSC,
  name: 'National Savings Certificate (NSC)',
  supportedCalculationFrequencies: [INTEREST_FREQUENCIES.YEARLY],
  supportedPayoutFrequencies: [INTEREST_FREQUENCIES.MATURITY],
  supportsReinvestment: true,
  notes: 'Government security with yearly compounding, maturity payout',
});

/**
 * Example: 54EC Bond
 * Calculation: yearly | Payout: yearly
 */
export const exampleBond54EC = createInvestmentType({
  id: '550e8400-e29b-41d4-a716-446655440004',
  code: INVESTMENT_TYPE_CODES.BOND_54EC,
  name: '54EC Taxable Bond',
  supportedCalculationFrequencies: [INTEREST_FREQUENCIES.YEARLY],
  supportedPayoutFrequencies: [INTEREST_FREQUENCIES.YEARLY],
  supportsReinvestment: true,
  notes: 'Infrastructure bond with yearly interest calculation and payout, capital gains exemption under Section 54EC',
});
