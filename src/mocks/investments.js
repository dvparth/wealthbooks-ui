/**
 * Mock investments for WealthBooks
 * Data array only (no factories or helper functions)
 * Follows banking rules: calendar quarters, FY accruals, compounding for maturity payouts
 */
export const mockInvestments = [
  // Stress FD - cumulative, quarterly calculation, maturity payout
  {
    id: 'inv-fd-st001',
    externalInvestmentId: 'FD_ST001',
    name: 'Stress Test FD - 444 Days',
    investmentTypeId: '550e8400-e29b-41d4-a716-446655440001',
    bankId: 'bank-001',
    ownerId: 'owner-003',
    startDate: '2024-08-23',
    maturityDate: '2025-11-20',
    principal: 750000,
    interestRate: 6.75,
    interestCalculationFrequency: 'quarterly',
    interestPayoutFrequency: 'maturity',
    expectedMaturityAmount: 816663.75,
    status: 'active'
  },
  // SCSS quarterly payout
  {
    id: 'inv-scss-001',
    externalInvestmentId: 'SCSS7890',
    name: 'Senior Citizens Savings - SCSS 2023',
    investmentTypeId: '550e8400-e29b-41d4-a716-446655440002',
    bankId: 'bank-003',
    ownerId: 'owner-002',
    startDate: '2023-06-01',
    maturityDate: '2028-06-01',
    principal: 300000,
    interestRate: 8.0,
    interestCalculationFrequency: 'quarterly',
    interestPayoutFrequency: 'quarterly',
    expectedMaturityAmount: 300000,
    status: 'active'
  },
  // NSC (maturity payout)
  {
    id: 'inv-nsc-001',
    externalInvestmentId: 'NSC20221115',
    name: 'National Savings Certificate - NSC X 2022',
    investmentTypeId: '550e8400-e29b-41d4-a716-446655440003',
    bankId: 'bank-005',
    ownerId: 'owner-004',
    startDate: '2022-11-15',
    maturityDate: '2027-11-15',
    principal: 200000,
    interestRate: 7.0,
    interestCalculationFrequency: 'yearly',
    interestPayoutFrequency: 'maturity',
    expectedMaturityAmount: 280608.99,
    status: 'active'
  },
  // 54EC bond (closed)
  {
    id: 'inv-bond-001',
    externalInvestmentId: '54EC2020A',
    name: '54EC Bond - 2020 Investment',
    investmentTypeId: '550e8400-e29b-41d4-a716-446655440004',
    bankId: 'bank-004',
    ownerId: 'owner-001',
    startDate: '2020-03-10',
    maturityDate: '2025-12-01',
    principal: 100000,
    interestRate: 5.5,
    interestCalculationFrequency: 'yearly',
    interestPayoutFrequency: 'yearly',
    expectedMaturityAmount: 100000,
    status: 'closed'
  },
  // FD partial reinvestment
  {
    id: 'inv-fd-reinv-001',
    externalInvestmentId: 'FD_PART_REINV',
    name: 'FD with Partial Reinvestment',
    investmentTypeId: '550e8400-e29b-41d4-a716-446655440001',
    bankId: 'bank-005',
    ownerId: 'owner-002',
    startDate: '2024-02-15',
    maturityDate: '2026-02-15',
    principal: 400000,
    interestRate: 6.25,
    interestCalculationFrequency: 'quarterly',
    interestPayoutFrequency: 'quarterly',
    expectedMaturityAmount: 400000,
    status: 'active'
  },
  // FD full reinvestment (created from reinvested cash)
  {
    id: 'inv-fd-full-reinv',
    externalInvestmentId: 'FD_FULL_REINV',
    name: 'FD created from Full Reinvestment',
    investmentTypeId: '550e8400-e29b-41d4-a716-446655440001',
    bankId: 'bank-002',
    ownerId: 'owner-002',
    // This investment was funded entirely by a reinvestment from another investment
    startDate: '2024-03-01',
    maturityDate: '2025-03-01',
    principal: 3664.75,
    interestRate: 6.0,
    interestCalculationFrequency: 'quarterly',
    interestPayoutFrequency: 'maturity',
    expectedMaturityAmount: 3760.00,
    status: 'active',
    sourceInvestmentId: 'inv-fd-310',
    sourceAmount: 3664.75,
  },
  // Premature closure example
  {
    id: 'inv-closed-premature',
    externalInvestmentId: 'FD_PREM_CLOSE',
    name: 'FD - Premature Closure',
    investmentTypeId: '550e8400-e29b-41d4-a716-446655440001',
    bankId: 'bank-003',
    ownerId: 'owner-001',
    startDate: '2023-06-01',
    maturityDate: '2025-06-01',
    principal: 250000,
    interestRate: 6.5,
    interestCalculationFrequency: 'quarterly',
    interestPayoutFrequency: 'maturity',
    expectedMaturityAmount: null,
    status: 'closed',
    closedAt: '2024-09-15',
    closureAmount: 252500.00,
    closureReason: 'Premature closure by customer',
  },
  // FD quarter test
  {
    id: 'inv-fd-quarter-test',
    externalInvestmentId: 'FD-QUARTER-TEST',
    name: 'FD - Quarterly Test',
    investmentTypeId: '550e8400-e29b-41d4-a716-446655440001',
    bankId: 'bank-001',
    ownerId: 'owner-003',
    startDate: '2026-02-01',
    maturityDate: '2027-02-01',
    principal: 100000,
    interestRate: 7.0,
    interestCalculationFrequency: 'quarterly',
    interestPayoutFrequency: 'maturity',
    expectedMaturityAmount: 107111.98,
    status: 'active'
  }
];

export function addInvestment(investment) {
  mockInvestments.push(investment)
}

