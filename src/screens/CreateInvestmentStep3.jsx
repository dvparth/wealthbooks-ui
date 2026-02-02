import { useEffect, useMemo, useState } from 'react'
import { mockInvestmentTypes, mockOwners, mockBanks, mockInvestments, addInvestment, mockCashflows, addCashflow } from '../mocks/index.js'
import { calculateFdMaturity, calculateFdMaturityBankStyle } from '../utils/calculateFdMaturity.js'
import { createInvestment } from '../models/Investment.js'
import { createCashFlow } from '../models/CashFlow.js'
import '../styles/CreateInvestment.css'

export default function CreateInvestmentStep3({ onBack, onDone }) {
  const [step1, setStep1] = useState(null)
  const [step2, setStep2] = useState(null)
  const [step1Loaded, setStep1Loaded] = useState(false)
  const [step2Loaded, setStep2Loaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actualMaturityAmount, setActualMaturityAmount] = useState('')
  const [diagnosticsExpanded, setDiagnosticsExpanded] = useState(false)

  // Helper to identify any interest-like cashflow types
  const isInterestCf = (cf) => cf && (cf.type === 'interest' || cf.type === 'accrued_interest' || cf.type === 'interest_accrual' || cf.type === 'maturity_payout' || cf.type === 'interest_payout')

  // Load step 1 and 2 data from sessionStorage
  useEffect(() => {
    try {
      const raw1 = sessionStorage.getItem('wb:createInvestment:step1')
      setStep1(raw1 ? JSON.parse(raw1) : null)
      console.debug('[Step3] Loaded step1 from sessionStorage:', raw1 ? JSON.parse(raw1) : null)
    } catch (e) {
      console.warn('[Step3] Error loading step1:', e)
      setStep1(null)
    } finally {
      setStep1Loaded(true)
    }
  }, [])

  useEffect(() => {
    try {
      const raw2 = sessionStorage.getItem('wb:createInvestment:step2')
      setStep2(raw2 ? JSON.parse(raw2) : null)
      console.debug('[Step3] Loaded step2 from sessionStorage:', raw2 ? JSON.parse(raw2) : null)
    } catch (e) {
      console.warn('[Step3] Error loading step2:', e)
      setStep2(null)
    } finally {
      setStep2Loaded(true)
    }
  }, [])

  // Validate both steps loaded and have data
  useEffect(() => {
    if (step1Loaded && step2Loaded && (!step1 || !step2)) {
      console.warn('[Step3] Missing step1 or step2 data, calling onBack')
      onBack && onBack()
    }
  }, [step1Loaded, step2Loaded, step1, step2, onBack])

  // Resolve lookup references
  const investmentType = useMemo(() => {
    if (!step1) return null
    return mockInvestmentTypes.find((t) => t.id === step1.investmentTypeId)
  }, [step1])

  const owner = useMemo(() => {
    if (!step1) return null
    return mockOwners.find((o) => o.id === step1.ownerId)
  }, [step1])

  const bank = useMemo(() => {
    if (!step1) return null
    return mockBanks.find((b) => b.id === step1.bankId)
  }, [step1])

  // Detect investment type based on interest payout frequency (canonical rule)
  // isCumulative: interest paid at maturity
  // isNonCumulative: interest paid periodically (quarterly, monthly, annually, etc.)
  const isCumulative = useMemo(() => {
    const result = step2?.payoutFreq === 'maturity'
    console.log('[Step3] isCumulative check: payoutFreq=%s, result=%s', step2?.payoutFreq, result)
    return result
  }, [step2])

  const isNonCumulative = useMemo(() => {
    return !isCumulative
  }, [isCumulative])

  // Check if investment is matured (historical)
  const isMatured = useMemo(() => {
    if (!step1?.maturityDate) return false
    const today = new Date()
    const maturityDate = new Date(step1.maturityDate)
    return maturityDate < today
  }, [step1])

  // Build preview investment object for interest engine
  const previewInvestment = useMemo(() => {
    if (!step1 || !step2 || !investmentType) return null
    // calculationMode must always come from user form state, never from defaults
    const selectedMode = step2.calculationMode || 'fractional'
    if (!selectedMode) {
      console.error('[Step3] GUARD: calculationMode is undefined! Defaulting to fractional.')
    }
    console.log('[Step3] previewInvestment: calcMode=%s compounding=%s calcFreq=%s payoutFreq=%s', selectedMode, step2.compounding, step2.calcFreq, step2.payoutFreq)

    return {
      id: `preview-${Date.now()}`,
      externalInvestmentId: step1.externalId || 'PREVIEW',
      name: investmentType.name,
      principal: step2.principal,
      interestRate: step2.rate,
      startDate: step1.startDate,
      maturityDate: step1.maturityDate,
      interestCalculationFrequency: step2.calcFreq,
      interestPayoutFrequency: step2.payoutFreq,
      calculationMode: selectedMode,
      compounding: step2.compounding || 'no',
      status: 'active',
      ownerId: step1.ownerId,
    }
  }, [step1, step2, investmentType])

  // Generate preview cashflows using quarterly compounding engine (FD) or periodic payouts (Non-Cumulative)
  const previewCashflows = useMemo(() => {
    if (!previewInvestment || !step2) return []

    const { principal, interestRate, startDate, maturityDate } = previewInvestment

    // Helper: parse YYYY-MM-DD to Date object
    const parseDate = (dateStr) => {
      const parts = dateStr.split('-')
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    }

    // Helper: format Date back to YYYY-MM-DD
    const formatDate = (date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    const start = parseDate(startDate)
    const maturityDateObj = parseDate(maturityDate)

    console.log('[Step3] previewCashflows branch: isCumulative=%s, isNonCumulative=%s', isCumulative, isNonCumulative)

    // ============ NON-CUMULATIVE (PERIODIC PAYOUT) LOGIC ============
    if (isNonCumulative) {
      const schedule = []
      
      // Simple interest with periodic payout must always generate cashflows
      // Calculate total simple interest for the entire investment period
      const durationDays = Math.floor((maturityDateObj - start) / (1000 * 60 * 60 * 24))
      const totalSimpleInterest = (principal * interestRate * durationDays) / (100 * 365)
      
      // Calculate periodic interest based on calculation frequency
      const compoundingPeriodsPerYear = step2.calcFreq === 'quarterly' ? 4 : step2.calcFreq === 'monthly' ? 12 : 1
      // For simple interest with periodic payout, distribute totalSimpleInterest across payout dates
      let periodicInterest = step2.compounding === 'no'
        ? Math.round(totalSimpleInterest / Math.max(1, compoundingPeriodsPerYear)) // Distribute equally across periods
        : Math.round((principal * interestRate) / compoundingPeriodsPerYear / 100)
      
      // Helper to get quarter-end dates (31 Mar, 30 Jun, 30 Sep, 31 Dec)
      const getQuarterEndDates = (year) => [
        new Date(year, 2, 31),   // 31 Mar
        new Date(year, 5, 30),   // 30 Jun
        new Date(year, 8, 30),   // 30 Sep
        new Date(year, 11, 31),  // 31 Dec
      ]

      // Helper to get month-end dates
      const getMonthEndDates = (year) => {
        const dates = []
        for (let month = 0; month < 12; month++) {
          const nextMonth = new Date(year, month + 1, 0)
          dates.push(nextMonth)
        }
        return dates
      }

      // Generate payout dates based on payout frequency
      const getPayoutDates = () => {
        const dates = []
        
        // For yearly payout: generate anniversaries of start date + final payout at maturity
        if (step2.payoutFreq === 'annually') {
          // Simple interest with yearly payout must always generate at least one interest cashflow
          let currentAnniversary = new Date(start)
          currentAnniversary.setFullYear(currentAnniversary.getFullYear() + 1) // First anniversary
          
          while (currentAnniversary < maturityDateObj) {
            dates.push(new Date(currentAnniversary))
            currentAnniversary.setFullYear(currentAnniversary.getFullYear() + 1)
          }
          
          // Always add final payout at maturity (unless it's already at an anniversary)
          const lastDate = dates.length > 0 ? dates[dates.length - 1] : null
          if (!lastDate || formatDate(lastDate) !== formatDate(maturityDateObj)) {
            dates.push(maturityDateObj)
          }
        } else {
          // For quarterly and monthly, use existing logic
          let currentYear = start.getFullYear()
          
          while (currentYear <= maturityDateObj.getFullYear()) {
            if (step2.payoutFreq === 'quarterly') {
              getQuarterEndDates(currentYear).forEach(date => {
                if (date >= start && date <= maturityDateObj) dates.push(date)
              })
            } else if (step2.payoutFreq === 'monthly') {
              getMonthEndDates(currentYear).forEach(date => {
                if (date >= start && date <= maturityDateObj) dates.push(date)
              })
            }
            currentYear++
          }
        }
        
        return dates.sort((a, b) => a - b)
      }

      const payoutDates = getPayoutDates()

      // For simple interest: ensure all periods sum to totalSimpleInterest
      let remainingInterest = step2.compounding === 'no' ? totalSimpleInterest : 0
      
      // Generate interest cashflows for each payout date
      payoutDates.forEach((payoutDate, idx) => {
        const fy = (() => {
          const y = payoutDate.getFullYear()
          const m = payoutDate.getMonth()
          if (m >= 3) {
            return `FY${y}-${String(y + 1).slice(-2)}`
          } else {
            return `FY${y - 1}-${String(y).slice(-2)}`
          }
        })()

        // For simple interest, allocate remaining interest to last period; others get periodic
        let amount = periodicInterest
        if (step2.compounding === 'no' && idx === payoutDates.length - 1) {
          // Last payout: add any rounding remainder
          amount = Math.round(remainingInterest)
        } else if (step2.compounding === 'no') {
          remainingInterest -= amount
        }

        schedule.push({
          id: `payout-${formatDate(payoutDate)}`,
          investmentId: previewInvestment.id,
          date: formatDate(payoutDate),
          type: 'interest',
          amount: amount,
          fy,
          status: payoutDate < new Date() ? 'completed' : 'planned',
          source: 'system',
          isPreview: true,
        })
      })

      console.log('[Step3] Non-cumulative payout schedule: payoutFreq=%s, payoutDates=%d, periodicInterest=%f, totalSimple=%f, isSimple=%s', 
        step2.payoutFreq, payoutDates.length, periodicInterest, step2.compounding === 'no' ? totalSimpleInterest : 0, step2.compounding === 'no')
      
      // Simple interest with yearly payout must always generate at least one interest cashflow
      if (step2.compounding === 'no' && totalSimpleInterest > 0 && schedule.length === 0) {
        // Guardrail: this should never happen. If it does, force a single payout at maturity.
        console.warn('[Step3] GUARDRAIL: No cashflows generated for simple interest. Forcing payout at maturity.')
        const fy = (() => {
          const y = maturityDateObj.getFullYear()
          const m = maturityDateObj.getMonth()
          if (m >= 3) {
            return `FY${y}-${String(y + 1).slice(-2)}`
          } else {
            return `FY${y - 1}-${String(y).slice(-2)}`
          }
        })()
        schedule.push({
          id: `payout-${formatDate(maturityDateObj)}`,
          investmentId: previewInvestment.id,
          date: formatDate(maturityDateObj),
          type: 'interest',
          amount: Math.round(totalSimpleInterest),
          fy,
          status: maturityDateObj < new Date() ? 'completed' : 'planned',
          source: 'system',
          isPreview: true,
        })
      }
      
      return schedule
    }

    // ============ CUMULATIVE (MATURITY PAYOUT) LOGIC ============
    // Daily accrual model: interest accrues daily, taxed per FY, paid at payout timing
    const compoundingFrequencyPerYear = step2.calcFreq === 'quarterly' ? 4 : step2.calcFreq === 'monthly' ? 12 : 1
    
    // CRITICAL: Check compounding flag
    // If compounding === 'no', use simple interest formula regardless of mode selection
    let maturityResult
    if (step2.compounding === 'no') {
      // Simple interest formula: interest = principal * rate * (durationDays / 365)
      const durationDays = Math.floor((maturityDateObj - start) / (1000 * 60 * 60 * 24))
      const simpleInterest = (principal * interestRate * durationDays) / (100 * 365)
      maturityResult = {
        maturityAmount: principal + simpleInterest,
        interestEarned: simpleInterest,
        explanation: {
          method: 'simple_interest',
          durationDays,
          rate: interestRate,
          principal,
        }
      }
      console.log('[Step3] Using SIMPLE INTEREST: durationDays=%d, interest=%f, maturity=%f', durationDays, simpleInterest, principal + simpleInterest)
    } else {
      // Compounding enabled: use selected calculation mode
      maturityResult = (previewInvestment?.calculationMode === 'bank')
        ? calculateFdMaturityBankStyle({ principal, annualRatePercent: interestRate, startDate: start, maturityDate: maturityDateObj, compoundingFrequencyPerYear })
        : calculateFdMaturity({ principal, annualRatePercent: interestRate, startDate: start, maturityDate: maturityDateObj, compoundingFrequencyPerYear })
      console.log('[Step3] Using COMPOUND INTEREST: mode=%s, interest=%f, maturity=%f', previewInvestment?.calculationMode, maturityResult.interestEarned, maturityResult.maturityAmount)
    }

    const totalInterestEarned = maturityResult.interestEarned
    const totalDurationDays = Math.floor((maturityDateObj - start) / (1000 * 60 * 60 * 24))

    // Helper to get financial year
    const getFinancialYear = (date) => {
      const year = date.getFullYear()
      const month = date.getMonth()
      if (month >= 3) {
        return `FY${year}-${String(year + 1).slice(-2)}`
      } else {
        return `FY${year - 1}-${String(year).slice(-2)}`
      }
    }

    // Cumulative investments must accrue interest per FY for taxation correctness
    // Calculate accrued amount at each FY boundary using proper compounding/simple interest
    const accrualByFY = {}
    
    let currentFYStart = new Date(start.getFullYear(), 3, 1) // 1 Apr of start year
    if (start.getMonth() < 3) {
      currentFYStart = new Date(start.getFullYear() - 1, 3, 1)
    }

    let previousAccumulated = principal // Track accumulated balance for true compounding

    while (currentFYStart <= maturityDateObj) {
      const fyStartYear = currentFYStart.getFullYear()
      const fyLabel = `FY${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`
      const fyEnd = new Date(fyStartYear + 1, 2, 31) // 31 Mar of the FY end year

      // Compute days in this FY that overlap with investment period
      const periodStart = currentFYStart > start ? currentFYStart : start
      const periodEnd = fyEnd < maturityDateObj ? fyEnd : maturityDateObj

      if (periodStart <= periodEnd) {
        // Calculate accumulated amount at periodEnd using actual compounding formula
        const daysFromStart = Math.floor((periodEnd - start) / (1000 * 60 * 60 * 24)) + 1
        const yearsFromStart = daysFromStart / 365.25
        
        let accumulatedAtFYEnd
        if (step2.compounding === 'no') {
          // Simple interest: only depends on days from start
          accumulatedAtFYEnd = principal + (principal * interestRate * yearsFromStart) / 100
        } else {
          // Compound interest: use the actual compounding formula
          const periodsFromStart = yearsFromStart * compoundingFrequencyPerYear
          accumulatedAtFYEnd = principal * Math.pow(1 + (interestRate / 100 / compoundingFrequencyPerYear), periodsFromStart)
        }
        
        const accruedForFY = accumulatedAtFYEnd - previousAccumulated
        accrualByFY[fyLabel] = {
          accruedAmount: accruedForFY,
          fyEndDate: periodEnd < fyEnd ? periodEnd : fyEnd,
        }
        console.log('[Step3] FY accrual: %s, accumulated=₹%f, previousAccum=₹%f, accrued=₹%f', fyLabel, accumulatedAtFYEnd, previousAccumulated, accruedForFY)
        
        previousAccumulated = accumulatedAtFYEnd
      }

      currentFYStart = new Date(fyStartYear + 1, 3, 1)
    }
    console.log('[Step3] accrualByFY keys: %s', Object.keys(accrualByFY).join(', '))

    const schedule = []

    // Generate interest_accrual cashflows for each FY
    const fyEntries = Object.entries(accrualByFY).map(([fy, data]) => {
      return { fy, accruedAmount: data.accruedAmount, fyEndDate: data.fyEndDate }
    }).sort((a, b) => a.fyEndDate - b.fyEndDate)

    console.log('[Step3] fyEntries count: %d, entries: %s', fyEntries.length, fyEntries.map(e => e.fy).join(', '))

    let totalAccruedRounded = 0
    fyEntries.forEach(({ fy, accruedAmount, fyEndDate }) => {
      const accruedRounded = Math.round(accruedAmount * 100) / 100 // Bank rounding to 2 decimals
      if (accruedRounded > 0) {
        schedule.push({
          id: `accrual-${fy}`,
          investmentId: previewInvestment.id,
          date: formatDate(fyEndDate),
          type: 'interest_accrual',
          amount: accruedRounded,
          fy,
          status: fyEndDate < new Date() ? 'completed' : 'planned',
          source: 'system',
          isPreview: true,
        })
        totalAccruedRounded += accruedRounded
        console.log('[Step3] Added interest_accrual: %s, ₹%f (%f rounded)', fy, accruedAmount, accruedRounded)
      }
    })
    // For cumulative FDs with payout at maturity:
    // - Interest is tracked via interest_accrual (per FY, POSITIVE)
    // - TDS is tracked via tds_deduction (same dates, NEGATIVE)
    // - NO interest_payout cashflow should be generated (interest already accrued)
    // - NO maturity_payout (principal is not paid in preview)
    
    // Note: For non-cumulative investments with interim/periodic payouts,
    // interest_payout would be generated, but that's handled in the non-cumulative section above

    // ===== INVARIANT ASSERTIONS =====
    // Validate the accrual model correctness for cumulative investments
    const accrualCashflows = schedule.filter(cf => cf.type === 'interest_accrual')
    const totalAccrualAmount = accrualCashflows.reduce((sum, cf) => sum + cf.amount, 0)
    const relativeError = Math.abs(totalAccrualAmount - totalInterestEarned) / Math.max(totalInterestEarned, 0.01)
    
    console.log('[Step3] Final invariant check: accruals=%d, totalAmount=₹%f, totalInterest=₹%f, relError=%f%%', 
      accrualCashflows.length, totalAccrualAmount, totalInterestEarned, relativeError * 100)
    
    console.assert(
      relativeError < 0.01, // Allow up to 1% relative error (per-FY rounding tolerance)
      `[Step3] Accrual invariant: Sum(interest_accrual)=${totalAccrualAmount.toFixed(2)}, totalInterest=${totalInterestEarned.toFixed(2)}, relError=${(relativeError * 100).toFixed(4)}%`
    )
    
    console.assert(
      accrualCashflows.length > 0,
      `[Step3] CRITICAL: No interest_accrual cashflows generated! Investment: ${startDate} to ${maturityDate}, totalInterest=₹${totalInterestEarned.toFixed(2)}`
    )

    // 2. CRITICAL: No negative cashflows allowed
    schedule.forEach(cf => {
      console.assert(
        cf.amount >= 0,
        `[Step3] NEGATIVE CASHFLOW VIOLATION: ${cf.type} id=${cf.id} has amount=${cf.amount} (must be ≥ 0)`
      )
    })

    // 3. For cumulative FDs with maturity payout: no interest_payout should exist
    const interestPayouts = schedule.filter(cf => cf.type === 'interest_payout')
    if (step2.payoutFreq === 'maturity' && interestPayouts.length > 0) {
      console.warn(
        `[Step3] Unexpected interest_payout for maturity FD: ${interestPayouts.length} found (should be 0 for cumulative maturity)`
      )
    }

    return schedule
  }, [previewInvestment, step2, isMatured, isNonCumulative])

  // Generate preview TDS cashflows matching each interest_accrual cashflow
  // TDS is generated on accrual date (not payout date) per Indian tax rules
  // CRITICAL: Generate TDS for ALL accruals, even if amount rounds to 0 (maintains 1:1 correspondence)
  const previewTdsCashflows = useMemo(() => {
    if (!step2?.tdsApplicable || !step2?.tdsRate || previewCashflows.length === 0) return []
    
    const tdsCashflows = []
    previewCashflows.forEach((accrualCf) => {
      // TDS only on interest_accrual events, not on payouts
      if (accrualCf.type === 'interest_accrual') {
        const tdsAmount = Math.round((accrualCf.amount * step2.tdsRate) / 100)
        // Always generate TDS entry (even if ₹0) to maintain 1:1 accrual-to-TDS correspondence
        tdsCashflows.push({
          id: `tds-${accrualCf.id}`,
          investmentId: accrualCf.investmentId,
          date: accrualCf.date,
          type: 'tds_deduction',
          amount: -Math.max(tdsAmount, 0), // Ensure non-positive (TDS is a deduction)
          fy: accrualCf.fy,
          status: accrualCf.status,
          source: 'system',
          isPreview: true,
        })
      }
    })
    return tdsCashflows
  }, [previewCashflows, step2])

  // Verify 1:1 correspondence between interest_accrual and tds_deduction entries
  useMemo(() => {
    if (!isCumulative || previewCashflows.length === 0) return
    const accruals = previewCashflows.filter(cf => cf.type === 'interest_accrual')
    const tdses = previewTdsCashflows
    if (step2?.tdsApplicable && step2?.tdsRate) {
      console.assert(
        accruals.length === tdses.length,
        `[Step3] TDS mismatch: ${accruals.length} accruals but ${tdses.length} TDS entries (should be 1:1)`
      )
    }
  }, [previewCashflows, previewTdsCashflows, isCumulative, step2])

  // Calculate tenure (days)
  const tenure = useMemo(() => {
    if (!step1) return 0
    const start = new Date(step1.startDate)
    const maturity = new Date(step1.maturityDate)
    return Math.ceil((maturity - start) / (1000 * 60 * 60 * 24))
  }, [step1])

  // Calculate total interest for preview using selected calculation mode and compounding flag
  const totalInterest = useMemo(() => {
    if (!previewInvestment || !step2) return 0
    const parseDate = (dateStr) => {
      const parts = dateStr.split('-')
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    }
    
    const startDate = parseDate(previewInvestment.startDate)
    const maturityDate = parseDate(previewInvestment.maturityDate)
    
    // Check compounding flag FIRST
    if (step2.compounding === 'no') {
      // Simple interest: interest = principal * rate * (durationDays / 365)
      const durationDays = Math.floor((maturityDate - startDate) / (1000 * 60 * 60 * 24))
      const interest = (previewInvestment.principal * previewInvestment.interestRate * durationDays) / (100 * 365)
      console.log('[Step3] totalInterest (SIMPLE): durationDays=%d, interest=%f', durationDays, interest)
      return interest
    }
    
    // Compounding enabled: use selected calculation mode
    const args = {
      principal: previewInvestment.principal,
      annualRatePercent: previewInvestment.interestRate,
      startDate,
      maturityDate,
      compoundingFrequencyPerYear: (step2?.calcFreq === 'quarterly' ? 4 : step2?.calcFreq === 'monthly' ? 12 : 1),
    }
    const result = (previewInvestment?.calculationMode === 'bank')
      ? calculateFdMaturityBankStyle(args)
      : calculateFdMaturity(args)
    console.log('[Step3] totalInterest (COMPOUND mode=%s): interest=%f', previewInvestment?.calculationMode, result.interestEarned)
    return result.interestEarned
  }, [previewInvestment])

  // Calculate final maturity amount (principal + interest for cumulative, principal only for non-cumulative), rounded up
  const finalMaturityAmount = useMemo(() => {
    if (!step2) return 0
    // For non-cumulative investments, maturity amount is always principal (interest is paid periodically)
    if (isNonCumulative) return step2.principal
    // For cumulative investments, maturity amount = principal + interest
    return Math.ceil(step2.principal + totalInterest)
  }, [step2, totalInterest, isNonCumulative])

  // Calculate effective maturity amount (override takes precedence)
  const effectiveMaturityAmount = useMemo(() => {
    if (actualMaturityAmount && parseFloat(actualMaturityAmount) > 0) {
      return parseFloat(actualMaturityAmount)
    }
    return finalMaturityAmount
  }, [actualMaturityAmount, finalMaturityAmount])

  // Calculate difference between actual (if provided) and calculated
  const maturityDifference = useMemo(() => {
    if (actualMaturityAmount && parseFloat(actualMaturityAmount) > 0) {
      return parseFloat(actualMaturityAmount) - finalMaturityAmount
    }
    return 0
  }, [actualMaturityAmount, finalMaturityAmount])

  // For matured investments, recalculate interest and TDS based on effective maturity amount
  const maturedCalculations = useMemo(() => {
    if (!isMatured || !step2) return null
    // Interest earned = effective maturity - principal
    const interestEarned = effectiveMaturityAmount - step2.principal
    // TDS = interest * rate (only if user opted in)
    const tdsAmount = step2.tdsApplicable ? Math.round((interestEarned * step2.tdsRate) / 100) : 0
    // Net income = interest - TDS
    const netIncome = interestEarned - tdsAmount
    return {
      interestEarned: Math.round(interestEarned),
      tdsAmount,
      netIncome: Math.round(netIncome),
    }
  }, [isMatured, effectiveMaturityAmount, step2])

  // TDS estimation is controlled solely by the user's choice in step2
  const estimatedTDS = useMemo(() => {
    if (isMatured && maturedCalculations) {
      // For matured investments, use recalculated TDS
      return maturedCalculations.tdsAmount
    }
    // For future investments, use original calculation
    if (!step2?.tdsApplicable || !step2?.tdsRate) return 0
    return Math.round((totalInterest * step2.tdsRate) / 100)
  }, [isMatured, maturedCalculations, totalInterest, step2])

  // Group cashflows by FY and summarize
  const fyData = useMemo(() => {
    // For non-cumulative investments, calculate FY summaries based on actual payouts
    if (isNonCumulative && maturedCalculations === null) {
      const grouped = {}
      
      // Group all interest payouts by FY
      previewCashflows.forEach((cf) => {
        const fy = cf.fy || 'Unknown'
        if (!grouped[fy]) {
          grouped[fy] = {
            interest: 0,
            accrued: 0,
            tds: 0,
            netIncome: 0,
          }
        }
          // For non-cumulative, all interest-like cashflows count as accrued payouts
          if (isInterestCf(cf)) grouped[fy].accrued += cf.amount
      })

      // Calculate TDS per FY (critical: TDS applies to interest PAID in that FY, not global)
      Object.keys(grouped).forEach((fy) => {
        const fyInterest = grouped[fy].accrued
        // TDS applies only if user opted in
        if (step2?.tdsApplicable && fyInterest > 0) {
          grouped[fy].tds = Math.round((fyInterest * step2.tdsRate) / 100)
        } else {
          grouped[fy].tds = 0
        }
        // Net income = interest - TDS for that FY
        grouped[fy].netIncome = fyInterest - grouped[fy].tds
      })

      return grouped
    }

    // For cumulative investments OR matured calculations, use existing logic
    if (isMatured && maturedCalculations) {
      const maturityFY = step1?.maturityDate
        ? (() => {
            const date = new Date(step1.maturityDate)
            const year = date.getFullYear()
            const month = date.getMonth()
            if (month >= 3) {
              return `FY${year}-${String(year + 1).slice(-2)}`
            } else {
              return `FY${year - 1}-${String(year).slice(-2)}`
            }
          })()
        : 'Unknown'
      return {
        [maturityFY]: {
          interest: 0,
          accrued: maturedCalculations.interestEarned,
          tds: maturedCalculations.tdsAmount,
          netIncome: maturedCalculations.netIncome,
        },
      }
    }

    // Default for cumulative future investments
    const grouped = {}
    previewCashflows.forEach((cf) => {
      const fy = cf.fy || 'Unknown'
      if (!grouped[fy]) {
        grouped[fy] = {
          interest: 0,
          accrued: 0,
          tds: 0,
          netIncome: 0,
        }
      }
      // For cumulative: interest_accrual is the tax event, interest_payout is cash only
      if (cf.type === 'interest_accrual') {
        grouped[fy].accrued += cf.amount
      }
    })

    // Add TDS cashflows to FY summaries (TDS tied to accrual events)
    previewTdsCashflows.forEach((tdsCf) => {
      const fy = tdsCf.fy || 'Unknown'
      if (!grouped[fy]) {
        grouped[fy] = {
          interest: 0,
          accrued: 0,
          tds: 0,
          netIncome: 0,
        }
      }
      // TDS reduces the net income
      grouped[fy].tds += Math.abs(tdsCf.amount)
    })

    // Calculate net income per FY
    Object.keys(grouped).forEach((fy) => {
      grouped[fy].netIncome = grouped[fy].accrued - grouped[fy].tds
    })

    return grouped
  }, [previewCashflows, previewTdsCashflows, isNonCumulative, isMatured, maturedCalculations, step1, step2])

  // Warnings (contextual based on rules)
  const warnings = useMemo(() => {
    const warns = []
    if (!step2) return warns

    // Compounding warning only relevant if payout != maturity
    if (step2.compounding === 'yes' && step2.payoutFreq === 'maturity') {
      warns.push(`✓ Compounding: Interest compounds at the selected calculation frequency (${step2.calcFreq}) and is paid at maturity`)
    } else if (step2.compounding === 'yes') {
      warns.push('⚠ Compounding enabled but payout frequency is not maturity (unusual configuration).')
    }

    // Maturity payout warning
    if (step2.payoutFreq === 'maturity') {
      warns.push('📅 Maturity Payout: Interest accrues daily but is paid only at maturity along with principal. No interim cash flow.')
    } else if (step2.payoutFreq === 'quarterly') {
      warns.push('📤 Quarterly Payouts: Interest is paid every quarter. Accrual shown at FY boundaries for tax purposes.')
    } else if (step2.payoutFreq === 'yearly') {
      warns.push('📤 Yearly Payouts: Interest is paid annually. Accrual shown at FY boundaries for tax purposes.')
    }

    // TDS warning (user-controlled)
    if (step2.tdsApplicable) {
      warns.push(`💰 TDS (User-Controlled): You opted in for TDS deduction. Estimated @ ${step2.tdsRate}%. Note: Indian rules apply TDS thresholds (₹50,000 for general / ₹1,00,000 for senior citizens).`)
    } else {
      warns.push(`💰 TDS (User-Controlled): You opted out. No TDS will be deducted in this preview.`)
    }

    return warns
  }, [step2])

  // Diagnostic panel for validating calculation correctness
  const handleCopyDiagnostics = async () => {
    console.log('[Step3] Copy diagnostics button clicked')
    const durationYears = tenure / 365
    const compoundingFrequencyPerYear = step2?.calcFreq === 'quarterly' ? 4 : step2?.calcFreq === 'monthly' ? 12 : 1
    const fractionalPeriods = durationYears * compoundingFrequencyPerYear
    const periodRate = (step2?.rate || 0) / 100 / compoundingFrequencyPerYear
    
    // GUARD: calculationMode must never be undefined
    const userSelectedMode = step2?.calculationMode
    if (!userSelectedMode && step2?.compounding !== 'no') {
      console.warn('[Step3] DIAGNOSTICS: User-selected calculation mode is missing!', { userSelectedMode, compounding: step2?.compounding })
    }
    
    // Determine interest model used
    let modelUsed = 'Unknown'
    if (step2?.compounding === 'no') {
      modelUsed = 'Simple Interest'
    } else if (previewInvestment?.calculationMode === 'bank') {
      modelUsed = 'Bank-Style Compounding'
    } else {
      modelUsed = 'Fractional Compounding'
    }
    
    // Calculate cashflow summaries
    const interestCashflows = previewCashflows.filter(cf => isInterestCf(cf))
    const accrualCashflows = previewCashflows.filter(cf => cf.type === 'interest_accrual')
    const totalInterestAmount = interestCashflows.reduce((sum, cf) => sum + cf.amount, 0)
    const totalAccrualAmount = accrualCashflows.reduce((sum, cf) => sum + cf.amount, 0)
    const totalTdsAmount = previewTdsCashflows.reduce((sum, cf) => sum + Math.abs(cf.amount), 0)
    const netCashImpact = totalInterestAmount - totalTdsAmount
    
    // Build detailed cashflows section
    const detailedCashflowsSection = step2?.tdsApplicable ? accrualCashflows.map(accrual => {
      const correspondingTds = previewTdsCashflows.find(tds => tds.id === `tds-${accrual.id}`)
      const tdsAmount = correspondingTds ? `₹${Math.abs(correspondingTds.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'
      const matchStatus = correspondingTds ? '✓ Matched' : '✗ Missing'
      return `  ${accrual.fy} (${accrual.date}):\n    Interest Accrual: ₹${accrual.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n    TDS Deduction: ${tdsAmount} (${matchStatus})`
    }).join('\n') : '  (TDS not applicable)'
    
    const diagnosticsText = `=== CREATE INVESTMENT DIAGNOSTICS ===

Principal: ₹${step2?.principal?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0'}
Interest Rate: ${step2?.rate || '0'}%
Start Date: ${step1?.startDate || 'N/A'}
Maturity Date: ${step1?.maturityDate || 'N/A'}
Duration (days): ${tenure}
Calculation Frequency: ${step2?.calcFreq ? step2.calcFreq.charAt(0).toUpperCase() + step2.calcFreq.slice(1) : 'N/A'}
Compounding: ${step2?.compounding === 'no' ? 'No' : 'Yes'}
Calculation Mode: ${previewInvestment?.calculationMode === 'bank' ? 'Bank Style' : 'Fractional'}
Interest Payout: ${step2?.payoutFreq ? step2.payoutFreq.charAt(0).toUpperCase() + step2.payoutFreq.slice(1) : 'N/A'}
TDS Enabled: ${step2?.tdsApplicable ? 'Yes' : 'No'}
TDS Rate: ${step2?.tdsRate || '0'}%
Actual Maturity Override: ${actualMaturityAmount ? `₹${parseFloat(actualMaturityAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'None'}

Duration (years): ${durationYears.toFixed(5)}
Fractional Periods: ${fractionalPeriods.toFixed(5)}
Period Rate: ${periodRate.toFixed(6)}
Growth Factor: ${step2?.compounding === 'no' ? '1.0 (simple)' : ((1 + periodRate) ** fractionalPeriods).toFixed(6)}
Total Interest (Calculated): ₹${totalInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Effective Maturity Amount: ₹${effectiveMaturityAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Total TDS (Estimated): ₹${estimatedTDS.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Net Income (Calculated): ₹${(totalInterest - estimatedTDS).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Interest Model Used: ${modelUsed}

CASHFLOW BREAKDOWN:
  Interest Accrual Entries: ${accrualCashflows.length}
  Interest-Related Cashflows: ${interestCashflows.length}
  TDS Deduction Entries: ${previewTdsCashflows.length}
  Total Accrued Interest (from entries): ₹${totalAccrualAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
  Total TDS Deducted (from entries): ₹${totalTdsAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
  Net Cash Impact (Interest - TDS): ₹${netCashImpact.toLocaleString('en-IN', { minimumFractionDigits: 2 })}

DETAILED CASHFLOWS (Per-Accrual TDS Entries):
${detailedCashflowsSection || '  (No accruals to display)'}

VALIDATION:
  Accrual Count: ${accrualCashflows.length}
  TDS Count: ${previewTdsCashflows.length}
  TDS-to-Accrual Correspondence: ${accrualCashflows.length === previewTdsCashflows.length ? '✓ Pass (1:1 match)' : `✗ Fail (Mismatch: ${accrualCashflows.length} accruals vs ${previewTdsCashflows.length} TDS)`}
  Accrual-to-Interest Match: ${(() => {
    const relErr = Math.abs(totalAccrualAmount - totalInterest) / Math.max(totalInterest, 0.01);
    return relErr < 0.01 ? '✓ Pass' : `⚠ Warn (diff: ₹${Math.abs(totalAccrualAmount - totalInterest).toFixed(2)}, relErr: ${(relErr * 100).toFixed(4)}%)`;
  })()}
  No Negative Cashflows: ${previewCashflows.every(cf => cf.amount >= 0) && previewTdsCashflows.every(cf => cf.amount <= 0) ? '✓ Pass' : '✗ Fail'}
`
    // Prepend Step1 specific inputs (source, reinvest amount, investment type, owner, bank)
    const step1Details = `Source: ${step1?.source || 'N/A'}\nInvestment Type: ${investmentType?.name || 'N/A'}\nExternal ID: ${step1?.externalId || 'None'}\nOwner: ${owner?.name || 'N/A'}\nBank: ${bank?.name || 'N/A'}\nBranch: ${step1?.branch || 'N/A'}\nReinvest Amount: ${step1?.reinvestAmount ? `₹${Number(step1.reinvestAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'None'}\n\n`

    const fullDiagnostics = `=== CREATE INVESTMENT DIAGNOSTICS ===\n\n-- Step 1 (Form) --\n${step1Details}${diagnosticsText}`
    
    try {
      console.log('[Step3] Copy diagnostics - attempting to copy', { diagnosticsLength: fullDiagnostics.length })
      // Use modern clipboard API if available
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        console.log('[Step3] Using navigator.clipboard API')
        await navigator.clipboard.writeText(fullDiagnostics)
        alert('✅ Diagnostics copied to clipboard!')
      } else {
        // Fallback: create a temporary textarea and copy via execCommand
        console.log('[Step3] Using execCommand fallback method')
        const textArea = document.createElement('textarea')
        textArea.value = fullDiagnostics
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        textArea.style.top = '-9999px'
        document.body.appendChild(textArea)
        textArea.select()
        const success = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (success) {
          console.log('[Step3] execCommand copy successful')
          alert('✅ Diagnostics copied to clipboard!')
        } else {
          console.log('[Step3] execCommand copy failed')
          alert('❌ Failed to copy diagnostics. Please try again.')
        }
      }
    } catch (err) {
      console.error('[Step3] Copy diagnostics error:', err, { message: err?.message, stack: err?.stack })
      alert('❌ Failed to copy diagnostics. Error: ' + (err?.message || 'Unknown error'))
    }
  }

  const handleConfirmAndSave = async () => {
    if (!step1 || !step2 || !previewInvestment) {
      console.error('[Step3] Missing data for save')
      return
    }

    setSaving(true)
    try {
      // Create investment using factory
      const newInvestment = createInvestment({
        investmentTypeId: step1.investmentTypeId,
        externalInvestmentId: step1.externalId,
        name: investmentType.name,
        principal: step2.principal,
        interestRate: step2.rate,
        startDate: step1.startDate,
        maturityDate: step1.maturityDate,
        interestCalculationFrequency: step2.calcFreq,
        calculationMode: step2.calculationMode,
        compounding: step2.compounding,
        interestPayoutFrequency: step2.payoutFreq,
        expectedMaturityAmount: finalMaturityAmount,
        bankId: step1.bankId,
        ownerId: step1.ownerId,
        sourceInvestmentId: step1.source === 'existing' ? step1.sourceInvestmentId : null,
        sourceAmount: step1.source === 'existing' ? step1.reinvestAmount : null,
        actualMaturityAmount: actualMaturityAmount && parseFloat(actualMaturityAmount) > 0 ? parseFloat(actualMaturityAmount) : null,
        status: 'active',
      })

      // Add to mock investments
      addInvestment(newInvestment)
      console.debug('[Step3] Created investment:', newInvestment)

      // Create normalized cashflows from preview schedule
      // Map old 'interest' type to canonical types based on investment structure
      previewCashflows.forEach((cf) => {
        let normalizedType = cf.type
        
        // Normalize 'interest' type to canonical types
        if (cf.type === 'interest') {
          if (isNonCumulative) {
            // Non-cumulative: all interest payouts are INTEREST_PAYOUT
            normalizedType = 'interest_payout'
          } else {
            // Cumulative: accrued interest before maturity, interest at maturity
            normalizedType = cf.date === step1.maturityDate ? 'maturity_payout' : 'accrued_interest'
          }
        }

        const cashflow = createCashFlow({
          investmentId: newInvestment.id,
          date: cf.date,
          type: normalizedType,
          amount: cf.amount,
          financialYear: cf.fy,
          status: cf.status,
          source: cf.source || 'system',
        })
        addCashflow(cashflow)
      })

      console.debug('[Step3] Created', previewCashflows.length, 'interest cashflows')

      // TDS must be generated alongside each taxable interest cashflow
      // Generate TDS_DEDUCTION cashflows on the same date interest becomes taxable
      if (step2?.tdsApplicable && step2?.tdsRate) {
        const interestCashflows = previewCashflows.filter(cf => isInterestCf(cf))
        
        interestCashflows.forEach((interestCf) => {
          // Calculate TDS amount based on the interest amount on this date
          const tdsAmount = Math.round((interestCf.amount * step2.tdsRate) / 100)
          
          if (tdsAmount > 0) {
            const tdsCashflow = createCashFlow({
              investmentId: newInvestment.id,
              date: interestCf.date, // Same date as interest becomes taxable
              type: 'tds_deduction',
              amount: -tdsAmount, // Negative (outflow)
              financialYear: interestCf.fy,
              status: interestCf.status, // Same status as interest (planned or completed)
              source: 'system',
            })
            addCashflow(tdsCashflow)
          }
        })
        console.debug('[Step3] Created TDS_DEDUCTION cashflows tied to interest cashflows')
      }

      // Clear wizard state
      sessionStorage.removeItem('wb:createInvestment:step1')
      sessionStorage.removeItem('wb:createInvestment:step2')

      // Navigate to detail page
      if (onDone && typeof onDone === 'function') {
        onDone(newInvestment.id)
      }

      // Clear wizard state
      sessionStorage.removeItem('wb:createInvestment:step1')
      sessionStorage.removeItem('wb:createInvestment:step2')

      // Navigate to detail page
      if (onDone && typeof onDone === 'function') {
        onDone(newInvestment.id)
      }
    } catch (e) {
      console.error('[Step3] Error saving investment:', e)
    } finally {
      setSaving(false)
    }
  }

  if (!step1Loaded || !step2Loaded || !step1 || !step2 || !investmentType) {
    return <div className="create-investment-root">Loading...</div>
  }

  return (
    <div className="create-investment-root">
      <header className="ci-header">
        <h1>Create Investment</h1>
        <div className="ci-step">Step 3 of 3 — Preview & Confirm</div>
      </header>

      <main className="ci-main">
        {/* SECTION 1: Investment Summary */}
        <section className="ci-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0, display: 'inline-block' }}>Investment Summary</h2>
              {isMatured && (
                <span style={{ marginLeft: '12px', background: '#dbeafe', border: '1px solid #93c5fd', color: '#1e40af', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85em', fontWeight: 'bold' }}>
                  Matured
                </span>
              )}
            </div>
            <span style={{ background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85em', fontWeight: 'bold' }}>PREVIEW (NOT SAVED)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <strong>{investmentType.name}</strong>
              <div style={{ color: '#6b7280', fontSize: '0.9em' }}>
                {step1.externalId && <div>ID: {step1.externalId}</div>}
                {owner && <div>Owner: {owner.name}</div>}
                {bank && <div>Bank: {bank.name}, {step1.branch}</div>}
              </div>
            </div>
            <div>
              <div><strong>Principal:</strong> ₹{step2.principal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div><strong>Rate:</strong> {step2.rate}% p.a.</div>
              <div><strong>Duration:</strong> {tenure} days ({step1.startDate} to {step1.maturityDate})</div>
            </div>
          </div>

          <div style={{ padding: '12px', background: '#ecfdf5', border: '1px solid #86efac', borderRadius: '4px', marginBottom: '12px' }}>
            <strong>{isNonCumulative ? 'Maturity Amount' : 'Calculated Maturity Amount'}:</strong>
            <div style={{ fontSize: '1.4em', color: '#16a34a', fontWeight: 'bold', marginTop: '4px' }}>
              ₹{finalMaturityAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '4px' }}>
              {isNonCumulative ? '= Principal (interest paid periodically)' : '= Principal + Interest (accrued until maturity)'}
            </div>
          </div>

          {isCumulative && (
            <div style={{ padding: '12px', background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '4px', marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                <strong>Actual Maturity Amount (Optional — from bank statement)</strong>
                <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '2px' }}>
                  Enter the actual maturity amount shown by your bank. This overrides the calculated value for all downstream calculations. Leave blank to use calculated value.
                </div>
              </label>
              <input
                type="number"
                min={step2?.principal || 0}
                step="0.01"
                value={actualMaturityAmount}
                onChange={(e) => setActualMaturityAmount(e.target.value)}
                placeholder={`e.g., ${finalMaturityAmount.toFixed(2)}`}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '1em',
                  boxSizing: 'border-box',
                }}
              />
              {actualMaturityAmount && parseFloat(actualMaturityAmount) > 0 && (
                <div style={{ marginTop: '8px', fontSize: '0.9em' }}>
                  <div style={{ color: maturityDifference > 0 ? '#16a34a' : maturityDifference < 0 ? '#b91c1c' : '#6b7280' }}>
                    <strong>Difference:</strong> {maturityDifference > 0 ? '+' : ''} ₹{maturityDifference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  {maturityDifference !== 0 && (
                    <div style={{ marginTop: '4px', padding: '8px', background: maturityDifference > 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${maturityDifference > 0 ? '#86efac' : '#fecaca'}`, borderRadius: '4px', color: maturityDifference > 0 ? '#166534' : '#7f1d1d' }}>
                      💡 Using bank-provided value. All calculations (interest, FY accrual, TDS) will be based on this amount.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: '0.85em', color: '#6b7280' }}>
            <div><strong>Interest Rules:</strong> {step2.calcFreq} calc, {step2.payoutFreq} payout, compounding: {step2.compounding}</div>
            <div>
              <strong>TDS:</strong> {step2.tdsApplicable ? `Estimated @ ${step2.tdsRate}% (user opted in)` : 'Not applicable (user opted out)'}
            </div>
          </div>
        </section>

        {/* SECTION 2: Cashflow Timeline */}
        <section className="ci-section">
          <h2>Cashflow Timeline (PREVIEW ONLY)</h2>
          {previewCashflows.length > 0 || previewTdsCashflows.length > 0 ? (
            <div style={{ overflowX: 'auto', marginTop: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #d1d5db' }}>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>FY</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Combine cashflows and TDS entries, sorted by date
                    const allCashflows = [
                      ...previewCashflows.map(cf => ({
                        ...cf,
                        sourceType: 'interest',
                        sortDate: new Date(cf.date)
                      })),
                      ...previewTdsCashflows.map(tds => ({
                        ...tds,
                        sourceType: 'tds',
                        sortDate: new Date(tds.date)
                      }))
                    ].sort((a, b) => a.sortDate - b.sortDate)
                    
                    return allCashflows.map((cf, idx) => {
                      // Determine the label for cashflow rows based on investment type
                      let label = cf.type
                      if (cf.sourceType === 'tds') {
                        label = 'TDS Deduction'
                      } else if (cf.type === 'interest') {
                        if (isNonCumulative) {
                          label = 'Interest Payout'
                        } else if (isMatured) {
                          label = 'Realized Interest (paid at maturity)'
                        } else if (cf.date === step1.maturityDate) {
                          label = 'Accrued Interest (paid at maturity)'
                        } else if (step2.payoutFreq === 'maturity' && cf.status === 'planned') {
                          // FY boundary accrual before maturity
                          label = 'Accrued Interest (paid at maturity)'
                        } else {
                          label = 'Interest'
                        }
                      } else if (cf.type === 'interest_accrual') {
                        label = 'Interest Accrual (FY End)'
                      }
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', background: cf.sourceType === 'tds' ? '#fef2f2' : cf.isPreview ? '#f9fafb' : '#ffffff' }}>
                          <td style={{ padding: '8px' }}>{cf.date}</td>
                          <td style={{ padding: '8px' }}>{cf.fy}</td>
                          <td style={{ textAlign: 'right', padding: '8px', color: cf.sourceType === 'tds' ? '#b91c1c' : '#000' }}>
                            {cf.sourceType === 'tds' ? '-' : ''}₹{Math.abs(cf.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '8px' }}>{label}</td>
                          <td style={{ padding: '8px', textTransform: 'capitalize', fontSize: '0.85em', color: '#6b7280' }}>
                            {cf.status} {cf.isPreview && '(preview)'}
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          ) : step2?.payoutFreq === 'maturity' ? (
            <p style={{ color: '#6b7280' }}>No interim cashflows. Interest accrues daily but is paid only at maturity.</p>
          ) : (
            <p style={{ color: '#6b7280' }}>No cashflows generated (check dates and calculation).</p>
          )}
        </section>

        {/* SECTION 3: FY Summary */}
        <section className="ci-section">
          <h2>Financial Year Summary</h2>
          <p style={{ fontSize: '0.85em', color: '#6b7280', marginBottom: '12px' }}>
            <em>{isNonCumulative ? 'Interest is taxable in the FY it is paid. TDS applies independently to each FY.' : 'Interest is taxable in the year it accrues, even if paid later at maturity.'}</em>
          </p>
          {isMatured && (
            <div style={{ padding: '10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', marginBottom: '12px', fontSize: '0.9em', color: '#166534' }}>
              💡 <strong>Net income shown is based on {actualMaturityAmount && parseFloat(actualMaturityAmount) > 0 ? 'actual' : 'calculated'} maturity amount</strong>
            </div>
          )}
          {Object.keys(fyData).length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
              {Object.entries(fyData).map(([fy, data]) => (
                  <div key={fy} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#f9fafb' }}>
                  <strong>{fy}</strong>
                  <div style={{ marginTop: '8px', fontSize: '0.9em', display: 'grid', gap: '4px' }}>
                    {data.interest > 0 && (
                      <div>
                        <span style={{ color: '#6b7280' }}>Interest (Paid):</span>
                        <span style={{ float: 'right' }}>₹{data.interest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {data.accrued > 0 && (
                      <div>
                        <span style={{ color: '#6b7280' }}>{isNonCumulative ? 'Interest Earned (Taxable):' : isMatured ? 'Realized Interest (Taxable as per IT rules):' : 'Interest Accrued (Taxable as per IT rules):'}</span>
                        <span style={{ float: 'right' }}>₹{data.accrued.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {step2?.tdsApplicable && (
                      <div>
                        <span style={{ color: '#6b7280' }}>TDS (User-controlled, applied on FY interest only @ {step2.tdsRate}%):</span>
                        <span style={{ float: 'right', color: '#b91c1c' }}>
                          ₹{data.tds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid #d1d5db', marginTop: '8px', paddingTop: '8px', fontWeight: 'bold' }}>
                      <span>Net Income (Preview):</span>
                      <span style={{ float: 'right', color: '#16a34a' }}>₹{data.netIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#6b7280' }}>Interest summary will appear here after cashflows are generated.</p>
          )}
        </section>

        {/* SECTION 4: Diagnostics (for troubleshooting) */}
        <section className="ci-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => setDiagnosticsExpanded(!diagnosticsExpanded)}>
            <h2 style={{ margin: 0 }}>Diagnostics (for troubleshooting)</h2>
            <span style={{ fontSize: '1.2em', color: '#6b7280', transition: 'transform 0.2s' }}>
              {diagnosticsExpanded ? '▼' : '▶'}
            </span>
          </div>
          
          {diagnosticsExpanded && (
            <div style={{ marginTop: '12px', padding: '12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85em', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '500px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#1f2937' }}>-- User Inputs --</strong>
                <div style={{ marginTop: '4px', color: '#4b5563' }}>
                  <div style={{ marginBottom: '6px' }}>
                    <strong style={{ color: '#1f2937', fontWeight: 'normal' }}>Step 1 (Form):</strong>{'\n'}
                    <div style={{ color: '#4b5563' }}>
                      {'Source: '}{step1?.source || 'N/A'}{`\n`}
                      {'Investment Type: '}{investmentType?.name || 'N/A'}{`\n`}
                      {'External ID: '}{step1?.externalId || 'None'}{`\n`}
                      {'Owner: '}{owner?.name || 'N/A'}{`\n`}
                      {'Bank: '}{bank?.name || 'N/A'}{`\n`}
                      {'Branch: '}{step1?.branch || 'N/A'}{`\n`}
                      {'Reinvest Amount: '}{step1?.reinvestAmount ? `₹${Number(step1.reinvestAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'None'}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '4px', color: '#4b5563' }}>
Principal: ₹{step2?.principal?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0'}{'\n'}
Interest Rate: {step2?.rate || '0'}%{'\n'}
Start Date: {step1?.startDate || 'N/A'}{'\n'}
Maturity Date: {step1?.maturityDate || 'N/A'}{'\n'}
Duration (days): {tenure}{'\n'}
Calculation Frequency: {step2?.calcFreq ? step2.calcFreq.charAt(0).toUpperCase() + step2.calcFreq.slice(1) : 'N/A'}{'\n'}
Compounding: {step2?.compounding === 'no' ? 'No' : 'Yes'}{'\n'}
Calculation Mode: {previewInvestment?.calculationMode === 'bank' ? 'Bank Style' : 'Fractional'}{'\n'}
Interest Payout: {step2?.payoutFreq ? step2.payoutFreq.charAt(0).toUpperCase() + step2.payoutFreq.slice(1) : 'N/A'}{'\n'}
TDS Enabled: {step2?.tdsApplicable ? 'Yes' : 'No'}{'\n'}
TDS Rate: {step2?.tdsRate || '0'}%{'\n'}
Actual Maturity Override: {actualMaturityAmount ? `₹${parseFloat(actualMaturityAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'None'}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#1f2937' }}>-- Derived Values --</strong>
                <div style={{ marginTop: '4px', color: '#4b5563' }}>
Duration (years): {(tenure / 365).toFixed(5)}{'\n'}
Fractional Periods: {((tenure / 365) * (step2?.calcFreq === 'quarterly' ? 4 : step2?.calcFreq === 'monthly' ? 12 : 1)).toFixed(5)}{'\n'}
Period Rate: {((step2?.rate || 0) / 100 / (step2?.calcFreq === 'quarterly' ? 4 : step2?.calcFreq === 'monthly' ? 12 : 1)).toFixed(6)}{'\n'}
{step2?.compounding === 'no' && `Effective Growth Factor (Simple Interest): ${(1 + (step2?.rate || 0) / 100 * (tenure / 365)).toFixed(6)}\n`}
Total Interest: ₹{totalInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}{'\n'}
Effective Maturity Amount: ₹{effectiveMaturityAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}{'\n'}
Total TDS: ₹{estimatedTDS.toLocaleString('en-IN', { minimumFractionDigits: 2 })}{'\n'}
Net Income: ₹{(totalInterest - estimatedTDS).toLocaleString('en-IN', { minimumFractionDigits: 2 })}{'\n'}
Interest Model: {step2?.compounding === 'no' ? 'Simple Interest' : previewInvestment?.calculationMode === 'bank' ? 'Bank-Style Compounding' : 'Fractional Compounding'}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#1f2937' }}>-- Cashflows --</strong>
                <div style={{ marginTop: '4px', color: '#4b5563' }}>
Interest Cashflows: {previewCashflows.filter(cf => isInterestCf(cf)).length}{'\n'}
TDS Cashflows: {previewTdsCashflows.length}{'\n'}
Total Interest Amount: ₹{previewCashflows.filter(cf => isInterestCf(cf)).reduce((sum, cf) => sum + cf.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}{'\n'}
Total TDS Amount: ₹{previewTdsCashflows.reduce((sum, cf) => sum + Math.abs(cf.amount), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}{'\n'}
Net Cash Impact: ₹{(previewCashflows.filter(cf => isInterestCf(cf)).reduce((sum, cf) => sum + cf.amount, 0) + previewTdsCashflows.reduce((sum, cf) => sum + cf.amount, 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {step2?.tdsApplicable && (
                <div>
                  <strong style={{ color: '#1f2937' }}>-- Per-Accrual TDS Entries --</strong>
                  <div style={{ marginTop: '4px', color: '#4b5563', fontSize: '0.9em' }}>
                    {previewCashflows.filter(cf => cf.type === 'interest_accrual').length > 0 ? (
                      previewCashflows.filter(cf => cf.type === 'interest_accrual').map((accrual) => {
                        const correspondingTds = previewTdsCashflows.find(tds => tds.id === `tds-${accrual.id}`)
                        const tdsAmount = correspondingTds ? `₹${Math.abs(correspondingTds.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'
                        const matchStatus = correspondingTds ? '✓' : '✗'
                        return (
                          <div key={accrual.id} style={{ marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #d1d5db' }}>
                            <div>{accrual.fy} ({accrual.date})</div>
                            <div style={{ marginLeft: '8px', color: '#374151' }}>
                              Interest Accrual: ₹{accrual.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}{'\n'}
TDS Deduction: {tdsAmount} [{matchStatus}]
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div style={{ color: '#9ca3af' }}>No accruals to display</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {diagnosticsExpanded && (
            <button
              onClick={handleCopyDiagnostics}
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9em',
                fontWeight: 'bold',
              }}
            >
              📋 Copy diagnostics
            </button>
          )}
        </section>

        {/* SECTION 5: Warnings */}
        {warnings.length > 0 && (
          <section className="ci-section">
            <h2>Warnings & Notes</h2>
            <div style={{ display: 'grid', gap: '8px' }}>
              {warnings.map((w, idx) => (
                <div key={idx} style={{ padding: '10px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '4px', fontSize: '0.9em' }}>
                  {w}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="ci-footer">
        <button className="btn-secondary" onClick={onBack} disabled={saving}>
          Back
        </button>
        <button className="btn-primary" onClick={handleConfirmAndSave} disabled={saving}>
          {saving ? 'Saving...' : 'Confirm & Save'}
        </button>
      </footer>
    </div>
  )
}



