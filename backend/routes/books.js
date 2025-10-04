const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const bookMetadataService = require('../services/bookMetadataService');
const coverValidationService = require('../services/coverValidationService');
const imageProcessingService = require('../services/imageProcessingService');
const coverSearchService = require('../services/coverSearchService');
const { body, validationResult } = require('express-validator');

// ==================== DEBUG MIDDLEWARE ====================
router.use((req, res, next) => {
  console.log('\n=== BOOKS ROUTER REQUEST ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Original URL:', req.originalUrl);
  console.log('Base URL:', req.baseUrl);
  console.log('Params:', req.params);
  console.log('===========================\n');
  next();
});

// ==================== ROOT ROUTES ====================

// Get all books with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      genre,
      excludeGenres,
      author,
      sort = '-addedDate'
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (genre) query.genres = genre;
    if (author) query.authors = new RegExp(author, 'i');
    
    // Handle excluded genres
    if (excludeGenres) {
      const excludeList = Array.isArray(excludeGenres) ? excludeGenres : [excludeGenres];
      query.genres = { $nin: excludeList };
      
      // If both include and exclude genres are specified, combine them
      if (genre) {
        query.genres = {
          $in: Array.isArray(genre) ? genre : [genre],
          $nin: excludeList
        };
      }
    }

    // Handle author sorting specially (since authors is an array)
    if (sort === 'authors' || sort === '-authors') {
      const sortDirection = sort.startsWith('-') ? -1 : 1;
      
      // Fetch all matching books
      const allBooks = await Book.find(query);
      
      // Sort in memory by author last name using virtual field
      allBooks.sort((a, b) => {
        const aName = a.authorLastName || '';
        const bName = b.authorLastName || '';
        return sortDirection * aName.localeCompare(bName);
      });
      
      // Apply pagination manually
      const paginatedBooks = allBooks.slice(
        (page - 1) * limit,
        page * limit
      );
      
      const count = allBooks.length;
      
      return res.json({
        books: paginatedBooks,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      });
    }

    // Normal MongoDB sort for other fields
    const books = await Book.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Book.countDocuments(query);

    res.json({
      books,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Failed to fetch books' });
  }
});

// Add new book (requires auth)
router.post('/', auth, [
  body('isbn').notEmpty().trim(),
  body('title').notEmpty().trim(),
  body('authors').isArray(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if book already exists
    const existingBook = await Book.findOne({ isbn: req.body.isbn });
    if (existingBook) {
      // If allowDuplicate flag is set, increment quantity
      if (req.body.allowDuplicate) {
        existingBook.quantity = (existingBook.quantity || 1) + 1;
        existingBook.lastModified = Date.now();
        await existingBook.save();
        
        console.log(`Incremented quantity for book ${existingBook.isbn} to ${existingBook.quantity}`);
        return res.status(200).json({ 
          book: existingBook,
          message: `Added another copy. Total: ${existingBook.quantity} copies`,
          isDuplicate: true,
          newQuantity: existingBook.quantity
        });
      }
      
      // Return 409 with existing book data so frontend can prompt user
      return res.status(409).json({ 
        message: 'Book already exists in library',
        existingBook: {
          _id: existingBook._id,
          isbn: existingBook.isbn,
          title: existingBook.title,
          authors: existingBook.authors,
          quantity: existingBook.quantity || 1,
          coverImage: existingBook.coverImage
        }
      });
    }

    // Ensure cover image URL is properly formatted
    let coverImage = req.body.coverImage;
    if (coverImage) {
      // Ensure HTTPS
      if (coverImage.startsWith('http://')) {
        coverImage = coverImage.replace('http://', 'https://');
      }
      // Log the cover image being saved for debugging
      console.log('Saving book with cover:', coverImage);
    }

    const bookData = {
      ...req.body,
      coverImage: coverImage,
      // Ensure tags and genres are arrays
      tags: req.body.tags || [],
      genres: req.body.genres || [],
    };

    const book = new Book(bookData);
    await book.save();

    console.log('Book saved successfully:', book.isbn, 'Cover:', book.coverImage);
    res.status(201).json(book);
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ message: 'Failed to add book' });
  }
});

