const mongoose = require('mongoose');

const CustomShelfSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  filters: {
    // Genre filters
    genre: {
      type: [String],
      default: []
    },
    excludeGenres: {
      type: [String],
      default: []
    },
    
    // Status filter
    status: {
      type: String,
      enum: ['all', 'to-read', 'reading', 'read', 'loaned'],
      default: 'all'
    },
    
    // Edition filters
    includeEditions: {
      type: [String],
      enum: ['standard', 'signed', 'deluxe'],
      default: []
    },
    excludeEditions: {
      type: [String],
      enum: ['standard', 'signed', 'deluxe'],
      default: []
    },
    
    // Collection filters
    includeCollections: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Collection',
      default: []
    },
    excludeCollections: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Collection',
      default: []
    },
    
    // Sort order
    sort: {
      type: String,
      default: 'title'
    }
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique shelf names per user
CustomShelfSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('CustomShelf', CustomShelfSchema);
