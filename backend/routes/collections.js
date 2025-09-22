const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const Book = require('../models/Book');
const CollectionBookService = require('../services/collectionBookService');
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
    await CollectionBookService.deleteCollection(req.params.id);
    res.json({ message: 'Collection deleted successfully - books preserved' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    if (error.message === 'Collection not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to delete collection' });
  }
});

// Add book to collection (requires auth)
router.post('/:id/books/:bookId', auth, async (req, res) => {
  try {
    // Get the collection first to know the previous book count
    const collection = await Collection.findById(req.params.id).populate('books', 'coverImage');
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    const previousBookCount = collection.books.length;
    
    const result = await CollectionBookService.addBookToCollection(
      req.params.id,
      req.params.bookId
    );
    
    // Populate books for cover generation
    await result.collection.populate('books', 'coverImage title');
    
    const CompositeImageService = require('../services/compositeImageService');
    
    // Check if we should regenerate based on book count transition
    if (CompositeImageService.shouldRegenerateOnBookChange(result.collection, previousBookCount) ||
        (result.collection.books.length >= 2 && !result.collection.coverImage)) {
      console.log(`Regenerating composite cover for collection: ${result.collection.name} (${previousBookCount} -> ${result.collection.books.length} books)`);
      await result.collection.generateCoverImage();
      await result.collection.save();
    }
    
    res.json(result.collection);
  } catch (error) {
    console.error('Error adding book to collection:', error);
    if (error.message === 'Collection not found' || error.message === 'Book not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to add book to collection' });
  }
});

// Remove book from collection (requires auth)
router.delete('/:id/books/:bookId', auth, async (req, res) => {
  try {
    // Get the collection first to know the previous book count
    const collection = await Collection.findById(req.params.id).populate('books', 'coverImage');
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    const previousBookCount = collection.books.length;
    
    const result = await CollectionBookService.removeBookFromCollection(
      req.params.id,
      req.params.bookId
    );
    
    // Populate remaining books
    await result.collection.populate('books', 'coverImage title');
    
    const CompositeImageService = require('../services/compositeImageService');
    
    // Check if we should regenerate based on book count transition
    if (result.collection.books.length >= 2 && 
        CompositeImageService.shouldRegenerateOnBookChange(result.collection, previousBookCount)) {
      console.log(`Regenerating composite cover after book removal: ${result.collection.name} (${previousBookCount} -> ${result.collection.books.length} books)`);
      await result.collection.generateCoverImage();
      await result.collection.save();
    } else if (result.collection.books.length < 2 && result.collection.coverImage?.startsWith('data:image')) {
      // Clear auto-generated cover if less than 2 books remain
      result.collection.coverImage = null;
      result.collection.coverBookId = null;
      await result.collection.save();
    }
    
    res.json(result.collection);
  } catch (error) {
    console.error('Error removing book from collection:', error);
    if (error.message === 'Collection not found') {
      return res.status(404).json({ message: error.message });
    }
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

    // Get the collection first to know the previous book count
    const existingCollection = await Collection.findById(req.params.id).populate('books', 'coverImage');
    if (!existingCollection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    const previousBookCount = existingCollection.books.length;

    const { bookIds } = req.body;
    const collection = await CollectionBookService.bulkAddBooks(
      req.params.id,
      bookIds
    );
    
    // Populate books for cover generation
    await collection.populate('books', 'coverImage title');
    
    const CompositeImageService = require('../services/compositeImageService');
    
    // Auto-generate or regenerate composite cover based on transitions
    if (!collection.coverImage || 
        collection.books.length === bookIds.length || // New collection
        CompositeImageService.shouldRegenerateOnBookChange(collection, previousBookCount)) {
      console.log(`Generating/regenerating composite cover for collection: ${collection.name} (${previousBookCount} -> ${collection.books.length} books)`);
      await collection.generateCoverImage();
      await collection.save();
    }
    
    res.json(collection);
  } catch (error) {
    console.error('Error adding books to collection:', error);
    if (error.message === 'Collection not found' || error.message === 'Some books not found') {
      return res.status(404).json({ message: error.message });
    }
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

// Validate collection data integrity
router.get('/:id/validate', async (req, res) => {
  try {
    const validation = await CollectionBookService.validateCollection(req.params.id);
    res.json(validation);
  } catch (error) {
    console.error('Error validating collection:', error);
    if (error.message === 'Collection not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to validate collection' });
  }
});

// Fix collection data integrity (requires auth)
router.post('/:id/fix', auth, async (req, res) => {
  try {
    const collection = await CollectionBookService.fixCollectionIntegrity(req.params.id);
    res.json({
      message: 'Collection integrity fixed',
      collection
    });
  } catch (error) {
    console.error('Error fixing collection:', error);
    if (error.message === 'Collection not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to fix collection' });
  }
});

module.exports = router;
