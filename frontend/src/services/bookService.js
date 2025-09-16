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
};

export default bookService;
