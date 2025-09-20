const mongoose = require('mongoose');
const Collection = require('../models/Collection');
const Book = require('../models/Book');

class CollectionBookService {
  /**
   * Add a book to a collection with proper synchronization
   * @param {String} collectionId 
   * @param {String} bookId 
   * @returns {Object} Updated collection and book
   */
  static async addBookToCollection(collectionId, bookId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Update collection
      const collection = await Collection.findById(collectionId).session(session);
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      const book = await Book.findById(bookId).session(session);
      if (!book) {
        throw new Error('Book not found');
      }
      
      // Add book to collection if not already present
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
        
        await collection.save({ session });
      }
      
      // Add collection to book if not already present
      if (!book.collections.some(id => id.equals(collectionId))) {
        book.collections.push(collectionId);
        await book.save({ session });
      }
      
      await session.commitTransaction();
      
      // Populate and return
      await collection.populate('books');
      return { collection, book };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Remove a book from a collection with proper synchronization
   * @param {String} collectionId 
   * @param {String} bookId 
   * @returns {Object} Updated collection
   */
  static async removeBookFromCollection(collectionId, bookId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Update collection
      const collection = await Collection.findById(collectionId).session(session);
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
      
      await collection.save({ session });
      
      // Update book (remove collection reference)
      const book = await Book.findById(bookId).session(session);
      if (book) {
        book.collections = book.collections.filter(id => !id.equals(collectionId));
        await book.save({ session });
      }
      
      await session.commitTransaction();
      
      // Populate and return
      await collection.populate('books');
      return { collection };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Bulk add books to a collection
   * @param {String} collectionId 
   * @param {Array<String>} bookIds 
   * @returns {Object} Updated collection
   */
  static async bulkAddBooks(collectionId, bookIds) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const collection = await Collection.findById(collectionId).session(session);
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      // Validate all books exist
      const books = await Book.find({ _id: { $in: bookIds } }).session(session);
      if (books.length !== bookIds.length) {
        throw new Error('Some books not found');
      }
      
      // Add books to collection
      for (const bookId of bookIds) {
        if (!collection.books.some(id => id.equals(bookId))) {
          collection.books.push(bookId);
          
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
      
      await collection.save({ session });
      
      // Update all books to include this collection
      await Book.updateMany(
        { 
          _id: { $in: bookIds },
          collections: { $ne: collectionId }
        },
        { 
          $addToSet: { collections: collectionId } 
        },
        { session }
      );
      
      await session.commitTransaction();
      
      // Populate and return
      await collection.populate('books');
      return collection;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Delete a collection and clean up all references
   * @param {String} collectionId 
   * @returns {Boolean} Success
   */
  static async deleteCollection(collectionId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const collection = await Collection.findById(collectionId).session(session);
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      // Remove collection reference from all books (DO NOT DELETE THE BOOKS)
      if (collection.books.length > 0) {
        await Book.updateMany(
          { _id: { $in: collection.books } },
          { $pull: { collections: collectionId } },
          { session }
        );
      }
      
      // Delete the collection
      await collection.deleteOne({ session });
      
      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
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
   * Fix collection data integrity issues
   * @param {String} collectionId 
   * @returns {Object} Fixed collection
   */
  static async fixCollectionIntegrity(collectionId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const collection = await Collection.findById(collectionId).session(session);
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
      
      await collection.save({ session });
      
      // Fix bidirectional references
      for (const bookId of collection.books) {
        await Book.updateOne(
          { 
            _id: bookId,
            collections: { $ne: collectionId }
          },
          { 
            $addToSet: { collections: collectionId } 
          },
          { session }
        );
      }
      
      await session.commitTransaction();
      
      await collection.populate('books');
      return collection;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = CollectionBookService;
