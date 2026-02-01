import { describe, it, expect } from 'vitest';
import { mockInvestments } from '../src/mocks/investments.js';
import { mockCashFlows } from '../src/mocks/cashflows.js';
import { mockBanks } from '../src/mocks/banks.js';
import { mockOwners } from '../src/mocks/owners.js';
import { mockInvestmentTypes } from '../src/mocks/investmentTypes.js';

describe('mocks basic sanity', () => {
  it('exports non-empty arrays', () => {
    expect(Array.isArray(mockInvestments)).toBe(true);
    expect(mockInvestments.length).toBeGreaterThan(0);

    expect(Array.isArray(mockCashFlows)).toBe(true);
    expect(mockCashFlows.length).toBeGreaterThan(0);

    expect(Array.isArray(mockBanks)).toBe(true);
    expect(mockBanks.length).toBeGreaterThan(0);

    expect(Array.isArray(mockOwners)).toBe(true);
    expect(mockOwners.length).toBeGreaterThan(0);

    expect(Array.isArray(mockInvestmentTypes)).toBe(true);
    expect(mockInvestmentTypes.length).toBeGreaterThan(0);
  });

  it('cashflow has required fields', () => {
    const cf = mockCashFlows[0];
    expect(cf).toHaveProperty('id');
    expect(cf).toHaveProperty('investmentId');
    expect(cf).toHaveProperty('date');
    expect(cf).toHaveProperty('type');
    expect(cf).toHaveProperty('amount');
  });
});
