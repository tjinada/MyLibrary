const googleBooksService = require('./googleBooksService');
const openLibraryService = require('./openLibraryService');
const bisacMappingService = require('./bisacMappingService');
const simpleCategoryMappingService = require('./simpleCategoryMappingService');
const coverValidationService = require('./coverValidationService');

class BookMetadataService {
  constructor() {
    // Can be set to false to disable Open Library integration temporarily
    this.useOpenLibrary = process.env.USE_OPEN_LIBRARY !== 'false';
  }
  /**
   * Fetch enhanced book data from multiple sources
   * @param {string} isbn - ISBN to search for
   * @returns {Object} Enhanced book data with BISAC categories
   */
  async fetchEnhancedBookData(isbn) {
    try {
      // Clean ISBN
      const cleanISBN = isbn.replace(/[-\s]/g, '');
      
      console.log(`Fetching enhanced metadata for ISBN: ${cleanISBN}`);
      
      // Check if BISAC mapping is disabled
      const useBISAC = process.env.USE_BISAC_MAPPING !== 'false';
      
      // Fetch from both sources in parallel for speed (if Open Library is enabled)
      let googleResult, openLibResult;
      
      if (this.useOpenLibrary) {
        [googleResult, openLibResult] = await Promise.allSettled([
          googleBooksService.searchByISBN(cleanISBN),
          openLibraryService.searchByISBN(cleanISBN)
        ]);
      } else {
        // Only fetch from Google Books
        googleResult = await googleBooksService.searchByISBN(cleanISBN)
          .then(value => ({ status: 'fulfilled', value }))
          .catch(reason => ({ status: 'rejected', reason }));
        openLibResult = { status: 'rejected', reason: 'Open Library disabled' };
      }
      
      // Extract successful results
      const googleData = googleResult.status === 'fulfilled' ? googleResult.value : null;
      const openLibData = openLibResult.status === 'fulfilled' ? openLibResult.value : null;
      
      // Google Books is our primary source
      if (!googleData) {
        throw new Error('Book not found in Google Books');
      }
      
      // Combine all subject/genre data
      const allSubjects = this.combineSubjects(googleData, openLibData);
      
      // Build enhanced book data
      const enhancedBook = {
        ...googleData,
        rawSubjects: {
          google: googleData.genres || [],
          openLibrary: openLibData?.subjects || []
        }
      };
      
      // Find and validate the best cover image
      const bestCover = await coverValidationService.findBestCover(
        cleanISBN,
        googleData.googleBooksId,
        googleData.coverImage
      );
      
      if (bestCover) {
        enhancedBook.coverImage = bestCover.url;
        enhancedBook.coverImageSource = bestCover.url.includes('openlibrary') ? 'openlibrary' : 'google';
        enhancedBook.coverQualityScore = bestCover.score;
        console.log(`Selected best cover for ISBN ${cleanISBN}: ${bestCover.url} (score: ${bestCover.score})`);
      } else {
        // No valid JPEG cover found
        enhancedBook.coverImage = null;
        enhancedBook.coverImageSource = 'none';
        enhancedBook.coverQualityScore = 0;
        console.log(`No valid JPEG cover found for ISBN ${cleanISBN}`);
      }
      
      // Apply BISAC mapping if enabled
      if (useBISAC) {
        // Map to BISAC categories
        const bisacCategories = bisacMappingService.mapToBISAC(allSubjects);
        enhancedBook.bisacCategories = bisacCategories;
        
        // Update genres field with simplified BISAC descriptions
        if (bisacCategories.length > 0) {
          enhancedBook.genres = this.extractSimpleGenres(bisacCategories);
        } else {
          // If no BISAC mapping, use all combined subjects as genres
          enhancedBook.genres = allSubjects;
        }
      } else {
        // BISAC mapping disabled - use simple category mapping
        const simpleCategories = simpleCategoryMappingService.mapToSimpleCategories(allSubjects);
        enhancedBook.genres = simpleCategories.length > 0 ? simpleCategories : ['General Fiction'];
        enhancedBook.bisacCategories = [];
        
        // Store all raw subjects for reference
        enhancedBook.allSubjects = allSubjects;
      }
      
      // Add metadata sources tracking
      enhancedBook.metadataSources = [
        { source: 'google', fetchedAt: new Date() }
      ];
      
      if (openLibData) {
        enhancedBook.metadataSources.push({
          source: 'openlibrary',
          fetchedAt: new Date()
        });
      }
      
      console.log(`Successfully fetched enhanced metadata for ISBN: ${cleanISBN}`);
      return enhancedBook;
      
    } catch (error) {
      console.error('Error fetching enhanced book data:', error);
      throw error;
    }
  }
  