// Batch validate covers for all books (requires auth)
router.post('/validate-covers/batch', auth, async (req, res) => {
  try {
    const { limit = 10, skipValidated = true } = req.body;
    
    // Build query
    const query = {};
    if (skipValidated) {
      query.$or = [
        { coverQualityScore: { $exists: false } },
        { coverQualityScore: 0 }
      ];
    }
    
    // Find books that need cover validation
    const books = await Book.find(query).limit(limit);
    
    console.log(`Starting batch cover validation for ${books.length} books`);
    
    const results = {
      updated: [],
      failed: [],
      noValidCover: []
    };
    
    for (const book of books) {
      try {
        console.log(`Validating cover for: ${book.title}`);
        
        const bestCover = await coverValidationService.findBestCover(
          book.isbn,
          book.googleBooksId,
          book.coverImage
        );
        
        if (bestCover) {
          book.coverImage = bestCover.url;
          book.coverQualityScore = bestCover.score;
          
          // Track cover source
          let coverSource = 'unknown';
          if (bestCover.url.includes('openlibrary.org')) {
            coverSource = 'openlibrary';
          } else if (bestCover.url.includes('google')) {
            coverSource = 'google';
          }
          book.coverImageSource = coverSource;
          book.lastModified = Date.now();
          await book.save();
          
          results.updated.push({
            isbn: book.isbn,
            title: book.title,
            coverUrl: bestCover.url,
            source: coverSource,
            score: bestCover.score
          });
        } else {
          book.coverImage = null;
          book.coverImageSource = 'none';
          book.coverQualityScore = 0;
          book.lastModified = Date.now();
          await book.save();
          
          results.noValidCover.push({
            isbn: book.isbn,
            title: book.title
          });
        }
      } catch (error) {
        console.error(`Failed to validate cover for ${book.isbn}:`, error.message);
        results.failed.push({
          isbn: book.isbn,
          title: book.title,
          error: error.message
        });
      }
    }
    
    res.json({
      message: 'Batch cover validation completed',
      processed: books.length,
      results
    });
  } catch (error) {
    console.error('Error in batch cover validation:', error);
    res.status(500).json({ message: 'Failed to validate covers in batch' });
  }
});

// ==================== COVER MANAGEMENT ROUTES (MUST BE BEFORE /:isbn) ====================

// Test route to verify routing is working
router.get('/test/covers', (req, res) => {
  console.log('Test covers route hit!');
  res.json({ message: 'Covers test route is working' });
});

// Get all available covers for a book (temporarily no auth for testing)
router.get('/:isbn/covers', async (req, res) => {
  console.log('=== COVER ROUTE HIT ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Request params:', req.params);
  console.log('ISBN:', req.params.isbn);
  
  try {
    const { isbn } = req.params;
    
    console.log('Searching for book with ISBN:', isbn);
    const book = await Book.findOne({ isbn });
    console.log('Book found:', book ? 'YES' : 'NO');
    
    if (!book) {
      console.log('Book not found, returning 404');
      return res.status(404).json({ message: 'Book not found' });
    }
    
    const covers = [];
    
    // Add custom cover if exists
    if (book.customCoverImage) {
      covers.push({
        id: 'custom',
        url: book.customCoverImage,
        thumbnail: book.coverThumbnail || book.customCoverImage,
        source: 'user',  // Use enum value
        isActive: book.coverImageSource === 'user'
      });
    }
    
    // Get API covers
    try {
      const apiCovers = await coverSearchService.searchByISBN(isbn);
      apiCovers.forEach((cover, index) => {
        covers.push({
          id: `api-${index}`,
          url: cover.url,
          thumbnail: cover.thumbnail || cover.url,
          source: cover.source,
          quality: cover.quality,
          isActive: book.coverImage === cover.url
        });
      });
    } catch (error) {
      console.error('Error fetching API covers:', error);
    }
    
    res.json({
      covers,
      currentCover: book.coverImage,
      currentSource: book.coverImageSource
    });
  } catch (error) {
    console.error('Error fetching covers:', error);
    res.status(500).json({ message: 'Failed to fetch covers' });
  }
});

