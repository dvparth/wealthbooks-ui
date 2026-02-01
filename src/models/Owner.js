import { generateId } from './constants.js';

/**
 * Factory function to create an Owner object
 * @param {Object} data
 * @param {string} data.name - Owner's name
 * @param {string} [data.id] - Optional custom ID, generates UUID if not provided
 * @returns {Object} Owner object
 */
export const createOwner = (data) => {
  return {
    id: data.id || generateId(),
    name: data.name,
  };
};
