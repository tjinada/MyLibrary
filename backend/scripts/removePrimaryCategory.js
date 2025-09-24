const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import the Book model
const Book = require('../models/Book');

async function removePrimaryCategory() {
  try {
    // Connect to database
    // Try different possible environment variable names and connection strings
    const mongoUri = process.env.MONGO_URI || 
                     process.env.MONGODB_URI || 
                     process.env.DATABASE_URL ||
                     'mongodb://mongodb:27017/home-library';
    
    console.log('Connecting to MongoDB:', mongoUri);
    
    // Remove deprecated options for newer MongoDB drivers
    await mongoose.connect(mongoUri);
    
    console.log('Connected to database');
    console.log('\n========================================');
    console.log('Starting primaryCategory field removal...');
    console.log('========================================\n');
    
    // First, let's see how many books have primaryCategory
    const booksWithPrimaryCategory = await Book.countDocuments({ 
      primaryCategory: { $exists: true } 
    });
    
    console.log(`Found ${booksWithPrimaryCategory} books with primaryCategory field`);
    
    if (booksWithPrimaryCategory === 0) {
      console.log('No books have primaryCategory field. Nothing to do!');
      return;
    }
    
    // Find books where primaryCategory doesn't match first genre (potential issues)
    const mismatchedBooks = await Book.find({
      primaryCategory: { $exists: true },
      genres: { $exists: true, $ne: [] }
    });
    
    let mismatchCount = 0;
    const mismatches = [];
    
    for (const book of mismatchedBooks) {
      if (book.primaryCategory && book.genres && book.genres.length > 0) {
        // Check if primaryCategory is not in the genres array
        if (!book.genres.includes(book.primaryCategory)) {
          mismatchCount++;
          mismatches.push({
            isbn: book.isbn,
            title: book.title,
            primaryCategory: book.primaryCategory,
            genres: book.genres,
            categoryType: book.categoryType
          });
        }
      }
    }
    
    if (mismatchCount > 0) {
      console.log(`\n⚠️  Found ${mismatchCount} books with mismatched primaryCategory:`);
      console.log('These books have primaryCategory that doesn\'t match their genres:\n');
      
      mismatches.forEach(book => {
        console.log(`  📚 ${book.title} (ISBN: ${book.isbn})`);
        console.log(`     Primary Category: ${book.primaryCategory}`);
        console.log(`     Actual Genres: ${book.genres.join(', ')}`);
        console.log(`     Category Type: ${book.categoryType || 'not set'}`);
        console.log('');
      });
      
      console.log('These mismatches will be resolved by removing primaryCategory.');
      console.log('The genres array will be the source of truth.\n');
    } else {
      console.log('✓ No mismatched primaryCategory fields found');
    }
    
    // Remove primaryCategory field from all documents
    console.log('Removing primaryCategory field from all books...');
    
    const result = await Book.updateMany(
      { primaryCategory: { $exists: true } },
      { $unset: { primaryCategory: "" } }
    );
    
    console.log(`\n✓ Successfully updated ${result.modifiedCount} books`);
    
    // Verify removal
    const remainingWithPrimaryCategory = await Book.countDocuments({ 
      primaryCategory: { $exists: true } 
    });
    
    if (remainingWithPrimaryCategory === 0) {
      console.log('✓ All primaryCategory fields have been removed successfully!');
    } else {
      console.warn(`⚠️  Warning: ${remainingWithPrimaryCategory} books still have primaryCategory field`);
    }
    
    // Final check - ensure all books have genres
    const booksWithoutGenres = await Book.countDocuments({
      $or: [
        { genres: { $exists: false } },
        { genres: { $size: 0 } }
      ]
    });
    
    if (booksWithoutGenres > 0) {
      console.warn(`\n⚠️  Warning: ${booksWithoutGenres} books have no genres`);
      console.log('Running genre fix...');
      
      const booksToFix = await Book.find({
        $or: [
          { genres: { $exists: false } },
          { genres: { $size: 0 } }
        ]
      });
      
      for (const book of booksToFix) {
        const defaultGenre = book.categoryType === 'Nonfiction' ? 'Nonfiction' : 'Fiction';
        book.genres = [defaultGenre];
        await book.save();
        console.log(`  Fixed: ${book.title} - Added genre: ${defaultGenre}`);
      }
      
      console.log('✓ Genre fix completed');
    } else {
      console.log('\n✓ All books have at least one genre');
    }
    
    console.log('\n========================================');
    console.log('Migration Complete!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  removePrimaryCategory()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = removePrimaryCategory;
