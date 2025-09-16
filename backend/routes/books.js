const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const auth = require('../middleware/auth');
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
      return res.status(409).json({ message: 'Book already exists in library' });
    }

    const book = new Book(req.body);
    await book.save();

    res.status(201).json(book);
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ message: 'Failed to add book' });
  }
});

// Update book (requires auth)
router.put('/:isbn', auth, async (req, res) => {
  try {
    const book = await Book.findOneAndUpdate(
      { isbn: req.params.isbn },
      { ...req.body, lastModified: Date.now() },
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

module.exports = router;
