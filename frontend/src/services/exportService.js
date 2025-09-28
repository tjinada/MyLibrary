import Papa from 'papaparse';

class ExportService {
  /**
   * Export library data to CSV with import-friendly format
   * @param {Object} data - Contains books and collections arrays
   * @returns {Object} - Contains CSV strings for books and collections
   */
  exportToCSV(data) {
    const { books = [], collections = [] } = data;
    
    // Prepare books data for CSV with import markers
    const booksData = books.map(book => ({
      // Unique Identifier (for reimport)
      _id: book._id || '', // Include MongoDB ID for reference
      ISBN: book.isbn || '',
      
      // Basic Info
      Title: book.title || '',
      Authors: Array.isArray(book.authors) ? book.authors.join('; ') : '',
      Publisher: book.publisher || '',
      PublishedDate: book.publishedDate || '',
      
      // Book Details
      PageCount: book.pageCount || 0, // Keep as number
      Language: book.language || '',
      Description: book.description ? book.description.replace(/\n/g, '\\n') : '', // Preserve newlines with escape
      
      // Categories and Genres
      PrimaryCategory: book.primaryCategory || '',
      CategoryType: book.categoryType || '', // Fiction/Nonfiction
      Genres: Array.isArray(book.genres) ? book.genres.join('; ') : '',
      Tags: Array.isArray(book.tags) ? book.tags.join('; ') : '',
      
      // Status and Reading Info
      Status: book.status || 'to-read',
      Rating: book.rating || 0, // Keep as number
      Notes: book.notes ? book.notes.replace(/\n/g, '\\n') : '', // Preserve newlines
      
      // Edition and Quantity
      Edition: book.edition || 'standard',
      Quantity: book.quantity || 1,
      
      // Collections (with IDs for reimport)
      Collections: Array.isArray(book.collections) 
        ? book.collections.map(c => {
            if (typeof c === 'object') {
              return `${c.name}|${c._id}`; // Include ID for exact matching
            }
            return c;
          }).join('; ') 
        : '',
      CollectionCount: Array.isArray(book.collections) ? book.collections.length : 0,
      
      // Metadata (ISO format for reliable parsing)
      AddedDate: book.addedDate || '',
      UpdatedDate: book.updatedAt || '',
      CreatedDate: book.createdAt || '',
      
      // Images and External IDs
      CoverImage: book.coverImage || '',
      CoverImageSource: book.coverImageSource || '',
      GoogleBooksId: book.googleBooksId || '',
      
      // Additional fields for complete reimport
      SourceType: book.source || 'manual',
      ImportDate: new Date().toISOString(), // Track when exported
    }));
    
    // Prepare collections data for CSV with import markers
    const collectionsData = collections.map(collection => ({
      // Unique Identifier
      _id: collection._id || '',
      Name: collection.name || '',
      Description: collection.description || '',
      Type: collection.collectionType || 'custom',
      SortName: collection.sortName || '',
      
      // Books (with ISBNs for reimport)
      BookCount: collection.books ? collection.books.length : 0,
      BookISBNs: Array.isArray(collection.books) 
        ? collection.books.map(b => {
            if (typeof b === 'object') {
              return b.isbn || b._id; // Prefer ISBN for matching
            }
            return b;
          }).join('; ')
        : '',
      BookTitles: Array.isArray(collection.books) 
        ? collection.books.map(b => {
            if (typeof b === 'object') {
              return b.title || '';
            }
            return '';
          }).filter(t => t).join('; ')
        : '',
      
      // Settings
      DisplayInLibrary: collection.displayInLibrary !== false ? 'true' : 'false',
      
      // Metadata (ISO format)
      CreatedDate: collection.createdAt || '',
      UpdatedDate: collection.updatedAt || '',
      
      // Export tracking
      ExportDate: new Date().toISOString(),
    }));
    
    // Convert to CSV using PapaParse
    const booksCSV = Papa.unparse(booksData, {
      header: true,
      skipEmptyLines: true,
    });
    
    const collectionsCSV = Papa.unparse(collectionsData, {
      header: true,
      skipEmptyLines: true,
    });
    
    return {
      books: booksCSV,
      collections: collectionsCSV,
      combined: this.createCombinedCSV(booksCSV, collectionsCSV),
    };
  }
  
  /**
   * Create a combined CSV with both books and collections
   * @param {string} booksCSV - Books CSV string
   * @param {string} collectionsCSV - Collections CSV string
   * @returns {string} - Combined CSV string
   */
  createCombinedCSV(booksCSV, collectionsCSV) {
    // Add a separator between books and collections
    return `BOOKS\n${booksCSV}\n\n\nCOLLECTIONS\n${collectionsCSV}`;
  }
  
  /**
   * Download CSV file
   * @param {string} csvContent - CSV content to download
   * @param {string} filename - Name of the file to download
   */
  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  }
  
  /**
   * Export library data with download
   * @param {Object} data - Contains books and collections
   * @param {string} type - 'books', 'collections', or 'all'
   */
  exportLibrary(data, type = 'all') {
    const csvData = this.exportToCSV(data);
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    switch(type) {
      case 'books':
        this.downloadCSV(csvData.books, `library_books_${timestamp}.csv`);
        break;
      case 'collections':
        this.downloadCSV(csvData.collections, `library_collections_${timestamp}.csv`);
        break;
      case 'all':
      default:
        // Download books
        this.downloadCSV(csvData.books, `library_books_${timestamp}.csv`);
        // Small delay then download collections
        setTimeout(() => {
          this.downloadCSV(csvData.collections, `library_collections_${timestamp}.csv`);
        }, 500);
        break;
    }
  }
  
  /**
   * Generate library statistics
   * @param {Object} data - Contains books and collections
   * @returns {Object} - Library statistics
   */
  generateStatistics(data) {
    const { books = [], collections = [] } = data;
    
    const stats = {
      totalBooks: books.reduce((sum, book) => sum + (book.quantity || 1), 0),
      uniqueBooks: books.length,
      totalCollections: collections.length,
      
      // Status breakdown
      toRead: books.filter(b => b.status === 'to-read').reduce((sum, book) => sum + (book.quantity || 1), 0),
      reading: books.filter(b => b.status === 'reading').reduce((sum, book) => sum + (book.quantity || 1), 0),
      read: books.filter(b => b.status === 'read').reduce((sum, book) => sum + (book.quantity || 1), 0),
      loaned: books.filter(b => b.status === 'loaned').reduce((sum, book) => sum + (book.quantity || 1), 0),
      
      // Edition breakdown
      standardEdition: books.filter(b => !b.edition || b.edition === 'standard').length,
      signedEdition: books.filter(b => b.edition === 'signed').length,
      deluxeEdition: books.filter(b => b.edition === 'deluxe').length,
      
      // Books with ratings
      ratedBooks: books.filter(b => b.rating > 0).length,
      averageRating: books.filter(b => b.rating > 0).reduce((sum, b) => sum + b.rating, 0) / 
                     (books.filter(b => b.rating > 0).length || 1),
      
      // Collections stats
      seriesCollections: collections.filter(c => c.collectionType === 'series').length,
      customCollections: collections.filter(c => c.collectionType !== 'series').length,
      
      // Books in collections
      booksInCollections: books.filter(b => b.collections && b.collections.length > 0).length,
      booksNotInCollections: books.filter(b => !b.collections || b.collections.length === 0).length,
    };
    
    return stats;
  }
}

export default new ExportService();
