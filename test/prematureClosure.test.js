import { describe, it, expect } from 'vitest';
import { generatePrematureClosureCashflows } from '../src/utils/cashflowAdjustments.js';

describe('generatePrematureClosureCashflows', () => {
  it('creates a premature_closure audit entry with zero amount and maturity_payout with finalPayout', () => {
    const investment = {
      id: 'inv-1',
      principal: 100000,
      interestRate: 7,
      compounding: 'no',
      maturityDate: '2025-12-07',
    };

    const prematureClosure = {
      isClosed: true,
      closureDate: '2025-03-19',
      recalculatedInterest: 3479.45,
      penaltyAmount: 500,
      finalPayout: 102979.45,
    };

    const cashflows = generatePrematureClosureCashflows(investment, prematureClosure, '2025-26');

    // Should contain maturity_payout
    const maturity = cashflows.find(cf => cf.type === 'maturity_payout');
    expect(maturity).toBeDefined();
    expect(maturity.amount).toBeCloseTo(102979.45, 2);

    // Should contain penalty (negative)
    const penalty = cashflows.find(cf => cf.type === 'penalty');
    expect(penalty).toBeDefined();
    expect(penalty.amount).toBe(-500);

    // Should contain tds_deduction (if any) or not depending on compounding
    // For compounding === 'no' the function currently checks investment.compounding !== 'no'
    // So tds may not be generated; assert that premature_closure audit exists and has metadata
    const audit = cashflows.find(cf => cf.type === 'premature_closure');
    expect(audit).toBeDefined();
    expect(audit.amount).toBe(0);
    expect(audit.investmentId).toBe('inv-1');
    expect(audit.date).toBe('2025-03-19');
    // Metadata should include original maturity and final payout and linked IDs
    expect(audit.metadata).toBeDefined();
    expect(audit.metadata.originalMaturityDate).toBe('2025-12-07');
    expect(audit.metadata.finalPayout).toBeCloseTo(102979.45, 2);
    // linkedCashflowIds should include maturity and penalty IDs
    expect(Array.isArray(audit.metadata.linkedCashflowIds)).toBe(true);
    const maturityId = cashflows.find(cf => cf.type === 'maturity_payout')?.id;
    const penaltyId = cashflows.find(cf => cf.type === 'penalty')?.id;
    if (maturityId) expect(audit.metadata.linkedCashflowIds).toContain(maturityId);
    if (penaltyId) expect(audit.metadata.linkedCashflowIds).toContain(penaltyId);
  });
});
