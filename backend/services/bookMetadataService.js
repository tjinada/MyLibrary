const googleBooksService = require('./googleBooksService');
const openLibraryService = require('./openLibraryService');
const bisacMappingService = require('./bisacMappingService');
const improvedCategoryService = require('./improvedCategoryService');
const multiGenreCategoryService = require('./multiGenreCategoryService');
const coverValidationService = require('./coverValidationService');

class BookMetadataService {
  constructor() {
    // Can be set to false to disable Open Library integration temporarily
    this.useOpenLibrary = process.env.USE_OPEN_LIBRARY !== 'false';
    // Check which categorization system to use
    this.useMultiGenre = process.env.USE_MULTI_GENRE === 'true';
    
    // Log service configuration on startup
    console.log('=== BookMetadataService Configuration ===');
    console.log('USE_OPEN_LIBRARY:', this.useOpenLibrary);
    console.log('USE_BISAC_MAPPING:', process.env.USE_BISAC_MAPPING !== 'false');
    console.log('USE_MULTI_GENRE:', this.useMultiGenre);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    if (this.useMultiGenre) {
      console.log('Categorization Service: MultiGenreCategoryService (multiple genres allowed)');
    } else {
      console.log('Categorization Service:', process.env.USE_BISAC_MAPPING !== 'false' ? 'BISAC' : 'ImprovedCategoryService');
    }
    console.log('=========================================');
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
        // Determine source based on URL pattern
        if (bestCover.url.includes('openlibrary.org')) {
          enhancedBook.coverImageSource = 'openlibrary';
        } else if (bestCover.url.includes('google')) {
          enhancedBook.coverImageSource = 'google';
        } else {
          enhancedBook.coverImageSource = 'other';
        }
        enhancedBook.coverQualityScore = bestCover.score;
        console.log(`Selected best cover for ISBN ${cleanISBN}: ${bestCover.url} (source: ${enhancedBook.coverImageSource}, score: ${bestCover.score})`);
      } else {
        // No valid JPEG cover found
        enhancedBook.coverImage = null;
        enhancedBook.coverImageSource = 'none';
        enhancedBook.coverQualityScore = 0;
        console.log(`No valid JPEG cover found for ISBN ${cleanISBN}`);
      }
      
      // Apply categorization based on configuration
      console.log(`\n=== Categorization Debug for ISBN: ${cleanISBN} ===`);
      console.log('Title:', googleData.title);
      console.log('USE_MULTI_GENRE:', this.useMultiGenre);
      console.log('USE_BISAC_MAPPING:', useBISAC);
      console.log('All Subjects Combined:', allSubjects);
      
      if (this.useMultiGenre) {
        // Use new multi-genre categorization system
        console.log('Using MultiGenreCategoryService...');
        const categorization = multiGenreCategoryService.categorizeBook(
          allSubjects,
          googleData.title,
          googleData.description,
          googleData.authors
        );
        
        enhancedBook.categoryType = categorization.categoryType;
        enhancedBook.genres = categorization.genres;
        enhancedBook.genreReasons = categorization.genreReasons;
        
        // Set primaryCategory for backward compatibility
        // Note: multiGenreCategoryService now guarantees at least one genre
        enhancedBook.primaryCategory = categorization.genres[0] || 'Contemporary Fiction';
        
        console.log('Category Type:', categorization.categoryType);
        console.log('Genres:', categorization.genres);
      } else if (useBISAC) {
        console.log('Using BISAC Mapping Service...');
        // Map to BISAC categories
        const bisacCategories = bisacMappingService.mapToBISAC(allSubjects);
        console.log('BISAC Categories Found:', bisacCategories);
        enhancedBook.bisacCategories = bisacCategories;
        
        // Update genres field with simplified BISAC descriptions
        if (bisacCategories.length > 0) {
          enhancedBook.genres = this.extractSimpleGenres(bisacCategories);
          console.log('Genres from BISAC:', enhancedBook.genres);
        } else {
          // If no BISAC mapping, use improved categorization
          console.log('No BISAC categories found, falling back to ImprovedCategoryService...');
          const category = improvedCategoryService.categorizeBook(
            allSubjects,
            googleData.title,
            googleData.description
          );
          console.log('Category from ImprovedCategoryService:', category);
          enhancedBook.genres = [category];
          enhancedBook.primaryCategory = category;
          enhancedBook.categoryType = improvedCategoryService.getParentCategory(category);
        }
      } else {
        console.log('Using ImprovedCategoryService (BISAC disabled)...');
        // BISAC mapping disabled - use improved category mapping
        const category = improvedCategoryService.categorizeBook(
          allSubjects,
          googleData.title,
          googleData.description
        );
        console.log('Category Result:', category);
        console.log('Category Type:', improvedCategoryService.getParentCategory(category));
        enhancedBook.genres = [category];
        enhancedBook.primaryCategory = category;
        enhancedBook.categoryType = improvedCategoryService.getParentCategory(category);
        enhancedBook.bisacCategories = [];
        
        // Store all raw subjects for reference
        enhancedBook.allSubjects = allSubjects;
      }
      
