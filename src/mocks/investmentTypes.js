/**
 * Mock investment types for WealthBooks
 * Data array only (no factories or helpers)
 */
export const mockInvestmentTypes = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    code: "FD",
    name: "Fixed Deposit (FD)",
    supportedCalculationFrequencies: ["quarterly"],
    supportedPayoutFrequencies: ["maturity"],
    supportsReinvestment: true,
    notes: "Bank Fixed Deposit with quarterly compounding, maturity payout"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    code: "SCSS",
    name: "Senior Citizen Savings Scheme (SCSS)",
    supportedCalculationFrequencies: ["quarterly"],
    supportedPayoutFrequencies: ["quarterly"],
    supportsReinvestment: false,
    notes: "Government scheme for senior citizens (60+), quarterly interest calculation and payout"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    code: "NSC",
    name: "National Savings Certificate (NSC)",
    supportedCalculationFrequencies: ["yearly"],
    supportedPayoutFrequencies: ["maturity"],
    supportsReinvestment: true,
    notes: "Government security with yearly compounding, maturity payout"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    code: "54EC",
    name: "54EC Taxable Bond",
    supportedCalculationFrequencies: ["yearly"],
    supportedPayoutFrequencies: ["yearly"],
    supportsReinvestment: true,
    notes: "Infrastructure bond with yearly interest calculation and payout, capital gains exemption under Section 54EC"
  }
];
