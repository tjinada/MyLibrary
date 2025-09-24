const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import models and services
const Book = require('../models/Book');
const multiGenreCategoryService = require('../services/multiGenreCategoryService');
const improvedCategoryService = require('../services/improvedCategoryService');

async function fixUncategorizedBooks() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mylibrary';
    console.log('Connecting to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Find all books with primaryCategory = "Uncategorized"
    const uncategorizedBooks = await Book.find({ 
      primaryCategory: 'Uncategorized' 
    });
    
    console.log(`Found ${uncategorizedBooks.length} books with "Uncategorized" primary category`);
    
    if (uncategorizedBooks.length === 0) {
      console.log('No uncategorized books found. All books are properly categorized!');
      return;
    }
    
    let fixedCount = 0;
    let failedCount = 0;
    const useMultiGenre = process.env.USE_MULTI_GENRE === 'true';
    
    for (const book of uncategorizedBooks) {
      try {
        console.log(`\nProcessing: ${book.title} (ISBN: ${book.isbn})`);
        console.log(`  Current genres: ${book.genres ? book.genres.join(', ') : 'none'}`);
        console.log(`  Current categoryType: ${book.categoryType || 'not set'}`);
        
        // Strategy 1: If book already has valid genres, use the first one
        if (book.genres && book.genres.length > 0) {
          // Filter out "Uncategorized" from genres
          const validGenres = book.genres.filter(g => g !== 'Uncategorized');
          
          if (validGenres.length > 0) {
            book.genres = validGenres;
            book.primaryCategory = validGenres[0];
            console.log(`  ✓ Using existing genre: ${book.primaryCategory}`);
          } else {
            // All genres were "Uncategorized", need to re-categorize
            console.log(`  All genres were "Uncategorized", re-categorizing...`);
            await recategorizeBook(book, useMultiGenre);
          }
        } 
        // Strategy 2: Re-categorize based on available data
        else {
          console.log(`  No genres found, re-categorizing...`);
          await recategorizeBook(book, useMultiGenre);
        }
        
        // Strategy 3: Final fallback - ensure we have something valid
        if (book.primaryCategory === 'Uncategorized' || !book.primaryCategory) {
          // Check if it's fiction or nonfiction based on existing data
          if (book.categoryType === 'Nonfiction') {
            book.primaryCategory = 'Nonfiction';
            if (!book.genres || book.genres.length === 0) {
              book.genres = ['Nonfiction'];
            }
          } else {
            // Default to Contemporary Fiction for fiction books
            book.primaryCategory = 'Contemporary Fiction';
            if (!book.genres || book.genres.length === 0) {
              book.genres = ['Contemporary Fiction'];
            }
          }
          console.log(`  ✓ Applied fallback category: ${book.primaryCategory}`);
        }
        
        // Ensure genres array is clean
        if (book.genres && book.genres.includes('Uncategorized')) {
          book.genres = book.genres.filter(g => g !== 'Uncategorized');
          if (book.genres.length === 0) {
            book.genres = [book.primaryCategory];
          }
        }
        
        // Save the updated book
        await book.save();
        fixedCount++;
        console.log(`  ✓ Fixed successfully!`);
        console.log(`  New primaryCategory: ${book.primaryCategory}`);
        console.log(`  New genres: ${book.genres.join(', ')}`);
        
      } catch (error) {
        console.error(`  ✗ Failed to fix book: ${error.message}`);
        failedCount++;
      }
    }
    
    console.log('\n========================================');
    console.log(`Migration Complete!`);
    console.log(`Fixed: ${fixedCount} books`);
    console.log(`Failed: ${failedCount} books`);
    console.log('========================================\n');
    
    // Verify no more uncategorized books
    const remainingUncategorized = await Book.countDocuments({ 
      primaryCategory: 'Uncategorized' 
    });
    
    if (remainingUncategorized > 0) {
      console.warn(`⚠ Warning: ${remainingUncategorized} books still have "Uncategorized" as primary category`);
      
      // List them for debugging
      const stillUncategorized = await Book.find({ 
        primaryCategory: 'Uncategorized' 
      }).select('isbn title primaryCategory genres');
      
      console.log('Books still uncategorized:');
      stillUncategorized.forEach(book => {
        console.log(`  - ${book.title} (ISBN: ${book.isbn})`);
      });
    } else {
      console.log('✓ All books have been properly categorized!');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

async function recategorizeBook(book, useMultiGenre) {
  let newCategory;
  
  // Gather all available text for categorization
  const subjects = [];
  
  // Use raw subjects if available
  if (book.rawSubjects) {
    if (book.rawSubjects.google) subjects.push(...book.rawSubjects.google);
    if (book.rawSubjects.openLibrary) subjects.push(...book.rawSubjects.openLibrary);
  }
  
  // Also use allSubjects if available
  if (book.allSubjects && book.allSubjects.length > 0) {
    subjects.push(...book.allSubjects);
  }
  
  // Fallback to existing genres (even if empty)
  if (subjects.length === 0 && book.genres) {
    subjects.push(...book.genres);
  }
  
  if (useMultiGenre) {
    // Use multi-genre categorization
    console.log(`  Using MultiGenreCategoryService...`);
    const categorization = multiGenreCategoryService.categorizeBook(
      subjects,
      book.title,
      book.description,
      book.authors
    );
    
    book.genres = categorization.genres;
    book.categoryType = categorization.categoryType;
    book.genreReasons = categorization.genreReasons;
    newCategory = categorization.genres[0];
  } else {
    // Use improved categorization
    console.log(`  Using ImprovedCategoryService...`);
    newCategory = improvedCategoryService.categorizeBook(
      subjects,
      book.title,
      book.description
    );
    
    book.genres = [newCategory];
    book.categoryType = improvedCategoryService.getParentCategory(newCategory);
  }
  
  book.primaryCategory = newCategory;
  console.log(`  ✓ Re-categorized to: ${newCategory}`);
}

// Run the migration
if (require.main === module) {
  fixUncategorizedBooks()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = fixUncategorizedBooks;
