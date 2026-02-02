import { useEffect, useMemo, useState } from 'react'
import { useCreateInvestmentWizard } from '../contexts/CreateInvestmentContext'
import { withCreateInvestmentStep } from '../hoc/withCreateInvestmentStep'
import { mockInvestments } from '../mocks/investments.js'
import { mockOwners } from '../mocks/owners.js'
import { mockBanks } from '../mocks/banks.js'
import { mockInvestmentTypes } from '../mocks/investmentTypes.js'
import '../styles/CreateInvestment.css'

function CreateInvestmentStep1({ onNext, onCancel }) {
  const { step1, updateStep1, goToNextStep, resetWizard } = useCreateInvestmentWizard()

  // ============ Local State (mirrors context, for form) ============
  const sourceOptions = ['fresh', 'existing']
  const [source, setSource] = useState(step1?.source || 'fresh')

  const activeInvestments = useMemo(() => mockInvestments.filter((i) => i.status === 'active'), [])
  const [sourceInvestmentId, setSourceInvestmentId] = useState(step1?.sourceInvestmentId || activeInvestments[0]?.id || '')
  const availableAmount = useMemo(() => {
    const inv = activeInvestments.find((i) => i.id === sourceInvestmentId)
    return inv ? inv.principal : 0
  }, [sourceInvestmentId, activeInvestments])
  const [reinvestAmount, setReinvestAmount] = useState(step1?.reinvestAmount ? String(step1.reinvestAmount) : '')

  const [investmentTypeId, setInvestmentTypeId] = useState(step1?.investmentTypeId || mockInvestmentTypes[0]?.id || '')
  const [externalId, setExternalId] = useState(step1?.externalId || '')
  const [ownerId, setOwnerId] = useState(step1?.ownerId || mockOwners[0]?.id || '')
  const [bankId, setBankId] = useState(step1?.bankId || mockBanks[0]?.id || '')
  const branches = useMemo(() => {
    const b = mockBanks.find((x) => x.id === bankId)
    if (!b) return []
    if (Array.isArray(b.branches)) return b.branches
    if (typeof b.branch === 'string') return [b.branch]
    return []
  }, [bankId])
  const [branch, setBranch] = useState(step1?.branch || '')

  const [startDate, setStartDate] = useState(step1?.startDate || '')
  const [maturityDate, setMaturityDate] = useState(step1?.maturityDate || '')

  // ============ Sync local state to context on mount ============
  useEffect(() => {
    if (step1) {
      setSource(step1.source || 'fresh')
      setSourceInvestmentId(step1.sourceInvestmentId || '')
      setReinvestAmount(step1.reinvestAmount ? String(step1.reinvestAmount) : '')
      setInvestmentTypeId(step1.investmentTypeId || '')
      setExternalId(step1.externalId || '')
      setOwnerId(step1.ownerId || '')
      setBankId(step1.bankId || '')
      setBranch(step1.branch || '')
      setStartDate(step1.startDate || '')
      setMaturityDate(step1.maturityDate || '')
    }
  }, [step1])

  // ============ Validation ============
  const reinvestAmountNum = parseFloat(reinvestAmount || '0')
  const reinvestValid = source === 'fresh' || (reinvestAmountNum > 0 && reinvestAmountNum <= availableAmount)
  const datesValid = !startDate || !maturityDate || new Date(maturityDate) > new Date(startDate)
  const formValid = reinvestValid && datesValid && investmentTypeId && ownerId && bankId

  // ============ Handle Next ============
  const handleNext = () => {
    if (!formValid) return
    console.debug('[CreateInvestmentStep1] Updating context and moving to next step')
    
    const payload = {
      source,
      sourceInvestmentId: source === 'existing' ? sourceInvestmentId : null,
      reinvestAmount: source === 'existing' ? reinvestAmountNum : null,
      investmentTypeId,
      externalId,
      ownerId,
      bankId,
      branch,
      startDate,
      maturityDate,
    }
    
    updateStep1(payload)
    onNext?.()
  }

  return (
    <div className="create-investment-root">
      <header className="ci-header">
        <h1>Create Investment</h1>
        <div className="ci-step">Step 1 of 3</div>
      </header>

      <main className="ci-main">
        <section className="ci-section">
          <h2>Source of Funds</h2>
          <div className="radio-row">
            <label>
              <input type="radio" name="source" value="fresh" checked={source === 'fresh'} onChange={() => setSource('fresh')} /> Fresh money
            </label>
            <label>
              <input type="radio" name="source" value="existing" checked={source === 'existing'} onChange={() => setSource('existing')} /> From existing investment
            </label>
          </div>

          {source === 'existing' && (
            <div className="existing-block">
              <label>Source Investment</label>
              <select value={sourceInvestmentId} onChange={(e) => setSourceInvestmentId(e.target.value)}>
                {activeInvestments.map((inv) => (
                  <option key={inv.id} value={inv.id}>{inv.externalInvestmentId || inv.id} — {inv.name}</option>
                ))}
              </select>

              <div className="field-row">
                <label>Available amount</label>
                <input type="text" value={availableAmount} readOnly />
              </div>

              <div className="field-row">
                <label>Amount to reinvest</label>
                <input type="number" min="0" step="0.01" value={reinvestAmount} onChange={(e) => setReinvestAmount(e.target.value)} />
              </div>

              {!reinvestValid && <div className="ci-error">Reinvest amount must be &gt; 0 and ≤ available amount.</div>}
            </div>
          )}
        </section>

        <section className="ci-section">
          <h2>Investment Identity</h2>
          <div className="field-row">
            <label>Investment Type</label>
            <select value={investmentTypeId} onChange={(e) => setInvestmentTypeId(e.target.value)}>
              {mockInvestmentTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.code}</option>
              ))}
            </select>
          </div>

          <div className="field-row">
            <label>External Investment ID (optional)</label>
            <input type="text" value={externalId} onChange={(e) => setExternalId(e.target.value)} />
          </div>

          <div className="field-row">
            <label>Owner</label>
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              {mockOwners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          <div className="field-row">
            <label>Bank</label>
            <select value={bankId} onChange={(e) => { setBankId(e.target.value); setBranch('') }}>
              {mockBanks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="field-row">
            <label>Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} disabled={!bankId}>
              <option value="">Select branch</option>
              {branches.map((br) => <option key={br} value={br}>{br}</option>)}
            </select>
          </div>
        </section>

        <section className="ci-section">
          <h2>Dates</h2>
          <div className="field-row">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="field-row">
            <label>Maturity Date</label>
            <input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} />
          </div>

          {!datesValid && <div className="ci-error">Maturity date must be after start date.</div>}
        </section>
      </main>

      <footer className="ci-footer">
        <button className="btn-secondary" onClick={() => { resetWizard(); onCancel?.(); }}>Cancel</button>
        <button className="btn-primary" onClick={handleNext} disabled={!formValid}>Next</button>
      </footer>
    </div>
  )
}

// Export with HOC protection (Step 1 has no data requirements)
export default withCreateInvestmentStep(CreateInvestmentStep1, 1, { requireStep1: false })
