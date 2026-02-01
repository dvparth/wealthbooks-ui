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
    return step2?.payoutFreq === 'maturity'
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
    // Force bank-mode for FD product types regardless of persisted setting
    const forcedMode = investmentType?.code === 'FD' ? 'bank' : (step2.calculationMode || 'fractional')

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
      calculationMode: forcedMode,
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

    // ============ NON-CUMULATIVE (PERIODIC PAYOUT) LOGIC ============
    if (isNonCumulative) {
      const schedule = []
      
      // Calculate periodic interest based on calculation frequency
      // Interest for one calculation period = principal × rate / compounding_periods_per_year
      const compoundingPeriodsPerYear = step2.calcFreq === 'quarterly' ? 4 : step2.calcFreq === 'monthly' ? 12 : 1
      const periodicInterest = Math.round((principal * interestRate) / compoundingPeriodsPerYear / 100)
      
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
          } else if (step2.payoutFreq === 'annually') {
            const yearEnd = new Date(currentYear, 2, 31) // 31 Mar
            if (yearEnd >= start && yearEnd <= maturityDateObj) dates.push(yearEnd)
          }
          currentYear++
        }
        
        return dates.sort((a, b) => a - b)
      }

      const payoutDates = getPayoutDates()

      // Generate interest cashflows for each payout date
      payoutDates.forEach((payoutDate) => {
        const fy = (() => {
          const y = payoutDate.getFullYear()
          const m = payoutDate.getMonth()
          if (m >= 3) {
            return `FY${y}-${String(y + 1).slice(-2)}`
          } else {
            return `FY${y - 1}-${String(y).slice(-2)}`
          }
        })()

        schedule.push({
          id: `payout-${formatDate(payoutDate)}`,
          investmentId: previewInvestment.id,
          date: formatDate(payoutDate),
          type: 'interest',
          amount: periodicInterest,
          fy,
          status: payoutDate < new Date() ? 'completed' : 'planned',
          source: 'system',
          isPreview: true,
        })
      })

      return schedule
    }

    // ============ CUMULATIVE (MATURITY PAYOUT) LOGIC (ORIGINAL) ============
    // Calculate final maturity using selected calculation mode from previewInvestment
    const maturityResult = (previewInvestment?.calculationMode === 'bank')
      ? calculateFdMaturityBankStyle({ principal, annualRatePercent: interestRate, startDate: start, maturityDate: maturityDateObj })
      : calculateFdMaturity({ principal, annualRatePercent: interestRate, startDate: start, maturityDate: maturityDateObj })

    // Calculate accrued interest by FY end (31 Mar of each FY)
    const accrualByFY = {}
    let currentFYStart = new Date(start.getFullYear(), 3, 1) // 1 Apr
    if (start < currentFYStart) {
      currentFYStart = new Date(start.getFullYear() - 1, 3, 1)
    }

    while (currentFYStart <= maturityDateObj) {
      const fy = `FY${currentFYStart.getFullYear() - 1}-${String(currentFYStart.getFullYear()).slice(-2)}`
      const fyEnd = new Date(currentFYStart.getFullYear(), 2, 31) // 31 Mar

      // Period for this FY accrual: from investment start to FY end
      const periodStart = currentFYStart > start ? currentFYStart : start
      const periodEnd = fyEnd < maturityDateObj ? fyEnd : maturityDateObj

      if (periodStart <= periodEnd) {
        // Calculate maturity amount by FY end using same calculation mode (from previewInvestment)
        const resultByFYEnd = (previewInvestment?.calculationMode === 'bank')
          ? calculateFdMaturityBankStyle({ principal, annualRatePercent: interestRate, startDate: start, maturityDate: periodEnd })
          : calculateFdMaturity({ principal, annualRatePercent: interestRate, startDate: start, maturityDate: periodEnd })
        // Total accrued by FY end = maturity amount - principal
        accrualByFY[fy] = resultByFYEnd.maturityAmount - principal
      }

      currentFYStart = new Date(currentFYStart.getFullYear() + 1, 3, 1)
    }

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

    const schedule = []

    // Add FY accrual rows (for tax purposes, at FY end = 31 Mar)
    Object.entries(accrualByFY).forEach(([fy, totalAccrued]) => {
      const [, fyYear] = fy.split('-')
      const fyEndYear = parseInt('20' + fyYear)
      const fyEndDate = new Date(fyEndYear, 2, 31) // 31 Mar of FY end year

      if (fyEndDate < maturityDateObj) {
        schedule.push({
          id: `accrual-${fy}`,
          investmentId: previewInvestment.id,
          date: formatDate(fyEndDate),
          type: 'interest',
          amount: Math.round(totalAccrued),
          fy,
          status: isMatured ? 'completed' : 'planned',
          source: 'system',
          isPreview: true,
        })
      }
    })

    // Add final maturity entry
    const maturityFY = getFinancialYear(maturityDateObj)
    schedule.push({
      id: `maturity-${previewInvestment.id}`,
      investmentId: previewInvestment.id,
      date: maturityDate,
      type: 'interest',
      amount: Math.round(maturityResult.interestEarned),
      fy: maturityFY,
      status: isMatured ? 'completed' : 'planned',
      source: 'system',
      isPreview: true,
    })

    return schedule
  }, [previewInvestment, step2, isMatured, isNonCumulative])

  // Calculate tenure (days)
  const tenure = useMemo(() => {
    if (!step1) return 0
    const start = new Date(step1.startDate)
    const maturity = new Date(step1.maturityDate)
    return Math.ceil((maturity - start) / (1000 * 60 * 60 * 24))
  }, [step1])

  // Calculate total interest for preview using selected calculation mode
  const totalInterest = useMemo(() => {
    if (!previewInvestment) return 0
    const parseDate = (dateStr) => {
      const parts = dateStr.split('-')
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    }
    const args = {
      principal: previewInvestment.principal,
      annualRatePercent: previewInvestment.interestRate,
      startDate: parseDate(previewInvestment.startDate),
      maturityDate: parseDate(previewInvestment.maturityDate),
    }
    const result = (previewInvestment?.calculationMode === 'bank')
      ? calculateFdMaturityBankStyle(args)
      : calculateFdMaturity(args)
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
        // For non-cumulative, all interest is in 'accrued' (representing actual payouts)
        if (cf.type === 'interest') grouped[fy].accrued += cf.amount
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
      if (cf.type === 'interest' && cf.status === 'confirmed') grouped[fy].interest += cf.amount
      if (cf.type === 'interest' && cf.status === 'planned') grouped[fy].accrued += cf.amount
      if (cf.type === 'tds') grouped[fy].tds += cf.amount
    })

    // Calculate net income per FY
    // Rule: Net Income = Total Interest Accrued - Total TDS (user-controlled)
    // If TDS disabled: Net Income = Interest (paid)
    const totals = Object.keys(grouped).map((fy) => ({
      fy,
      totalAccrued: grouped[fy].interest + grouped[fy].accrued,
    }))
    const totalAccruedAllFY = totals.reduce((s, x) => s + x.totalAccrued, 0)

    Object.keys(grouped).forEach((fy) => {
      const fyTotal = grouped[fy].interest + grouped[fy].accrued
      // Allocate estimated TDS across FYs proportionally to accrued interest
      if (step2?.tdsApplicable && totalAccruedAllFY > 0) {
        grouped[fy].tds = Math.round((fyTotal / totalAccruedAllFY) * (typeof estimatedTDS === 'number' ? estimatedTDS : 0))
        grouped[fy].netIncome = fyTotal - grouped[fy].tds
      } else {
        grouped[fy].tds = 0
        // When TDS is disabled, Net Income = Total Interest (interest + accrued)
        grouped[fy].netIncome = fyTotal
      }
    })

    return grouped
  }, [previewCashflows, isNonCumulative, isMatured, maturedCalculations, step1, step2, estimatedTDS])

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

      // Generate TDS_DEDUCTION cashflows on the same date interest becomes taxable
      // TDS is generated only for confirmed/completed interest, not for planned interest
      if (step2?.tdsApplicable && step2?.tdsRate) {
        const interestCashflows = previewCashflows.filter(cf => cf.type === 'interest')
        
        interestCashflows.forEach((interestCf) => {
          // Only generate TDS for interest that is confirmed/completed (status !== 'planned')
          if (interestCf.status === 'planned') {
            return // Skip planned interest - no TDS until it's actually paid/accrued
          }
          
          // Calculate TDS amount based on the interest amount on this date
          const tdsAmount = Math.round((interestCf.amount * step2.tdsRate) / 100)
          
          if (tdsAmount > 0) {
            const tdsCashflow = createCashFlow({
              investmentId: newInvestment.id,
              date: interestCf.date, // Same date as interest becomes taxable
              type: 'tds_deduction',
              amount: -tdsAmount, // Negative (outflow)
              financialYear: interestCf.fy,
              status: interestCf.status, // Same status as interest (confirmed/completed)
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
          {previewCashflows.length > 0 ? (
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
                  {previewCashflows.map((cf, idx) => {
                    // Determine the label for cashflow rows based on investment type
                    let label = cf.type
                    if (cf.type === 'interest') {
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
                    }
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', background: cf.isPreview ? '#f9fafb' : '#ffffff' }}>
                        <td style={{ padding: '8px' }}>{cf.date}</td>
                        <td style={{ padding: '8px' }}>{cf.fy}</td>
                        <td style={{ textAlign: 'right', padding: '8px' }}>₹{cf.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: '8px' }}>{label}</td>
                        <td style={{ padding: '8px', textTransform: 'capitalize', fontSize: '0.85em', color: '#6b7280' }}>
                          {cf.status} {cf.isPreview && '(preview)'}
                        </td>
                      </tr>
                    )
                  })}
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

        {/* SECTION 4: Warnings */}
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



