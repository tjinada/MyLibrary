const mongoose = require('mongoose');

const CollectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  books: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }],
  coverImage: {
    type: String
  },
  coverBookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    default: null
  },
  
  // For library integration
  sortName: {
    type: String,
    index: true
  },
  displayInLibrary: {
    type: Boolean,
    default: true
  },
  collectionType: {
    type: String,
    enum: ['series', 'custom', 'theme'],
    default: 'custom'
  },
  bookOrder: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }],
  
  // Virtual field for book count
  bookCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update sortName before saving
CollectionSchema.pre('save', function(next) {
  if (!this.sortName) {
    // Remove common articles for better sorting
    this.sortName = this.name
      .toLowerCase()
      .replace(/^(the |a |an )/i, '')
      .trim();
  }
  
  // Update book count
  this.bookCount = this.books.length;
  
  next();
});

// Method to add a book to collection
CollectionSchema.methods.addBook = async function(bookId) {
  if (!this.books.includes(bookId)) {
    this.books.push(bookId);
    if (this.collectionType === 'series') {
      // For series, also add to bookOrder
      if (!this.bookOrder.includes(bookId)) {
        this.bookOrder.push(bookId);
      }
    }
    this.bookCount = this.books.length;
    return this.save();
  }
  return this;
};

// Method to remove a book from collection
CollectionSchema.methods.removeBook = async function(bookId) {
  this.books = this.books.filter(id => !id.equals(bookId));
  this.bookOrder = this.bookOrder.filter(id => !id.equals(bookId));
  this.bookCount = this.books.length;
  return this.save();
};

// Method to reorder books (for series)
CollectionSchema.methods.reorderBooks = async function(orderedBookIds) {
  if (this.collectionType === 'series') {
    // Validate that all books are in the collection
    const collectionBookIds = this.books.map(id => id.toString());
    const validOrder = orderedBookIds.every(id => collectionBookIds.includes(id.toString()));
    
    if (validOrder && orderedBookIds.length === this.books.length) {
      this.bookOrder = orderedBookIds.map(id => mongoose.Types.ObjectId(id));
      return this.save();
    } else {
      throw new Error('Invalid book order: all books must be included');
    }
  }
  return this;
};

// Method to generate cover image from book covers
CollectionSchema.methods.generateCoverImage = async function() {
  // Check if we should auto-generate a composite
  const CompositeImageService = require('../services/compositeImageService');
  
  // If collection already has a custom cover (not from a book), keep it
  if (this.coverImage && !this.coverBookId) {
    return this.coverImage;
  }
  
  // Populate books if not already populated
  if (this.books.length > 0 && !this.books[0].coverImage) {
    await this.populate('books', 'coverImage title');
  }
  
  // Check if we should auto-generate
  if (CompositeImageService.shouldAutoGenerate(this)) {
    try {
      // Get cover URLs from books
      const coverUrls = this.books
        .filter(book => book.coverImage)
        .slice(0, 4)
        .map(book => book.coverImage);
      
      if (coverUrls.length >= 2) {
        console.log(`Auto-generating composite cover for collection: ${this.name}`);
        
        // Generate composite image
        const compositeImage = await CompositeImageService.generateCompositeImage(coverUrls, {
          width: 400,
          height: 600,
          quality: 85
        });
        
        // Save the composite image
        this.coverImage = compositeImage;
        this.coverBookId = null; // Clear any book ID reference
        
        return this.coverImage;
      }
    } catch (error) {
      console.error('Failed to generate composite image:', error);
      // Fall back to using first book cover
    }
  }
  
  // Fallback: Use coverBookId if set, otherwise use first book
  if (this.coverBookId) {
    await this.populate('coverBookId', 'coverImage');
    if (this.coverBookId && this.coverBookId.coverImage) {
      this.coverImage = this.coverBookId.coverImage;
    }
  } else if (this.books.length > 0) {
    const covers = this.books
      .slice(0, 4)
      .map(book => book.coverImage)
      .filter(Boolean);
    
    if (covers.length > 0) {
      this.coverImage = covers[0];
      // Set the first book as cover if not set
      if (!this.coverBookId) {
        this.coverBookId = this.books[0]._id || this.books[0];
      }
    }
  }
  
  return this.coverImage;
};

// Create text index for search
CollectionSchema.index({ 
  name: 'text', 
  description: 'text'
});

module.exports = mongoose.model('Collection', CollectionSchema);
