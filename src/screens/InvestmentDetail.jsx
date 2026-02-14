import { useState, useMemo } from 'react';
import { mockInvestments } from '../mocks/investments.js';
import { mockCashFlows, addCashflow } from '../mocks/cashflows.js';
import { mockBanks } from '../mocks/banks.js';
import { mockOwners } from '../mocks/owners.js';
import { generateExpectedInterestSchedule } from '../utils/interestEngine.js';
import { createCashFlow, preserveManualCashflows } from '../models/CashFlow.js';
import { getEffectiveMaturityAmount } from '../utils/cashflowAdjustments.js';
import CashflowAdjustmentModal from '../components/CashflowAdjustmentModal.jsx';
import '../styles/InvestmentDetail.css';

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatFrequency = (freq) => {
  if (!freq) return '—';
  return String(freq).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const getCashflowTypeLabel = (type) => {
  const labels = {
    'principal': 'Principal',
    'interest_payout': 'Interest Payout',
    'interest': 'Interest', // Legacy
    'accrued_interest': 'Accrued Interest',
    'interest_accrual': 'Accrued Interest',
    'maturity_payout': 'Maturity Payout',
    'tds_deduction': 'TDS Deduction',
    'tds': 'TDS', // Legacy
    'maturity': 'Maturity', // Legacy
    'reinvestment': 'Reinvestment',
    'adjustment': 'Adjustment',
    'unallocated': 'Unallocated',
    'closure': 'Closure',
  };
  return labels[type] || type;
};

const getFinancialYear = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month >= 3) {
    return `FY${year}-${String(year + 1).slice(-2)}`;
  }
  return `FY${year - 1}-${String(year).slice(-2)}`;
};

const getFinancialYearRange = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth();
  let startYear, endYear;
  if (month >= 3) {
    startYear = year;
    endYear = year + 1;
  } else {
    startYear = year - 1;
    endYear = year;
  }
  const fyLabel = `FY ${startYear}–${String(endYear).slice(-2)}`;
  const dateRange = `(Apr ${startYear} – Mar ${endYear})`;
  return `${fyLabel} ${dateRange}`;
};

