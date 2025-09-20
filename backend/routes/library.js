const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Collection = require('../models/Collection');

// Get unified library view (books and collections mixed)
router.get('/unified', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      genre = 'all',
      sort = 'title',
      includeCollections = 'true',
      expandCollections = 'false',
      viewMode = 'unified' // unified | books-only | collections-only
    } = req.query;

    // Determine if we should show books that are in collections
    // Show them only when searching or filtering by genre
    const showCollectionBooks = search !== '' || genre !== 'all';

    let items = [];
    
    if (viewMode === 'unified' || viewMode === 'collections-only') {
      // Fetch collections that should be displayed in library
      let collectionsQuery = Collection.find({ displayInLibrary: true });
      
      // Apply search to collections
      if (search) {
        // When searching, show collections if their name matches
        // OR if the search term matches the collection name and book name
        collectionsQuery = collectionsQuery.find({
          $or: [
            { name: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') }
          ]
        });
      }
      
      const collections = await collectionsQuery
        .populate({
          path: 'books',
          match: status !== 'all' ? { status } : {},
        })
        .populate('bookOrder')
        .sort('sortName');

      // Filter out empty collections after population
      const nonEmptyCollections = collections.filter(c => c.books.length > 0);
      
      // Transform collections to library items
      const collectionItems = nonEmptyCollections.map(collection => ({
        type: 'collection',
        sortKey: collection.sortName || collection.name.toLowerCase(),
        data: {
          _id: collection._id,
          name: collection.name,
          description: collection.description,
          bookCount: collection.bookCount,
          coverImage: collection.coverImage,
          collectionType: collection.collectionType,
          books: expandCollections === 'true' ? 
            (collection.collectionType === 'series' && collection.bookOrder.length > 0 ? 
              collection.bookOrder : collection.books) : [],
          displayExpanded: expandCollections === 'true'
        }
      }));

      items.push(...collectionItems);
    }

    if (viewMode === 'unified' || viewMode === 'books-only') {
      // Get IDs of books that are in ANY collection (not just displayed ones)
      let booksInCollections = [];
      if (viewMode === 'unified' && !showCollectionBooks) {
        // When not searching/filtering, exclude ALL books that are in ANY collection
        const allCollections = await Collection.find({});
        booksInCollections = [...new Set(allCollections.flatMap(c => 
          c.books.map(bookId => bookId.toString())
        ))];
      }

      // Build query for standalone books
      let bookQuery = {};
      
      // Exclude books in collections only when not searching/filtering
      if (viewMode === 'unified' && booksInCollections.length > 0 && !showCollectionBooks) {
        bookQuery._id = { $nin: booksInCollections };
      }
      
      // Apply filters
      if (status !== 'all') {
        bookQuery.status = status;
      }
      
      if (genre !== 'all') {
        bookQuery.$or = [
          { genres: genre },
          { primaryCategory: genre }
        ];
      }
      
      if (search) {
        bookQuery.$and = [
          bookQuery.$and || {},
          {
            $or: [
              { title: new RegExp(search, 'i') },
              { authors: new RegExp(search, 'i') },
              { isbn: new RegExp(search, 'i') }
            ]
          }
        ];
      }

      const standaloneBooks = await Book.find(bookQuery);
      
      // Transform books to library items
      const bookItems = standaloneBooks.map(book => ({
        type: 'book',
        sortKey: book.title.toLowerCase().replace(/^(the |a |an )/i, ''),
        data: book
      }));

      items.push(...bookItems);
    }

    // Sort all items together
    items.sort((a, b) => {
      if (sort === 'title' || sort === '-title') {
        const multiplier = sort.startsWith('-') ? -1 : 1;
        return multiplier * a.sortKey.localeCompare(b.sortKey);
      }
      
      // For date sorting, only apply to books
      if (sort === '-addedDate' || sort === 'addedDate') {
        const multiplier = sort.startsWith('-') ? -1 : 1;
        
        // Collections go to the top/bottom based on sort direction
        if (a.type === 'collection' && b.type === 'book') {
          return -multiplier;
        }
        if (a.type === 'book' && b.type === 'collection') {
          return multiplier;
        }
        
        // Both are books
        if (a.type === 'book' && b.type === 'book') {
          return multiplier * (new Date(a.data.addedDate) - new Date(b.data.addedDate));
        }
        
        // Both are collections, sort by name
        return a.sortKey.localeCompare(b.sortKey);
      }
      
      return 0;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedItems = items.slice(startIndex, endIndex);

    res.json({
      items: paginatedItems,
      totalItems: items.length,
      totalPages: Math.ceil(items.length / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching unified library:', error);
    res.status(500).json({ message: 'Failed to fetch library' });
  }
});

// Get library stats including collections
router.get('/stats', async (req, res) => {
  try {
    const [totalBookCount, collectionCount, books, collections] = await Promise.all([
      Book.countDocuments(),
      Collection.countDocuments(),
      Book.find().select('status genres primaryCategory collections'),
      Collection.find().select('bookCount collectionType books')
    ]);

    // Calculate books in collections
    const booksInCollections = new Set();
    collections.forEach(collection => {
      collection.books.forEach(bookId => {
        booksInCollections.add(bookId.toString());
      });
    });
    
    // Count standalone books (not in any collection)
    const standaloneBookCount = books.filter(book => 
      !book.collections || book.collections.length === 0
    ).length;

    // Calculate book status counts
    const statusCounts = {
      'to-read': 0,
      'reading': 0,
      'read': 0,
      'loaned': 0
    };
    
    books.forEach(book => {
      if (statusCounts[book.status] !== undefined) {
        statusCounts[book.status]++;
      }
    });

    // Calculate genre counts
    const genreMap = new Map();
    books.forEach(book => {
      if (book.primaryCategory) {
        genreMap.set(book.primaryCategory, (genreMap.get(book.primaryCategory) || 0) + 1);
      } else if (book.genres) {
        book.genres.forEach(genre => {
          genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
        });
      }
    });

    const topGenres = Array.from(genreMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Collection stats
    const collectionStats = {
      total: collectionCount,
      series: collections.filter(c => c.collectionType === 'series').length,
      custom: collections.filter(c => c.collectionType === 'custom').length,
      theme: collections.filter(c => c.collectionType === 'theme').length,
      totalBooksInCollections: collections.reduce((sum, c) => sum + c.bookCount, 0)
    };

    res.json({
      totalBooks: totalBookCount,  // All books in the system
      standaloneBooks: standaloneBookCount,  // Books not in any collection
      booksInCollections: booksInCollections.size,  // Unique books in collections
      statusCounts,
      topGenres,
      collections: collectionStats
    });
  } catch (error) {
    console.error('Error fetching library stats:', error);
    res.status(500).json({ message: 'Failed to fetch library stats' });
  }
});

module.exports = router;
