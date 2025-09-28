/**
 * Migration script to convert existing books to use the copies structure
 * This is optional - the system will handle this automatically when books are edited
 * But this script can be run to migrate all books at once
 */

const mongoose = require('mongoose');
const Book = require('../models/Book');
require('dotenv').config({ path: '../.env' });

async function migrateToCopiesStructure() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mylibrary');
    console.log('Connected to MongoDB');

    // Find all books without copies array
    const booksWithoutCopies = await Book.find({
      $or: [
        { copies: { $exists: false } },
        { copies: { $size: 0 } }
      ]
    });

    console.log(`Found ${booksWithoutCopies.length} books to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const book of booksWithoutCopies) {
      try {
        const quantity = book.quantity || 1;
        const copies = [];

        // Create copy entries based on quantity
        for (let i = 0; i < quantity; i++) {
          copies.push({
            copyNumber: i + 1,
            edition: book.edition || 'standard',
            status: book.status || 'to-read',
            rating: i === 0 ? (book.rating || 0) : 0, // First copy gets the book's rating
            notes: i === 0 ? (book.notes || '') : '', // First copy gets the book's notes
            loanedTo: '',
            loanedDate: null
          });
        }

        // Update the book with copies
        book.copies = copies;
        await book.save();

        migratedCount++;
        console.log(`✓ Migrated: ${book.title} (${quantity} ${quantity === 1 ? 'copy' : 'copies'})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to migrate ${book.title}:`, error.message);
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Successfully migrated: ${migratedCount} books`);
    console.log(`Failed: ${errorCount} books`);

    // Verify migration
    const totalBooks = await Book.countDocuments();
    const booksWithCopies = await Book.countDocuments({ 
      copies: { $exists: true, $ne: [] } 
    });

    console.log(`\nVerification: ${booksWithCopies}/${totalBooks} books have copies structure`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  migrateToCopiesStructure();
}

module.exports = migrateToCopiesStructure;
