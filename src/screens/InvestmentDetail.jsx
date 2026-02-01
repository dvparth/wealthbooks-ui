import { useState, useMemo } from 'react';
import { mockInvestments } from '../mocks/investments.js';
import { mockCashFlows } from '../mocks/cashflows.js';
import { mockBanks } from '../mocks/banks.js';
import { mockOwners } from '../mocks/owners.js';
import { generateExpectedInterestSchedule } from '../utils/interestEngine.js';
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
  const investment = useMemo(
    () => mockInvestments.find((inv) => inv.id === investmentId),
    [investmentId]
  );

  const owner = mockOwners.find((o) => o.id === investment?.ownerId);
  const bank = mockBanks.find((b) => b.id === investment?.bankId);

  // Get persisted cashflows only (not preview)
  const persistedCashflows = useMemo(() => {
    if (!investment) return [];
    return mockCashFlows.filter((cf) => cf.investmentId === investmentId);
  }, [investment, investmentId]);

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
      

      cashflows.forEach((cf) => {
        // Sum interest (both interest_payout and accrued_interest types)
        if (cf.type === 'interest_payout' || cf.type === 'accrued_interest' || cf.type === 'interest') {
          interestEarned += cf.amount;
        }
        // Sum TDS (tds_deduction, tds types)
        if (cf.type === 'tds_deduction' || cf.type === 'tds') {
          tdsDeducted += Math.abs(cf.amount); // Make positive for display
        }
      });
      
      summaries[fy] = {
        interestEarned: Math.round(interestEarned),
        tdsDeducted: Math.round(tdsDeducted),
        netIncome: Math.round(interestEarned - tdsDeducted),
      };
    });
    
    return summaries;
  }, [groupedByFY]);

  const [expandedFYs, setExpandedFYs] = useState(() => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const currentFY = month >= 3 ? `FY${year}-${String(year + 1).slice(-2)}` : `FY${year - 1}-${String(year).slice(-2)}`;
    return new Set([currentFY]);
  });

  const toggleFY = (fy) => {
    const next = new Set(expandedFYs);
    if (next.has(fy)) next.delete(fy);
    else next.add(fy);
    setExpandedFYs(next);
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
        <button className="back-button" onClick={() => onBack && onBack()} aria-label="Back to investments">
          ← Back
        </button>
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
          <div className="grid-value">{investment.expectedMaturityAmount ? formatCurrency(investment.expectedMaturityAmount) : '—'}</div>

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
                      {groupedByFY[fy].map((cf) => (
                        <div
                          key={cf.id}
                          className={`cashflow-row cf-type-${cf.type} cf-source-${cf.source} cf-status-${cf.status} ${cf.isPreview ? 'preview-row' : ''}`}
                          role="listitem"
                        >
                          <div className="cf-date">{formatDate(cf.date)}</div>
                          <div className="cf-type">
                            {cf.isPreview ? (
                              <>
                                <span className="preview-label">Expected</span> {getCashflowTypeLabel(cf.type)}
                              </>
                            ) : (
                              getCashflowTypeLabel(cf.type)
                            )}
                          </div>
                          <div className={`cf-amount cf-type-${cf.type} ${cf.amount < 0 ? 'cf-amount-negative' : 'cf-amount-positive'}`}>
                            {cf.amount < 0 ? '−' : ''}{formatCurrency(Math.abs(cf.amount))}
                          </div>
                          <div className="cf-source">{cf.source}</div>
                          <div className="cf-status"><span className={`status-pill cf-status-${cf.status}`}>{cf.status}</span></div>
                          {cf.type === 'reinvestment' && cf.reinvestedInvestmentId && (
                            <div className="cf-detail">Reinvested into: <span className="mono">{cf.reinvestedInvestmentId}</span></div>
                          )}
                          {cf.periodNote && <div className="cf-detail period-note">{cf.periodNote}</div>}
                        </div>
                      ))}
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
            const isInflow = cf.type === 'interest_payout' || cf.type === 'accrued_interest' || cf.type === 'maturity_payout' || cf.type === 'interest' || cf.type === 'maturity';
            return isInflow && cf.amount > 0 ? sum + cf.amount : sum;
          }, 0))}</span></div>
          <div className="stat-item"><span className="stat-label">Total Outflows</span><span className="stat-value negative">{formatCurrency(Math.abs(sortedCashflows.reduce((sum, cf) => {
            const isOutflow = cf.type === 'tds_deduction' || cf.type === 'tds' || cf.type === 'reinvestment';
            return isOutflow && cf.amount < 0 ? sum + cf.amount : sum;
          }, 0)))}</span></div>
          <div className="stat-item"><span className="stat-label">Net Cashflow</span><span className={`stat-value ${sortedCashflows.reduce((s, cf) => s + cf.amount, 0) >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(sortedCashflows.reduce((s, cf) => s + cf.amount, 0))}</span></div>
        </div>
      </div>
    </div>
  );
}

