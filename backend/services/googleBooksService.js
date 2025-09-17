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
   * Get high-resolution cover image URL
   * @param {Object} imageLinks - Google Books imageLinks object
   * @param {string} bookId - Google Books volume ID for fallback
   * @returns {string} Best available cover image URL
   */
  getHighResCoverImage(imageLinks, bookId = null) {
    if (!imageLinks) return null;

    // Try to get the highest quality image available
    let coverImage = imageLinks.extraLarge || 
                    imageLinks.large || 
                    imageLinks.medium || 
                    imageLinks.small || 
                    imageLinks.thumbnail;
    
    if (!coverImage) return null;

    // Ensure HTTPS
    if (coverImage.startsWith('http://')) {
      coverImage = coverImage.replace('http://', 'https://');
    }

    // Google Books API hack: modify the URL parameters to get higher resolution
    // Remove any zoom parameter and add zoom=0 for full resolution
    if (coverImage.includes('zoom=')) {
      coverImage = coverImage.replace(/zoom=\d+/, 'zoom=0');
    } else if (coverImage.includes('?')) {
      coverImage += '&zoom=0';
    } else {
      coverImage += '?zoom=0';
    }

    // Remove any edge curl effect
    if (coverImage.includes('edge=')) {
      coverImage = coverImage.replace(/edge=\w+/, 'edge=none');
    } else {
      coverImage += '&edge=none';
    }

    // If we have a Google Books ID, we can also try the direct cover API
    // This sometimes provides better quality images
    if (bookId && !coverImage.includes('/books/content')) {
      // Alternative high-res URL format
      const alternativeUrl = `https://books.google.com/books/content?id=${bookId}&printsec=frontcover&img=1&zoom=0&source=gbs_api`;
      
      // For thumbnail URLs, replace with the higher quality alternative
      if (imageLinks.thumbnail && !imageLinks.large && !imageLinks.extraLarge) {
        return alternativeUrl;
      }
    }

    return coverImage;
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

    // Get high-resolution cover image
    const coverImage = this.getHighResCoverImage(info.imageLinks, bookData.id);

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
