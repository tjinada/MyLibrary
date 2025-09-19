const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Book = require('../models/Book');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function migrateBooks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Update all books that don't have a collections field
    const result = await Book.updateMany(
      { collections: { $exists: false } },
      { $set: { collections: [] } }
    );
    
    console.log(`Updated ${result.modifiedCount} books with empty collections array`);
    
    // Verify the migration
    const booksWithoutCollections = await Book.countDocuments({ 
      collections: { $exists: false } 
    });
    
    if (booksWithoutCollections === 0) {
      console.log('Migration successful! All books now have a collections field.');
    } else {
      console.log(`Warning: ${booksWithoutCollections} books still missing collections field`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the migration
migrateBooks();
