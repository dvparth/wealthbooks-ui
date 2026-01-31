import { useMemo } from 'react';
import { mockInvestments } from '../mocks/investments.js';
import { mockCashFlows } from '../mocks/cashflows.js';
import { mockInvestmentTypes } from '../mocks/investmentTypes.js';
import { mockBanks } from '../mocks/banks.js';
import { mockOwners } from '../mocks/owners.js';
import '../styles/InvestmentDetail.css';

/**
 * Helper function to format date as DD-MMM-YYYY
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Helper function to format currency as Indian Rupees
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Helper to get financial year from date (Apr-Mar)
 */
const getFinancialYear = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth();
  // April = 3, March = 2
  if (month >= 3) {
    return `FY${year}-${String(year + 1).slice(-2)}`;
  }
  return `FY${year - 1}-${String(year).slice(-2)}`;
};

/**
 * Helper to get financial year display range (Apr–Mar)
 * Returns "FY 2023–24 (Apr 2023 – Mar 2024)"
 */
const getFinancialYearRange = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth();
  let startYear, endYear;

  if (month >= 3) {
    // Apr-Dec: FY year to year+1
    startYear = year;
    endYear = year + 1;
  } else {
    // Jan-Mar: FY year-1 to year
    startYear = year - 1;
    endYear = year;
  }

  const fyLabel = `FY ${startYear}–${String(endYear).slice(-2)}`;
  const dateRange = `(Apr ${startYear} – Mar ${endYear})`;
  return `${fyLabel} ${dateRange}`;
};

/**
 * InvestmentDetail Screen Component
 * Shows detailed information about an investment and its cashflow timeline
 */
