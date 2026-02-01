import { describe, it, expect } from 'vitest'
import { calculateFdMaturity } from '../src/utils/calculateFdMaturity'

import { calculateFdMaturityBankStyle } from '../src/utils/calculateFdMaturity'

describe('calculateFdMaturity - Fractional Quarterly Compounding (ACT/365)', () => {
  it('REFERENCE TEST: ₹457,779 @ 7.75% (Sep 19, 2024 → Dec 7, 2025) via Date objects', () => {
    const result = calculateFdMaturity({
      principal: 457779,
      annualRatePercent: 7.75,
      startDate: new Date(2024, 8, 19), // Sep 19, 2024
      maturityDate: new Date(2025, 11, 7), // Dec 7, 2025
    })

    console.log('\n╔════════════════════════════════════════════════════════════════╗')
    console.log('║        REFERENCE FD CALCULATION (ACT/365)                      ║')
    console.log('╚════════════════════════════════════════════════════════════════╝')
    console.log(`Principal:                ₹457,779`)
    console.log(`Annual Rate:              7.75%`)
    console.log(`Period:                   Sep 19, 2024 → Dec 7, 2025`)
    console.log(`Compounding:              Quarterly (4x per year)`)
    console.log(`Day Count Convention:     ACT/365`)
    console.log('')
    console.log('ALGORITHM BREAKDOWN:')
    console.log(`  Duration Days:          ${result.explanation.durationDays}`)
    console.log(`  Fractional Periods:     ${result.explanation.fractionalPeriods.toFixed(12)}`)
    console.log(`  Period Rate:            ${(result.explanation.periodRate * 100).toFixed(6)}%`)
    console.log(`  Growth Factor:          ${result.explanation.growthFactorRaw.toFixed(6)}`)
    console.log('')
    console.log('CALCULATED RESULTS:')
    console.log(`  Final Maturity Amount:  ₹${result.maturityAmount.toLocaleString('en-IN')}`)
    console.log(`  Interest Earned:        ₹${result.interestEarned.toLocaleString('en-IN')}`)
    console.log('')
    console.log(`Formula: exp(${result.explanation.fractionalPeriods.toFixed(6)} × ln(1.019375))`)
    console.log('╚════════════════════════════════════════════════════════════════╝\n')

    // Per Copilot's algorithm: exp(fractionalPeriods * ln(1 + periodRate)) with ACT/365
    expect(result.maturityAmount).toBe(502582.02)
    expect(result.interestEarned).toBe(44803.02)
  })

  it('ALTERNATIVE: Same case using durationDays parameter (444 days)', () => {
    const result = calculateFdMaturity({
      principal: 457779,
      annualRatePercent: 7.75,
      durationDays: 444, // Directly provide duration instead of computing from dates
    })

    console.log('\n╔════════════════════════════════════════════════════════════════╗')
    console.log('║  SAME CALCULATION via durationDays Parameter                  ║')
    console.log('╚════════════════════════════════════════════════════════════════╝')
    console.log(`Principal:                ₹457,779`)
    console.log(`Annual Rate:              7.75%`)
    console.log(`Duration Days:            444`)
    console.log(`Compounding:              Quarterly (4x per year)`)
    console.log(`Day Count Convention:     ACT/365`)
    console.log('')
    console.log('CALCULATED RESULTS:')
    console.log(`  Final Maturity Amount:  ₹${result.maturityAmount.toLocaleString('en-IN')}`)
    console.log(`  Interest Earned:        ₹${result.interestEarned.toLocaleString('en-IN')}`)
    console.log('╚════════════════════════════════════════════════════════════════╝\n')

    // Should match the date-based calculation
    expect(result.maturityAmount).toBe(502582.02)
    expect(result.interestEarned).toBe(44803.02)
  })

  it('should handle no compounding when principal is invested but not compounded', () => {
    const result = calculateFdMaturity({
      principal: 100000,
      annualRatePercent: 8,
      durationDays: 365,
    })

    // With quarterly compounding for 1 year: principal * (1.02)^4 ≈ 108243.22
    expect(result.maturityAmount).toBeCloseTo(108243.22, 2)
    expect(result.interestEarned).toBeCloseTo(8243.22, 2)
  })

  it('should return principal when duration is zero', () => {
    const result = calculateFdMaturity({
      principal: 100000,
      annualRatePercent: 8,
      durationDays: 0,
    })

    expect(result.maturityAmount).toBe(100000)
    expect(result.interestEarned).toBe(0)
  })
})