// Upload custom cover image (temporarily no auth for testing)
router.post('/:isbn/cover/upload', async (req, res) => {
  try {
    const { isbn } = req.params;
    const { imageData, imageUrl } = req.body;
    
    if (!imageData && !imageUrl) {
      return res.status(400).json({ message: 'No image data or URL provided' });
    }
    
    // Find the book
    const book = await Book.findOne({ isbn });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    let processedImage;
    let thumbnail;
    
    try {
      if (imageUrl) {
        // Process image from URL
        processedImage = await imageProcessingService.processImageFromUrl(imageUrl, 'full');
        thumbnail = await imageProcessingService.processImageFromUrl(imageUrl, 'thumbnail');
      } else {
        // Validate the uploaded image
        const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const validation = await imageProcessingService.validateImage(buffer);
        
        if (!validation.valid) {
          return res.status(400).json({ 
            message: 'Invalid image', 
            errors: validation.errors 
          });
        }
        
        // Process the image
        const sizes = await imageProcessingService.generateAllSizes(imageData);
        processedImage = sizes.full;
        thumbnail = sizes.thumbnail;
      }
      
      // Update book with custom cover
      book.customCoverImage = processedImage;
      book.coverThumbnail = thumbnail;
      book.coverImage = processedImage; // Set as active cover
      book.coverImageSource = 'user';
      book.coverQualityScore = 100; // Set high quality score for user uploads
      book.lastModified = Date.now();
      
      await book.save();
      
      console.log(`Custom cover uploaded for book: ${book.title}`);
      
      res.json({
        message: 'Cover uploaded successfully',
        book
      });
    } catch (processingError) {
      console.error('Error processing image:', processingError);
      return res.status(400).json({ 
        message: 'Failed to process image',
        error: processingError.message 
      });
    }
  } catch (error) {
    console.error('Error uploading cover:', error);
    res.status(500).json({ message: 'Failed to upload cover' });
  }
});

// Delete custom cover (temporarily no auth for testing)
router.delete('/:isbn/cover/custom', async (req, res) => {
  try {
    const { isbn } = req.params;
    
    const book = await Book.findOne({ isbn });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Remove custom cover
    book.customCoverImage = null;
    book.coverThumbnail = null;
    
    // Revert to API cover if available
    if (book.coverImageSource === 'user') {
      // Try to find an API cover
      const apiCovers = await coverSearchService.searchByISBN(isbn);
      if (apiCovers && apiCovers.length > 0) {
        book.coverImage = apiCovers[0].url;
        // Normalize source to match enum values
        let normalizedSource = 'other';
        const sourceLower = apiCovers[0].source.toLowerCase();
        if (sourceLower.includes('google')) {
          normalizedSource = 'google';
        } else if (sourceLower.includes('open')) {
          normalizedSource = 'openlibrary';
        }
        book.coverImageSource = normalizedSource;
      } else {
        book.coverImage = null;
        book.coverImageSource = 'none';
      }
    }
    
    book.lastModified = Date.now();
    await book.save();
    
    res.json({
      message: 'Custom cover deleted',
      book
    });
  } catch (error) {
    console.error('Error deleting custom cover:', error);
    res.status(500).json({ message: 'Failed to delete custom cover' });
  }
});

// Select a specific cover (temporarily no auth for testing)
router.post('/:isbn/cover/select', async (req, res) => {
  try {
    const { isbn } = req.params;
    const { coverUrl, source } = req.body;
    
    if (!coverUrl) {
      return res.status(400).json({ message: 'Cover URL is required' });
    }
    
    const book = await Book.findOne({ isbn });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Normalize source to match enum values
    let normalizedSource = source || 'other';
    if (typeof normalizedSource === 'string') {
      const sourceLower = normalizedSource.toLowerCase();
      if (sourceLower.includes('google')) {
        normalizedSource = 'google';
      } else if (sourceLower.includes('open')) {
        normalizedSource = 'openlibrary';
      } else if (sourceLower === 'user upload' || sourceLower === 'uploaded' || sourceLower === 'user') {
        normalizedSource = 'user';
      } else if (sourceLower === 'current' || sourceLower === 'original') {
        // Keep current source if it's just a re-selection
        normalizedSource = book.coverImageSource || 'other';
      } else if (!['google', 'openlibrary', 'user', 'custom', 'other', 'none'].includes(sourceLower)) {
        // Default to 'other' for unknown sources
        normalizedSource = 'other';
      } else {
        normalizedSource = sourceLower;
      }
    }
    
    // Update active cover
    book.coverImage = coverUrl;
    book.coverImageSource = normalizedSource;
    book.coverQualityScore = normalizedSource === 'user' ? 100 : 50; // Set quality score
    book.lastModified = Date.now();
    
    await book.save();
    
    res.json({
      message: 'Cover selected successfully',
      book
    });
  } catch (error) {
    console.error('Error selecting cover:', error);
    res.status(500).json({ message: 'Failed to select cover' });
  }
});

