const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function forceRemovePrimaryCategory() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || 
                     process.env.MONGODB_URI || 
                     process.env.DATABASE_URL ||
                     'mongodb://mongodb:27017/home-library';
    
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to database');
    
    console.log('\n========================================');
    console.log('FORCE REMOVING primaryCategory field...');
    console.log('========================================\n');
    
    // Get the raw MongoDB collection (bypass Mongoose schema)
    const db = mongoose.connection.db;
    const booksCollection = db.collection('books');
    
    // Count documents with primaryCategory
    const beforeCount = await booksCollection.countDocuments({ 
      primaryCategory: { $exists: true } 
    });
    
    console.log(`Found ${beforeCount} books with primaryCategory field`);
    
    if (beforeCount === 0) {
      console.log('No books have primaryCategory field. Nothing to do!');
      return;
    }
    
    // Force remove using raw MongoDB operations
    console.log('Force removing primaryCategory field from all documents...');
    
    const result = await booksCollection.updateMany(
      {},  // Match all documents
      { $unset: { primaryCategory: "" } }
    );
    
    console.log(`\nModified ${result.modifiedCount} documents`);
    console.log(`Matched ${result.matchedCount} documents`);
    
    // Verify removal
    const afterCount = await booksCollection.countDocuments({ 
      primaryCategory: { $exists: true } 
    });
    
    if (afterCount === 0) {
      console.log('\n✓ SUCCESS: All primaryCategory fields have been removed!');
    } else {
      console.log(`\n⚠️ WARNING: ${afterCount} books still have primaryCategory field`);
      
      // List them for debugging
      const remaining = await booksCollection.find(
        { primaryCategory: { $exists: true } },
        { projection: { isbn: 1, title: 1, primaryCategory: 1 } }
      ).limit(5).toArray();
      
      console.log('Sample of remaining books with primaryCategory:');
      remaining.forEach(book => {
        console.log(`  - ${book.title} (${book.isbn}): ${book.primaryCategory}`);
      });
    }
    
    console.log('\n========================================');
    console.log('Force removal complete!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('Force removal failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  forceRemovePrimaryCategory()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = forceRemovePrimaryCategory;