describe('calculateFdMaturityBankStyle - Bank Quarterly + Remainder (Traditional Method)', () => {
  it('BANK TEST: ₹457,779 @ 7.75% (444 days) - Per-Quarter Rounding', () => {
    const result = calculateFdMaturityBankStyle({
      principal: 457779,
      annualRatePercent: 7.75,
      durationDays: 444,
    })

    console.log('\n╔════════════════════════════════════════════════════════════════╗')
    console.log('║    BANK-STYLE FD CALCULATION (Quarterly + Remainder)           ║')
    console.log('╚════════════════════════════════════════════════════════════════╝')
    console.log(`Principal:                ₹457,779`)
    console.log(`Annual Rate:              7.75%`)
    console.log(`Duration:                 444 days`)
    console.log(`Compounding:              Quarterly (per-quarter rounding)`)
    console.log('')
    console.log('ALGORITHM BREAKDOWN:')
    console.log(`  Approx Quarter Days:    ${result.explanation.approxQuarterDays}`)
    console.log(`  Full Quarters:          ${result.explanation.fullQuarters}`)
    console.log(`  Remainder Days:         ${result.explanation.remainderDays}`)
    console.log(`  Period Rate:            ${(result.explanation.periodRate * 100).toFixed(6)}%`)
    console.log('')
    console.log('CALCULATED RESULTS:')
    console.log(`  Final Maturity Amount:  ₹${result.maturityAmount.toLocaleString('en-IN')}`)
    console.log(`  Interest Earned:        ₹${result.interestEarned.toLocaleString('en-IN')}`)
    console.log('╚════════════════════════════════════════════════════════════════╝\n')

    // Bank-style should give different (likely higher) result than fractional
    expect(result.maturityAmount).toBeGreaterThan(0)
    expect(result.interestEarned).toBeGreaterThan(0)
  })

  it('COMPARISON: Both modes on same input', () => {
    const params = {
      principal: 457779,
      annualRatePercent: 7.75,
      durationDays: 444,
    }

    const fractional = calculateFdMaturity(params)
    const bankStyle = calculateFdMaturityBankStyle(params)

    console.log('\n╔════════════════════════════════════════════════════════════════╗')
    console.log('║              MODE COMPARISON (Same Input)                      ║')
    console.log('╚════════════════════════════════════════════════════════════════╝')
    console.log(`Principal:                ₹457,779`)
    console.log(`Annual Rate:              7.75%`)
    console.log(`Duration:                 444 days`)
    console.log('')
    console.log('FRACTIONAL MODE (ACT/365, continuous):')
    console.log(`  Maturity: ₹${fractional.maturityAmount.toLocaleString('en-IN')}`)
    console.log(`  Interest: ₹${fractional.interestEarned.toLocaleString('en-IN')}`)
    console.log('')
    console.log('BANK-STYLE MODE (Quarterly + Remainder, per-quarter rounding):')
    console.log(`  Maturity: ₹${bankStyle.maturityAmount.toLocaleString('en-IN')}`)
    console.log(`  Interest: ₹${bankStyle.interestEarned.toLocaleString('en-IN')}`)
    console.log('')
    console.log(`Difference:               ₹${(bankStyle.maturityAmount - fractional.maturityAmount).toFixed(2)}`)
    console.log('╚════════════════════════════════════════════════════════════════╝\n')

    // Both should produce reasonable results
    expect(Math.abs(bankStyle.maturityAmount - fractional.maturityAmount)).toBeLessThan(1000)
  })

  it('should handle 1-year quarterly with bank-style', () => {
    const result = calculateFdMaturityBankStyle({
      principal: 100000,
      annualRatePercent: 8,
      durationDays: 365,
    })

    // Bank-style with per-quarter rounding should match standard quarterly
    expect(result.maturityAmount).toBeCloseTo(108243.22, 1)
    expect(result.interestEarned).toBeCloseTo(8243.22, 1)
  })
})