// Get Google Images search URL for a book
router.get('/:isbn/cover/google-search-url', async (req, res) => {
  try {
    const { isbn } = req.params;
    
    const book = await Book.findOne({ isbn });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Generate search URL with ISBN or book details
    const searchUrl = coverSearchService.generateGoogleImageSearchUrl(
      `${book.title} ${book.authors?.join(' ')}`,
      isbn
    );
    
    res.json({
      searchUrl,
      isbn,
      title: book.title,
      authors: book.authors
    });
  } catch (error) {
    console.error('Error generating Google search URL:', error);
    res.status(500).json({ message: 'Failed to generate search URL' });
  }
});

// Search for cover suggestions (no auth required for searching)
router.post('/:isbn/cover/search', async (req, res) => {
  console.log('=== COVER SEARCH ROUTE HIT ===');
  console.log('ISBN:', req.params.isbn);
  console.log('Body:', req.body);
  
  try {
    const { isbn } = req.params;
    const { query } = req.body;
    
    console.log('Searching for book with ISBN:', isbn);
    const book = await Book.findOne({ isbn });
    console.log('Book found:', book ? 'YES' : 'NO');
    
    if (!book) {
      console.log('Book not found, returning 404');
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Use book title and author if no query provided
    const searchQuery = query || `${book.title} ${book.authors?.join(' ')}`;
    
    // Search for covers
    const suggestions = await coverSearchService.searchGoogleImages(searchQuery, 8);
    
    // Validate which URLs are accessible
    const validatedSuggestions = [];
    for (const suggestion of suggestions) {
      const isValid = await coverSearchService.validateImageUrl(suggestion.url);
      if (isValid) {
        validatedSuggestions.push({
          ...suggestion,
          valid: true
        });
      }
    }
    
    res.json({
      query: searchQuery,
      suggestions: validatedSuggestions,
      total: validatedSuggestions.length
    });
  } catch (error) {
    console.error('Error searching for covers:', error);
    res.status(500).json({ message: 'Failed to search for covers' });
  }
});

// Update book quantity (requires auth)
router.patch('/:isbn/quantity', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (quantity < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }
    
    const book = await Book.findOne({ isbn: req.params.isbn });
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    if (quantity === 0) {
      // Delete the book if quantity is set to 0
      await book.deleteOne();
      return res.json({ message: 'Book removed from library', deleted: true });
    }
    
    // Update quantity
    book.quantity = quantity;
    book.lastModified = Date.now();
    await book.save();
    
    res.json({ 
      message: `Quantity updated to ${quantity}`,
      book 
    });
  } catch (error) {
    console.error('Error updating book quantity:', error);
    res.status(500).json({ message: 'Failed to update book quantity' });
  }
});

// Enhance book metadata (requires auth)
router.post('/:isbn/enhance', auth, async (req, res) => {
  try {
    const { isbn } = req.params;
    
    // Find the existing book
    const book = await Book.findOne({ isbn });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Fetch enhanced metadata
    const enhancedData = await bookMetadataService.fetchEnhancedBookData(isbn);
    
    if (!enhancedData) {
      return res.status(404).json({ message: 'Could not fetch enhanced metadata' });
    }
    
    // Update book with enhanced data
    book.bisacCategories = enhancedData.bisacCategories || [];
    book.rawSubjects = enhancedData.rawSubjects || {};
    book.metadataSources = enhancedData.metadataSources || [];
    
    // Update genres if we got better ones
    if (enhancedData.genres && enhancedData.genres.length > 0) {
      book.genres = enhancedData.genres;
    }
    
    // Update cover if we found a better one
    if (enhancedData.coverImage) {
      book.coverImage = enhancedData.coverImage;
      book.coverQualityScore = enhancedData.coverQualityScore || 0;
    }
    
    book.dataSource = 'enhanced';
    book.lastModified = Date.now();
    
    await book.save();
    
    res.json({
      message: 'Book metadata enhanced successfully',
      book
    });
  } catch (error) {
    console.error('Error enhancing book metadata:', error);
    res.status(500).json({ message: 'Failed to enhance book metadata' });
  }
});

