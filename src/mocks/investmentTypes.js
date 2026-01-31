import {
  exampleFixedDeposit,
  exampleSeniorCitizenSavingsScheme,
  exampleNationalSavingsCertificate,
  exampleBond54EC,
} from '../models/InvestmentType.js';

/**
 * Mock investment types for WealthBooks (normalized)
 */
export const mockInvestmentTypes = [
  exampleFixedDeposit,
  exampleSeniorCitizenSavingsScheme,
  exampleNationalSavingsCertificate,
  exampleBond54EC,
];

/**
 * Helper to find investment type by ID
 */
export const findInvestmentTypeById = (id) => {
  return mockInvestmentTypes.find((type) => type.id === id);
};

/**
 * Helper to find investment type by code
 */
export const findInvestmentTypeByCode = (code) => {
  return mockInvestmentTypes.find((type) => type.code === code);
};
