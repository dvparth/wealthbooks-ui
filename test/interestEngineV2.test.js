import { describe, it, expect } from 'vitest'
import { calculateQuarterlyCompoundedMaturity } from '../src/utils/interestEngineV2'

describe('InterestEngineV2 - Quarterly Compounding', () => {
  it('should calculate quarterly compounded FD interest', () => {
    // Reference case from user
    const principal = 457779
    const rate = 7.75
    const startDate = '2024-09-19'
    const maturityDate = '2025-12-07'

    const result = calculateQuarterlyCompoundedMaturity(principal, rate, startDate, maturityDate)

    console.log('\n=== QUARTERLY COMPOUNDING CALCULATION ===')
    console.log(`Principal: ₹${principal.toLocaleString('en-IN')}`)
    console.log(`Rate: ${rate}% p.a.`)
    console.log(`Period: ${startDate} to ${maturityDate}`)
    console.log(`Full quarters crossed: ${result.fullQuarters.length}`)
    if (result.fullQuarters && Array.isArray(result.fullQuarters)) {
      result.fullQuarters.forEach((q, i) => {
        const dateStr = q instanceof Date ? q.toISOString().split('T')[0] : q
        console.log(`  Q${i + 1}: ${dateStr}`)
      })
    }
    console.log(`Compounded amount: ₹${result.compoundedAmount.toLocaleString('en-IN')}`)
    console.log(`Remainder days: ${result.remainderDays}`)
    console.log(`Remainder interest: ₹${result.remainderInterest.toLocaleString('en-IN')}`)
    console.log(`---`)
    console.log(`Calculated maturity: ₹${result.maturityAmount.toLocaleString('en-IN')}`)
    console.log(`Calculated interest: ₹${result.totalInterest.toLocaleString('en-IN')}`)
    console.log('=====================================\n')

    // Verify the calculation produces reasonable results
    expect(result.maturityAmount).toBeGreaterThan(principal)
    expect(result.totalInterest).toBeGreaterThan(0)
    expect(result.fullQuarters.length).toBeGreaterThan(0)
  })
})
