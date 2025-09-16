const express = require('express');
const router = express.Router();
const googleBooksService = require('../services/googleBooksService');
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

    // Search Google Books
    const bookData = await googleBooksService.searchByISBN(cleanISBN);

    if (!bookData) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Ensure ISBN is set (use the scanned one if not found in Google Books)
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

    const results = [];
    const errors = [];

    for (const isbn of isbns) {
      try {
        const bookData = await googleBooksService.searchByISBN(isbn);
        if (bookData) {
          if (!bookData.isbn) {
            bookData.isbn = isbn.replace(/[-\s]/g, '');
          }
          results.push(bookData);
        } else {
          errors.push({ isbn, error: 'Not found' });
        }
      } catch (error) {
        errors.push({ isbn, error: error.message });
      }
    }

    res.json({ results, errors });
  } catch (error) {
    console.error('Batch lookup error:', error);
    res.status(500).json({ message: 'Failed to batch lookup books' });
  }
});

module.exports = router;
