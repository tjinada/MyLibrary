const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// Get library statistics
router.get('/', async (req, res) => {
  try {
    const [
      totalBooks,
      statusCounts,
      genreStats,
      authorStats,
      recentlyAdded
    ] = await Promise.all([
      // Total books
      Book.countDocuments(),
      
      // Books by status
      Book.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Top genres
      Book.aggregate([
        { $unwind: '$genres' },
        { $group: { _id: '$genres', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Top authors
      Book.aggregate([
        { $unwind: '$authors' },
        { $group: { _id: '$authors', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Recently added books
      Book.find()
        .sort('-addedDate')
        .limit(5)
        .select('title authors coverImage isbn addedDate')
    ]);

    // Format status counts
    const statusMap = {
      available: 0,
      reading: 0,
      loaned: 0,
      wishlist: 0
    };
    
    statusCounts.forEach(item => {
      if (item._id) {
        statusMap[item._id] = item.count;
      }
    });

    res.json({
      totalBooks,
      statusCounts: statusMap,
      topGenres: genreStats.map(g => ({ name: g._id, count: g.count })),
      topAuthors: authorStats.map(a => ({ name: a._id, count: a.count })),
      recentlyAdded
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

module.exports = router;