export default function InvestmentDetail({ investmentId, onBack }) {
  // Initialize state first before any useMemo hooks that depend on them
  const [expandedFYs, setExpandedFYs] = useState(() => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const currentFY = month >= 3 ? `FY${year}-${String(year + 1).slice(-2)}` : `FY${year - 1}-${String(year).slice(-2)}`;
    return new Set([currentFY]);
  });

  const [adjustmentModal, setAdjustmentModal] = useState(null);
  const [allCashflows, setAllCashflows] = useState(mockCashFlows);

  const investment = useMemo(
    () => mockInvestments.find((inv) => inv.id === investmentId),
    [investmentId]
  );

  const owner = mockOwners.find((o) => o.id === investment?.ownerId);
  const bank = mockBanks.find((b) => b.id === investment?.bankId);

  // Get persisted cashflows only (not preview)
  const persistedCashflows = useMemo(() => {
    if (!investment) return [];
    return allCashflows.filter((cf) => cf.investmentId === investmentId);
  }, [investment, investmentId, allCashflows]);

  // Backfill missing TDS_DEDUCTION cashflows for existing investments
  // If investment has tds in name or we detect it was created with TDS but has no tds_deduction cashflows
  // Sort all cashflows globally by date, preserving ledger correctness
  // Cashflows are sorted globally by date to preserve ledger correctness.
  // For the same date, interest entries come before TDS deductions.
  const sortedCashflows = useMemo(() => {
    const typeOrder = {
      'principal': 0,
      'interest_payout': 1,
      'interest': 1,
      'accrued_interest': 1,
      'maturity_payout': 1,
      'tds_deduction': 2,
      'tds': 2,
      'reinvestment': 3,
      'adjustment': 4,
      'unallocated': 5,
      'closure': 6,
    };
    
    return [...persistedCashflows].sort((a, b) => {
      // Primary: sort by date
      const dateCompare = new Date(a.date) - new Date(b.date);
      if (dateCompare !== 0) return dateCompare;
      
      // Secondary: for same date, use type order (interest before TDS)
      const typeA = typeOrder[a.type] ?? 999;
      const typeB = typeOrder[b.type] ?? 999;
      return typeA - typeB;
    });
  }, [persistedCashflows]);

  // Group sorted cashflows by FY (groups are already in chronological order)
  const groupedByFY = useMemo(() => {
    const groups = {};
    sortedCashflows.forEach((cf) => {
      const fy = getFinancialYear(cf.date);
      if (!groups[fy]) groups[fy] = [];
      groups[fy].push(cf);
    });
    return groups;
  }, [sortedCashflows]);

  // Calculate FY summaries from persisted cashflows only
  const fySummaries = useMemo(() => {
    const summaries = {};
    
    Object.entries(groupedByFY).forEach(([fy, cashflows]) => {
      let interestEarned = 0;
      let tdsDeducted = 0;
      let adjustments = 0;

      cashflows.forEach((cf) => {
        // Sum interest (include interest_payout, accrued_interest, and interest_accrual types)
        if (cf.type === 'interest_payout' || cf.type === 'accrued_interest' || cf.type === 'interest' || cf.type === 'interest_accrual') {
          interestEarned += cf.amount;
        }
        // Sum TDS (tds_deduction, tds types)
        if (cf.type === 'tds_deduction' || cf.type === 'tds') {
          tdsDeducted += Math.abs(cf.amount); // Make positive for display
        }
        // Sum adjustments (manual corrections)
        if (cf.type === 'ADJUSTMENT') {
          adjustments += cf.amount;
        }
      });
      
      summaries[fy] = {
        interestEarned: Math.round(interestEarned),
        tdsDeducted: Math.round(tdsDeducted),
        adjustments: Math.round(adjustments),
        netIncome: Math.round(interestEarned - tdsDeducted + adjustments),
      };
    });
    
    return summaries;
  }, [groupedByFY]);

  // Diagnostics: copy persisted-investment diagnostics + preview overlay
  const showDiagnosticsPreview = (text, title = 'Diagnostics') => {
    try {
      const existing = document.getElementById('wb-diagnostics-overlay')
      if (existing) existing.remove()
      const overlay = document.createElement('div')
      overlay.id = 'wb-diagnostics-overlay'
      overlay.style.position = 'fixed'
      overlay.style.left = '0'
      overlay.style.top = '0'
      overlay.style.width = '100%'
      overlay.style.height = '100%'
      overlay.style.background = 'rgba(0,0,0,0.6)'
      overlay.style.zIndex = 9999
      overlay.style.display = 'flex'
      overlay.style.alignItems = 'center'
      overlay.style.justifyContent = 'center'

      const panel = document.createElement('div')
      panel.style.width = 'min(980px, 96%)'
      panel.style.maxHeight = '86%'
      panel.style.background = '#fff'
      panel.style.borderRadius = '8px'
      panel.style.padding = '16px'
      panel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'
      panel.style.overflow = 'auto'
      panel.style.fontFamily = 'monospace'
      panel.style.fontSize = '0.9em'

      const header = document.createElement('div')
      header.style.display = 'flex'
      header.style.justifyContent = 'space-between'
      header.style.alignItems = 'center'
      header.style.marginBottom = '8px'

      const h = document.createElement('strong')
      h.textContent = title
      header.appendChild(h)

      const closeBtn = document.createElement('button')
      closeBtn.textContent = 'Close'
      closeBtn.style.padding = '6px 10px'
      closeBtn.style.border = 'none'
      closeBtn.style.background = '#111827'
      closeBtn.style.color = '#fff'
      closeBtn.style.borderRadius = '4px'
      closeBtn.style.cursor = 'pointer'
      closeBtn.onclick = () => overlay.remove()
      header.appendChild(closeBtn)

      const pre = document.createElement('pre')
      pre.textContent = text
      pre.style.whiteSpace = 'pre-wrap'
      pre.style.wordBreak = 'break-word'
      pre.style.margin = '0'

      panel.appendChild(header)
      panel.appendChild(pre)
      overlay.appendChild(panel)
      document.body.appendChild(overlay)
    } catch (e) {
      console.error('[InvestmentDetail] showDiagnosticsPreview error', e)
    }
  }

  const handleCopyDiagnostics = async () => {
    try {
      // Build diagnostics text for persisted investment
      const investmentInfo = `Investment: ${investment.name || investment.id}\nID: ${investment.externalInvestmentId || investment.id}\nOwner: ${owner?.name || '—'}\nBank: ${bank?.name || '—'}\nPrincipal: ${investment.principal || 0}\nRate: ${investment.interestRate || 0}%\nStart: ${investment.startDate || '—'}\nMaturity: ${investment.maturityDate || '—'}\n`;

      const totalInterest = Object.values(fySummaries).reduce((s, f) => s + (f.interestEarned || 0), 0)
      const totalTds = Object.values(fySummaries).reduce((s, f) => s + (f.tdsDeducted || 0), 0)

      let detailed = ''
      Object.entries(groupedByFY).forEach(([fy, cfs]) => {
        detailed += `\n${fy} - ${cfs.length} cashflows\n`
        cfs.forEach(cf => {
          detailed += `  ${cf.date} | ${cf.type} | ${cf.amount} | ${cf.status} | ${cf.source}\\n`
        })
      })

      const diagnostics = `=== INVESTMENT DIAGNOSTICS ===\n\n${investmentInfo}\nTotal Interest (FY summaries): ${totalInterest}\nTotal TDS (FY summaries): ${totalTds}\nCashflow Count: ${sortedCashflows.length}\n${detailed}`

      // Copy to clipboard
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(diagnostics)
      } else {
        const ta = document.createElement('textarea')
        ta.value = diagnostics
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }

      // Show preview overlay with the exact text copied
      showDiagnosticsPreview(diagnostics, 'Investment Diagnostics — Copied to clipboard')
    } catch (err) {
      console.error('[InvestmentDetail] Copy diagnostics error', err)
      alert('Failed to copy diagnostics. ' + (err?.message || ''))
    }
  }

  const toggleFY = (fy) => {
    const next = new Set(expandedFYs);
    if (next.has(fy)) next.delete(fy);
    else next.add(fy);
    setExpandedFYs(next);
  };

  const handleAdjustCashflow = (cashflow) => {
    // Only allow adjusting system cashflows
    if (cashflow.source !== 'system') {
      alert('Cannot adjust manual entries directly. Only system cashflows can be adjusted.');
      return;
    }
    setAdjustmentModal(cashflow);
  };

  const handleAdjustmentSubmit = (adjustment) => {
    const newCashflow = createCashFlow(adjustment);
    // Persist adjustment to mock data (source of truth)
    addCashflow(newCashflow);
    // Reload all cashflows from mock data to ensure single source of truth
    // This prevents duplicate entries and ensures state is always in sync with the ledger
    setAllCashflows([...mockCashFlows]);
    setAdjustmentModal(null);
  };

  const handleAdjustmentCancel = () => {
    setAdjustmentModal(null);
  };

  if (!investment) {
    return (
      <div className="investment-detail-container">
        <div className="not-found">Investment not found</div>
      </div>
    );
  }

  return (
    <div className="investment-detail-container">
      <div className="detail-header">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="back-button" onClick={() => onBack && onBack()} aria-label="Back to investments">
            ← Back
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleCopyDiagnostics()}
            style={{ padding: '6px 10px', borderRadius: '6px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            📋 Copy diagnostics
          </button>
        </div>
      </div>
      <div className="investment-summary-card" role="region" aria-label="Investment summary">
        <div className="summary-grid">
          <div className="section-title">Identity</div>

          <div className="grid-label">Investment ID</div>
          <div className="grid-value mono">{investment.externalInvestmentId || investment.id}</div>
          <div className="grid-label">Status</div>
          <div className="grid-value">
            <span className={`status-badge status-${investment.status}`}>{investment.status}</span>
          </div>

          <div className="grid-label">Owner</div>
          <div className="grid-value">{owner?.name || '—'}</div>
          <div className="grid-label">&nbsp;</div>
          <div className="grid-value">&nbsp;</div>

          <div className="section-title">Bank & Terms</div>

          <div className="grid-label">Bank & Branch</div>
          <div className="grid-value">{bank?.name || '—'}{bank?.branch ? ` (${bank.branch})` : ''}</div>
          <div className="grid-label">Interest Calculation</div>
          <div className="grid-value">{formatFrequency(investment.interestCalculationFrequency)}</div>

          <div className="grid-label">Interest Payout</div>
          <div className="grid-value">{formatFrequency(investment.interestPayoutFrequency)}</div>
          <div className="grid-label">Interest Rate</div>
          <div className="grid-value">{investment.interestRate ? `${investment.interestRate}%` : '—'}</div>

          <div className="section-title">Amounts</div>

          <div className="grid-label">Principal</div>
          <div className="grid-value">{formatCurrency(investment.principal)}</div>
          <div className="grid-label">Expected Maturity Amount</div>
          <div className="grid-value">{getEffectiveMaturityAmount(investment, allCashflows) ? formatCurrency(getEffectiveMaturityAmount(investment, allCashflows)) : '—'}</div>

          <div className="section-title">Dates</div>

          <div className="grid-label">Start Date</div>
          <div className="grid-value">{formatDate(investment.startDate)}</div>
          <div className="grid-label">Maturity Date</div>
          <div className="grid-value">{formatDate(investment.maturityDate)}</div>
        </div>
      </div>

      <div className="cashflow-timeline" role="region" aria-label="Cashflow timeline">
        <h2 className="timeline-title">Cashflow Timeline</h2>

        {Object.keys(groupedByFY).length === 0 ? (
          <div className="no-cashflows"><p>No cashflows recorded for this investment.</p></div>
        ) : (
          Object.keys(groupedByFY)
            .sort()
            .map((fy) => {
              const isExpanded = expandedFYs.has(fy);
              return (
                <div key={fy} className="fy-section">
                  <button
                    className="fy-header-button"
                    onClick={() => toggleFY(fy)}
                    aria-expanded={isExpanded}
                    aria-controls={`fy-content-${fy}`}
                  >
                    <span className="fy-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
                    <span className="fy-header-text">{getFinancialYearRange(groupedByFY[fy][0].date)}</span>
                    {fySummaries[fy] && (
                      <span className="fy-summary-badge">
                        Interest: ₹{fySummaries[fy].interestEarned.toLocaleString('en-IN')} 
                        {fySummaries[fy].tdsDeducted > 0 ? ` | TDS: ₹${fySummaries[fy].tdsDeducted.toLocaleString('en-IN')}` : ''}
                      </span>
                    )}
                  </button>
                  {isExpanded && (
                    <div id={`fy-content-${fy}`} className="cashflow-rows">
                      {groupedByFY[fy].map((cf) => {
                        const isSystemCashflow = cf.source === 'system';
                        const isAdjustment = cf.type === 'ADJUSTMENT';
                        const linkedCashflow = isAdjustment 
                          ? persistedCashflows.find(c => c.id === cf.adjustsCashflowId)
                          : null;
                        
                        return (
                          <div
                            key={cf.id}
                            className={`cashflow-row cf-type-${cf.type} cf-source-${cf.source} cf-status-${cf.status} ${cf.isPreview ? 'preview-row' : ''} ${isAdjustment ? 'cf-adjustment-entry' : ''}`}
                            role="listitem"
                          >
                            <div className="cf-date">{formatDate(cf.date)}</div>
                            <div className="cf-type">
                              {cf.isPreview ? (
                                <>
                                  <span className="preview-label">Expected</span> {getCashflowTypeLabel(cf.type)}
                                </>
                              ) : (
                                <>
                                  {getCashflowTypeLabel(cf.type)}
                                  {isAdjustment && cf.reason && (
                                    <div className="cf-adjustment-reason">{cf.reason}</div>
                                  )}
                                </>
                              )}
                            </div>
                            <div className={`cf-amount cf-type-${cf.type} ${cf.amount < 0 ? 'cf-amount-negative' : 'cf-amount-positive'}`}>
                              {cf.amount < 0 ? '−' : ''}{formatCurrency(Math.abs(cf.amount))}
                            </div>
                            <div className="cf-source">{cf.source}</div>
                            <div className="cf-status"><span className={`status-pill cf-status-${cf.status}`}>{cf.status}</span></div>
                            <div className="cf-actions">
                              {isSystemCashflow && !cf.isPreview && (
                                <button
                                  className="btn-adjust-cashflow"
                                  onClick={() => handleAdjustCashflow(cf)}
                                  title="Create adjustment entry for this cashflow"
                                  aria-label={`Adjust ${getCashflowTypeLabel(cf.type)}`}
                                >
                                  Adjust
                                </button>
                              )}
                            </div>
                            {cf.type === 'reinvestment' && cf.reinvestedInvestmentId && (
                              <div className="cf-detail">Reinvested into: <span className="mono">{cf.reinvestedInvestmentId}</span></div>
                            )}
                            {cf.periodNote && <div className="cf-detail period-note">{cf.periodNote}</div>}
                            {isAdjustment && linkedCashflow && (
                              <div className="cf-detail cf-linked-info">
                                Adjusts: {getCashflowTypeLabel(linkedCashflow.type)} (₹{Math.abs(linkedCashflow.amount).toLocaleString('en-IN')})
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      <div className="fy-summary-section" role="region" aria-label="Financial Year Summary">
        <h2 className="summary-title">Financial Year Summary</h2>
        {Object.keys(fySummaries).length === 0 ? (
          <p style={{ color: '#6b7280' }}>No cashflows to summarize.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
            {Object.entries(fySummaries)
              .sort(([fyA], [fyB]) => fyA.localeCompare(fyB))
              .map(([fy, summary]) => (
                <div key={fy} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#f9fafb' }}>
                  <strong>{fy}</strong>
                  <div style={{ marginTop: '8px', fontSize: '0.9em', display: 'grid', gap: '4px' }}>
                    <div>
                      <span style={{ color: '#6b7280' }}>Interest Earned:</span>
                      <span style={{ float: 'right', fontWeight: '500' }}>₹{summary.interestEarned.toLocaleString('en-IN')}</span>
                    </div>
                    {summary.tdsDeducted > 0 && (
                      <div>
                        <span style={{ color: '#6b7280' }}>TDS Deducted:</span>
                        <span style={{ float: 'right', color: '#b91c1c' }}>₹{summary.tdsDeducted.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {summary.adjustments !== 0 && (
                      <div>
                        <span style={{ color: '#6b7280' }}>Adjustments:</span>
                        <span style={{ float: 'right', color: summary.adjustments > 0 ? '#16a34a' : '#b91c1c', fontWeight: '500' }}>
                          {summary.adjustments > 0 ? '+' : ''}₹{summary.adjustments.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid #d1d5db', marginTop: '8px', paddingTop: '8px', fontWeight: 'bold' }}>
                      <span>Net Income:</span>
                      <span style={{ float: 'right', color: '#16a34a' }}>₹{summary.netIncome.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="audit-summary" role="region" aria-label="Audit summary">
        <h2 className="summary-title">Summary</h2>
        <div className="summary-stats">
          <div className="stat-item"><span className="stat-label">Total Cashflows</span><span className="stat-value">{sortedCashflows.length}</span></div>
          <div className="stat-item"><span className="stat-label">Total Inflows</span><span className="stat-value positive">{formatCurrency(sortedCashflows.reduce((sum, cf) => {
            // Include 'interest_accrual' as inflow for summary totals
            const isInflow = cf.type === 'interest_payout' || cf.type === 'accrued_interest' || cf.type === 'interest_accrual' || cf.type === 'maturity_payout' || cf.type === 'interest' || cf.type === 'maturity';
            return isInflow && cf.amount > 0 ? sum + cf.amount : sum;
          }, 0))}</span></div>
          <div className="stat-item"><span className="stat-label">Total Outflows</span><span className="stat-value negative">{formatCurrency(Math.abs(sortedCashflows.reduce((sum, cf) => {
            const isOutflow = cf.type === 'tds_deduction' || cf.type === 'tds' || cf.type === 'reinvestment';
            return isOutflow && cf.amount < 0 ? sum + cf.amount : sum;
          }, 0)))}</span></div>
          <div className="stat-item"><span className="stat-label">Net Cashflow</span><span className={`stat-value ${sortedCashflows.reduce((s, cf) => s + cf.amount, 0) >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(sortedCashflows.reduce((s, cf) => s + cf.amount, 0))}</span></div>
        </div>
      </div>

      {adjustmentModal && (
        <CashflowAdjustmentModal
          cashflow={adjustmentModal}
          onSubmit={handleAdjustmentSubmit}
          onCancel={handleAdjustmentCancel}
        />
      )}
    </div>
  );
}

