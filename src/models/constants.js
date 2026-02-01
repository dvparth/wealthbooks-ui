/**
 * Constants and utilities for WealthBooks data models
 */

/**
 * Generate a UUID v4-style string (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
 * Note: This is a simple implementation for demo purposes, not cryptographically random
 */
export const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Investment type codes
 */
export const INVESTMENT_TYPE_CODES = {
  FD: 'FD',
  SCSS: 'SCSS',
  NSC: 'NSC',
  BOND_54EC: '54EC',
};

/**
 * Interest frequency options
 */
export const INTEREST_FREQUENCIES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  HALF_YEARLY: 'half-yearly',
  YEARLY: 'yearly',
  MATURITY: 'maturity',
};

/**
 * Investment status
 */
export const INVESTMENT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  CLOSED: 'closed',
};

/**
 * Cash flow types
 */
export const CASHFLOW_TYPES = {
  PRINCIPAL: 'principal',
  INTEREST_PAYOUT: 'interest_payout',
  ACCRUED_INTEREST: 'accrued_interest',
  MATURITY_PAYOUT: 'maturity_payout',
  TDS_DEDUCTION: 'tds_deduction',
  // Legacy types (for backwards compatibility)
  INTEREST: 'interest',
  TDS: 'tds',
  MATURITY: 'maturity',
  REINVESTMENT: 'reinvestment',
  ADJUSTMENT: 'adjustment',
  UNALLOCATED: 'unallocated',
  CLOSURE: 'closure',
};

/**
 * Cash flow status
 */
export const CASHFLOW_STATUS = {
  PLANNED: 'planned',
  CONFIRMED: 'confirmed',
  ADJUSTED: 'adjusted',
};

/**
 * Cash flow source
 */
export const CASHFLOW_SOURCE = {
  SYSTEM: 'system',
  MANUAL: 'manual',
};
