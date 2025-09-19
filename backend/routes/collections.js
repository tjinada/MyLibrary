const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all collections
router.get('/', async (req, res) => {
  try {
    const { 
      includeBooks = false,
      sort = 'sortName' 
    } = req.query;

    let query = Collection.find();
    
    if (includeBooks === 'true') {
      query = query.populate('books');
    }
    
    const collections = await query.sort(sort);

    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ message: 'Failed to fetch collections' });
  }
});

// Get single collection by ID
router.get('/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('books')
      .populate('bookOrder');
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // For series, return books in order
    if (collection.collectionType === 'series' && collection.bookOrder.length > 0) {
      collection.books = collection.bookOrder;
    }

    res.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ message: 'Failed to fetch collection' });
  }
});

// Create new collection (requires auth)
router.post('/', auth, [
  body('name').notEmpty().trim(),
  body('collectionType').optional().isIn(['series', 'custom', 'theme']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if collection with same name exists
    const existingCollection = await Collection.findOne({ 
      name: new RegExp(`^${req.body.name}$`, 'i') 
    });
    
    if (existingCollection) {
      return res.status(409).json({ message: 'Collection with this name already exists' });
    }

    const collection = new Collection({
      name: req.body.name,
      description: req.body.description,
      collectionType: req.body.collectionType || 'custom',
      displayInLibrary: req.body.displayInLibrary !== false,
      books: [],
      bookOrder: []
    });

    await collection.save();
    res.status(201).json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ message: 'Failed to create collection' });
  }
});

// Update collection (requires auth)
router.put('/:id', auth, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'description', 'displayInLibrary', 'collectionType', 'coverImage'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Update sortName if name is changed
    if (updates.name) {
      updates.sortName = updates.name
        .toLowerCase()
        .replace(/^(the |a |an )/i, '')
        .trim();
    }

    const collection = await Collection.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    res.json(collection);
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ message: 'Failed to update collection' });
  }
});

// Delete collection (requires auth)
router.delete('/:id', auth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Remove collection reference from all books
    if (collection.books.length > 0) {
      await Book.updateMany(
        { _id: { $in: collection.books } },
        { $pull: { collections: collection._id } }
      );
    }

    await collection.deleteOne();
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ message: 'Failed to delete collection' });
  }
});

// Add book to collection (requires auth)
router.post('/:id/books/:bookId', auth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    const book = await Book.findById(req.params.bookId);
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Add book to collection
    await collection.addBook(book._id);
    
    // Add collection to book
    if (!book.collections.includes(collection._id)) {
      book.collections.push(collection._id);
      await book.save();
    }

    // Generate cover image if needed
    if (!collection.coverImage) {
      await collection.generateCoverImage();
      await collection.save();
    }

    await collection.populate('books');
    res.json(collection);
  } catch (error) {
    console.error('Error adding book to collection:', error);
    res.status(500).json({ message: 'Failed to add book to collection' });
  }
});

// Remove book from collection (requires auth)
router.delete('/:id/books/:bookId', auth, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    const book = await Book.findById(req.params.bookId);
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    if (book) {
      // Remove collection from book
      book.collections = book.collections.filter(
        colId => !colId.equals(collection._id)
      );
      await book.save();
    }

    // Remove book from collection
    await collection.removeBook(req.params.bookId);
    
    await collection.populate('books');
    res.json(collection);
  } catch (error) {
    console.error('Error removing book from collection:', error);
    res.status(500).json({ message: 'Failed to remove book from collection' });
  }
});

// Bulk add books to collection (requires auth)
router.post('/:id/books', auth, [
  body('bookIds').isArray(),
  body('bookIds.*').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    const { bookIds } = req.body;
    
    // Add books to collection
    for (const bookId of bookIds) {
      if (!collection.books.includes(bookId)) {
        collection.books.push(bookId);
        if (collection.collectionType === 'series') {
          collection.bookOrder.push(bookId);
        }
      }
    }
    
    collection.bookCount = collection.books.length;
    await collection.save();

    // Update books to include this collection
    await Book.updateMany(
      { _id: { $in: bookIds } },
      { $addToSet: { collections: collection._id } }
    );

    // Generate cover image if needed
    if (!collection.coverImage) {
      await collection.generateCoverImage();
      await collection.save();
    }

    await collection.populate('books');
    res.json(collection);
  } catch (error) {
    console.error('Error adding books to collection:', error);
    res.status(500).json({ message: 'Failed to add books to collection' });
  }
});

// Reorder books in series collection (requires auth)
router.put('/:id/reorder', auth, [
  body('bookOrder').isArray(),
  body('bookOrder.*').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    if (collection.collectionType !== 'series') {
      return res.status(400).json({ message: 'Can only reorder books in series collections' });
    }

    await collection.reorderBooks(req.body.bookOrder);
    await collection.populate('bookOrder');
    
    res.json(collection);
  } catch (error) {
    console.error('Error reordering books:', error);
    res.status(500).json({ message: error.message || 'Failed to reorder books' });
  }
});

// Get books by collection ID (with proper ordering for series)
router.get('/:id/books', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('books')
      .populate('bookOrder');
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    let books;
    if (collection.collectionType === 'series' && collection.bookOrder.length > 0) {
      books = collection.bookOrder;
    } else {
      books = collection.books;
    }

    res.json(books);
  } catch (error) {
    console.error('Error fetching collection books:', error);
    res.status(500).json({ message: 'Failed to fetch collection books' });
  }
});

module.exports = router;
