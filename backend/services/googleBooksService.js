const axios = require('axios');

class GoogleBooksService {
  constructor() {
    this.baseURL = 'https://www.googleapis.com/books/v1';
    this.apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  }

  /**
   * Search for a book by ISBN
   * @param {string} isbn - ISBN-10 or ISBN-13
   * @returns {Object} Book data or null
   */
  async searchByISBN(isbn) {
    try {
      // Clean ISBN (remove dashes and spaces)
      const cleanISBN = isbn.replace(/[-\s]/g, '');
      
      const response = await axios.get(`${this.baseURL}/volumes`, {
        params: {
          q: `isbn:${cleanISBN}`,
          key: this.apiKey
        }
      });

      if (!response.data.items || response.data.items.length === 0) {
        return null;
      }

      return this.formatBookData(response.data.items[0]);
    } catch (error) {
      console.error('Google Books API error:', error.message);
      throw new Error('Failed to fetch book from Google Books');
    }
  }

  /**
   * Search books by query
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results
   * @returns {Array} Array of books
   */
  async searchBooks(query, maxResults = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/volumes`, {
        params: {
          q: query,
          maxResults: maxResults,
          orderBy: 'relevance',
          printType: 'books',
          key: this.apiKey
        }
      });

      if (!response.data.items) {
        return [];
      }

      return response.data.items.map(item => this.formatBookData(item));
    } catch (error) {
      console.error('Google Books API error:', error.message);
      throw new Error('Failed to search books');
    }
  }

  /**
   * Format Google Books API response to our schema
   * @param {Object} bookData - Raw Google Books data
   * @returns {Object} Formatted book data
   */
  formatBookData(bookData) {
    const info = bookData.volumeInfo || {};
    
    // Extract ISBN
    let isbn = null;
    if (info.industryIdentifiers) {
      const isbn13 = info.industryIdentifiers.find(id => id.type === 'ISBN_13');
      const isbn10 = info.industryIdentifiers.find(id => id.type === 'ISBN_10');
      isbn = isbn13 ? isbn13.identifier : (isbn10 ? isbn10.identifier : null);
    }

    // Get best quality cover image
    let coverImage = null;
    if (info.imageLinks) {
      coverImage = info.imageLinks.extraLarge || 
                  info.imageLinks.large || 
                  info.imageLinks.medium || 
                  info.imageLinks.small || 
                  info.imageLinks.thumbnail;
      
      // Ensure HTTPS
      if (coverImage && coverImage.startsWith('http://')) {
        coverImage = coverImage.replace('http://', 'https://');
      }
    }

    return {
      isbn: isbn,
      title: info.title || 'Unknown Title',
      authors: info.authors || ['Unknown Author'],
      publisher: info.publisher || '',
      publishedDate: info.publishedDate || '',
      description: info.description || '',
      pageCount: info.pageCount || 0,
      genres: info.categories || [],
      language: info.language || 'en',
      coverImage: coverImage,
      googleBooksId: bookData.id,
      dataSource: 'google'
    };
  }
}

module.exports = new GoogleBooksService();
