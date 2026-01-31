import { createOwner, exampleOwnerAjay } from '../models/Owner.js';

/**
 * Mock owners for WealthBooks
 */
export const mockOwners = [
  exampleOwnerAjay,
  createOwner({
    id: '550e8400-e29b-41d4-a716-446655440202',
    name: 'Priya Sharma',
  }),
  createOwner({
    id: '550e8400-e29b-41d4-a716-446655440203',
    name: 'Rajesh Patel',
  }),
  createOwner({
    id: '550e8400-e29b-41d4-a716-446655440204',
    name: 'Meera Desai',
  }),
  // Added owners with simple IDs used by regenerated mocks
  createOwner({
    id: 'owner-001',
    name: 'Owner One',
  }),
  createOwner({
    id: 'owner-002',
    name: 'Owner Two',
  }),
  createOwner({
    id: 'owner-003',
    name: 'Owner Three',
  }),
  createOwner({
    id: 'owner-004',
    name: 'Owner Four',
  }),
];

/**
 * Helper to find owner by ID
 */
export const findOwnerById = (id) => {
  return mockOwners.find((owner) => owner.id === id);
};
