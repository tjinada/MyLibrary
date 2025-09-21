const axios = require('axios');

class CoverValidationService {
  constructor() {
    // Cache validation results for the session to avoid repeated checks
    this.validationCache = new Map();
    this.cacheTimeout = 1000 * 60 * 60 * 24; // 24 hours for static content like book covers
    this.openLibraryCheckCache = new Map(); // Cache OpenLibrary API checks
  }

  /**
   * Quality scores for different cover sources and sizes
   */
  getQualityScore(url, contentType, contentLength = 0) {
    // Special case: Google Books zoom=0 PNG images with sufficient size are valid
    if ((url.includes('books.google.com') || url.includes('googleapis.com')) && 
        url.includes('zoom=0') && 
        contentType === 'image/png' && 
        contentLength > 9103) {
      return 100; // Highest quality for proper PNG covers
    }
    
    // Otherwise, only JPEG images get a score
    if (contentType !== 'image/jpeg') {
      return 0;
    }

    // Google Books scoring
    if (url.includes('books.google.com') || url.includes('googleapis.com')) {
      if (url.includes('zoom=0')) return 100; // Highest quality
      if (url.includes('zoom=1')) return 70;
      if (url.includes('zoom=2')) return 50;
      if (url.includes('zoom=3')) return 40;
      return 30; // Other zoom levels
    }

    // Open Library scoring (both /b/id/ and /b/isbn/ patterns)
    if (url.includes('openlibrary.org')) {
      if (url.includes('-L.jpg')) return 90; // Large
      if (url.includes('-M.jpg')) return 60; // Medium
      if (url.includes('-S.jpg')) return 30; // Small
      return 25; // Unknown size
    }

    // Unknown source but valid JPEG
    return 20;
  }

  /**
   * Check if OpenLibrary has a cover for this ISBN
   * Returns cover URLs if available, null if not
   */
  async checkOpenLibraryCover(isbn) {
    if (!isbn) return null;
    
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    // Check cache first
    const cached = this.openLibraryCheckCache.get(cleanISBN);
    if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
      return cached.result;
    }

    try {
      console.log(`Checking OpenLibrary API for cover availability: ${cleanISBN}`);
      
      const response = await axios.get(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`,
        { timeout: 5000 }
      );
      
      const bookData = response.data[`ISBN:${cleanISBN}`];
      
      let result = null;
      
      if (bookData && bookData.cover) {
        console.log(`OpenLibrary has cover for ${cleanISBN}`);
        result = {
          large: bookData.cover.large,
          medium: bookData.cover.medium,
          small: bookData.cover.small
        };
      } else if (bookData) {
        console.log(`OpenLibrary has book but no cover for ${cleanISBN}`);
      } else {
        console.log(`Book not found in OpenLibrary: ${cleanISBN}`);
      }
      
      // Cache the result
      this.openLibraryCheckCache.set(cleanISBN, {
        result,
        timestamp: Date.now()
      });
      
      return result;
      
    } catch (error) {
      console.log(`Error checking OpenLibrary API: ${error.message}`);
      
      // Cache the failure too to avoid repeated failed attempts
      this.openLibraryCheckCache.set(cleanISBN, {
        result: null,
        timestamp: Date.now()
      });
      
      return null;
    }
  }

  /**
   * Validate a single cover URL by checking its content-type
   * @param {string} url - Cover image URL
   * @returns {Object} Validation result with score and content-type
   */
  async validateCoverUrl(url) {
    if (!url) {
      return { url, valid: false, score: 0, contentType: null, error: 'No URL provided' };
    }

    // Check cache first
    const cached = this.validationCache.get(url);
    if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
      return cached.result;
    }

    try {
      // Ensure HTTPS
      const secureUrl = url.startsWith('http://') ? url.replace('http://', 'https://') : url;
      
      console.log(`Validating cover: ${secureUrl}`);
      
      // Special handling for OpenLibrary URLs from the API (using /b/id/ pattern)
      // We trust them since the API confirmed they exist
      if (url.includes('covers.openlibrary.org/b/id/')) {
        const sizePattern = /-([LMS])\.jpg$/;
        const match = url.match(sizePattern);
        let score = 25; // Default
        
        if (match) {
          switch(match[1]) {
            case 'L': score = 90; break;
            case 'M': score = 60; break;
            case 'S': score = 30; break;
          }
        }
        
        const result = {
          url: secureUrl,
          valid: true,
          score,
          contentType: 'image/jpeg',
          source: 'openlibrary-api',
          error: null
        };
        
        this.validationCache.set(url, { result, timestamp: Date.now() });
        console.log(`Validation result for ${secureUrl}: valid=true, score=${score}, type=image/jpeg (from API)`);
        return result;
      }
      
      // For all other URLs (Google Books, direct URLs, etc.)
      // Make HEAD request to check content-type without downloading the full image
      const response = await axios.head(secureUrl, {
        timeout: 5000,
        maxRedirects: 3,
        validateStatus: (status) => status === 200 || status === 302 || status === 301
      });

      const contentType = response.headers['content-type'];
      const contentLength = parseInt(response.headers['content-length'] || '0');
      
      // Special handling for Google Books zoom=0 PNG images
      const isGoogleZoom0 = (secureUrl.includes('books.google.com') || secureUrl.includes('googleapis.com')) && 
                           secureUrl.includes('zoom=0');
      const isValidPng = isGoogleZoom0 && 
                        contentType && contentType.includes('image/png') && 
                        contentLength > 9103; // PNG > 9103 bytes indicates a real cover, not placeholder
      
      // Check if it's a valid JPEG
      const isValidJpeg = contentType && (
        contentType.includes('image/jpeg') || 
        contentType.includes('image/jpg')
      );
      
      // Additional validation: reject very small images (likely placeholders)
      const isValidSize = contentLength > 1000; // At least 1KB for JPEGs
      
      // Valid if it's either a good JPEG OR a Google zoom=0 PNG with proper size
      const valid = (isValidJpeg && isValidSize) || isValidPng;
      const score = valid ? this.getQualityScore(secureUrl, contentType, contentLength) : 0;
      
      const result = {
        url: secureUrl,
        valid,
        score,
        contentType,
        contentLength,
        error: null
      };

      // Cache the result
      this.validationCache.set(url, {
        result,
        timestamp: Date.now()
      });

      if (isValidPng) {
        console.log(`Validation result for ${secureUrl}: valid=${valid}, score=${score}, type=${contentType}, size=${contentLength} (Google zoom=0 PNG accepted)`);
      } else {
        console.log(`Validation result for ${secureUrl}: valid=${valid}, score=${score}, type=${contentType}`);
      }
      
      return result;

    } catch (error) {
      const errorMessage = error.response?.status === 404 ? 'Image not found' : error.message;
      
      const result = {
        url,
        valid: false,
        score: 0,
        contentType: null,
        error: errorMessage
      };

      // Cache failed validation too
      this.validationCache.set(url, {
        result,
        timestamp: Date.now()
      });

      console.log(`Validation failed for ${url}: ${errorMessage}`);
      return result;
    }
  }

  /**
   * Generate all possible cover URLs for a book
   * @param {string} isbn - Book ISBN
   * @param {string} googleBooksId - Google Books volume ID
   * @returns {Array} Array of potential cover URLs
   */
  async generateCoverUrls(isbn, googleBooksId) {
    const urls = [];

    // Google Books URLs with different zoom levels (high to low quality)
    if (googleBooksId) {
      // Use consistent parameter order to avoid duplicates
      urls.push(
        `https://books.google.com/books/content?id=${googleBooksId}&printsec=frontcover&img=1&zoom=0&edge=none&source=gbs_api`,
        `https://books.google.com/books/content?id=${googleBooksId}&printsec=frontcover&img=1&zoom=1&edge=none&source=gbs_api`,
        `https://books.google.com/books/content?id=${googleBooksId}&printsec=frontcover&img=1&zoom=2&edge=none&source=gbs_api`
      );
    }

