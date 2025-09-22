const axios = require('axios');

class CoverSearchService {
  constructor() {
    // Google Custom Search API credentials
    // You'll need to set these in your .env file
    this.apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    this.searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
    
    // Alternative: Use SerpAPI or similar service
    this.serpApiKey = process.env.SERP_API_KEY;
  }

  /**
   * Search for book covers using Google Custom Search API
   * @param {String} query - Search query (usually "book title author cover")
   * @param {Number} limit - Number of results to return
   * @returns {Promise<Array>} Array of image results
   */
  async searchGoogleImages(query, limit = 6) {
    if (!this.apiKey || !this.searchEngineId) {
      console.warn('Google Custom Search API credentials not configured');
      return this.searchAlternativeSource(query, limit);
    }

    try {
      const searchQuery = `${query} book cover high quality`;
      const url = 'https://www.googleapis.com/customsearch/v1';
      
      const response = await axios.get(url, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: searchQuery,
          searchType: 'image',
          num: limit,
          imgType: 'photo',
          imgSize: 'medium',
          safe: 'active'
        },
        timeout: 10000
      });

      if (response.data && response.data.items) {
        return response.data.items.map(item => ({
          url: item.link,
          thumbnail: item.image.thumbnailLink,
          title: item.title,
          source: item.displayLink,
          width: item.image.width,
          height: item.image.height,
          contextLink: item.image.contextLink
        }));
      }

