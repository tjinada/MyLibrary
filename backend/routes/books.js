const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const bookMetadataService = require('../services/bookMetadataService');
const coverValidationService = require('../services/coverValidationService');
const { body, validationResult } = require('express-validator');

// Get all books with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      genre,
      author,
      sort = '-addedDate'
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (genre) query.genres = genre;
    if (author) query.authors = new RegExp(author, 'i');

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

// Get single book by ISBN
router.get('/:isbn', async (req, res) => {
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

// Update book (requires auth)
router.put('/:isbn', auth, async (req, res) => {
  try {
    // Clean up the update data
    const updateData = { ...req.body };
    
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

    res.json(book);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ message: 'Failed to update book' });
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
      book.lastModified = Date.now();
      
      await book.save();
      
      res.json({
        message: 'Cover validated and updated successfully',
        cover: {
          url: bestCover.url,
          score: bestCover.score,
          contentType: bestCover.contentType,
          source: bestCover.url.includes('openlibrary') ? 'openlibrary' : 'google'
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
          book.lastModified = Date.now();
          await book.save();
          
          results.updated.push({
            isbn: book.isbn,
            title: book.title,
            coverUrl: bestCover.url,
            score: bestCover.score
          });
        } else {
          book.coverImage = null;
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

module.exports = router;
