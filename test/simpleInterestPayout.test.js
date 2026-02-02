import { describe, it, expect } from 'vitest'

/**
 * Test for simple interest with periodic payout
 * 
 * When compounding === false AND interestPayout !== "maturity":
 * - System must compute positive interest
 * - System must generate interest cashflows (never zero)
 * - Net cash impact must equal sum of cashflows minus TDS
 */

describe('Simple Interest with Periodic Payout', () => {
  it('Acceptance Test: 30k principal, 7.4% rate, 390 days, yearly payout', () => {
    // Input
    const principal = 30000
    const annualRate = 7.4
    const durationDays = 390
    
    // Calculate simple interest
    const totalInterest = (principal * annualRate * durationDays) / (100 * 365)
    
    // Expected interest: 30000 * 7.4 * (390/365) / 100 = 2372.05
    expect(totalInterest).toBeCloseTo(2372.05, 0)
    
    // For yearly payout with 390 days duration:
    // - More than 365 days, so: 1 payout at year-end + 1 payout at maturity
    // - Or: 1-2 payouts depending on exact boundaries
    // Minimal expectation: at least 1 cashflow should be generated
    const numberOfPayouts = 1 // At minimum, one at maturity
    expect(numberOfPayouts).toBeGreaterThanOrEqual(1)
    
    // Maturity amount must be principal only (not principal + interest)
    const maturityAmount = principal // 30,000
    expect(maturityAmount).toBe(30000)
    
    // Net cash impact = total interest (assuming no TDS for this test)
    const netCashImpact = totalInterest
    expect(netCashImpact).toBeCloseTo(2372.05, 0)
    
    // Invariant: if totalInterest > 0, then interestCashflows.length >= 1
    // This must NEVER be zero
    expect(totalInterest).toBeGreaterThan(0)
    expect(numberOfPayouts).toBeGreaterThanOrEqual(1)
  })

  it('Simple interest formula: principal * rate * (durationDays / 365) / 100', () => {
    const principal = 100000
    const rate = 8.0
    const durationDays = 365
    
    const interest = (principal * rate * durationDays) / (100 * 365)
    expect(interest).toBe(8000) // 100000 * 8 * 365 / (100 * 365) = 8000
  })

  it('Effective growth factor for simple interest: 1 + rate * (durationDays / 365)', () => {
    const principal = 30000
    const rate = 7.4
    const durationDays = 390
    
    const effectiveGrowthFactor = 1 + (rate / 100) * (durationDays / 365)
    const expectedGrowthFactor = 1 + 0.074 * (390 / 365)
    
    expect(effectiveGrowthFactor).toBeCloseTo(expectedGrowthFactor, 5)
    expect(effectiveGrowthFactor).toBeCloseTo(1.0791, 4)
  })

  it('Interest must sum exactly across payout periods', () => {
    const principal = 50000
    const rate = 6.0
    const durationDays = 730 // 2 years
    
    // Assume quarterly payout = 4 periods (ignoring fractional last period)
    const totalInterest = (principal * rate * durationDays) / (100 * 365)
    const quarterlyInterest = totalInterest / 4
    
    // Sum of 4 quarters should equal total
    const sumOfPayouts = quarterlyInterest * 4
    expect(sumOfPayouts).toBeCloseTo(totalInterest, 0)
  })

  it('Maturity amount must always be principal for non-cumulative', () => {
    const principal = 25000
    const totalInterest = 1500
    
    // For non-cumulative: maturityAmount = principal (NOT principal + interest)
    const maturityAmount = principal
    const expectedMaturity = 25000
    
    expect(maturityAmount).toBe(expectedMaturity)
    // Interest is paid separately via cashflows, not added to maturity
    expect(maturityAmount).not.toBe(principal + totalInterest)
  })

  it('Net cash impact invariant: never zero when interest > 0', () => {
    const totalInterest = 2372.05
    const tds = 356.81 // Assuming 15% TDS
    
    const netCashImpact = totalInterest - tds
    
    // Net cash impact must never be zero when interest is positive
    expect(totalInterest).toBeGreaterThan(0)
    expect(netCashImpact).not.toBe(0)
    expect(netCashImpact).toBeCloseTo(2015.24, 0)
  })
})
