import api from './api';

const bookService = {
  // Get all books
  async getBooks(params = {}) {
    const response = await api.get('/books', { params });
    return response.data;
  },

  // Get single book
  async getBook(isbn) {
    const response = await api.get(`/books/${isbn}`);
    return response.data;
  },

  // Add new book
  async addBook(bookData) {
    const response = await api.post('/books', bookData);
    return response.data;
  },

  // Update book
  async updateBook(isbn, updates) {
    const response = await api.put(`/books/${isbn}`, updates);
    return response.data; // Returns the updated book
  },

  // Update book quantity
  async updateQuantity(isbn, quantity) {
    const response = await api.patch(`/books/${isbn}/quantity`, { quantity });
    return response.data;
  },

  // Delete book
  async deleteBook(isbn) {
    const response = await api.delete(`/books/${isbn}`);
    return response.data;
  },

  // Lookup book by ISBN
  async lookupISBN(isbn) {
    const response = await api.post('/scanner/lookup', { isbn });
    return response.data;
  },

  // Search books in library
  async searchLibrary(query, type = 'all') {
    const response = await api.get('/search', { params: { q: query, type } });
    return response.data;
  },

  // Search Google Books
  async searchGoogleBooks(query) {
    const response = await api.get('/search/google', { params: { q: query } });
    return response.data;
  },

  // Get statistics
  async getStats() {
    const response = await api.get('/stats');
    return response.data;
  },

  // Cover Management
  async uploadCover(isbn, imageData, imageUrl = null) {
    const response = await api.post(`/books/${isbn}/cover/upload`, {
      imageData,
      imageUrl
    });
    return response.data;
  },

  async deleteCoverImage(isbn) {
    const response = await api.delete(`/books/${isbn}/cover/custom`);
    return response.data;
  },

  async getAllCovers(isbn) {
    const response = await api.get(`/books/${isbn}/covers`);
    return response.data;
  },

  async selectCover(isbn, coverUrl, source) {
    const response = await api.post(`/books/${isbn}/cover/select`, {
      coverUrl,
      source
    });
    return response.data;
  },

  async searchCovers(isbn, query = null) {
    const response = await api.post(`/books/${isbn}/cover/search`, {
      query
    });
    return response.data;
  },
};

export default bookService;
