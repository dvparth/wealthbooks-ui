import { useMemo, useState } from 'react';
import { mockInvestments } from '../mocks/investments.js';
import { mockCashFlows } from '../mocks/cashflows.js';
import { mockInvestmentTypes } from '../mocks/investmentTypes.js';
import { mockBanks } from '../mocks/banks.js';
import { mockOwners } from '../mocks/owners.js';
import { getEffectiveMaturityAmount } from '../utils/cashflowAdjustments.js';
import '../styles/InvestmentsList.css';

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
 * Helper function to get investment type name by ID
 */
const getInvestmentTypeName = (investmentTypeId) => {
  const type = mockInvestmentTypes.find((t) => t.id === investmentTypeId);
  return type?.code || 'N/A';
};

/**
 * InvestmentsList Screen Component
 * Displays all investments in a mobile-friendly table format
 * Shows: Name, Type, Principal, Start Date, Maturity Date, Status
 */
export default function InvestmentsList({ onSelectInvestment }) {
  const [filters, setFilters] = useState({ ownerId: '', bankId: '', status: '', typeId: '', startYear: '', maturityYear: '' });
  const [sortBy, setSortBy] = useState({ key: 'maturityDate', direction: 'desc' });

  const owners = mockOwners;
  const banks = mockBanks;
  const types = mockInvestmentTypes;

  const activeCount = mockInvestments.filter((inv) => inv.status === 'active').length;
  const totalInvested = mockInvestments.reduce((sum, inv) => sum + inv.principal, 0);

  const filtered = useMemo(() => {
    return mockInvestments
      .filter((inv) => (filters.ownerId ? inv.ownerId === filters.ownerId : true))
      .filter((inv) => (filters.bankId ? inv.bankId === filters.bankId : true))
      .filter((inv) => (filters.status ? inv.status === filters.status : true))
      .filter((inv) => (filters.typeId ? inv.investmentTypeId === filters.typeId : true))
      .filter((inv) => (filters.startYear ? new Date(inv.startDate).getFullYear().toString() === filters.startYear : true))
      .filter((inv) => (filters.maturityYear ? new Date(inv.maturityDate).getFullYear().toString() === filters.maturityYear : true));
  }, [filters]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    const dir = sortBy.direction === 'asc' ? 1 : -1;
    copy.sort((a, b) => {
      const key = sortBy.key;
      // numeric keys
      if (key === 'principal' || key === 'interestRate') {
        const va = a[key] == null ? -Infinity : a[key];
        const vb = b[key] == null ? -Infinity : b[key];
        return (va - vb) * dir;
      }
      if (key === 'expectedMaturityAmount') {
        const va = getEffectiveMaturityAmount(a, mockCashFlows) ?? -Infinity;
        const vb = getEffectiveMaturityAmount(b, mockCashFlows) ?? -Infinity;
        return (va - vb) * dir;
      }
      if (key === 'status') {
        return a.status.localeCompare(b.status) * dir;
      }
      if (key === 'startDate' || key === 'maturityDate') {
        return (new Date(a[key]) - new Date(b[key])) * dir;
      }
      return 0;
    });
    return copy;
  }, [filtered, sortBy]);

  const handleSort = (key) => {
    setSortBy((s) => {
      if (s.key === key) {
        return { key, direction: s.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters((f) => ({ ...f, [field]: value }));
  };

  // derive year options
  const startYears = Array.from(new Set(mockInvestments.map((i) => new Date(i.startDate).getFullYear()))).sort((a, b) => b - a);
  const maturityYears = Array.from(new Set(mockInvestments.map((i) => new Date(i.maturityDate).getFullYear()))).sort((a, b) => b - a);

  return (
    <div className="investments-list-container">
      {/* Header Section */}
      <header className="investments-header">
        <h1>My Investments</h1>
        <div>
          <button onClick={() => { window.history.pushState({}, '', '/investments/new'); window.dispatchEvent(new PopStateEvent('popstate')) }} className="btn-primary">Create Investment</button>
        </div>
        <div className="investments-summary">
          <div className="summary-item">
            <span className="summary-label">Active</span>
            <span className="summary-value">{activeCount}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Invested</span>
            <span className="summary-value">{formatCurrency(totalInvested)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Investments</span>
            <span className="summary-value">{mockInvestments.length}</span>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="investments-filters" style={{ margin: '0 0 1rem 0' }} role="region" aria-label="Investment filters">
        <label htmlFor="filter-owner" className="sr-only">Filter by Owner</label>
        <select id="filter-owner" value={filters.ownerId} onChange={(e) => handleFilterChange('ownerId', e.target.value)}>
          <option value="">All Owners</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>

        <label htmlFor="filter-bank" className="sr-only">Filter by Bank</label>
        <select id="filter-bank" value={filters.bankId} onChange={(e) => handleFilterChange('bankId', e.target.value)}>
          <option value="">All Banks</option>
          {banks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <label htmlFor="filter-status" className="sr-only">Filter by Status</label>
        <select id="filter-status" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>

        <label htmlFor="filter-type" className="sr-only">Filter by Investment Type</label>
        <select id="filter-type" value={filters.typeId} onChange={(e) => handleFilterChange('typeId', e.target.value)}>
          <option value="">All Types</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.code}
            </option>
          ))}
        </select>

        <label htmlFor="filter-start-year" className="sr-only">Filter by Start Year</label>
        <select id="filter-start-year" value={filters.startYear} onChange={(e) => handleFilterChange('startYear', e.target.value)}>
          <option value="">All Start Years</option>
          {startYears.map((y) => (
            <option key={y} value={y.toString()}>
              {y}
            </option>
          ))}
        </select>

        <label htmlFor="filter-maturity-year" className="sr-only">Filter by Maturity Year</label>
        <select id="filter-maturity-year" value={filters.maturityYear} onChange={(e) => handleFilterChange('maturityYear', e.target.value)}>
          <option value="">All Maturity Years</option>
          {maturityYears.map((y) => (
            <option key={y} value={y.toString()}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Investments Table */}
      <div className="investments-table-wrapper">
        <table className="investments-table" aria-label="List of investments with details including principal, maturity dates, and status" role="table">
          <thead>
            <tr role="row">
              <th role="columnheader" scope="col">Investment ID</th>
              <th role="columnheader" scope="col">Owner</th>
              <th role="columnheader" scope="col">Bank</th>
              <th role="columnheader" scope="col">Branch</th>
              <th
                role="columnheader"
                scope="col"
                className={`sortable ${sortBy.key === 'interestRate' ? `sorted-${sortBy.direction}` : ''}`}
                onClick={() => handleSort('interestRate')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSort('interestRate');
                  }
                }}
                tabIndex="0"
                aria-sort={sortBy.key === 'interestRate' ? (sortBy.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Interest Rate
              </th>
              <th
                role="columnheader"
                scope="col"
                className={`sortable ${sortBy.key === 'principal' ? `sorted-${sortBy.direction}` : ''}`}
                onClick={() => handleSort('principal')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSort('principal');
                  }
                }}
                tabIndex="0"
                aria-sort={sortBy.key === 'principal' ? (sortBy.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Principal
              </th>
              <th
                role="columnheader"
                scope="col"
                className={`sortable ${sortBy.key === 'startDate' ? `sorted-${sortBy.direction}` : ''}`}
                onClick={() => handleSort('startDate')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSort('startDate');
                  }
                }}
                tabIndex="0"
                aria-sort={sortBy.key === 'startDate' ? (sortBy.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Start Date
              </th>
              <th
                role="columnheader"
                scope="col"
                className={`sortable ${sortBy.key === 'maturityDate' ? `sorted-${sortBy.direction}` : ''}`}
                onClick={() => handleSort('maturityDate')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSort('maturityDate');
                  }
                }}
                tabIndex="0"
                aria-sort={sortBy.key === 'maturityDate' ? (sortBy.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Maturity Date
              </th>
              <th
                role="columnheader"
                scope="col"
                className={`sortable ${sortBy.key === 'expectedMaturityAmount' ? `sorted-${sortBy.direction}` : ''}`}
                onClick={() => handleSort('expectedMaturityAmount')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSort('expectedMaturityAmount');
                  }
                }}
                tabIndex="0"
                aria-sort={sortBy.key === 'expectedMaturityAmount' ? (sortBy.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Maturity Amount
              </th>
              <th
                role="columnheader"
                scope="col"
                className={`sortable ${sortBy.key === 'status' ? `sorted-${sortBy.direction}` : ''}`}
                onClick={() => handleSort('status')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSort('status');
                  }
                }}
                tabIndex="0"
                aria-sort={sortBy.key === 'status' ? (sortBy.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((investment) => (
              <tr
                key={investment.id}
                className={`status-${investment.status}`}
                role="row"
                onClick={() => onSelectInvestment && onSelectInvestment(investment.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectInvestment && onSelectInvestment(investment.id);
                  }
                }}
                tabIndex="0"
                style={{ cursor: 'pointer' }}
                aria-label={`Investment ${investment.externalInvestmentId || investment.id} - ${investment.status}. Click to view details.`}
              >
                <td className="cell-id" data-label="Investment ID">{investment.externalInvestmentId || investment.id}</td>
                <td className="cell-name" data-label="Owner">{mockOwners.find((o) => o.id === investment.ownerId)?.name || '—'}</td>
                <td className="cell-name" data-label="Bank">{mockBanks.find((b) => b.id === investment.bankId)?.name || '—'}</td>
                <td className="cell-name" data-label="Branch">{mockBanks.find((b) => b.id === investment.bankId)?.branch || '—'}</td>
                <td className="cell-interest-rate" data-label="Interest Rate">{investment.interestRate ? `${investment.interestRate}%` : '—'}</td>
                <td className="cell-principal" data-label="Principal">{formatCurrency(investment.principal)}</td>
                <td className="cell-date" data-label="Start Date">{formatDate(investment.startDate)}</td>
                <td className="cell-date" data-label="Maturity Date">{formatDate(investment.maturityDate)}</td>
                <td className="cell-maturity" data-label="Maturity Amount">{getEffectiveMaturityAmount(investment, mockCashFlows) ? formatCurrency(getEffectiveMaturityAmount(investment, mockCashFlows)) : '—'}</td>
                <td className="cell-status" data-label="Status">
                  <span className={`status-badge status-${investment.status}`} aria-label={`Status: ${investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}`}>
                    {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {mockInvestments.length === 0 && (
        <div className="investments-empty">
          <p>No investments found. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
