const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Collection = require('../models/Collection');
const googleBooksService = require('../services/googleBooksService');
const bookMetadataService = require('../services/bookMetadataService');

// Search local library (including books in collections)
router.get('/', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    let query = {};

    switch (type) {
      case 'title':
        query = { title: new RegExp(q, 'i') };
        break;
      case 'author':
        query = { authors: new RegExp(q, 'i') };
        break;
      case 'genre':
        query = { genres: new RegExp(q, 'i') };
        break;
      case 'isbn':
        query = { isbn: new RegExp(q, 'i') };
        break;
      default:
        // Search all text fields
        query = {
          $or: [
            { title: new RegExp(q, 'i') },
            { authors: new RegExp(q, 'i') },
            { description: new RegExp(q, 'i') },
            { tags: new RegExp(q, 'i') },
            { isbn: new RegExp(q, 'i') }
          ]
        };
    }

    // Search for books (this includes ALL books, even those in collections)
    const books = await Book.find(query)
      .sort('-addedDate')
      .limit(100); // Increased limit since we're including all books
    
    // Also search for collections by name and description
    const collectionQuery = {
      $or: [
        { name: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') }
      ]
    };
    
    const collections = await Collection.find(collectionQuery)
      .populate('books')
      .sort('-createdAt')
      .limit(20);
    
    // Combine results - books from direct search plus books from matched collections
    const bookIds = new Set(books.map(b => b._id.toString()));
    const allBooks = [...books];
    
    // Add books from matched collections that weren't in the direct search
    collections.forEach(collection => {
      if (collection.books) {
        collection.books.forEach(book => {
          if (!bookIds.has(book._id.toString())) {
            allBooks.push(book);
            bookIds.add(book._id.toString());
          }
        });
      }
    });

    res.json({
      books: allBooks,
      collections: collections.map(c => ({
        _id: c._id,
        name: c.name,
        description: c.description,
        bookCount: c.bookCount
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
});

// Search Google Books (for adding new books)
router.get('/google', async (req, res) => {
  try {
    const { q, enhanced = 'true' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    let books;
    
    // Check if enhanced metadata is requested (default: true)
    if (enhanced === 'true') {
      try {
        // Try to get enhanced metadata for search results
        books = await bookMetadataService.searchBooksWithEnhancedMetadata(q, 20);
      } catch (enhancedError) {
        console.log('Enhanced search failed, falling back to Google Books only:', enhancedError.message);
        books = await googleBooksService.searchBooks(q, 20);
      }
    } else {
      // Use Google Books only
      books = await googleBooksService.searchBooks(q, 20);
    }
    
    res.json(books);
  } catch (error) {
    console.error('Google Books search error:', error);
    res.status(500).json({ message: 'Failed to search books' });
  }
});

module.exports = router;
