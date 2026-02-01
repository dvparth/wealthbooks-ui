import { useEffect, useMemo, useState } from 'react'
import { mockInvestments } from '../mocks/investments.js'
import { mockOwners } from '../mocks/owners.js'
import { mockBanks } from '../mocks/banks.js'
import { mockInvestmentTypes } from '../mocks/investmentTypes.js'
import '../styles/CreateInvestment.css'

export default function CreateInvestment({ onCancel, onNext }) {
  const sourceOptions = ['fresh', 'existing']
  const [source, setSource] = useState('fresh')

  const activeInvestments = useMemo(() => mockInvestments.filter((i) => i.status === 'active'), [])
  const [sourceInvestmentId, setSourceInvestmentId] = useState(activeInvestments[0]?.id || '')
  const availableAmount = useMemo(() => {
    const inv = activeInvestments.find((i) => i.id === sourceInvestmentId)
    return inv ? inv.principal : 0
  }, [sourceInvestmentId, activeInvestments])
  const [reinvestAmount, setReinvestAmount] = useState('')

  const [investmentTypeId, setInvestmentTypeId] = useState(mockInvestmentTypes[0]?.id || '')
  const [externalId, setExternalId] = useState('')
  const [ownerId, setOwnerId] = useState(mockOwners[0]?.id || '')
  const [bankId, setBankId] = useState(mockBanks[0]?.id || '')
  const branches = useMemo(() => {
    const b = mockBanks.find((x) => x.id === bankId)
    if (!b) return []
    // support both `branches` array and legacy single `branch` string in mocks
    if (Array.isArray(b.branches)) return b.branches
    if (typeof b.branch === 'string') return [b.branch]
    return []
  }, [bankId])
  const [branch, setBranch] = useState('')

  const [startDate, setStartDate] = useState('')
  const [maturityDate, setMaturityDate] = useState('')

  // Load persisted step1 if returning via Back navigation
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('wb:createInvestment:step1')
      if (raw) {
        const payload = JSON.parse(raw)
        console.debug('[CreateInvestment] Restoring persisted step1 payload:', payload)
        if (payload.source) setSource(payload.source)
        if (payload.sourceInvestmentId) setSourceInvestmentId(payload.sourceInvestmentId)
        if (payload.reinvestAmount != null) setReinvestAmount(String(payload.reinvestAmount))
        if (payload.investmentTypeId) setInvestmentTypeId(payload.investmentTypeId)
        if (payload.externalId) setExternalId(payload.externalId)
        if (payload.ownerId) setOwnerId(payload.ownerId)
        if (payload.bankId) setBankId(payload.bankId)
        if (payload.branch) setBranch(payload.branch)
        if (payload.startDate) setStartDate(payload.startDate)
        if (payload.maturityDate) setMaturityDate(payload.maturityDate)
      }
    } catch (e) {
      console.warn('[CreateInvestment] Error restoring step1 payload:', e)
    }
  }, [])

  // Validation
  const reinvestAmountNum = parseFloat(reinvestAmount || '0')
  const reinvestValid = source === 'fresh' || (reinvestAmountNum > 0 && reinvestAmountNum <= availableAmount)
  const datesValid = !startDate || !maturityDate || new Date(maturityDate) > new Date(startDate)
  const formValid = reinvestValid && datesValid && investmentTypeId && ownerId && bankId

  const handleNext = () => {
    if (!formValid) return
    console.debug('[CreateInvestment] handleNext triggered')
    // store local state or pass up — per instructions do not save yet
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
    // persist step1 data in sessionStorage for the wizard
    try {
      sessionStorage.setItem('wb:createInvestment:step1', JSON.stringify(payload))
      console.debug('[CreateInvestment] Persisted step1 payload', payload)
    } catch (e) {
      console.warn('Could not persist step1 payload', e)
    }
    // Call onNext callback if provided by parent (App.jsx)
    if (onNext && typeof onNext === 'function') {
      console.debug('[CreateInvestment] Calling onNext handler')
      onNext()
    } else {
      console.warn('[CreateInvestment] onNext handler not available — parent should provide navigation callback')
    }
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
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={handleNext} disabled={!formValid}>Next</button>
      </footer>
    </div>
  )
}
