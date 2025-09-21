/**
 * Migration script to add edition field to existing books
 * Run this script once after deploying the schema update
 * 
 * Usage: node backend/migrations/addEditionField.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Book = require('../models/Book');

async function migrate() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mylibrary';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all books without an edition field
    const booksWithoutEdition = await Book.find({ 
      edition: { $exists: false } 
    });

    console.log(`Found ${booksWithoutEdition.length} books without edition field`);

    if (booksWithoutEdition.length === 0) {
      console.log('No books need updating');
      return;
    }

    // Update each book with default edition
    let updatedCount = 0;
    for (const book of booksWithoutEdition) {
      book.edition = 'standard';
      await book.save();
      updatedCount++;
      
      if (updatedCount % 10 === 0) {
        console.log(`Updated ${updatedCount} books...`);
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} books with default edition`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run migration
migrate();
