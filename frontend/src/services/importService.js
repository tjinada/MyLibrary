import Papa from 'papaparse';
import bookService from './bookService';
import collectionService from './collectionService';

class ImportService {
  /**
   * Parse CSV file content
   * @param {File} file - The CSV file to parse
   * @returns {Promise} - Parsed data
   */
  parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * Import books from CSV
   * @param {Array} booksData - Parsed CSV data for books
   * @returns {Object} - Import results
   */
  async importBooks(booksData) {
    const results = {
      success: [],
      failed: [],
      duplicates: [],
      total: booksData.length
    };

    for (const row of booksData) {
      try {
        // Parse the book data from CSV format
        const bookData = {
          isbn: row.ISBN,
          title: row.Title,
          authors: row.Authors ? row.Authors.split('; ').filter(a => a) : [],
          publisher: row.Publisher,
          publishedDate: row.PublishedDate,
          pageCount: parseInt(row.PageCount) || 0,
          language: row.Language,
          description: row.Description ? row.Description.replace(/\\n/g, '\n') : '', // Restore newlines
          primaryCategory: row.PrimaryCategory,
          categoryType: row.CategoryType,
          genres: row.Genres ? row.Genres.split('; ').filter(g => g) : [],
          tags: row.Tags ? row.Tags.split('; ').filter(t => t) : [],
          status: row.Status || 'to-read',
          rating: parseFloat(row.Rating) || 0,
          notes: row.Notes ? row.Notes.replace(/\\n/g, '\n') : '', // Restore newlines
          edition: row.Edition || 'standard',
          quantity: parseInt(row.Quantity) || 1,
          coverImage: row.CoverImage,
          coverImageSource: row.CoverImageSource,
          googleBooksId: row.GoogleBooksId,
          addedDate: row.AddedDate,
          // Keep original dates if available
          createdAt: row.CreatedDate,
          updatedAt: row.UpdatedDate,
        };

        // Try to add the book
        const response = await bookService.addBook(bookData);
        results.success.push({
          isbn: bookData.isbn,
          title: bookData.title,
          response
        });

      } catch (error) {
        if (error.response?.status === 409) {
          // Book already exists
          results.duplicates.push({
            isbn: row.ISBN,
            title: row.Title,
            error: 'Book already exists'
          });
        } else {
          results.failed.push({
            isbn: row.ISBN,
            title: row.Title,
            error: error.message
          });
        }
      }
    }

    return results;
  }

  /**
   * Import collections from CSV
   * @param {Array} collectionsData - Parsed CSV data for collections
   * @returns {Object} - Import results
   */
  async importCollections(collectionsData) {
    const results = {
      success: [],
      failed: [],
      total: collectionsData.length
    };

    for (const row of collectionsData) {
      try {
        // Create the collection first
        const collectionData = {
          name: row.Name,
          description: row.Description,
          collectionType: row.Type || 'custom',
          sortName: row.SortName || row.Name,
          displayInLibrary: row.DisplayInLibrary === 'true' || row.DisplayInLibrary === 'Yes',
        };

        const collection = await collectionService.createCollection(collectionData);

        // Now add books to the collection if they exist
        if (row.BookISBNs) {
          const bookISBNs = row.BookISBNs.split('; ').filter(isbn => isbn);
          
          // Try to add books by ISBN
          for (const isbn of bookISBNs) {
            try {
              // You'll need to implement a method to find book by ISBN
              // and add it to the collection
              // await collectionService.addBookToCollection(collection._id, bookId);
            } catch (bookError) {
              console.error(`Failed to add book ${isbn} to collection ${collection.name}:`, bookError);
            }
          }
        }

        results.success.push({
          name: collection.name,
          id: collection._id
        });

      } catch (error) {
        results.failed.push({
          name: row.Name,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Restore book-collection relationships after import
   * @param {Array} booksData - Books with collection info
   * @param {Array} collections - Imported collections
   */
  async restoreRelationships(booksData, collections) {
    const results = {
      success: 0,
      failed: 0
    };

    for (const book of booksData) {
      if (book.Collections) {
        const collectionPairs = book.Collections.split('; ');
        
        for (const pair of collectionPairs) {
          try {
            // Parse collection name and ID (format: "Name|ID")
            const [collectionName, collectionId] = pair.split('|');
            
            // Find the collection by name or ID
            const collection = collections.find(c => 
              c.name === collectionName || c._id === collectionId
            );

            if (collection) {
              // Add the book to the collection
              // await collectionService.addBookToCollection(collection._id, book.isbn);
              results.success++;
            }
          } catch (error) {
            results.failed++;
            console.error('Failed to restore relationship:', error);
          }
        }
      }
    }

    return results;
  }

  /**
   * Full library import from exported CSVs
   * @param {File} booksFile - Books CSV file
   * @param {File} collectionsFile - Collections CSV file
   * @returns {Object} - Complete import results
   */
  async importLibrary(booksFile, collectionsFile) {
    const results = {
      books: null,
      collections: null,
      relationships: null,
      summary: {
        totalBooks: 0,
        importedBooks: 0,
        duplicateBooks: 0,
        failedBooks: 0,
        totalCollections: 0,
        importedCollections: 0,
        failedCollections: 0,
      }
    };

    try {
      // Parse both CSV files
      const [booksData, collectionsData] = await Promise.all([
        booksFile ? this.parseCSV(booksFile) : Promise.resolve([]),
        collectionsFile ? this.parseCSV(collectionsFile) : Promise.resolve([])
      ]);

      // Import collections first (so they exist when we import books)
      if (collectionsData.length > 0) {
        results.collections = await this.importCollections(collectionsData);
        results.summary.totalCollections = results.collections.total;
        results.summary.importedCollections = results.collections.success.length;
        results.summary.failedCollections = results.collections.failed.length;
      }

      // Import books
      if (booksData.length > 0) {
        results.books = await this.importBooks(booksData);
        results.summary.totalBooks = results.books.total;
        results.summary.importedBooks = results.books.success.length;
        results.summary.duplicateBooks = results.books.duplicates.length;
        results.summary.failedBooks = results.books.failed.length;
      }

      // Restore book-collection relationships
      if (booksData.length > 0 && results.collections?.success.length > 0) {
        results.relationships = await this.restoreRelationships(
          booksData,
          results.collections.success
        );
      }

    } catch (error) {
      throw new Error(`Import failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Validate CSV format before import
   * @param {File} file - CSV file to validate
   * @param {string} type - 'books' or 'collections'
   * @returns {Object} - Validation result
   */
  async validateCSV(file, type) {
    try {
      const data = await this.parseCSV(file);
      
      if (!data || data.length === 0) {
        return {
          valid: false,
          error: 'CSV file is empty'
        };
      }

      const firstRow = data[0];
      const requiredFields = type === 'books' 
        ? ['ISBN', 'Title', 'Authors']
        : ['Name'];

      const missingFields = requiredFields.filter(field => !(field in firstRow));
      
      if (missingFields.length > 0) {
        return {
          valid: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        };
      }

      return {
        valid: true,
        rowCount: data.length,
        fields: Object.keys(firstRow)
      };

    } catch (error) {
      return {
        valid: false,
        error: `Failed to parse CSV: ${error.message}`
      };
    }
  }
}

export default new ImportService();
