import { useEffect, useMemo, useState } from 'react'
import { mockInvestmentTypes } from '../mocks/investmentTypes.js'
import '../styles/CreateInvestment.css'

export default function CreateInvestmentStep2({ onBack, onNext }) {
  const [step1, setStep1] = useState(null)
  const [step1Loaded, setStep1Loaded] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('wb:createInvestment:step1')
      setStep1(raw ? JSON.parse(raw) : null)
      console.debug('[Step2] Loaded step1 from sessionStorage:', raw ? JSON.parse(raw) : null)
    } catch (e) {
      console.warn('[Step2] Error loading step1:', e)
      setStep1(null)
    } finally {
      setStep1Loaded(true)
    }
  }, [])

  // Also load persisted step2 inputs so navigating Back restores the form
  useEffect(() => {
    try {
      const raw2 = sessionStorage.getItem('wb:createInvestment:step2')
      if (raw2) {
        const payload = JSON.parse(raw2)
        console.debug('[Step2] Loaded persisted step2 payload:', payload)
        if (payload.principal != null) setPrincipal(String(payload.principal))
        if (payload.rate != null) setRate(String(payload.rate))
        if (payload.calcFreq) setCalcFreq(payload.calcFreq)
        if (payload.payoutFreq) setPayoutFreq(payload.payoutFreq)
        if (payload.compounding) setCompounding(payload.compounding)
        if (payload.calculationMode) setCalculationMode(payload.calculationMode)
        if (payload.tdsApplicable != null) setTdsApplicable(Boolean(payload.tdsApplicable))
        if (payload.tdsRate != null) setTdsRate(payload.tdsRate)
      }
    } catch (e) {
      console.warn('[Step2] Error loading step2 from sessionStorage:', e)
    }
  }, [])

  useEffect(() => {
    if (step1Loaded && !step1) {
      // step1 data not found after load attempt — navigate back
      console.warn('[Step2] No step1 data found, calling onBack')
      onBack && onBack()
    }
  }, [step1Loaded, step1, onBack])

  const type = useMemo(() => mockInvestmentTypes.find((t) => t.id === step1?.investmentTypeId), [step1])

  // Determine interest rules defaults and locks based on investment type
  const typeDefaults = useMemo(() => {
    if (!type) return { calcFreq: '', payoutFreq: '', compounding: '', locked: false }
    const typeCode = type.code
    if (typeCode === 'SCSS') {
        return { calcFreq: 'quarterly', payoutFreq: 'quarterly', compounding: 'no', calcMode: 'fractional', locked: true }
    } else if (typeCode === 'NSC') {
        return { calcFreq: 'yearly', payoutFreq: 'maturity', compounding: 'yes', calcMode: 'fractional', locked: true }
    } else if (typeCode === 'FD') {
        return { calcFreq: 'quarterly', payoutFreq: 'maturity', compounding: 'yes', calcMode: 'bank', locked: false }
    } else if (typeCode === '54EC') {
        return { calcFreq: 'yearly', payoutFreq: 'yearly', compounding: 'no', calcMode: 'fractional', locked: false }
    }
      return { calcFreq: '', payoutFreq: '', compounding: '', calcMode: 'fractional', locked: false }
  }, [type])

  // Amounts
  const [principal, setPrincipal] = useState(() => {
    if (!step1) return ''
    return step1.reinvestAmount != null ? String(step1.reinvestAmount) : ''
  })
  const [rate, setRate] = useState('')

  // Interest Rules (editable, with defaults and locks per type)
  const [calcFreq, setCalcFreq] = useState(() => typeDefaults.calcFreq)
  const [payoutFreq, setPayoutFreq] = useState(() => typeDefaults.payoutFreq)
  const [compounding, setCompounding] = useState(() => typeDefaults.compounding)
  const [calculationMode, setCalculationMode] = useState(() => typeDefaults.calcMode || 'fractional')

  // Update interest rules defaults when type changes
  useEffect(() => {
    if (type) {
      setCalcFreq(typeDefaults.calcFreq)
      setPayoutFreq(typeDefaults.payoutFreq)
      setCompounding(typeDefaults.compounding)
      setCalculationMode(typeDefaults.calcMode || 'fractional')
    }
  }, [type?.id])

  // Tax
  const [tdsApplicable, setTdsApplicable] = useState(false)
  const [tdsRate, setTdsRate] = useState(10)

  // Validation
  const principalNum = parseFloat(principal || '0')
  const rateNum = parseFloat(rate || '0')
  const amountValid = principalNum > 0
  const rateValid = rateNum > 0
  const tdsValid = !tdsApplicable || (tdsApplicable && tdsRate > 0)

  // Interest Rules Validation
  let interestRulesValid = true
  let interestRulesError = ''
  if (compounding === 'yes' && payoutFreq !== 'maturity') {
    interestRulesValid = false
    interestRulesError = 'Compounding = Yes requires payout frequency = Maturity'
  } else if (payoutFreq !== 'maturity' && compounding === 'yes') {
    interestRulesValid = false
    interestRulesError = 'Payout frequency must be Maturity if compounding is enabled'
  }
  
  const formValid = amountValid && rateValid && tdsValid && interestRulesValid

  const handleBack = () => {
    onBack && onBack()
  }

  const handleNext = () => {
    if (!formValid) return
    // Force bank calculation mode for FD product types when saving
    const finalCalculationMode = type?.code === 'FD' ? 'bank' : calculationMode

    const payload = {
      principal: principalNum,
      rate: rateNum,
      calcFreq,
      payoutFreq,
      compounding,
      calculationMode: finalCalculationMode,
      tdsApplicable,
      tdsRate: tdsApplicable ? tdsRate : null,
    }
    try {
      sessionStorage.setItem('wb:createInvestment:step2', JSON.stringify(payload))
      console.debug('[Step2] Persisted step2 payload', payload)
    } catch (e) {
      console.warn('Could not persist step2 payload', e)
    }
    onNext && onNext()
  }

  return (
    <div className="create-investment-root">
      <header className="ci-header">
        <h1>Create Investment</h1>
        <div className="ci-step">Step 2 of 3</div>
      </header>

      <main className="ci-main">
        <section className="ci-section">
          <h2>Amount</h2>
          <div className="field-row">
            <label>Principal</label>
            <input type="number" min="0" step="0.01" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
          </div>
          <div className="field-row">
            <label>Interest Rate (%)</label>
            <input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          {(!amountValid || !rateValid) && <div className="ci-error">Principal and rate must be greater than 0.</div>}
        </section>

        <section className="ci-section">
          <h2>Interest Rules</h2>
          <div className="field-row">
            <label>Calculation Frequency {typeDefaults.locked && <span className="ci-locked">(locked)</span>}</label>
            <select value={calcFreq} onChange={(e) => setCalcFreq(e.target.value)} disabled={typeDefaults.locked}>
              <option value="">Select frequency</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="field-row">
            <label>Payout Frequency {typeDefaults.locked && <span className="ci-locked">(locked)</span>}</label>
            <select value={payoutFreq} onChange={(e) => setPayoutFreq(e.target.value)} disabled={typeDefaults.locked}>
              <option value="">Select frequency</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="maturity">Maturity</option>
            </select>
          </div>
          <div className="field-row">
            <label>Compounding {typeDefaults.locked && <span className="ci-locked">(locked)</span>}</label>
            <select value={compounding} onChange={(e) => setCompounding(e.target.value)} disabled={typeDefaults.locked}>
              <option value="">Select option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="field-row">
            <label>Calculation Mode {typeDefaults.locked && <span className="ci-locked">(locked)</span>}</label>
            <select value={calculationMode} onChange={(e) => setCalculationMode(e.target.value)} disabled={typeDefaults.locked}>
              <option value="fractional">Fractional (ln/exp)</option>
              <option value="bank">Bank-style (per-quarter rounding)</option>
            </select>
          </div>
          {!interestRulesValid && <div className="ci-error">{interestRulesError}</div>}
        </section>

        <section className="ci-section">
          <h2>Tax</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={tdsApplicable} onChange={(e) => setTdsApplicable(e.target.checked)} /> TDS applicable
            </label>
          </div>
          <div className="field-row">
            <label>TDS rate (%)</label>
            <input type="number" min="0" step="0.01" value={tdsRate} onChange={(e) => setTdsRate(parseFloat(e.target.value || '0'))} disabled={!tdsApplicable} />
          </div>
          {!tdsValid && <div className="ci-error">TDS rate must be greater than 0 when TDS is applicable.</div>}
        </section>
      </main>

      <footer className="ci-footer">
        <button className="btn-secondary" onClick={handleBack}>Back</button>
        <button className="btn-primary" onClick={handleNext} disabled={!formValid}>Next</button>
      </footer>
    </div>
  )
}