// Validate and update book cover (requires auth)
router.post('/:isbn/validate-cover', auth, async (req, res) => {
  try {
    const { isbn } = req.params;
    
    // Find the existing book
    const book = await Book.findOne({ isbn });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    console.log(`Validating cover for book: ${book.title} (ISBN: ${isbn})`);
    
    // Find the best available cover
    const bestCover = await coverValidationService.findBestCover(
      book.isbn,
      book.googleBooksId,
      book.coverImage
    );
    
    if (bestCover) {
      // Update the book with the best cover
      book.coverImage = bestCover.url;
      book.coverQualityScore = bestCover.score;
      
      // Determine and save cover source
      let coverSource = 'unknown';
      if (bestCover.url.includes('openlibrary.org')) {
        coverSource = 'openlibrary';
      } else if (bestCover.url.includes('google')) {
        coverSource = 'google';
      }
      book.coverImageSource = coverSource;
      book.lastModified = Date.now();
      
      await book.save();
      
      console.log(`Cover updated for ${book.title}: ${coverSource} (score: ${bestCover.score})`);
      
      res.json({
        message: 'Cover validated and updated successfully',
        cover: {
          url: bestCover.url,
          score: bestCover.score,
          contentType: bestCover.contentType,
          source: coverSource
        },
        book
      });
    } else {
      // No valid cover found
      book.coverImage = null;
      book.coverQualityScore = 0;
      book.lastModified = Date.now();
      
      await book.save();
      
      res.json({
        message: 'No valid JPEG cover found for this book',
        cover: null,
        book
      });
    }
  } catch (error) {
    console.error('Error validating book cover:', error);
    res.status(500).json({ message: 'Failed to validate book cover' });
  }
});

// Remove primaryCategory field from all books (requires auth)
router.post('/remove-primary-category', auth, async (req, res) => {
  try {
    console.log('Starting primaryCategory field removal...');
    
    // Count books with primaryCategory
    const booksWithPrimaryCategory = await Book.countDocuments({ 
      primaryCategory: { $exists: true } 
    });
    
    if (booksWithPrimaryCategory === 0) {
      return res.json({
        message: 'No books have primaryCategory field',
        removed: 0
      });
    }
    
    // Find mismatched books for logging
    const mismatchedBooks = await Book.find({
      primaryCategory: { $exists: true },
      genres: { $exists: true, $ne: [] }
    }).select('isbn title primaryCategory genres categoryType');
    
    const mismatches = [];
    for (const book of mismatchedBooks) {
      if (book.primaryCategory && !book.genres.includes(book.primaryCategory)) {
        mismatches.push({
          isbn: book.isbn,
          title: book.title,
          oldPrimaryCategory: book.primaryCategory,
          genres: book.genres,
          categoryType: book.categoryType
        });
      }
    }
    
    // Remove the field
    const result = await Book.updateMany(
      { primaryCategory: { $exists: true } },
      { $unset: { primaryCategory: "" } }
    );
    
    res.json({
      message: `Removed primaryCategory from ${result.modifiedCount} books`,
      totalProcessed: booksWithPrimaryCategory,
      removed: result.modifiedCount,
      mismatches: mismatches.length,
      mismatchDetails: mismatches
    });
    
  } catch (error) {
    console.error('Error removing primaryCategory:', error);
    res.status(500).json({ 
      message: 'Failed to remove primaryCategory',
      error: error.message 
    });
  }
});

