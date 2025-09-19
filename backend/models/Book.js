const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  isbn: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    index: true
  },
  authors: [{
    type: String,
    index: true
  }],
  publisher: String,
  publishedDate: String,
  description: String,
  pageCount: Number,
  genres: [{
    type: String,
    index: true
  }],
  
  // Primary category (single, specific genre)
  primaryCategory: {
    type: String,
    index: true
  },
  
  // Category type (Fiction or Nonfiction)
  categoryType: {
    type: String,
    enum: ['Fiction', 'Nonfiction'],
    index: true
  },
  
  // Reasoning for genre assignments (for debugging/transparency)
  genreReasons: {
    type: Map,
    of: [String]
  },
  
  // All raw subjects combined from sources (for reference)
  allSubjects: [String],
  
  // BISAC standardized categories
  bisacCategories: [{
    code: String,
    description: String
  }],
  
  // Raw subject data from different sources
  rawSubjects: {
    google: [String],
    openLibrary: [String]
  },
  
  language: {
    type: String,
    default: 'en'
  },
  coverImage: String,
  coverQualityScore: {
    type: Number,
    default: 0
  },
  
  // Library management fields
  status: {
    type: String,
    enum: ['to-read', 'reading', 'read', 'loaned'],
    default: 'to-read'
  },
  location: {
    type: String,
    default: ''
  },
  
  // User fields
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  notes: String,
  tags: [{
    type: String,
    index: true
  }],
  
  // Collections this book belongs to
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  }],
  
  // Metadata
  googleBooksId: String,
  dataSource: {
    type: String,
    enum: ['google', 'manual', 'enhanced'],
    default: 'google'
  },
  
  // Track metadata sources
  metadataSources: [{
    source: String,
    fetchedAt: Date
  }],
  
  addedDate: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastModified on save
BookSchema.pre('save', function(next) {
  this.lastModified = Date.now();
  next();
});

// Create text index for search
BookSchema.index({ 
  title: 'text', 
  authors: 'text', 
  description: 'text',
  tags: 'text'
});

module.exports = mongoose.model('Book', BookSchema);
