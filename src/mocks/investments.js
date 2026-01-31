import {
  createInvestment,
  exampleInvestmentFD,
} from '../models/Investment.js';
import { INTEREST_FREQUENCIES, INVESTMENT_STATUS } from '../models/constants.js';

/**
 * Mock investments for WealthBooks
 * Includes 3 different investment types with various scenarios
 */
export const mockInvestments = [
  // FD: Quarterly calculation, maturity payout (2-year term, ongoing)
  // exampleInvestmentFD now includes externalInvestmentId via model example
  exampleInvestmentFD,

  // SCSS: Quarterly calculation and payout (senior citizen scheme)
  createInvestment({
    id: '550e8400-e29b-41d4-a716-446655440302',
    externalInvestmentId: 'SCSS7890',
    name: 'Senior Citizens Savings - SCSS 2023',
    investmentTypeId: '550e8400-e29b-41d4-a716-446655440002', // SCSS type
    bankId: '550e8400-e29b-41d4-a716-446655440103', // SBI
    ownerId: '550e8400-e29b-41d4-a716-446655440202', // Priya Sharma
    startDate: '2023-06-01',
    maturityDate: '2028-06-01',
    principal: 300000,
    interestRate: 8.0,
    interestCalculationFrequency: INTEREST_FREQUENCIES.QUARTERLY,
    interestPayoutFrequency: INTEREST_FREQUENCIES.QUARTERLY,
    expectedMaturityAmount: 452000, // approximate expected maturity (estimate)
    status: INVESTMENT_STATUS.ACTIVE,
  }),

  // NSC: Yearly calculation, maturity payout (5-year term, ongoing)
  createInvestment({
    id: '550e8400-e29b-41d4-a716-446655440303',
    externalInvestmentId: 'NSC20221115',
    name: 'National Savings Certificate - NSC X 2022',
    investmentTypeId: '550e8400-e29b-41d4-a716-446655440003', // NSC type
    bankId: '550e8400-e29b-41d4-a716-446655440104', // Axis Bank
    ownerId: '550e8400-e29b-41d4-a716-446655440203', // Rajesh Patel
    startDate: '2022-11-15',
    maturityDate: '2027-11-15',
    principal: 200000,
    interestRate: 7.0,
    interestCalculationFrequency: INTEREST_FREQUENCIES.YEARLY,
    interestPayoutFrequency: INTEREST_FREQUENCIES.MATURITY,
    expectedMaturityAmount: 281500, // compounded yearly estimate
    status: INVESTMENT_STATUS.ACTIVE,
  }),

  // 54EC Bond: Yearly calculation and payout (closed investment)
  createInvestment({
    id: '550e8400-e29b-41d4-a716-446655440304',
    externalInvestmentId: '54EC2020A',
    name: '54EC Bond - 2020 Investment',
    investmentTypeId: '550e8400-e29b-41d4-a716-446655440004', // 54EC type
    bankId: '550e8400-e29b-41d4-a716-446655440105', // Kotak Bank
    ownerId: '550e8400-e29b-41d4-a716-446655440201', // Ajay Kumar
    startDate: '2020-03-10',
    maturityDate: '2025-03-10',
    principal: 100000,
    interestRate: 5.5,
    interestCalculationFrequency: INTEREST_FREQUENCIES.YEARLY,
    interestPayoutFrequency: INTEREST_FREQUENCIES.YEARLY,
    expectedMaturityAmount: 128000, // approximate
    status: INVESTMENT_STATUS.CLOSED,
  }),
];

/**
 * Helper to find investment by ID
 */
export const findInvestmentById = (id) => {
  return mockInvestments.find((inv) => inv.id === id);
};

/**
 * Helper to get all active investments
 */
export const getActiveInvestments = () => {
  return mockInvestments.filter((inv) => inv.status === INVESTMENT_STATUS.ACTIVE);
};

/**
 * Helper to get all investments for an owner
 */
export const getInvestmentsByOwnerId = (ownerId) => {
  return mockInvestments.filter((inv) => inv.ownerId === ownerId);
};
