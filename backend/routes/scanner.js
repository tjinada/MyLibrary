const express = require('express');
const router = express.Router();
const googleBooksService = require('../services/googleBooksService');
const bookMetadataService = require('../services/bookMetadataService');
const openLibraryService = require('../services/openLibraryService');
const bisacMappingService = require('../services/bisacMappingService');
const simpleCategoryMappingService = require('../services/simpleCategoryMappingService');
const auth = require('../middleware/auth');

// Lookup book by ISBN
router.post('/lookup', auth, async (req, res) => {
  try {
    const { isbn } = req.body;

    if (!isbn) {
      return res.status(400).json({ message: 'ISBN is required' });
    }

    // Clean ISBN
    const cleanISBN = isbn.replace(/[-\s]/g, '');

    // Validate ISBN format (basic check)
    if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
      return res.status(400).json({ message: 'Invalid ISBN format' });
    }

    // Fetch enhanced book data from multiple sources
    let bookData;
    try {
      // Try to get enhanced metadata (Google + Open Library + BISAC mapping)
      bookData = await bookMetadataService.fetchEnhancedBookData(cleanISBN);
      
      // Mark as enhanced data source
      if (bookData) {
        bookData.dataSource = 'enhanced';
      }
    } catch (enhancedError) {
      console.log('Enhanced metadata fetch failed, falling back to Google Books only:', enhancedError.message);
      
      // Fallback to Google Books only
      bookData = await googleBooksService.searchByISBN(cleanISBN);
    }

    if (!bookData) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Ensure ISBN is set (use the scanned one if not found)
    if (!bookData.isbn) {
      bookData.isbn = cleanISBN;
    }

    res.json(bookData);
  } catch (error) {
    console.error('Scanner lookup error:', error);
    res.status(500).json({ message: 'Failed to lookup book' });
  }
});

// Batch lookup multiple ISBNs
router.post('/batch-lookup', auth, async (req, res) => {
  try {
    const { isbns } = req.body;

    if (!Array.isArray(isbns) || isbns.length === 0) {
      return res.status(400).json({ message: 'ISBNs array is required' });
    }
    
    // Check if BISAC mapping is disabled
    const useBISAC = process.env.USE_BISAC_MAPPING !== 'false';

    const results = [];
    const errors = [];

    // First, try to get all books from Google Books
    const googlePromises = isbns.map(isbn => 
      googleBooksService.searchByISBN(isbn)
        .then(data => ({ isbn, data, source: 'google' }))
        .catch(error => ({ isbn, error, source: 'google' }))
    );
    
    const googleResults = await Promise.all(googlePromises);
    
    // Then try to get Open Library data in batch (much more efficient)
    let openLibraryData = {};
    try {
      const validIsbns = isbns.filter(isbn => isbn && isbn.length >= 10);
      if (validIsbns.length > 0 && process.env.USE_OPEN_LIBRARY !== 'false') {
        openLibraryData = await openLibraryService.searchByISBNBatch(validIsbns);
      }
    } catch (olError) {
      console.log('Open Library batch fetch failed:', olError.message);
    }
    
    // Combine results
    for (let i = 0; i < isbns.length; i++) {
      const isbn = isbns[i];
      const cleanISBN = isbn.replace(/[-\s]/g, '');
      const googleResult = googleResults[i];
      
      if (googleResult.error) {
        errors.push({ isbn, error: 'Not found' });
        continue;
      }
      
      let bookData = googleResult.data;
      
      if (!bookData) {
        errors.push({ isbn, error: 'Not found' });
        continue;
      }
      
      // Enhance with Open Library data if available
      const olData = openLibraryData[cleanISBN];
      if (olData) {
        // Combine subjects
        const allSubjects = [
          ...(bookData.genres || []),
          ...(olData.subjects || [])
        ];
        
        if (useBISAC) {
          // Map to BISAC if enabled
          const bisacCategories = bisacMappingService.mapToBISAC(allSubjects);
          
          bookData = {
            ...bookData,
            bisacCategories,
            rawSubjects: {
              google: bookData.genres || [],
              openLibrary: olData.subjects || []
            },
            genres: bisacCategories.length > 0 
              ? bisacCategories.map(cat => {
                  const parts = cat.description.split(' / ');
                  return parts[parts.length - 1];
                }).filter((genre, index, self) => self.indexOf(genre) === index)
              : allSubjects,
            dataSource: 'enhanced',
            metadataSources: [
              { source: 'google', fetchedAt: new Date() },
              { source: 'openlibrary', fetchedAt: new Date() }
            ]
          };
        } else {
          // BISAC disabled - use simple category mapping
          const simpleCategories = simpleCategoryMappingService.mapToSimpleCategories(allSubjects);
          bookData = {
            ...bookData,
            bisacCategories: [],
            rawSubjects: {
              google: bookData.genres || [],
              openLibrary: olData.subjects || []
            },
            genres: simpleCategories.length > 0 ? simpleCategories : ['General Fiction'],
            allSubjects,
            dataSource: 'enhanced',
            metadataSources: [
              { source: 'google', fetchedAt: new Date() },
              { source: 'openlibrary', fetchedAt: new Date() }
            ]
          };
        }
      } else if (useBISAC) {
        // Just apply BISAC mapping to Google genres if enabled
        const bisacCategories = bisacMappingService.mapToBISAC(bookData.genres || []);
        bookData = {
          ...bookData,
          bisacCategories,
          genres: bisacCategories.length > 0 
            ? bisacCategories.map(cat => {
                const parts = cat.description.split(' / ');
                return parts[parts.length - 1];
              }).filter((genre, index, self) => self.indexOf(genre) === index)
            : bookData.genres
        };
      } else {
        // No Open Library data, use simple category mapping on Google genres
        const simpleCategories = simpleCategoryMappingService.mapToSimpleCategories(bookData.genres || []);
        bookData = {
          ...bookData,
          genres: simpleCategories.length > 0 ? simpleCategories : ['General Fiction']
        };
      }
      
      // Ensure ISBN is set
      if (!bookData.isbn) {
        bookData.isbn = cleanISBN;
      }
      
      results.push(bookData);
    }

    res.json({ results, errors });
  } catch (error) {
    console.error('Batch lookup error:', error);
    res.status(500).json({ message: 'Failed to batch lookup books' });
  }
});

module.exports = router;
