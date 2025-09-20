/**
 * Migration script to fix existing collections with data integrity issues
 * Run this script to fix collections where the first book is missing or 
 * where book counts don't match the actual number of books
 */

const mongoose = require('mongoose');
const Collection = require('../models/Collection');
const Book = require('../models/Book');
const CollectionBookService = require('../services/collectionBookService');

// Load environment variables
require('dotenv').config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mylibrary';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

async function validateAllCollections() {
  console.log('\n=== Validating All Collections ===\n');
  
  const collections = await Collection.find();
  const issues = [];
  
  for (const collection of collections) {
    try {
      const validation = await CollectionBookService.validateCollection(collection._id);
      
      if (!validation.isValid) {
        issues.push({
          id: collection._id,
          name: collection.name,
          issues: validation.issues
        });
        
        console.log(`❌ Collection "${collection.name}" has issues:`);
        validation.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      } else {
        console.log(`✅ Collection "${collection.name}" is valid`);
      }
    } catch (error) {
      console.error(`Error validating collection ${collection.name}:`, error.message);
    }
  }
  
  return issues;
}

async function fixAllCollections() {
  console.log('\n=== Fixing Collection Issues ===\n');
  
  const collections = await Collection.find();
  let fixedCount = 0;
  let errorCount = 0;
  
  for (const collection of collections) {
    try {
      console.log(`Fixing collection "${collection.name}"...`);
      
      const fixed = await CollectionBookService.fixCollectionIntegrity(collection._id);
      
      console.log(`✅ Fixed collection "${collection.name}"`);
      console.log(`   - Book count: ${fixed.bookCount}`);
      console.log(`   - Cover book: ${fixed.coverBookId ? 'Set' : 'None'}`);
      
      fixedCount++;
    } catch (error) {
      console.error(`❌ Error fixing collection "${collection.name}":`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Fixed: ${fixedCount} collections`);
  console.log(`Errors: ${errorCount} collections`);
}

async function checkOrphanedReferences() {
  console.log('\n=== Checking for Orphaned References ===\n');
  
  // Check books referencing non-existent collections
  const books = await Book.find({ collections: { $exists: true, $ne: [] } });
  const collectionIds = await Collection.find().distinct('_id');
  const collectionIdStrings = collectionIds.map(id => id.toString());
  
  let orphanedCount = 0;
  
  for (const book of books) {
    const orphanedRefs = book.collections.filter(
      colId => !collectionIdStrings.includes(colId.toString())
    );
    
    if (orphanedRefs.length > 0) {
      console.log(`Book "${book.title}" references non-existent collections:`, orphanedRefs);
      
      // Clean up orphaned references
      book.collections = book.collections.filter(
        colId => collectionIdStrings.includes(colId.toString())
      );
      await book.save();
      orphanedCount++;
    }
  }
  
  if (orphanedCount > 0) {
    console.log(`\nCleaned ${orphanedCount} books with orphaned collection references`);
  } else {
    console.log('No orphaned references found');
  }
}

async function generateReport() {
  console.log('\n=== Collection Statistics Report ===\n');
  
  const collections = await Collection.find().populate('books');
  
  let totalCollections = collections.length;
  let totalBooksInCollections = 0;
  let emptyCollections = 0;
  let seriesCollections = 0;
  let customCollections = 0;
  let themeCollections = 0;
  
  for (const collection of collections) {
    totalBooksInCollections += collection.books.length;
    
    if (collection.books.length === 0) {
      emptyCollections++;
    }
    
    switch (collection.collectionType) {
      case 'series':
        seriesCollections++;
        break;
      case 'custom':
        customCollections++;
        break;
      case 'theme':
        themeCollections++;
        break;
    }
  }
  
  console.log(`Total Collections: ${totalCollections}`);
  console.log(`  - Series: ${seriesCollections}`);
  console.log(`  - Custom: ${customCollections}`);
  console.log(`  - Theme: ${themeCollections}`);
  console.log(`Empty Collections: ${emptyCollections}`);
  console.log(`Total Books in Collections: ${totalBooksInCollections}`);
  console.log(`Average Books per Collection: ${(totalBooksInCollections / totalCollections).toFixed(2)}`);
  
  // Find the largest collection
  const largestCollection = collections.reduce((largest, current) => 
    current.books.length > (largest?.books.length || 0) ? current : largest
  , null);
  
  if (largestCollection) {
    console.log(`\nLargest Collection: "${largestCollection.name}" with ${largestCollection.books.length} books`);
  }
}

async function main() {
  console.log('Starting Collection Migration Script...\n');
  
  await connectDB();
  
  try {
    // Step 1: Validate all collections
    const issues = await validateAllCollections();
    
    if (issues.length > 0) {
      console.log(`\nFound ${issues.length} collections with issues.`);
      
      // Ask for confirmation before fixing
      console.log('\nProceeding to fix all issues...');
      
      // Step 2: Fix all collections
      await fixAllCollections();
    } else {
      console.log('\nAll collections are valid!');
    }
    
    // Step 3: Check for orphaned references
    await checkOrphanedReferences();
    
    // Step 4: Generate report
    await generateReport();
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the migration
main().catch(console.error);
