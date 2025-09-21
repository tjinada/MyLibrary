/**
 * Utility script to validate and update covers for all books in the database
 * Run this script with: node backend/utils/validateAllCovers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const coverValidationService = require('../services/coverValidationService');

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
 * Validate covers for all books
 * @param {boolean} force - Force revalidation even if book has a quality score
 * @param {number} batchSize - Number of books to process at once
 */
async function validateAllCovers(force = false, batchSize = 10) {
  try {
    await connectDB();
    
    // Build query
    const query = {};
    if (!force) {
      // Only get books that haven't been validated
      query.$or = [
        { coverQualityScore: { $exists: false } },
        { coverQualityScore: 0 }
      ];
    }
    
    const totalBooks = await Book.countDocuments(query);
    console.log(`Found ${totalBooks} books to validate`);
    
    if (totalBooks === 0) {
      console.log('No books need validation');
      return;
    }
    
    let processed = 0;
    let updated = 0;
    let noValidCover = 0;
    let failed = 0;
    
    // Process in batches to avoid overwhelming the APIs
    while (processed < totalBooks) {
      const books = await Book.find(query)
        .skip(processed)
        .limit(batchSize);
      
      if (books.length === 0) break;
      
      console.log(`\nProcessing batch ${Math.floor(processed / batchSize) + 1} (${books.length} books)`);
      
      for (const book of books) {
        try {
          console.log(`  Validating: "${book.title}" by ${book.authors[0] || 'Unknown'}`);
          
          const bestCover = await coverValidationService.findBestCover(
            book.isbn,
            book.googleBooksId,
            book.coverImage
          );
          
          if (bestCover) {
            if (book.coverImage !== bestCover.url || book.coverQualityScore !== bestCover.score) {
              book.coverImage = bestCover.url;
              book.coverQualityScore = bestCover.score;
              book.lastModified = Date.now();
              await book.save();
              
              console.log(`    ✓ Updated with ${bestCover.url.includes('openlibrary') ? 'Open Library' : 'Google Books'} cover (score: ${bestCover.score})`);
              updated++;
            } else {
              console.log(`    - No change needed (score: ${bestCover.score})`);
            }
          } else {
            book.coverImage = null;
            book.coverQualityScore = 0;
            book.lastModified = Date.now();
            await book.save();
            
            console.log(`    ✗ No valid JPEG cover found`);
            noValidCover++;
          }
          
        } catch (error) {
          console.error(`    ✗ Error: ${error.message}`);
          failed++;
        }
        
        processed++;
        
        // Add a small delay between books to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Progress report
      const percentage = Math.round((processed / totalBooks) * 100);
      console.log(`\nProgress: ${processed}/${totalBooks} (${percentage}%)`);
      console.log(`Updated: ${updated}, No valid cover: ${noValidCover}, Failed: ${failed}`);
      
      // Delay between batches
      if (processed < totalBooks) {
        console.log('Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n=== Final Results ===');
    console.log(`Total processed: ${processed}`);
    console.log(`Updated: ${updated}`);
    console.log(`No valid cover: ${noValidCover}`);
    console.log(`Failed: ${failed}`);
    
    // Show detailed cache stats
    const cacheStats = coverValidationService.getCacheStats();
    console.log(`\nCache Statistics:`);
    console.log(`  Validation cache: ${cacheStats.validationCacheSize} entries`);
    console.log(`  OpenLibrary API cache: ${cacheStats.openLibraryCacheSize} entries`);
    console.log(`  Total cache size: ${cacheStats.totalCacheSize} entries`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f');
const batchSizeArg = args.find(arg => arg.startsWith('--batch='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 10;

console.log('=== Book Cover Validation Script ===');
console.log(`Force revalidation: ${force}`);
console.log(`Batch size: ${batchSize}`);
console.log('');

// Run the validation
validateAllCovers(force, batchSize);
