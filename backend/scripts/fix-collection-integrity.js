/**
 * Utility script to fix collection-book relationships
 * Run with: node fix-collection-integrity.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Book = require('../models/Book');
const Collection = require('../models/Collection');
const CollectionBookService = require('../services/collectionBookService');

async function fixAllCollections() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mylibrary');
    console.log('✓ Connected to MongoDB');

    // Get all collections
    const collections = await Collection.find();
    console.log(`Found ${collections.length} collections to check`);

    let totalFixed = 0;
    let totalIssues = 0;

    for (const collection of collections) {
      console.log(`\nChecking collection: ${collection.name}`);
      
      // Validate collection
      const validation = await CollectionBookService.validateCollection(collection._id);
      
      if (!validation.isValid) {
        console.log(`  ⚠️  Found ${validation.issues.length} issues:`);
        validation.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
        
        totalIssues += validation.issues.length;
        
        // Fix the issues
        console.log(`  🔧 Fixing collection integrity...`);
        await CollectionBookService.fixCollectionIntegrity(collection._id);
        console.log(`  ✓ Fixed!`);
        totalFixed++;
      } else {
        console.log(`  ✓ No issues found`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total collections checked: ${collections.length}`);
    console.log(`   Collections with issues: ${totalFixed}`);
    console.log(`   Total issues fixed: ${totalIssues}`);

    // Final verification
    console.log(`\n🔍 Final verification:`);
    
    // Count books with proper collection references
    const booksInCollections = await Book.find({
      collections: { $exists: true, $ne: [] }
    }).countDocuments();
    
    const standaloneBooks = await Book.find({
      $or: [
        { collections: { $exists: false } },
        { collections: { $size: 0 } }
      ]
    }).countDocuments();
    
    const totalBooks = await Book.countDocuments();
    
    console.log(`   Total books: ${totalBooks}`);
    console.log(`   Books in collections: ${booksInCollections}`);
    console.log(`   Standalone books: ${standaloneBooks}`);
    console.log(`   Sum check: ${booksInCollections + standaloneBooks} (should equal ${totalBooks})`);
    
    if (booksInCollections + standaloneBooks === totalBooks) {
      console.log(`   ✅ All books accounted for!`);
    } else {
      console.log(`   ⚠️  Discrepancy detected!`);
    }

    console.log('\n✅ Complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
fixAllCollections();
