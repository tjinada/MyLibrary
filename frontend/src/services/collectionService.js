import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const collectionService = {
  // Get all collections
  getCollections: async (includeBooks = false) => {
    const response = await axios.get(`${API_URL}/collections`, {
      params: { includeBooks }
    });
    return response.data;
  },

  // Get single collection
  getCollection: async (id) => {
    const response = await axios.get(`${API_URL}/collections/${id}`);
    return response.data;
  },

  // Create collection
  createCollection: async (collectionData) => {
    const response = await axios.post(
      `${API_URL}/collections`,
      collectionData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Update collection
  updateCollection: async (id, updates) => {
    const response = await axios.put(
      `${API_URL}/collections/${id}`,
      updates,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Delete collection
  deleteCollection: async (id) => {
    const response = await axios.delete(
      `${API_URL}/collections/${id}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Add book to collection
  addBookToCollection: async (collectionId, bookId) => {
    const response = await axios.post(
      `${API_URL}/collections/${collectionId}/books/${bookId}`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Remove book from collection
  removeBookFromCollection: async (collectionId, bookId) => {
    const response = await axios.delete(
      `${API_URL}/collections/${collectionId}/books/${bookId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Bulk add books to collection
  bulkAddBooks: async (collectionId, bookIds) => {
    const response = await axios.post(
      `${API_URL}/collections/${collectionId}/books`,
      { bookIds },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Reorder books in series
  reorderBooks: async (collectionId, bookOrder) => {
    const response = await axios.put(
      `${API_URL}/collections/${collectionId}/reorder`,
      { bookOrder },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Get collection books
  getCollectionBooks: async (collectionId) => {
    const response = await axios.get(`${API_URL}/collections/${collectionId}/books`);
    return response.data;
  }
};

export default collectionService;
