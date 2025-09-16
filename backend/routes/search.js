const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const googleBooksService = require('../services/googleBooksService');

// Search local library
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

    const books = await Book.find(query)
      .sort('-addedDate')
      .limit(50);

    res.json(books);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
});

// Search Google Books (for adding new books)
router.get('/google', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const books = await googleBooksService.searchBooks(q, 20);
    res.json(books);
  } catch (error) {
    console.error('Google Books search error:', error);
    res.status(500).json({ message: 'Failed to search Google Books' });
  }
});

module.exports = router;