      return [];
    } catch (error) {
      console.error('Error searching Google Images:', error.message);
      // Fallback to alternative source
      return this.searchAlternativeSource(query, limit);
    }
  }

  /**
   * Alternative search using free sources or web scraping
   * This is a fallback when Google API is not available
   * @param {String} query - Search query
   * @param {Number} limit - Number of results
   * @returns {Promise<Array>} Array of image results
   */
  async searchAlternativeSource(query, limit = 6) {
    const results = [];
    
    try {
      // Search multiple sources for book covers
      const promises = [];
      
      // 1. Google Books API (already implemented)
      promises.push(this.searchGoogleBooks(query));
      
      // 2. Open Library Covers
      promises.push(this.searchOpenLibrary(query));
      
      // 3. Additional sources can be added here
      
      const allResults = await Promise.allSettled(promises);
      
      allResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(...result.value);
        }
      });
      
      // Remove duplicates and limit results
      const uniqueResults = this.removeDuplicates(results);
      return uniqueResults.slice(0, limit);
    } catch (error) {
      console.error('Error in alternative cover search:', error);
      return results;
    }
  }

  /**
   * Search Google Books for covers
   * @param {String} query - Search query
   * @returns {Promise<Array>} Array of cover images
   */
  async searchGoogleBooks(query) {
    try {
      const url = 'https://www.googleapis.com/books/v1/volumes';
      const response = await axios.get(url, {
        params: {
          q: query,
          maxResults: 10,
          orderBy: 'relevance'
        },
        timeout: 5000
      });

      const results = [];
      if (response.data && response.data.items) {
        response.data.items.forEach(item => {
          if (item.volumeInfo && item.volumeInfo.imageLinks) {
            const imageLinks = item.volumeInfo.imageLinks;
            
            // Get the highest quality available
            const imageUrl = imageLinks.extraLarge || 
                           imageLinks.large || 
                           imageLinks.medium || 
                           imageLinks.thumbnail;
            
            if (imageUrl) {
              results.push({
                url: imageUrl.replace('http://', 'https://'),
                thumbnail: (imageLinks.smallThumbnail || imageLinks.thumbnail || imageUrl).replace('http://', 'https://'),
                title: item.volumeInfo.title,
                source: 'Google Books',
                width: null,
                height: null,
                contextLink: `https://books.google.com/books?id=${item.id}`
              });
            }
          }
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error searching Google Books:', error.message);
      return [];
    }
  }

  /**
   * Search Open Library for covers
   * @param {String} query - Search query (title and author)
   * @returns {Promise<Array>} Array of cover images
   */
  async searchOpenLibrary(query) {
    try {
      // Search for the book first
      const searchUrl = 'https://openlibrary.org/search.json';
      const response = await axios.get(searchUrl, {
        params: {
          q: query,
          limit: 10,
          fields: 'key,title,author_name,isbn,cover_i,first_publish_year'
        },
        timeout: 5000
      });

      const results = [];
      if (response.data && response.data.docs) {
        response.data.docs.forEach(doc => {
          if (doc.cover_i) {
            const coverId = doc.cover_i;
            results.push({
              url: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
              thumbnail: `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
              title: doc.title,
              source: 'Open Library',
              width: null,
              height: null,
              contextLink: `https://openlibrary.org${doc.key}`
            });
          } else if (doc.isbn && doc.isbn.length > 0) {
            // Try ISBN-based cover
            const isbn = doc.isbn[0];
            results.push({
              url: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
              thumbnail: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
              title: doc.title,
              source: 'Open Library',
              width: null,
              height: null,
              contextLink: `https://openlibrary.org${doc.key}`
            });
          }
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error searching Open Library:', error.message);
      return [];
    }
  }

  /**
   * Generate Google Images search URL
   * @param {String} query - Search query (book title, author, etc.)
   * @param {String} isbn - ISBN (optional)
   * @returns {String} Google Images search URL
   */
  generateGoogleImageSearchUrl(query, isbn = null) {
    let searchQuery = '';
    
    if (isbn) {
      // If ISBN provided, use it as primary search term
      searchQuery = `${isbn}+book+cover`;
    } else if (query) {
      // Otherwise use the provided query
      searchQuery = `${query.replace(/\s+/g, '+')}+book+cover`;
    }
    
    // The &udm=2 parameter forces Google to show image results
    return `https://www.google.com/search?q=${searchQuery}&udm=2`;
  }

  /**
   * Search for covers by ISBN
   * @param {String} isbn - Book ISBN
   * @returns {Promise<Array>} Array of cover options
   */
  async searchByISBN(isbn) {
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    const results = [];

    // 1. Google Books by ISBN
    try {
      const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`;
      const googleResponse = await axios.get(googleUrl, { timeout: 5000 });
      
      if (googleResponse.data.items && googleResponse.data.items[0]) {
        const item = googleResponse.data.items[0];
        if (item.volumeInfo && item.volumeInfo.imageLinks) {
          const imageLinks = item.volumeInfo.imageLinks;
          results.push({
            url: (imageLinks.large || imageLinks.medium || imageLinks.thumbnail).replace('http://', 'https://'),
            thumbnail: (imageLinks.thumbnail || imageLinks.smallThumbnail).replace('http://', 'https://'),
            title: item.volumeInfo.title,
            source: 'Google Books',
            quality: 'high'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching Google Books cover:', error.message);
    }

    // 2. Open Library by ISBN
    results.push({
      url: `https://covers.openlibrary.org/b/isbn/${cleanISBN}-L.jpg`,
      thumbnail: `https://covers.openlibrary.org/b/isbn/${cleanISBN}-M.jpg`,
      title: 'Open Library Cover',
      source: 'Open Library',
      quality: 'medium'
    });

    // 3. Additional sources can be added here

    return results;
  }

  /**
   * Remove duplicate images based on URL
   * @param {Array} results - Array of image results
   * @returns {Array} Deduplicated array
   */
  removeDuplicates(results) {
    const seen = new Set();
    return results.filter(item => {
      const key = item.url.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Validate if an image URL is accessible
   * @param {String} imageUrl - URL to validate
   * @returns {Promise<Boolean>} True if accessible
   */
  async validateImageUrl(imageUrl) {
    try {
      const response = await axios.head(imageUrl, {
        timeout: 5000,
        validateStatus: status => status === 200
      });
      
      const contentType = response.headers['content-type'];
      return contentType && contentType.startsWith('image/');
    } catch (error) {
      return false;
    }
  }
}

module.exports = new CoverSearchService();
