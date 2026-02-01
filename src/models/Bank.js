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