  /**
   * Search for books with enhanced metadata
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results
   * @returns {Array} Array of enhanced books
   */
  async searchBooksWithEnhancedMetadata(query, maxResults = 20) {
    try {
      // Check if BISAC mapping is disabled
      const useBISAC = process.env.USE_BISAC_MAPPING !== 'false';
      
      // First search Google Books
      const googleBooks = await googleBooksService.searchBooks(query, maxResults);
      
      if (!googleBooks || googleBooks.length === 0) {
        return [];
      }
      
      // For search results, only enhance the first 3 books to avoid rate limiting
      // Users can get enhanced data when they select a specific book
      const enhancedBooks = [];
      const limit = Math.min(3, googleBooks.length); // Reduced from 5 to 3
      
      for (let i = 0; i < googleBooks.length; i++) {
        const book = googleBooks[i];
        
        // Only enhance first few books and those with ISBNs
        if (i < limit && book.isbn) {
          try {
            // Try to get Open Library data
            const openLibData = await openLibraryService.searchByISBN(book.isbn);
            
            // Validate and find best cover
            const bestCover = await coverValidationService.findBestCover(
              book.isbn,
              book.googleBooksId,
              book.coverImage
            );
            
            if (openLibData) {
              // Combine subjects
              const allSubjects = this.combineSubjects(book, openLibData);
              
              if (useBISAC) {
                // Map to BISAC if enabled
                const bisacCategories = bisacMappingService.mapToBISAC(allSubjects);
                
                enhancedBooks.push({
                  ...book,
                  coverImage: bestCover ? bestCover.url : null,
                  coverQualityScore: bestCover ? bestCover.score : 0,
                  bisacCategories,
                  rawSubjects: {
                    google: book.genres || [],
                    openLibrary: openLibData?.subjects || []
                  },
                  genres: bisacCategories.length > 0 
                    ? this.extractSimpleGenres(bisacCategories)
                    : allSubjects,
                  dataSource: 'enhanced'
                });
              } else {
                // BISAC disabled - use simple category mapping
                const simpleCategories = simpleCategoryMappingService.mapToSimpleCategories(allSubjects);
                enhancedBooks.push({
                  ...book,
                  coverImage: bestCover ? bestCover.url : null,
                  coverQualityScore: bestCover ? bestCover.score : 0,
                  bisacCategories: [],
                  rawSubjects: {
                    google: book.genres || [],
                    openLibrary: openLibData?.subjects || []
                  },
                  genres: simpleCategories.length > 0 ? simpleCategories : ['General Fiction'],
                  allSubjects,
                  dataSource: 'enhanced'
                });
              }
            } else {
              // Open Library had no data
              if (useBISAC) {
                const bisacCategories = bisacMappingService.mapToBISAC(book.genres || []);
                enhancedBooks.push({
                  ...book,
                  coverImage: bestCover ? bestCover.url : null,
                  coverQualityScore: bestCover ? bestCover.score : 0,
                  bisacCategories,
                  genres: bisacCategories.length > 0 
                    ? this.extractSimpleGenres(bisacCategories)
                    : book.genres
                });
              } else {
                // No Open Library data, just use Google genres with simple mapping
                const simpleCategories = simpleCategoryMappingService.mapToSimpleCategories(book.genres || []);
                enhancedBooks.push({
                  ...book,
                  coverImage: bestCover ? bestCover.url : null,
                  coverQualityScore: bestCover ? bestCover.score : 0,
                  genres: simpleCategories.length > 0 ? simpleCategories : ['General Fiction']
                });
              }
            }
          } catch (err) {
            // If enhancement fails, still try to validate the cover
            console.log(`Failed to enhance book ${book.isbn}:`, err.message);
            
            let bestCover = null;
            try {
              bestCover = await coverValidationService.findBestCover(
                book.isbn,
                book.googleBooksId,
                book.coverImage
              );
            } catch (coverErr) {
              console.log(`Cover validation also failed: ${coverErr.message}`);
            }
            
            if (useBISAC) {
              const bisacCategories = bisacMappingService.mapToBISAC(book.genres || []);
              enhancedBooks.push({
                ...book,
                coverImage: bestCover ? bestCover.url : null,
                coverQualityScore: bestCover ? bestCover.score : 0,
                bisacCategories,
                genres: bisacCategories.length > 0 
                  ? this.extractSimpleGenres(bisacCategories)
                  : book.genres
              });
            } else {
              // Just use Google genres with simple mapping
              const simpleCategories = simpleCategoryMappingService.mapToSimpleCategories(book.genres || []);
              enhancedBooks.push({
                ...book,
                coverImage: bestCover ? bestCover.url : null,
                coverQualityScore: bestCover ? bestCover.score : 0,
                genres: simpleCategories.length > 0 ? simpleCategories : ['General Fiction']
              });
            }
          }
        } else {
          // For remaining books
          if (useBISAC) {
            const bisacCategories = bisacMappingService.mapToBISAC(book.genres || []);
            enhancedBooks.push({
              ...book,
              bisacCategories,
              genres: bisacCategories.length > 0 
                ? this.extractSimpleGenres(bisacCategories)
                : book.genres
            });
          } else {
            // Simple mapping for remaining books
            const simpleCategories = simpleCategoryMappingService.mapToSimpleCategories(book.genres || []);
            enhancedBooks.push({
              ...book,
              genres: simpleCategories.length > 0 ? simpleCategories : ['General Fiction']
            });
          }
        }
      }
      
      return enhancedBooks;
      
    } catch (error) {
      console.error('Error searching books with enhanced metadata:', error);
      throw error;
    }
  }
  
