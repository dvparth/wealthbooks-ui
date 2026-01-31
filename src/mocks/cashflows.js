import { createCashFlow } from '../models/CashFlow.js';
import { CASHFLOW_TYPES, CASHFLOW_SOURCE, CASHFLOW_STATUS } from '../models/constants.js';

/**
 * Regenerated mock cashflows following banking rules:
 * - Quarterly periods end on calendar quarter ends
 * - Accruals only at FY end (31 Mar) or maturity
 * - TDS applied on payout dates
 * - Reinvestments reference target investments via reinvestedInvestmentId
 */
export const mockCashFlows = [
  // FD_ST001 (Stress FD) - confirmed quarterly interest, maturity compounded
  createCashFlow({
    id: 'cf-fd-st001-2024-09-30',
    investmentId: 'inv-fd-st001',
    date: '2024-09-30',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 5396.58,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),
  createCashFlow({
    id: 'cf-fd-st001-2024-12-31',
    investmentId: 'inv-fd-st001',
    date: '2024-12-31',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 12657.53,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),
  createCashFlow({
    id: 'cf-fd-st001-2025-03-31',
    investmentId: 'inv-fd-st001',
    date: '2025-03-31',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 12410.96,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),
  createCashFlow({
    id: 'cf-fd-st001-2025-06-30',
    investmentId: 'inv-fd-st001',
    date: '2025-06-30',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 12534.38,
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),
  createCashFlow({
    id: 'cf-fd-st001-mat',
    investmentId: 'inv-fd-st001',
    date: '2025-11-20',
    type: CASHFLOW_TYPES.MATURITY,
    amount: 816663.75,
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // SCSS quarterly payouts + TDS
  createCashFlow({
    id: 'cf-scss-2023-06-30',
    investmentId: 'inv-scss-001',
    date: '2023-06-30',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 6000.0,
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
    amount: 100000.00, // AUDIT FIX: Maturity should be principal only for yearly payout (interest paid annually)
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // ============ STRESS-TEST CASHFLOWS ============

  // ========== FD 444 DAYS (Investment 5) - Calendar Quarter Aligned =========
  // Start: 23 Aug 2024, Maturity: 01 Dec 2025
  // Quarterly periods MUST end on calendar quarter ends: 30 Sep, 31 Dec, 31 Mar, 30 Jun, 30 Sep, 31 Dec
  // First period: 23 Aug - 30 Sep 2024 (39 days prorated)
  
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450501',
    investmentId: '550e8400-e29b-41d4-a716-446655440305',
    date: '2024-09-30',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 5409.25, // AUDIT FIX: Compounded interest on running principal for 39 days
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Q2: 01 Oct - 31 Dec 2024 (92 days)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450502',
    investmentId: '550e8400-e29b-41d4-a716-446655440305',
    date: '2024-12-31',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 12852.31, // AUDIT FIX: Compounded interest on running principal for 92 days
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Q3: 01 Jan - 31 Mar 2025 (90 days)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450503',
    investmentId: '550e8400-e29b-41d4-a716-446655440305',
    date: '2025-03-31',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 12786.82, // AUDIT FIX: Compounded interest on running principal for 90 days
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Q4: 01 Apr - 30 Jun 2025 (91 days)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450504',
    investmentId: '550e8400-e29b-41d4-a716-446655440305',
    date: '2025-06-30',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 13144.08, // AUDIT FIX: Compounded interest on running principal for 91 days
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Q5: 01 Jul - 01 Dec 2025 (154 days, partial - maturity before next quarter end)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450505',
    investmentId: '550e8400-e29b-41d4-a716-446655440305',
    date: '2025-12-01',
    type: CASHFLOW_TYPES.MATURITY,
    amount: 816663.75, // AUDIT FIX: Maturity payout = principal + all compounded interest (per-period compounding)
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // ========== SCSS QUARTERLY (Investment 6) - Calendar Quarter Ends =========
  // Start: 18 Sept 2023 → First period: 30 Sept 2023 (partial: 13 days)
  // Subsequent periods align to calendar quarter ends: 31 Dec, 31 Mar, 30 Jun, 30 Sept
  
  // Q1 (18 Sept - 30 Sept 2023): Partial period, 13 days
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450601',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2023-09-30',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 3476.67, // 500K * 8.2% / 365 * 13 days
    financialYear: '2023-24',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Q2 (01 Oct - 31 Dec 2023): Full quarter, 92 days
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450602',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2023-12-31',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 10366.67, // 500K * 8.2% / 365 * 92 days
    financialYear: '2023-24',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Q3 (01 Jan - 31 Mar 2024): Full quarter, 91 days
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450603',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2024-03-31',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 10250.00, // 500K * 8.2% / 365 * 91 days
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450604',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2024-03-31',
    type: CASHFLOW_TYPES.TDS,
    amount: -2050.00, // 20% TDS on interest exceeding Rs. 40K cumulative
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Q4 (01 Apr - 30 Jun 2024): Full quarter, 91 days
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450605',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2024-06-30',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 10250.00,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450606',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2024-06-30',
    type: CASHFLOW_TYPES.TDS,
    amount: -2050.00,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Q5 (01 Jul - 30 Sept 2024): Full quarter, 92 days
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450607',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2024-09-30',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 10366.67,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450608',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2024-09-30',
    type: CASHFLOW_TYPES.TDS,
    amount: -2073.33,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // FD yearly confirmed payouts removed to enforce FY-end accruals per banking rules

  // ========== NSC LONG TENURE (Investment 8) - 5 year accrual =========
  // Accrued in past FYs (no payouts until maturity)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450801',
    investmentId: '550e8400-e29b-41d4-a716-446655440308',
    date: '2023-03-22',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 10650.00, // Year 1: 150K * 7.1%
    financialYear: '2023-24',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450802',
    investmentId: '550e8400-e29b-41d4-a716-446655440308',
    date: '2024-03-22',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 11389.88, // Year 2: compounding effect (approx)
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // ========== BOND DELAYED INTEREST (Investment 9) - FY 2022-23 missed, caught up in 2024 =========
  // FY 2023-24: First payout
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450901',
    investmentId: '550e8400-e29b-41d4-a716-446655440309',
    date: '2024-07-14',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 11600.00, // 200K * 5.8%
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // FY 2024-25: Catch-up for previous year's interest (delayed by 1 year)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450902',
    investmentId: '550e8400-e29b-41d4-a716-446655440309',
    date: '2024-10-01',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 11600.00, // Previous year's interest, paid late
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.MANUAL,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // FY 2024-25: Current year regular payout
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655450903',
    investmentId: '550e8400-e29b-41d4-a716-446655440309',
    date: '2025-07-14',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 11600.00,
    financialYear: '2025-26',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // ========== FD PARTIAL REINVESTMENT (Investment 10) - Quarterly payouts, 50% reinvested =========
  // FY 2023-24: Q1 (Nov 30 - Feb 29, partial period)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655451001',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-02-29',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 7329.50, // 425K * 6.9% / 4 (partial quarter)
    financialYear: '2023-24',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Partial reinvestment: 50% of interest reinvested
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655451002',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-03-01',
    type: CASHFLOW_TYPES.REINVESTMENT,
    amount: -3664.75, // 50% of interest reinvested into a new FD
    financialYear: '2023-24',
    source: CASHFLOW_SOURCE.MANUAL,
    status: CASHFLOW_STATUS.CONFIRMED,
    reinvestedInvestmentId: 'inv-fd-st001', // Into FD 444 days
  }),

  // FY 2024-25: Q2 (Feb 29 - May 30)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655451003',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-05-30',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 7354.17, // Quarter interest
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Partial reinvestment: 50% of Q2 interest
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655451004',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-06-05',
    type: CASHFLOW_TYPES.REINVESTMENT,
    amount: -3677.08,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.MANUAL,
    status: CASHFLOW_STATUS.CONFIRMED,
    reinvestedInvestmentId: 'inv-fd-st001',
  }),

  // FY 2024-25: Q3 (May 30 - Aug 30)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655451005',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-08-30',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 7354.17,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Partial reinvestment: 50% of Q3 interest
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655451006',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-09-10',
    type: CASHFLOW_TYPES.REINVESTMENT,
    amount: -3677.08,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.MANUAL,
    status: CASHFLOW_STATUS.CONFIRMED,
    reinvestedInvestmentId: 'inv-fd-st001',
  }),

  // FY 2024-25: Q4 (Aug 30 - Nov 30)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655451007',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-11-30',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 7354.17,
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.SYSTEM,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // Manual adjustment: Interest correction for missed compounding
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655451008',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-12-10',
    type: CASHFLOW_TYPES.ADJUSTMENT,
    amount: 125.50, // Correction adjustment
    financialYear: '2024-25',
    source: CASHFLOW_SOURCE.MANUAL,
    status: CASHFLOW_STATUS.CONFIRMED,
  }),

  // FY 2025-26: Q1 (Nov 30 - Feb 28)
  createCashFlow({
    id: '550e8400-e29b-41d4-a716-446655451009',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2025-02-28',
    type: CASHFLOW_TYPES.INTEREST,
    amount: 7354.17,
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
