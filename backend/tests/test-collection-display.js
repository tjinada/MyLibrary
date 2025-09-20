/**
 * Test script for collection display logic
 * Run with: node test-collection-display.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Book = require('../models/Book');
const Collection = require('../models/Collection');

async function testCollectionDisplay() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mylibrary');
    console.log('✓ Connected to MongoDB');

    // Get stats
    const totalBooks = await Book.countDocuments();
    const totalCollections = await Collection.countDocuments();
    
    console.log(`\n📊 Library Stats:`);
    console.log(`   Total Books: ${totalBooks}`);
    console.log(`   Total Collections: ${totalCollections}`);

    // Find books in collections
    const booksWithCollections = await Book.find({ 
      collections: { $exists: true, $ne: [] } 
    }).select('title collections');
    
    const standaloneBooks = await Book.find({
      $or: [
        { collections: { $exists: false } },
        { collections: { $size: 0 } }
      ]
    }).select('title');

    console.log(`\n📚 Book Distribution:`);
    console.log(`   Books in Collections: ${booksWithCollections.length}`);
    console.log(`   Standalone Books: ${standaloneBooks.length}`);
    
    // Verify collection integrity
    const collections = await Collection.find().populate('books', 'title');
    
    console.log(`\n📦 Collections:`);
    for (const collection of collections) {
      console.log(`   - ${collection.name}: ${collection.books.length} books`);
      
      // Check if all books reference this collection
      let missingReferences = 0;
      for (const book of collection.books) {
        const fullBook = await Book.findById(book._id);
        if (!fullBook.collections.includes(collection._id)) {
          missingReferences++;
        }
      }
      
      if (missingReferences > 0) {
        console.log(`     ⚠️  ${missingReferences} books don't reference this collection back`);
      }
    }

    // Test scenarios
    console.log(`\n🧪 Test Scenarios:`);
    
    // Scenario 1: Normal library view (no search/filter)
    console.log(`\n1. Normal Library View:`);
    console.log(`   Should show: ${standaloneBooks.length} standalone books + ${totalCollections} collections`);
    console.log(`   Should hide: ${booksWithCollections.length} books that are in collections`);
    
    // Scenario 2: Search active
    console.log(`\n2. Search Active (e.g., searching for "Harry"):`);
    console.log(`   Should show: ALL matching books (both standalone and in collections)`);
    console.log(`   Should show: Collections with matching names`);
    
    // Scenario 3: Genre filter
    console.log(`\n3. Genre Filter Active:`);
    console.log(`   Should show: ALL books matching the genre (both standalone and in collections)`);
    console.log(`   Collections should remain visible`);

    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testCollectionDisplay();
