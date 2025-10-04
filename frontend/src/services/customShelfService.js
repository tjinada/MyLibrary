import api from './api';

const customShelfService = {
  /**
   * Get all shelves for the current user
   */
  async getShelves() {
    const response = await api.get('/custom-shelves');
    return response.data;
  },

  /**
   * Create a new custom shelf
   * @param {Object} shelfData - Shelf data including name and filters
   * @param {string} shelfData.name - Unique shelf name
   * @param {Object} shelfData.filters - Filter configuration
   */
  async createShelf(shelfData) {
    const response = await api.post('/custom-shelves', shelfData);
    return response.data;
  },

  /**
   * Update an existing shelf
   * @param {string} shelfId - Shelf ID
   * @param {Object} shelfData - Updated shelf data
   */
  async updateShelf(shelfId, shelfData) {
    const response = await api.put(`/custom-shelves/${shelfId}`, shelfData);
    return response.data;
  },

  /**
   * Delete a shelf
   * @param {string} shelfId - Shelf ID
   */
  async deleteShelf(shelfId) {
    const response = await api.delete(`/custom-shelves/${shelfId}`);
    return response.data;
  },

  /**
   * Reorder shelves
   * @param {Array<string>} shelfIds - Array of shelf IDs in desired order
   */
  async reorderShelves(shelfIds) {
    const response = await api.put('/custom-shelves/reorder', { shelfIds });
    return response.data;
  }
};

export default customShelfService;