// Fix uncategorized books endpoint (requires auth)
router.post('/fix-uncategorized', auth, async (req, res) => {
  try {
    const multiGenreCategoryService = require('../services/multiGenreCategoryService');
    const improvedCategoryService = require('../services/improvedCategoryService');
    
    console.log('Starting fix for uncategorized books...');
    
    // Find all uncategorized books
    const uncategorizedBooks = await Book.find({ 
      primaryCategory: 'Uncategorized' 
    });
    
    const results = {
      total: uncategorizedBooks.length,
      fixed: 0,
      failed: 0,
      details: []
    };
    
    if (uncategorizedBooks.length === 0) {
      return res.json({
        message: 'No uncategorized books found',
        results
      });
    }
    
    const useMultiGenre = process.env.USE_MULTI_GENRE === 'true';
    
    for (const book of uncategorizedBooks) {
      try {
        console.log(`Processing book: ${book.title} (ISBN: ${book.isbn})`);
        
        // Strategy 1: If book already has valid genres, keep them
        if (book.genres && book.genres.length > 0) {
          const validGenres = book.genres.filter(g => g !== 'Uncategorized');
          
          if (validGenres.length > 0) {
            book.genres = validGenres;
            console.log(`  Using existing genres: ${book.genres.join(', ')}`);
          } else {
            // Re-categorize the book
            const subjects = [];
            if (book.rawSubjects) {
              if (book.rawSubjects.google) subjects.push(...book.rawSubjects.google);
              if (book.rawSubjects.openLibrary) subjects.push(...book.rawSubjects.openLibrary);
            }
            if (book.allSubjects) subjects.push(...book.allSubjects);
            
            if (useMultiGenre) {
              const categorization = multiGenreCategoryService.categorizeBook(
                subjects,
                book.title,
                book.description,
                book.authors
              );
              
              book.genres = categorization.genres;
              book.categoryType = categorization.categoryType;
            } else {
              const category = improvedCategoryService.categorizeBook(
                subjects,
                book.title,
                book.description
              );
              
              book.genres = [category];
              book.categoryType = improvedCategoryService.getParentCategory(category);
            }
            console.log(`  Re-categorized to: ${book.genres.join(', ')}`);
          }
        } else {
          // Re-categorize the book
          const subjects = [];
          if (book.rawSubjects) {
            if (book.rawSubjects.google) subjects.push(...book.rawSubjects.google);
            if (book.rawSubjects.openLibrary) subjects.push(...book.rawSubjects.openLibrary);
          }
          if (book.allSubjects) subjects.push(...book.allSubjects);
          
          if (useMultiGenre) {
            const categorization = multiGenreCategoryService.categorizeBook(
              subjects,
              book.title,
              book.description,
              book.authors
            );
            
            book.genres = categorization.genres;
            book.categoryType = categorization.categoryType;
          } else {
            const category = improvedCategoryService.categorizeBook(
              subjects,
              book.title,
              book.description
            );
            
            book.genres = [category];
            book.categoryType = improvedCategoryService.getParentCategory(category);
          }
          console.log(`  Re-categorized to: ${book.genres.join(', ')}`);
        }
        
        // Ensure no "Uncategorized" in genres array
        if (book.genres && book.genres.includes('Uncategorized')) {
          book.genres = book.genres.filter(g => g !== 'Uncategorized');
          if (book.genres.length === 0) {
            const defaultGenre = book.categoryType === 'Nonfiction' ? 'Nonfiction' : 'Contemporary Fiction';
            book.genres = [defaultGenre];
          }
        }
        
        await book.save();
        results.fixed++;
        results.details.push({
          isbn: book.isbn,
          title: book.title,
          genres: book.genres,
          categoryType: book.categoryType,
          status: 'fixed'
        });
        
        console.log(`  ✓ Fixed successfully`);
      } catch (error) {
        console.error(`  ✗ Failed to fix book: ${error.message}`);
        results.failed++;
        results.details.push({
          isbn: book.isbn,
          title: book.title,
          error: error.message,
          status: 'failed'
        });
      }
    }
    
    // Verify no more uncategorized books
    const remainingUncategorized = await Book.countDocuments({ 
      primaryCategory: 'Uncategorized' 
    });
    
    res.json({
      message: `Fixed ${results.fixed} books, ${results.failed} failures`,
      remainingUncategorized,
      results
    });
    
  } catch (error) {
    console.error('Error fixing uncategorized books:', error);
    res.status(500).json({ 
      message: 'Failed to fix uncategorized books',
      error: error.message 
    });
  }
});

// ==================== GENERIC ISBN ROUTES (MUST BE AFTER SPECIFIC ROUTES) ====================

