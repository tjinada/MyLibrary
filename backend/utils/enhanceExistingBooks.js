/**
 * Utility script to enhance existing books in the database with BISAC categories
 * Run this manually when needed: node backend/utils/enhanceExistingBooks.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const bookMetadataService = require('../services/bookMetadataService');

async function enhanceExistingBooks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/home-library');
    console.log('Connected to MongoDB');
    
    // Get all books that don't have BISAC categories
    const books = await Book.find({ 
      $or: [
        { bisacCategories: { $exists: false } },
        { bisacCategories: { $size: 0 } }
      ]
    });
    
    console.log(`Found ${books.length} books to enhance`);
    
    let enhanced = 0;
    let failed = 0;
    
    for (const book of books) {
      if (!book.isbn) {
        console.log(`Skipping book without ISBN: ${book.title}`);
        continue;
      }
      
      try {
        console.log(`Enhancing: ${book.title} (${book.isbn})`);
        
        // Fetch enhanced metadata
        const enhancedData = await bookMetadataService.fetchEnhancedBookData(book.isbn);
        
        if (enhancedData && enhancedData.bisacCategories) {
          // Update the book with new metadata
          book.bisacCategories = enhancedData.bisacCategories;
          book.rawSubjects = enhancedData.rawSubjects;
          book.metadataSources = enhancedData.metadataSources;
          
          // Update genres if we got better ones
          if (enhancedData.genres && enhancedData.genres.length > 0) {
            book.genres = enhancedData.genres;
          }
          
          book.dataSource = 'enhanced';
          await book.save();
          
          enhanced++;
          console.log(`✓ Enhanced: ${book.title}`);
        } else {
          console.log(`No enhanced data available for: ${book.title}`);
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`✗ Failed to enhance ${book.title}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\nEnhancement complete!`);
    console.log(`Successfully enhanced: ${enhanced} books`);
    console.log(`Failed: ${failed} books`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  enhanceExistingBooks();
}

module.exports = enhanceExistingBooks;
