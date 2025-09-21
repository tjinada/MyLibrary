/**
 * Migration script to update existing books with cover source information
 * Run this script with: node backend/utils/migrateCoverSources.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/home-library', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Migrate cover sources for existing books
 */
async function migrateCoverSources() {
  try {
    await connectDB();
    
    // Find all books that have a cover but no source
    const books = await Book.find({
      coverImage: { $exists: true, $ne: null },
      coverImageSource: { $exists: false }
    });
    
    console.log(`Found ${books.length} books to migrate`);
    
    let updated = 0;
    let googleCovers = 0;
    let openLibraryCovers = 0;
    let otherCovers = 0;
    
    for (const book of books) {
      let source = 'other';
      
      if (book.coverImage.includes('openlibrary.org')) {
        source = 'openlibrary';
        openLibraryCovers++;
      } else if (book.coverImage.includes('google')) {
        source = 'google';
        googleCovers++;
      } else if (book.coverImage.includes('googleapis.com')) {
        source = 'google';
        googleCovers++;
      } else {
        otherCovers++;
      }
      
      book.coverImageSource = source;
      await book.save();
      updated++;
      
      if (updated % 10 === 0) {
        console.log(`Progress: ${updated}/${books.length} books migrated`);
      }
    }
    
    // Also update books without covers
    const noCoverBooks = await Book.find({
      $or: [
        { coverImage: { $exists: false } },
        { coverImage: null },
        { coverImage: '' }
      ],
      coverImageSource: { $exists: false }
    });
    
    console.log(`Found ${noCoverBooks.length} books without covers`);
    
    for (const book of noCoverBooks) {
      book.coverImageSource = 'none';
      await book.save();
      updated++;
    }
    
    console.log('\n=== Migration Complete ===');
    console.log(`Total books migrated: ${updated}`);
    console.log(`Google covers: ${googleCovers}`);
    console.log(`OpenLibrary covers: ${openLibraryCovers}`);
    console.log(`Other covers: ${otherCovers}`);
    console.log(`No covers: ${noCoverBooks.length}`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run the migration
console.log('=== Cover Source Migration Script ===');
console.log('This will update all existing books with cover source information');
console.log('');

migrateCoverSources();