// Get single book by ISBN
router.get('/:isbn', async (req, res) => {
  console.log('=== GENERIC ISBN ROUTE HIT ===');
  console.log('Request URL:', req.originalUrl);
  console.log('ISBN param:', req.params.isbn);
  console.log('Full URL path:', req.path);
  
  // Check if this is actually a cover request that shouldn't be here
  if (req.params.isbn.includes('/')) {
    console.log('WARNING: ISBN contains slash, might be a misrouted request');
  }
  
  try {
    const book = await Book.findOne({ isbn: req.params.isbn });
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ message: 'Failed to fetch book' });
  }
});

// Update book (requires auth)
router.put('/:isbn', auth, async (req, res) => {
  try {
    console.log('\n=== UPDATE BOOK REQUEST ===');
    console.log('ISBN:', req.params.isbn);
    console.log('Has copies:', req.body.copies ? 'Yes' : 'No');
    if (req.body.copies) {
      console.log('Copies count:', req.body.copies.length);
      console.log('Copies data:', JSON.stringify(req.body.copies, null, 2));
    }
    
    // Clean up the update data
    const updateData = { ...req.body };
    
    // Special handling for copies array
    if (updateData.copies && Array.isArray(updateData.copies)) {
      // Ensure each copy has required fields and clean IDs
      updateData.copies = updateData.copies.map((copy, index) => {
        const cleanCopy = {
          copyNumber: copy.copyNumber || index + 1,
          edition: copy.edition || 'standard',
          status: copy.status || 'to-read',
          rating: copy.rating || 0,
          notes: copy.notes || '',
          loanedTo: copy.loanedTo || '',
          loanedDate: copy.loanedDate || null
        };
        
        // Preserve the MongoDB _id if it exists (for existing copies)
        if (copy._id && typeof copy._id === 'string' && copy._id.length === 24) {
          cleanCopy._id = copy._id;
        }
        
        return cleanCopy;
      });
      
      console.log('Processed copies:', JSON.stringify(updateData.copies, null, 2));
      
      // Update quantity to match copies length
      updateData.quantity = updateData.copies.length;
      
      // Update book-level status and edition based on copies
      // If all copies have the same status/edition, use that; otherwise keep existing
      const allStatuses = updateData.copies.map(c => c.status);
      const allEditions = updateData.copies.map(c => c.edition);
      
      const uniqueStatuses = [...new Set(allStatuses)];
      const uniqueEditions = [...new Set(allEditions)];
      
      if (uniqueStatuses.length === 1) {
        updateData.status = uniqueStatuses[0];
      }
      
      if (uniqueEditions.length === 1) {
        updateData.edition = uniqueEditions[0];
      } else if (uniqueEditions.length > 1) {
        // If mixed editions, default to the "highest" edition
        if (uniqueEditions.includes('deluxe')) {
          updateData.edition = 'deluxe';
        } else if (uniqueEditions.includes('signed')) {
          updateData.edition = 'signed';
        } else {
          updateData.edition = 'standard';
        }
      }
    }
    
    // Remove rating if it's 0 or null (unset it instead of setting to 0)
    if (updateData.rating === 0 || updateData.rating === null) {
      delete updateData.rating;
      // Use $unset to remove the rating field
      const book = await Book.findOneAndUpdate(
        { isbn: req.params.isbn },
        { 
          $set: { ...updateData, lastModified: Date.now() },
          $unset: { rating: "" }
        },
        { new: true, runValidators: true }
      );
      
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
      
      console.log(`Book updated with ${book.copies ? book.copies.length : 0} copies`);
      return res.json(book);
    }
    
    // Normal update with rating included
    const book = await Book.findOneAndUpdate(
      { isbn: req.params.isbn },
      { ...updateData, lastModified: Date.now() },
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    console.log(`Book updated: ${book.title}, Copies: ${book.copies ? book.copies.length : 0}`);
    res.json(book);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ message: 'Failed to update book', error: error.message });
  }
});

// Delete book (requires auth)
router.delete('/:isbn', auth, async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({ isbn: req.params.isbn });

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Failed to delete book' });
  }
});

// Catch-all 404 for debugging
router.use('*', (req, res) => {
  console.log('\n=== 404 IN BOOKS ROUTER ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  console.log('Base URL:', req.baseUrl);
  console.log('Path:', req.path);
  console.log('This request did not match any route in books.js');
  console.log('==========================\n');
  res.status(404).json({ 
    message: 'Route not found in books router',
    attempted: req.originalUrl,
    method: req.method
  });
});

module.exports = router;
