import {
  createCashFlow,
  exampleCashFlowInterest,
  exampleCashFlowMaturity,
} from '../models/CashFlow.js';
import {
  CASHFLOW_TYPES,
  CASHFLOW_STATUS,
  CASHFLOW_SOURCE,
} from '../models/constants.js';

/**
 * Mock cash flows for WealthBooks
 * Includes interest, TDS, reinvestment, and adjustment scenarios across multiple financial years
 */
export const mockCashFlows = [
  // ============ FD (Investment 1) - Quarterly Calculation, Maturity Payout ============
  // FY 2024-25: First year interest (no payout, accumulates to maturity)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440401',
    investmentId: '550e8400-e29b-41d4-a716-446655440301',
    date: '2024-04-15',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 8125.00, // 500K * 6.5% / 4
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440402',
    investmentId: '550e8400-e29b-41d4-a716-446655440301',
    date: '2024-07-15',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 8125.00,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440403',
    investmentId: '550e8400-e29b-41d4-a716-446655440301',
    date: '2024-10-15',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 8125.00,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440404',
    investmentId: '550e8400-e29b-41d4-a716-446655440301',
    date: '2025-01-15',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 8125.00,
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // FY 2025-26: Second year interest
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440405',
    investmentId: '550e8400-e29b-41d4-a716-446655440301',
    date: '2025-04-15',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 8125.00,
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440406',
    investmentId: '550e8400-e29b-41d4-a716-446655440301',
    date: '2025-07-15',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 8125.00,
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440407',
    investmentId: '550e8400-e29b-41d4-a716-446655440301',
    date: '2025-10-15',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 8125.00,
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Maturity payout (principal + accumulated interest)
  exampleCashFlowMaturity,

  // ============ SCSS (Investment 2) - Quarterly Calculation & Payout ============
  // FY 2023-24: Quarterly interest received
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440410',
    investmentId: '550e8400-e29b-41d4-a716-446655440302',
    date: '2023-09-01',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 5900.00, // 300K * 8% / 4 (partial period)
    financialYear: '2023-24',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440411',
    investmentId: '550e8400-e29b-41d4-a716-446655440302',
    date: '2023-12-01',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 6000.00, // 300K * 8% / 4
    financialYear: '2023-24',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // FY 2024-25: Quarterly interest + TDS (20% on interest above Rs. 40,000)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440412',
    investmentId: '550e8400-e29b-41d4-a716-446655440302',
    date: '2024-03-01',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 6000.00,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440413',
    investmentId: '550e8400-e29b-41d4-a716-446655440302',
    date: '2024-03-15',
    type: CASHFLOW_TYPES.TDS,
    amount: -1200.00, // 20% TDS on interest exceeding Rs. 40K cumulative
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440414',
    investmentId: '550e8400-e29b-41d4-a716-446655440302',
    date: '2024-06-01',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 6000.00,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440415',
    investmentId: '550e8400-e29b-41d4-a716-446655440302',
    date: '2024-09-01',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 6000.00,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440416',
    investmentId: '550e8400-e29b-41d4-a716-446655440302',
    date: '2024-12-01',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 6000.00,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // FY 2025-26: Quarterly interest continues
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440417',
    investmentId: '550e8400-e29b-41d4-a716-446655440302',
    date: '2025-03-01',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 6000.00,
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // ============ NSC (Investment 3) - Yearly Calculation, Maturity Payout ============
  // FY 2022-23: First year interest (reinvested annually in NSC)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440420',
    investmentId: '550e8400-e29b-41d4-a716-446655440303',
    date: '2023-11-15',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 14000.00, // 200K * 7%
    financialYear: '2023-24',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440421',
    investmentId: '550e8400-e29b-41d4-a716-446655440303',
    date: '2023-11-15',
    type: CASHFLOW_TYPES.REINVESTMENT,
    amount: 14000.00, // Interest reinvested into principal
    financialYear: '2023-24',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // FY 2024-25: Second year interest on new principal (214K)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440422',
    investmentId: '550e8400-e29b-41d4-a716-446655440303',
    date: '2024-11-15',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 14980.00, // 214K * 7%
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440423',
    investmentId: '550e8400-e29b-41d4-a716-446655440303',
    date: '2024-11-15',
    type: CASHFLOW_TYPES.REINVESTMENT,
    amount: 14980.00,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // FY 2025-26: Third year interest on new principal (228.98K)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440424',
    investmentId: '550e8400-e29b-41d4-a716-446655440303',
    date: '2025-11-15',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 16029.00, // 228980 * 7%
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // ============ 54EC Bond (Investment 4 - Closed) ============
  // FY 2023-24 through 2024-25 (5 years of yearly payouts)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440430',
    investmentId: '550e8400-e29b-41d4-a716-446655440304',
    date: '2023-03-10',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 5500.00, // 100K * 5.5%
    financialYear: '2023-24',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440431',
    investmentId: '550e8400-e29b-41d4-a716-446655440304',
    date: '2024-03-10',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 5500.00,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Adjustment: Error correction for previous year's interest
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440432',
    investmentId: '550e8400-e29b-41d4-a716-446655440304',
    date: '2025-01-20',
    type: CASHFLOW_TYPES.ADJUSTMENT,
    amount: 250.00, // Correcting interest calculation error
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.MANUAL,
    status: CASHFLOW_STATUS.CONFIRMED,
    adjustsCashflowId: '550e8400-e29b-41d4-a716-446655440431', // Adjusts the interest entry
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440433',
    investmentId: '550e8400-e29b-41d4-a716-446655440304',
    date: '2025-03-10',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 5500.00,
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Maturity payout for 54EC Bond (closed investment)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655440434',
    investmentId: '550e8400-e29b-41d4-a716-446655440304',
    date: '2025-03-10',
    type: CASHFLOW_TYPES.MATURITY,
    amount: 100000.00,
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),
];

/**
 * Helper to find cash flows by investment ID
 */
export const getCashFlowsByInvestmentId = (investmentId) => {
  return mockCashFlows.filter((cf) => cf.investmentId === investmentId);
};

/**
 * Helper to find cash flows by financial year
 */
export const getCashFlowsByFinancialYear = (financialYear) => {
  return mockCashFlows.filter((cf) => cf.financialYear === financialYear);
};

/**
 * Helper to get all interest cash flows
 */
export const getInterestCashFlows = () => {
  return mockCashFlows.filter((cf) => cf.type === CASHFLOW_TYPES.INTEREST);
};

/**
 * Helper to get all TDS cash flows
 */
export const getTDSCashFlows = () => {
  return mockCashFlows.filter((cf) => cf.type === CASHFLOW_TYPES.TDS);
};