export default function InvestmentDetail({ investmentId, onBack }) {
  const investment = useMemo(
    () => mockInvestments.find((inv) => inv.id === investmentId),
    [investmentId]
  );

  const cashflows = useMemo(() => {
    if (!investment) return [];
    const filtered = mockCashFlows.filter((cf) => cf.investmentId === investmentId);
    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [investment, investmentId]);

  const groupedByFY = useMemo(() => {
    const groups = {};
    cashflows.forEach((cf) => {
      const fy = getFinancialYear(cf.date);
      if (!groups[fy]) groups[fy] = [];
      groups[fy].push(cf);
    });
    return groups;
  }, [cashflows]);

  if (!investment) {
    return (
      <div className="investment-detail-container">
        <div className="detail-header">
          <button
            className="back-button"
            onClick={onBack}
            aria-label="Go back to investments list"
          >
            ← Back
          </button>
        </div>
        <div className="investment-not-found">
          <p>Investment not found.</p>
        </div>
      </div>
    );
  }

  const owner = mockOwners.find((o) => o.id === investment.ownerId);
  const bank = mockBanks.find((b) => b.id === investment.bankId);

  return (
    <div className="investment-detail-container">
      {/* Header with back button */}
      <div className="detail-header">
        <button
          className="back-button"
          onClick={onBack}
          aria-label="Go back to investments list"
        >
          ← Back
        </button>
      </div>

      {/* Investment Summary Card */}
      <div className="investment-summary-card" role="region" aria-label="Investment summary">
        <div className="summary-row">
          <div className="summary-field">
            <label className="summary-label">Investment ID</label>
            <span className="summary-value mono">{investment.externalInvestmentId || investment.id}</span>
          </div>
          <div className="summary-field">
            <label className="summary-label">Owner</label>
            <span className="summary-value">{owner?.name || '—'}</span>
          </div>
          <div className="summary-field">
            <label className="summary-label">Status</label>
            <span className={`status-badge status-${investment.status}`} aria-label={`Status: ${investment.status}`}>
              {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="summary-row">
          <div className="summary-field">
            <label className="summary-label">Bank & Branch</label>
            <span className="summary-value">
              {bank?.name || '—'}
              {bank?.branch && ` (${bank.branch})`}
            </span>
          </div>
          <div className="summary-field">
            <label className="summary-label">Interest Rate</label>
            <span className="summary-value mono">
              {investment.interestRate ? `${investment.interestRate}%` : '—'}
            </span>
          </div>
        </div>

        <div className="summary-row">
          <div className="summary-field">
            <label className="summary-label">Principal</label>
            <span className="summary-value mono">{formatCurrency(investment.principal)}</span>
          </div>
          <div className="summary-field">
            <label className="summary-label">Start Date</label>
            <span className="summary-value">{formatDate(investment.startDate)}</span>
          </div>
          <div className="summary-field">
            <label className="summary-label">Maturity Date</label>
            <span className="summary-value">{formatDate(investment.maturityDate)}</span>
          </div>
        </div>

        {investment.expectedMaturityAmount && (
          <div className="summary-row">
            <div className="summary-field">
              <label className="summary-label">Expected Maturity Amount</label>
              <span className="summary-value mono">{formatCurrency(investment.expectedMaturityAmount)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Cashflow Timeline */}
      <div className="cashflow-timeline" role="region" aria-label="Cashflow timeline">
        <h2 className="timeline-title">Cashflow Timeline</h2>

        {Object.keys(groupedByFY).length === 0 ? (
          <div className="no-cashflows">
            <p>No cashflows recorded for this investment.</p>
          </div>
        ) : (
          Object.keys(groupedByFY)
            .sort()
            .map((fy) => (
              <div key={fy} className="fy-section">
                <h3 className="fy-header">{getFinancialYearRange(groupedByFY[fy][0].date)}</h3>
                <div className="cashflow-rows">
                  {groupedByFY[fy].map((cf) => (
                    <div
                      key={cf.id}
                      className={`cashflow-row cf-type-${cf.type} cf-source-${cf.source} cf-status-${cf.status}`}
                      role="listitem"
                    >
                      <div className="cf-date">{formatDate(cf.date)}</div>
                      <div className="cf-type">{cf.type}</div>
                      <div className={`cf-amount cf-type-${cf.type}`}>
                        {formatCurrency(cf.amount)}
                      </div>
                      <div className="cf-source">{cf.source}</div>
                      <div className="cf-status">
                        <span className={`status-pill cf-status-${cf.status}`} aria-label={`Status: ${cf.status}`}>
                          {cf.status}
                        </span>
                      </div>
                      {cf.type === 'reinvestment' && cf.reinvestedInvestmentId && (
                        <div className="cf-detail">
                          Reinvested into: <span className="mono">{cf.reinvestedInvestmentId}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {investment.interestPayoutFrequency === 'maturity' && groupedByFY[fy].length > 0 && (
                    <div className="cashflow-row cf-type-accrued-interest cf-source-system cf-status-planned accrued-placeholder" role="listitem">
                      <div className="cf-date">On maturity</div>
                      <div className="cf-type">Accrued Interest</div>
                      <div className="cf-amount cf-type-accrued-interest">—</div>
                      <div className="cf-source">system</div>
                      <div className="cf-status">
                        <span className="status-pill cf-status-planned" aria-label="Status: planned">
                          planned
                        </span>
                      </div>
                      <div className="cf-detail">Not yet paid (accrued)</div>
                    </div>
                  )}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Audit Summary */}
      <div className="audit-summary" role="region" aria-label="Audit summary">
        <h2 className="summary-title">Summary</h2>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Total Cashflows</span>
            <span className="stat-value">{cashflows.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Inflows</span>
            <span className="stat-value positive">
              {formatCurrency(
                cashflows.reduce((sum, cf) => {
                  if (cf.type === 'interest' || cf.type === 'maturity') {
                    return sum + cf.amount;
                  }
                  return sum;
                }, 0)
              )}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Outflows</span>
            <span className="stat-value negative">
              {formatCurrency(
                cashflows.reduce((sum, cf) => {
                  if (cf.type === 'tds' || cf.type === 'reinvestment') {
                    return sum + Math.abs(cf.amount);
                  }
                  return sum;
                }, 0) * -1
              )}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Net Cashflow</span>
            <span className={`stat-value ${cashflows.reduce((sum, cf) => sum + cf.amount, 0) >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(cashflows.reduce((sum, cf) => sum + cf.amount, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
