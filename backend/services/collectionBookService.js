const mongoose = require('mongoose');
const Collection = require('../models/Collection');
const Book = require('../models/Book');

class CollectionBookService {
  /**
   * Add a book to a collection without transactions
   * @param {String} collectionId 
   * @param {String} bookId 
   * @returns {Object} Updated collection and book
   */
  static async addBookToCollection(collectionId, bookId) {
    try {
      // Find collection and book
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      const book = await Book.findById(bookId);
      if (!book) {
        throw new Error('Book not found');
      }
      
      // Add book to collection if not already present
      let collectionUpdated = false;
      if (!collection.books.some(id => id.equals(bookId))) {
        collection.books.push(bookId);
        
        // If it's a series, also add to bookOrder
        if (collection.collectionType === 'series') {
          if (!collection.bookOrder.some(id => id.equals(bookId))) {
            collection.bookOrder.push(bookId);
          }
        }
        
        collection.bookCount = collection.books.length;
        
        // Set cover if this is the first book
        if (!collection.coverBookId && collection.books.length === 1) {
          collection.coverBookId = bookId;
        }
        
        await collection.save();
        collectionUpdated = true;
      }
      
      // Add collection to book if not already present
      if (!book.collections.some(id => id.equals(collectionId))) {
        book.collections.push(collectionId);
        await book.save();
      }
      
      // Populate and return
      if (collectionUpdated) {
        await collection.populate('books');
      }
      
      return { collection, book };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Remove a book from a collection without transactions
   * @param {String} collectionId 
   * @param {String} bookId 
   * @returns {Object} Updated collection
   */
  static async removeBookFromCollection(collectionId, bookId) {
    try {
      // Update collection
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      // Remove book from collection
      collection.books = collection.books.filter(id => !id.equals(bookId));
      collection.bookOrder = collection.bookOrder.filter(id => !id.equals(bookId));
      collection.bookCount = collection.books.length;
      
      // Update cover if needed
      if (collection.coverBookId && collection.coverBookId.equals(bookId)) {
        collection.coverBookId = collection.books.length > 0 ? collection.books[0] : null;
      }
      
      await collection.save();
      
      // Update book (remove collection reference)
      // Using updateOne to avoid issues if book was deleted
      await Book.updateOne(
        { _id: bookId },
        { $pull: { collections: collectionId } }
      );
      
      // Populate and return
      await collection.populate('books');
      return { collection };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Bulk add books to a collection without transactions
   * @param {String} collectionId 
   * @param {Array<String>} bookIds 
   * @returns {Object} Updated collection
   */
  static async bulkAddBooks(collectionId, bookIds) {
    try {
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      // Validate all books exist
      const books = await Book.find({ _id: { $in: bookIds } });
      if (books.length !== bookIds.length) {
        // Some books not found, but continue with the ones that exist
        console.log(`Warning: Only found ${books.length} of ${bookIds.length} books`);
      }
      
      // Add books to collection
      let added = 0;
      for (const bookId of bookIds) {
        if (!collection.books.some(id => id.equals(bookId))) {
          collection.books.push(bookId);
          added++;
          
          if (collection.collectionType === 'series') {
            if (!collection.bookOrder.some(id => id.equals(bookId))) {
              collection.bookOrder.push(bookId);
            }
          }
        }
      }
      
      collection.bookCount = collection.books.length;
      
      // Set cover if needed
      if (!collection.coverBookId && collection.books.length > 0) {
        collection.coverBookId = collection.books[0];
      }
      
      // Save collection if any books were added
      if (added > 0) {
        await collection.save();
        
        // Update all books to include this collection
        // Use updateMany for efficiency
        await Book.updateMany(
          { 
            _id: { $in: bookIds },
            collections: { $ne: collectionId }
          },
          { 
            $addToSet: { collections: collectionId } 
          }
        );
      }
      
      // Populate and return
      await collection.populate('books');
      return collection;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Delete a collection and clean up all references without transactions
   * @param {String} collectionId 
   * @returns {Boolean} Success
   */
  static async deleteCollection(collectionId) {
    try {
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      // Remove collection reference from all books (DO NOT DELETE THE BOOKS)
      if (collection.books.length > 0) {
        await Book.updateMany(
          { _id: { $in: collection.books } },
          { $pull: { collections: collectionId } }
        );
      }
      
      // Delete the collection
      await collection.deleteOne();
      
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Validate collection data integrity
   * @param {String} collectionId 
   * @returns {Object} Validation results
   */
  static async validateCollection(collectionId) {
    const collection = await Collection.findById(collectionId).populate('books');
    if (!collection) {
      throw new Error('Collection not found');
    }
    
    const issues = [];
    
    // Check book count
    if (collection.bookCount !== collection.books.length) {
      issues.push(`Book count mismatch: stored ${collection.bookCount}, actual ${collection.books.length}`);
    }
    
    // Check bidirectional references
    for (const book of collection.books) {
      if (!book.collections.some(id => id.equals(collectionId))) {
        issues.push(`Book ${book._id} doesn't reference collection ${collectionId}`);
      }
    }
    
    // Check series order
    if (collection.collectionType === 'series') {
      const bookIdSet = new Set(collection.books.map(b => b._id.toString()));
      const orderIdSet = new Set(collection.bookOrder.map(id => id.toString()));
      
      for (const bookId of bookIdSet) {
        if (!orderIdSet.has(bookId)) {
          issues.push(`Book ${bookId} is in collection but not in bookOrder`);
        }
      }
    }
    
    return {
      id: collection._id,
      name: collection.name,
      bookCount: collection.bookCount,
      actualBookCount: collection.books.length,
      bookIds: collection.books.map(b => b._id),
      coverBookId: collection.coverBookId,
      isValid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Fix collection data integrity issues without transactions
   * @param {String} collectionId 
   * @returns {Object} Fixed collection
   */
  static async fixCollectionIntegrity(collectionId) {
    try {
      const collection = await Collection.findById(collectionId);
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      // Fix book count
      collection.bookCount = collection.books.length;
      
      // Fix cover if needed
      if (!collection.coverBookId && collection.books.length > 0) {
        collection.coverBookId = collection.books[0];
      }
      
      // Fix series order
      if (collection.collectionType === 'series') {
        const bookSet = new Set(collection.books.map(id => id.toString()));
        collection.bookOrder = collection.bookOrder.filter(id => bookSet.has(id.toString()));
        
        // Add missing books to order
        for (const bookId of collection.books) {
          if (!collection.bookOrder.some(id => id.equals(bookId))) {
            collection.bookOrder.push(bookId);
          }
        }
      }
      
      await collection.save();
      
      // Fix bidirectional references
      // Use updateMany to add this collection to all books that don't have it
      if (collection.books.length > 0) {
        await Book.updateMany(
          { 
            _id: { $in: collection.books },
            collections: { $ne: collectionId }
          },
          { 
            $addToSet: { collections: collectionId } 
          }
        );
      }
      
      await collection.populate('books');
      return collection;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CollectionBookService;