  /**
   * Combine subjects from multiple sources
   * @private
   */
  combineSubjects(googleData, openLibData) {
    const subjects = [];
    
    // Add Google categories
    if (googleData?.genres && Array.isArray(googleData.genres)) {
      subjects.push(...googleData.genres);
    }
    
    // Add Open Library subjects
    if (openLibData?.subjects && Array.isArray(openLibData.subjects)) {
      subjects.push(...openLibData.subjects);
    }
    
    // Add Open Library subject places (can be useful for historical fiction)
    if (openLibData?.subject_places && Array.isArray(openLibData.subject_places)) {
      subjects.push(...openLibData.subject_places.map(place => `${place} (setting)`));
    }
    
    // Remove duplicates and clean up
    const uniqueSubjects = [...new Set(subjects)]
      .filter(s => s && s.length > 0)
      .map(s => s.trim());
    
    return uniqueSubjects;
  }
  
  /**
   * Extract simple genre names from BISAC categories
   * @private
   */
  extractSimpleGenres(bisacCategories) {
    return bisacCategories.map(cat => {
      // Get the last part of the BISAC description (most specific)
      const parts = cat.description.split(' / ');
      return parts[parts.length - 1];
    }).filter((genre, index, self) => {
      // Remove duplicates but keep order
      return self.indexOf(genre) === index;
    });
  }
}

module.exports = new BookMetadataService();
