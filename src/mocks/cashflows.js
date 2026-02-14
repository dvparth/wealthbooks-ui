/**
 * Mock cashflows following banking rules:
 * - Quarterly periods end on calendar quarter ends
 * - Accruals only at FY end (31 Mar) or maturity
 * - TDS applied on payout dates
 * - Reinvestments reference target investments via reinvestedInvestmentId
 */
export const mockCashFlows = [
  // FD_ST001 (Stress FD) - confirmed quarterly interest, maturity compounded
  {
    id: 'cf-fd-st001-2024-09-30',
    investmentId: 'inv-fd-st001',
    date: '2024-09-30',
    type: 'interest',
    amount: 5396.58,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },
  {
    id: 'cf-fd-st001-2024-12-31',
    investmentId: 'inv-fd-st001',
    date: '2024-12-31',
    type: 'interest',
    amount: 12657.53,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },
  {
    id: 'cf-fd-st001-2025-03-31',
    investmentId: 'inv-fd-st001',
    date: '2025-03-31',
    type: 'interest',
    amount: 12410.96,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },
  {
    id: 'cf-fd-st001-2025-06-30',
    investmentId: 'inv-fd-st001',
    date: '2025-06-30',
    type: 'interest',
    amount: 12534.38,
    financialYear: '2025-26',
    source: 'system',
    status: 'confirmed',
  },
  {
    id: 'cf-fd-st001-mat',
    investmentId: 'inv-fd-st001',
    date: '2025-11-20',
    type: 'maturity',
    amount: 816663.75,
    financialYear: '2025-26',
    source: 'system',
    status: 'confirmed',
  },

  // SCSS quarterly payouts + TDS
  {
    id: 'cf-scss-2023-06-30',
    investmentId: 'inv-scss-001',
    date: '2023-06-30',
    type: 'interest',
    amount: 6000.0,
    financialYear: '2023-24',
    source: 'system',
    status: 'confirmed',
  },

  {
    id: '550e8400-e29b-41d4-a716-446655440431',
    investmentId: '550e8400-e29b-41d4-a716-446655440304',
    date: '2024-03-10',
    type: 'interest',
    amount: 5500.00,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },

  // Adjustment: Error correction for previous year's interest
  {
    id: '550e8400-e29b-41d4-a716-446655440432',
    investmentId: '550e8400-e29b-41d4-a716-446655440304',
    date: '2025-01-20',
    type: 'ADJUSTMENT',
    amount: 250.00,
    financialYear: '2024-25',
    source: 'manual',
    status: 'confirmed',
    adjustsCashflowId: '550e8400-e29b-41d4-a716-446655440431',
    linkedTo: 'INTEREST',
    isManual: true,
  },

  {
    id: '550e8400-e29b-41d4-a716-446655440433',
    investmentId: '550e8400-e29b-41d4-a716-446655440304',
    date: '2025-03-10',
    type: 'interest',
    amount: 5500.00,
    financialYear: '2025-26',
    source: 'system',
    status: 'confirmed',
  },

  // Maturity payout for 54EC Bond (closed investment)
  {
    id: '550e8400-e29b-41d4-a716-446655440434',
    investmentId: '550e8400-e29b-41d4-a716-446655440304',
    date: '2025-03-10',
    type: 'maturity',
    amount: 100000.00,
    financialYear: '2025-26',
    source: 'system',
    status: 'confirmed',
  },

  // ============ STRESS-TEST CASHFLOWS ============

  // ========== FD 444 DAYS (Investment 5) - Calendar Quarter Aligned =========
  // Start: 23 Aug 2024, Maturity: 01 Dec 2025
  // Quarterly periods MUST end on calendar quarter ends: 30 Sep, 31 Dec, 31 Mar, 30 Jun, 30 Sep, 31 Dec
  // First period: 23 Aug - 30 Sep 2024 (39 days prorated)
  
  {
    id: '550e8400-e29b-41d4-a716-446655450501',
    investmentId: '550e8400-e29b-41d4-a716-446655440305',
    date: '2024-09-30',
    type: 'interest',
    amount: 5409.25,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },

  // Q2: 01 Oct - 31 Dec 2024 (92 days)
  {
    id: '550e8400-e29b-41d4-a716-446655450502',
    investmentId: '550e8400-e29b-41d4-a716-446655440305',
    date: '2024-12-31',
    type: 'interest',
    amount: 12852.31,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },

  // Q3: 01 Jan - 31 Mar 2025 (90 days)
  {
    id: '550e8400-e29b-41d4-a716-446655450503',
    investmentId: '550e8400-e29b-41d4-a716-446655440305',
    date: '2025-03-31',
    type: 'interest',
    amount: 12786.82,
    financialYear: '2025-26',
    source: 'system',
    status: 'confirmed',
  },

  // Q4: 01 Apr - 30 Jun 2025 (91 days)
  {
    id: '550e8400-e29b-41d4-a716-446655450504',
    investmentId: '550e8400-e29b-41d4-a716-446655440305',
    date: '2025-06-30',
    type: 'interest',
    amount: 13144.08,
    financialYear: '2025-26',
    source: 'system',
    status: 'confirmed',
  },

  // Q5: 01 Jul - 01 Dec 2025 (154 days, partial - maturity before next quarter end)
  {
    id: '550e8400-e29b-41d4-a716-446655450505',
    investmentId: '550e8400-e29b-41d4-a716-446655440305',
    date: '2025-12-01',
    type: 'maturity',
    amount: 816663.75,
    financialYear: '2025-26',
    source: 'system',
    status: 'confirmed',
  },

  // ========== SCSS QUARTERLY (Investment 6) - Calendar Quarter Ends =========
  // Start: 18 Sept 2023 → First period: 30 Sept 2023 (partial: 13 days)
  // Subsequent periods align to calendar quarter ends: 31 Dec, 31 Mar, 30 Jun, 30 Sept
  
  // Q1 (18 Sept - 30 Sept 2023): Partial period, 13 days
  {
    id: '550e8400-e29b-41d4-a716-446655450601',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2023-09-30',
    type: 'interest',
    amount: 3476.67,
    financialYear: '2023-24',
    source: 'system',
    status: 'confirmed',
  },

  // Q2 (01 Oct - 31 Dec 2023): Full quarter, 92 days
  {
    id: '550e8400-e29b-41d4-a716-446655450602',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2023-12-31',
    type: 'interest',
    amount: 10366.67,
    financialYear: '2023-24',
    source: 'system',
    status: 'confirmed',
  },

  // Q3 (01 Jan - 31 Mar 2024): Full quarter, 91 days
  {
    id: '550e8400-e29b-41d4-a716-446655450603',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2024-03-31',
    type: 'interest',
    amount: 10250.00,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },

  {
    id: '550e8400-e29b-41d4-a716-446655450604',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2024-03-31',
    type: 'tds',
    amount: -2050.00,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },

  // Q4 (01 Apr - 30 Jun 2024): Full quarter, 91 days
  {
    id: '550e8400-e29b-41d4-a716-446655450605',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2024-06-30',
    type: 'interest',
    amount: 10250.00,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },

  {
    id: '550e8400-e29b-41d4-a716-446655450606',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2024-06-30',
    type: 'tds',
    amount: -2050.00,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },

  // Q5 (01 Jul - 30 Sept 2024): Full quarter, 92 days
  {
    id: '550e8400-e29b-41d4-a716-446655450607',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2024-09-30',
    type: 'interest',
    amount: 10366.67,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },

  {
    id: '550e8400-e29b-41d4-a716-446655450608',
    investmentId: '550e8400-e29b-41d4-a716-446655440306',
    date: '2024-09-30',
    type: 'tds',
    amount: -2073.33,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },

  // FD yearly confirmed payouts removed to enforce FY-end accruals per banking rules

  // ========== NSC LONG TENURE (Investment 8) - 5 year accrual =========
  // Accrued in past FYs (no payouts until maturity)
  {
    id: '550e8400-e29b-41d4-a716-446655450801',
    investmentId: '550e8400-e29b-41d4-a716-446655440308',
    date: '2023-03-22',
    type: 'interest',
    amount: 10650.00,
    financialYear: '2023-24',
    source: 'system',
    status: 'confirmed',
  },

  {
    id: '550e8400-e29b-41d4-a716-446655450802',
    investmentId: '550e8400-e29b-41d4-a716-446655440308',
    date: '2024-03-22',
    type: 'interest',
    amount: 11389.88,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },

  // ========== BOND DELAYED INTEREST (Investment 9) - FY 2022-23 missed, caught up in 2024 =========
  // FY 2023-24: First payout
  {
    id: '550e8400-e29b-41d4-a716-446655450901',
    investmentId: '550e8400-e29b-41d4-a716-446655440309',
    date: '2024-07-14',
    type: 'interest',
    amount: 11600.00,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },

  // FY 2024-25: Catch-up for previous year's interest (delayed by 1 year)
  {
    id: '550e8400-e29b-41d4-a716-446655450902',
    investmentId: '550e8400-e29b-41d4-a716-446655440309',
    date: '2024-10-01',
    type: 'interest',
    amount: 11600.00,
    financialYear: '2024-25',
    source: 'manual',
    status: 'confirmed',
  },

  // FY 2024-25: Current year regular payout
  {
    id: '550e8400-e29b-41d4-a716-446655450903',
    investmentId: '550e8400-e29b-41d4-a716-446655440309',
    date: '2025-07-14',
    type: 'interest',
    amount: 11600.00,
    financialYear: '2025-26',
    source: 'system',
    status: 'confirmed',
  },

  // ========== FD PARTIAL REINVESTMENT (Investment 10) - Quarterly payouts, 50% reinvested =========
  // FY 2023-24: Q1 (Nov 30 - Feb 29, partial period)
  {
    id: '550e8400-e29b-41d4-a716-446655451001',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-02-29',
    type: 'interest',
    amount: 7329.50,
    financialYear: '2023-24',
    source: 'system',
    status: 'confirmed',
  },

  // Partial reinvestment: 50% of interest reinvested
  {
    id: '550e8400-e29b-41d4-a716-446655451002',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-03-01',
    type: 'reinvestment',
    amount: -3664.75,
    financialYear: '2023-24',
    source: 'manual',
    status: 'confirmed',
    sourceInvestmentId: 'inv-fd-310',
    targetInvestmentId: 'inv-fd-st001',
  },

  // FY 2024-25: Q2 (Feb 29 - May 30)
  {
    id: '550e8400-e29b-41d4-a716-446655451003',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-05-30',
    type: 'interest',
    amount: 7354.17,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },

  // Partial reinvestment: 50% of Q2 interest
  {
    id: '550e8400-e29b-41d4-a716-446655451004',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-06-05',
    type: 'reinvestment',
    amount: -3677.08,
    financialYear: '2024-25',
    source: 'manual',
    status: 'confirmed',
    sourceInvestmentId: 'inv-fd-310',
    targetInvestmentId: 'inv-fd-st001',
  },

  // FY 2024-25: Q3 (May 30 - Aug 30)
  {
    id: '550e8400-e29b-41d4-a716-446655451005',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-08-30',
    type: 'interest',
    amount: 7354.17,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },

  // Partial reinvestment: 50% of Q3 interest
  {
    id: '550e8400-e29b-41d4-a716-446655451006',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-09-10',
    type: 'reinvestment',
    amount: -3677.08,
    financialYear: '2024-25',
    source: 'manual',
    status: 'confirmed',
    sourceInvestmentId: 'inv-fd-310',
    targetInvestmentId: 'inv-fd-st001',
  },

  // FY 2024-25: Q4 (Aug 30 - Nov 30)
  {
    id: '550e8400-e29b-41d4-a716-446655451007',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-11-30',
    type: 'interest',
    amount: 7354.17,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },

  // Manual adjustment: Interest correction for missed compounding
  {
    id: '550e8400-e29b-41d4-a716-446655451008',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2024-12-10',
    type: 'ADJUSTMENT',
    amount: 125.50,
    financialYear: '2024-25',
    source: 'manual',
    status: 'confirmed',
    linkedTo: 'INTEREST',
    isManual: true,
  },

  // FY 2025-26: Q1 (Nov 30 - Feb 28)
  {
    id: '550e8400-e29b-41d4-a716-446655451009',
    investmentId: '550e8400-e29b-41d4-a716-446655440310',
    date: '2025-02-28',
    type: 'interest',
    amount: 7354.17,
    financialYear: '2025-26',
    source: 'system',
    status: 'confirmed',
  },
  // ===== Additional flow examples =====
  // Full reinvestment: source pays out, target receives full amount
  {
    id: 'cf-full-reinv-source-2024-03-01',
    investmentId: 'inv-fd-310',
    date: '2024-03-01',
    type: 'reinvestment',
    amount: -3664.75,
    financialYear: '2023-24',
    source: 'system',
    status: 'confirmed',
    sourceInvestmentId: 'inv-fd-310',
    targetInvestmentId: 'inv-fd-full-reinv',
  },
  {
    id: 'cf-full-reinv-target-2024-03-01',
    investmentId: 'inv-fd-full-reinv',
    date: '2024-03-01',
    type: 'principal',
    amount: 3664.75,
    financialYear: '2023-24',
    source: 'system',
    status: 'confirmed',
    sourceInvestmentId: 'inv-fd-310',
    targetInvestmentId: 'inv-fd-full-reinv',
  },

  // Premature closure: funds moved out at closure
  {
    id: 'cf-closure-premature-2024-09-15',
    investmentId: 'inv-closed-premature',
    date: '2024-09-15',
    type: 'closure',
    amount: 252500.00,
    financialYear: '2024-25',
    source: 'manual',
    status: 'confirmed',
  },

  // Unallocated cash: funds moved out to unallocated pool (not tied to an investment)
  {
    id: 'cf-unallocated-2024-10-01',
    investmentId: null,
    date: '2024-10-01',
    type: 'unallocated',
    amount: 5000.00,
    financialYear: '2024-25',
    source: 'system',
    status: 'confirmed',
  },
];

export function addCashflow(cashflow) {
  mockCashFlows.push(cashflow)
}