      console.log('Final Genres:', enhancedBook.genres);
      console.log('Primary Category:', enhancedBook.primaryCategory);
      console.log('Category Type:', enhancedBook.categoryType);
      console.log('=== End Categorization Debug ===\n');
      
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
      // Check which categorization system to use
      const useMultiGenre = process.env.USE_MULTI_GENRE === 'true';
      const useBISAC = !useMultiGenre && process.env.USE_BISAC_MAPPING !== 'false';
      
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
            
            // Validate and find best cover using the improved validation
            const bestCover = await coverValidationService.findBestCover(
              book.isbn,
              book.googleBooksId,
              book.coverImage
            );
            
            if (openLibData) {
              // Combine subjects
              const allSubjects = this.combineSubjects(book, openLibData);
              
              if (useMultiGenre) {
                // Use multi-genre categorization
                const categorization = multiGenreCategoryService.categorizeBook(
                  allSubjects,
                  book.title,
                  book.description,
                  book.authors
                );
                
                enhancedBooks.push({
                  ...book,
                  coverImage: bestCover ? bestCover.url : null,
                  coverQualityScore: bestCover ? bestCover.score : 0,
                  categoryType: categorization.categoryType,
                  genres: categorization.genres,
                  genreReasons: categorization.genreReasons,
                  primaryCategory: categorization.genres[0] || 'Contemporary Fiction',
                  rawSubjects: {
                    google: book.genres || [],
                    openLibrary: openLibData?.subjects || []
                  },
                  dataSource: 'enhanced'
                });
              } else if (useBISAC) {
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
                    : [improvedCategoryService.categorizeBook(allSubjects, book.title, book.description)],
                  primaryCategory: bisacCategories.length > 0
                    ? this.extractSimpleGenres(bisacCategories)[0]
                    : improvedCategoryService.categorizeBook(allSubjects, book.title, book.description),
                  dataSource: 'enhanced'
                });
              } else {
                // BISAC disabled - use improved category mapping
                const category = improvedCategoryService.categorizeBook(
                  allSubjects,
                  book.title,
                  book.description
                );
                enhancedBooks.push({
                  ...book,
                  coverImage: bestCover ? bestCover.url : null,
                  coverQualityScore: bestCover ? bestCover.score : 0,
                  bisacCategories: [],
                  rawSubjects: {
                    google: book.genres || [],
                    openLibrary: openLibData?.subjects || []
                  },
                  genres: [category],
                  primaryCategory: category,
                  categoryType: improvedCategoryService.getParentCategory(category),
                  allSubjects,
                  dataSource: 'enhanced'
                });
              }
            } else {
              // Open Library had no data
              if (useMultiGenre) {
                // Use multi-genre categorization with Google data only
                const categorization = multiGenreCategoryService.categorizeBook(
                  book.genres || [],
                  book.title,
                  book.description,
                  book.authors
                );
                
                enhancedBooks.push({
                  ...book,
                  coverImage: bestCover ? bestCover.url : null,
                  coverQualityScore: bestCover ? bestCover.score : 0,
                  categoryType: categorization.categoryType,
                  genres: categorization.genres,
                  genreReasons: categorization.genreReasons,
                  primaryCategory: categorization.genres[0] || 'Contemporary Fiction'
                });
              } else if (useBISAC) {
                const bisacCategories = bisacMappingService.mapToBISAC(book.genres || []);
                const category = bisacCategories.length > 0
                  ? this.extractSimpleGenres(bisacCategories)[0]
                  : improvedCategoryService.categorizeBook(book.genres || [], book.title, book.description);
                
                enhancedBooks.push({
                  ...book,
                  coverImage: bestCover ? bestCover.url : null,
                  coverQualityScore: bestCover ? bestCover.score : 0,
                  bisacCategories,
                  genres: bisacCategories.length > 0 
                    ? this.extractSimpleGenres(bisacCategories)
                    : [category],
                  primaryCategory: category
                });
              } else {
                // No Open Library data, use improved categorization
                const category = improvedCategoryService.categorizeBook(
                  book.genres || [],
                  book.title,
                  book.description
                );
                enhancedBooks.push({
                  ...book,
                  coverImage: bestCover ? bestCover.url : null,
                  coverQualityScore: bestCover ? bestCover.score : 0,
                  genres: [category],
                  primaryCategory: category,
                  categoryType: improvedCategoryService.getParentCategory(category)
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
            
            if (useMultiGenre) {
              // Use multi-genre categorization with available data
              const categorization = multiGenreCategoryService.categorizeBook(
                book.genres || [],
                book.title,
                book.description,
                book.authors
              );
              
              enhancedBooks.push({
                ...book,
                coverImage: bestCover ? bestCover.url : null,
                coverQualityScore: bestCover ? bestCover.score : 0,
                categoryType: categorization.categoryType,
                genres: categorization.genres,
                genreReasons: categorization.genreReasons,
                primaryCategory: categorization.genres[0] || 'Contemporary Fiction'
              });
            } else if (useBISAC) {
              const bisacCategories = bisacMappingService.mapToBISAC(book.genres || []);
              const category = bisacCategories.length > 0
                ? this.extractSimpleGenres(bisacCategories)[0]
                : improvedCategoryService.categorizeBook(book.genres || [], book.title, book.description);
              
              enhancedBooks.push({
                ...book,
                coverImage: bestCover ? bestCover.url : null,
                coverQualityScore: bestCover ? bestCover.score : 0,
                bisacCategories,
                genres: bisacCategories.length > 0 
                  ? this.extractSimpleGenres(bisacCategories)
                  : [category],
                primaryCategory: category
              });
            } else {
              // Use improved categorization
              const category = improvedCategoryService.categorizeBook(
                book.genres || [],
                book.title,
                book.description
              );
              enhancedBooks.push({
                ...book,
                coverImage: bestCover ? bestCover.url : null,
                coverQualityScore: bestCover ? bestCover.score : 0,
                genres: [category],
                primaryCategory: category,
                categoryType: improvedCategoryService.getParentCategory(category)
              });
            }
          }
        } else {
          // For remaining books that don't go through enhancement
          if (useMultiGenre) {
            // Use multi-genre categorization
            const categorization = multiGenreCategoryService.categorizeBook(
              book.genres || [],
              book.title,
              book.description,
              book.authors
            );
            
            enhancedBooks.push({
              ...book,
              categoryType: categorization.categoryType,
              genres: categorization.genres,
              primaryCategory: categorization.genres[0] || 'Contemporary Fiction'
            });
          } else if (useBISAC) {
            const bisacCategories = bisacMappingService.mapToBISAC(book.genres || []);
            const category = bisacCategories.length > 0
              ? this.extractSimpleGenres(bisacCategories)[0]
              : improvedCategoryService.categorizeBook(book.genres || [], book.title, book.description);
            
            enhancedBooks.push({
              ...book,
              bisacCategories,
              genres: bisacCategories.length > 0 
                ? this.extractSimpleGenres(bisacCategories)
                : [category],
              primaryCategory: category
            });
          } else {
            // Use improved categorization for remaining books
            const category = improvedCategoryService.categorizeBook(
              book.genres || [],
              book.title,
              book.description
            );
            enhancedBooks.push({
              ...book,
              genres: [category],
              primaryCategory: category,
              categoryType: improvedCategoryService.getParentCategory(category)
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
