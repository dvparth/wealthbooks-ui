import { createBank, exampleIciciBank } from '../models/Bank.js';

/**
 * Mock banks for WealthBooks
 */
export const mockBanks = [
  exampleIciciBank,
  createBank({
    id: '550e8400-e29b-41d4-a716-446655440102',
    name: 'HDFC Bank',
    branch: 'Mumbai - Fort',
  }),
  createBank({
    id: '550e8400-e29b-41d4-a716-446655440103',
    name: 'State Bank of India',
    branch: 'Bangalore - Residency Road',
  }),
  createBank({
    id: '550e8400-e29b-41d4-a716-446655440104',
    name: 'Axis Bank',
    branch: 'Delhi - Connaught Place',
  }),
  createBank({
    id: '550e8400-e29b-41d4-a716-446655440105',
    name: 'Kotak Mahindra Bank',
    branch: 'Chennai - Nungambakkam',
  }),
  // Added banks with simple IDs used by regenerated mocks
  createBank({
    id: 'bank-001',
    name: 'ICICI Bank',
    branch: 'Mumbai - Andheri',
  }),
  createBank({
    id: 'bank-002',
    name: 'HDFC Bank',
    branch: 'Mumbai - Fort',
  }),
  createBank({
    id: 'bank-003',
    name: 'State Bank of India',
    branch: 'Bangalore - Residency Road',
  }),
  createBank({
    id: 'bank-004',
    name: 'Axis Bank',
    branch: 'Delhi - Connaught Place',
  }),
  createBank({
    id: 'bank-005',
    name: 'Kotak Mahindra Bank',
    branch: 'Chennai - Nungambakkam',
  }),
];

/**
 * Helper to find bank by ID
 */
export const findBankById = (id) => {
  return mockBanks.find((bank) => bank.id === id);
};
