import { useEffect, useMemo, useState } from 'react'
import { useCreateInvestmentWizard } from '../contexts/CreateInvestmentContext.jsx'
import { withCreateInvestmentStep } from '../hoc/withCreateInvestmentStep.jsx'
import { mockInvestmentTypes } from '../mocks/investmentTypes.js'
import '../styles/CreateInvestment.css'

function CreateInvestmentStep2({ onBack, onNext }) {
  const { step1, step2, updateStep2, goToNextStep, goToPreviousStep } = useCreateInvestmentWizard()

  // Amounts — initialize from context, maintain local state for form
  const [principal, setPrincipal] = useState('')
  const [rate, setRate] = useState('')

  // Interest Rules
  const [calcFreq, setCalcFreq] = useState('')
  const [payoutFreq, setPayoutFreq] = useState('')
  const [compounding, setCompounding] = useState('')
  const [calculationMode, setCalculationMode] = useState('')

  // Tax
  const [tdsApplicable, setTdsApplicable] = useState(false)
  const [tdsRate, setTdsRate] = useState(10)

  // Sync context step2 data to local state on mount
  useEffect(() => {
    if (step2) {
      if (step2.principal != null) setPrincipal(String(step2.principal))
      if (step2.rate != null) setRate(String(step2.rate))
      if (step2.calcFreq) setCalcFreq(step2.calcFreq)
      if (step2.payoutFreq) setPayoutFreq(step2.payoutFreq)
      if (step2.compounding) setCompounding(step2.compounding)
      if (step2.calculationMode) setCalculationMode(step2.calculationMode)
      if (step2.tdsApplicable != null) setTdsApplicable(step2.tdsApplicable)
      if (step2.tdsRate != null) setTdsRate(step2.tdsRate)
    } else if (step1?.reinvestAmount != null) {
      // Initialize principal from step1 if no step2 data yet
      setPrincipal(String(step1.reinvestAmount))
    }
  }, [step2, step1?.reinvestAmount])

  const type = useMemo(() => mockInvestmentTypes.find((t) => t.id === step1?.investmentTypeId), [step1?.investmentTypeId])

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

  // Apply type defaults AFTER any persisted values are loaded
  // This ensures persisted values take precedence
  useEffect(() => {
    if (type && step1) {
      // Only apply type defaults when the current field is empty/unset.
      // This prevents overwriting persisted values when navigating Back.
      setCalcFreq((cur) => cur || typeDefaults.calcFreq)
      setPayoutFreq((cur) => cur || typeDefaults.payoutFreq)
      setCompounding((cur) => cur || typeDefaults.compounding)
      setCalculationMode((cur) => cur || (typeDefaults.calcMode || 'fractional'))
    }
  }, [type?.id, typeDefaults])

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
    goToPreviousStep()
    onBack?.()
  }

  const handleNext = () => {
    if (!formValid) return
    
    const payload = {
      principal: principalNum,
      rate: rateNum,
      calcFreq,
      payoutFreq,
      compounding,
      calculationMode,
      calcMode: calculationMode, // Legacy key for compatibility
      tdsApplicable,
      tdsRate: tdsApplicable ? tdsRate : null,
    }
    
    updateStep2(payload)
    goToNextStep()
    onNext?.()
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

export default withCreateInvestmentStep(CreateInvestmentStep2, 2, { requireStep1: true })
