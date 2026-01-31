import { generateId } from './constants.js';

/**
 * Factory function to create a Bank object
 * @param {Object} data
 * @param {string} data.name - Bank name
 * @param {string} data.branch - Branch name/code
 * @param {string} [data.id] - Optional custom ID, generates UUID if not provided
 * @returns {Object} Bank object
 */
export const createBank = (data) => {
  return {
    id: data.id || generateId(),
    name: data.name,
    branch: data.branch,
  };
};

/**
 * Example: ICICI Bank Bangalore Branch
 */
export const exampleIciciBank = createBank({
  id: '550e8400-e29b-41d4-a716-446655440101',
  name: 'ICICI Bank',
  branch: 'Bangalore - Koramangala',
});
