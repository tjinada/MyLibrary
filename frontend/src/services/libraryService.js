import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const libraryService = {
  // Get unified library view
  getUnifiedLibrary: async (params = {}) => {
    const response = await axios.get(`${API_URL}/library/unified`, {
      params: {
        page: params.page || 1,
        limit: params.limit || 24,
        search: params.search || '',
        status: params.status || 'all',
        genre: params.genre || 'all',
        sort: params.sort || 'title',
        includeCollections: params.includeCollections !== false,
        expandCollections: params.expandCollections || false,
        viewMode: params.viewMode || 'unified'
      }
    });
    return response.data;
  },

  // Get library stats
  getLibraryStats: async () => {
    const response = await axios.get(`${API_URL}/library/stats`);
    return response.data;
  }
};

export default libraryService;
