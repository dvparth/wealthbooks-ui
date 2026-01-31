import { createInvestment } from '../models/Investment.js';
import { INTEREST_FREQUENCIES, INVESTMENT_STATUS } from '../models/constants.js';

/**
 * Regenerated mock investments matching the banking rules and cashflows
 */
export const mockInvestments = [
  // Stress FD - cumulative, quarterly calculation, maturity payout
  createInvestment({
    id: 'inv-fd-st001',
    externalInvestmentId: 'FD_ST001',
    name: 'Stress Test FD - 444 Days',
    investmentTypeId: 'it-fd-cumulative',
    bankId: 'bank-001',
    ownerId: 'owner-003',
    startDate: '2024-08-23',
    maturityDate: '2025-11-20',
    principal: 750000,
    interestRate: 6.75,
    interestCalculationFrequency: INTEREST_FREQUENCIES.QUARTERLY,
    interestPayoutFrequency: INTEREST_FREQUENCIES.MATURITY,
    expectedMaturityAmount: 816663.75,
    status: INVESTMENT_STATUS.ACTIVE,
  }),

  // SCSS quarterly payout
  createInvestment({
    id: 'inv-scss-001',
    externalInvestmentId: 'SCSS7890',
    name: 'Senior Citizens Savings - SCSS 2023',
    investmentTypeId: 'it-scss',
    bankId: 'bank-003',
    ownerId: 'owner-002',
    startDate: '2023-06-01',
    maturityDate: '2028-06-01',
    principal: 300000,
    interestRate: 8.0,
    interestCalculationFrequency: INTEREST_FREQUENCIES.QUARTERLY,
    interestPayoutFrequency: INTEREST_FREQUENCIES.QUARTERLY,
    expectedMaturityAmount: 300000,
    status: INVESTMENT_STATUS.ACTIVE,
  }),

  // NSC (maturity payout)
  createInvestment({
    id: 'inv-nsc-001',
    externalInvestmentId: 'NSC20221115',
    name: 'National Savings Certificate - NSC X 2022',
    investmentTypeId: 'it-nsc',
    bankId: 'bank-005',
    ownerId: 'owner-004',
    startDate: '2022-11-15',
    maturityDate: '2027-11-15',
    principal: 200000,
    interestRate: 7.0,
    interestCalculationFrequency: INTEREST_FREQUENCIES.YEARLY,
    interestPayoutFrequency: INTEREST_FREQUENCIES.MATURITY,
    expectedMaturityAmount: 280608.99,
    status: INVESTMENT_STATUS.ACTIVE,
  }),

  // 54EC bond (closed)
  createInvestment({
    id: 'inv-bond-001',
    externalInvestmentId: '54EC2020A',
    name: '54EC Bond - 2020 Investment',
    investmentTypeId: 'it-bond-54ec',
    bankId: 'bank-004',
    ownerId: 'owner-001',
    startDate: '2020-03-10',
    maturityDate: '2025-12-01',
    principal: 100000,
    interestRate: 5.5,
    interestCalculationFrequency: INTEREST_FREQUENCIES.YEARLY,
    interestPayoutFrequency: INTEREST_FREQUENCIES.YEARLY,
    expectedMaturityAmount: 100000,
    status: INVESTMENT_STATUS.CLOSED,
  }),

  // FD partial reinvestment
  createInvestment({
    id: 'inv-fd-reinv-001',
    externalInvestmentId: 'FD_PART_REINV',
    name: 'FD with Partial Reinvestment',
    investmentTypeId: 'it-fd',
    bankId: 'bank-005',
    ownerId: 'owner-002',
    startDate: '2024-02-15',
    maturityDate: '2026-02-15',
    principal: 400000,
    interestRate: 6.25,
    interestCalculationFrequency: INTEREST_FREQUENCIES.QUARTERLY,
    interestPayoutFrequency: INTEREST_FREQUENCIES.QUARTERLY,
    expectedMaturityAmount: 400000,
    status: INVESTMENT_STATUS.ACTIVE,
  }),

  // FD quarter test
  createInvestment({
    id: 'inv-fd-quarter-test',
    externalInvestmentId: 'FD-QUARTER-TEST',
    name: 'FD - Quarterly Test',
    investmentTypeId: 'it-fd',
    bankId: 'bank-001',
    ownerId: 'owner-003',
    startDate: '2026-02-01',
    maturityDate: '2027-02-01',
    principal: 100000,
    interestRate: 7.0,
    interestCalculationFrequency: INTEREST_FREQUENCIES.QUARTERLY,
    interestPayoutFrequency: INTEREST_FREQUENCIES.MATURITY,
    expectedMaturityAmount: 107111.98,
    status: INVESTMENT_STATUS.ACTIVE,
  }),
];

export const findInvestmentById = (id) => mockInvestments.find((inv) => inv.id === id || inv.externalInvestmentId === id);
export const getActiveInvestments = () => mockInvestments.filter((inv) => inv.status === INVESTMENT_STATUS.ACTIVE);
export const getInvestmentsByOwnerId = (ownerId) => mockInvestments.filter((inv) => inv.ownerId === ownerId);