    // Check if OpenLibrary has covers for this ISBN
    if (isbn) {
      const openLibraryCovers = await this.checkOpenLibraryCover(isbn);
      
      if (openLibraryCovers) {
        // Add actual cover URLs from the API (these use /b/id/ pattern and are guaranteed to exist)
        if (openLibraryCovers.large) urls.push(openLibraryCovers.large);
        if (openLibraryCovers.medium) urls.push(openLibraryCovers.medium);
        if (openLibraryCovers.small) urls.push(openLibraryCovers.small);
      }
      // If no covers exist in OpenLibrary, we don't add any OpenLibrary URLs
      // This prevents unnecessary validation attempts for non-existent covers
    }

    // Remove any duplicates and return
    return [...new Set(urls)];
  }

  /**
   * Validate and rank multiple cover URLs
   * @param {Array} urls - Array of cover URLs to validate
   * @returns {Array} Sorted array of validation results (best first)
   */
  async validateAndRankCoverUrls(urls) {
    if (!urls || urls.length === 0) {
      return [];
    }

    // Validate all URLs in parallel with Promise.allSettled
    const validationPromises = urls.map(url => this.validateCoverUrl(url));
    const results = await Promise.allSettled(validationPromises);

    // Extract successful validations
    const validatedCovers = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(cover => cover.valid) // Only keep valid JPEG images
      .sort((a, b) => b.score - a.score); // Sort by score (highest first)

    return validatedCovers;
  }

  /**
   * Find the best available cover for a book
   * @param {string} isbn - Book ISBN
   * @param {string} googleBooksId - Google Books volume ID
   * @param {string} existingCoverUrl - Current cover URL if any
   * @returns {Object} Best cover result or null
   */
  async findBestCover(isbn, googleBooksId, existingCoverUrl = null) {
    console.log(`Finding best cover for ISBN: ${isbn}, Google ID: ${googleBooksId}`);
    
    const urls = [];
    
    // If there's an existing cover URL, validate it first
    if (existingCoverUrl) {
      urls.push(existingCoverUrl);
    }
    
    // Generate all possible URLs (will check OpenLibrary API first)
    const generatedUrls = await this.generateCoverUrls(isbn, googleBooksId);
    urls.push(...generatedUrls);
    
    // Remove duplicates
    const uniqueUrls = [...new Set(urls)];
    
    console.log(`Validating ${uniqueUrls.length} unique cover URLs`);
    
    // Validate and rank all URLs
    const validatedCovers = await this.validateAndRankCoverUrls(uniqueUrls);
    
    if (validatedCovers.length === 0) {
      console.log('No valid JPEG covers found');
      return null;
    }
    
    const bestCover = validatedCovers[0];
    console.log(`Best cover found: ${bestCover.url} (score: ${bestCover.score})`);
    
    return bestCover;
  }

  /**
   * Clear the validation cache
   */
  clearCache() {
    this.validationCache.clear();
    this.openLibraryCheckCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      validationCacheSize: this.validationCache.size,
      openLibraryCacheSize: this.openLibraryCheckCache.size,
      totalCacheSize: this.validationCache.size + this.openLibraryCheckCache.size,
      entries: {
        validation: Array.from(this.validationCache.keys()),
        openLibrary: Array.from(this.openLibraryCheckCache.keys())
      }
    };
  }
}

module.exports = new CoverValidationService();
