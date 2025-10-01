const express = require('express');
const router = express.Router();
const Book = require('../../models/Book');

// Calculate diversity score using Shannon Entropy
function calculateDiversityScore(genreCounts) {
  const total = genreCounts.reduce((sum, count) => sum + count, 0);
  if (total === 0 || genreCounts.length <= 1) return 0;
  
  const probabilities = genreCounts.map(count => count / total);
  
  // Calculate Shannon entropy
  const entropy = probabilities.reduce((sum, p) => {
    if (p === 0) return sum;
    return sum - (p * Math.log(p));
  }, 0);
  
  // Normalize to 0-100 based on max possible entropy
  const maxEntropy = Math.log(genreCounts.length);
  return Math.round((entropy / maxEntropy) * 100);
}

// Get diversity score label
function getDiversityLabel(score) {
  if (score < 25) return 'Specialist';
  if (score < 50) return 'Focused Reader';
  if (score < 75) return 'Balanced Reader';
  return 'Genre Explorer';
}

// Group years into periods
function getYearPeriod(year) {
  if (!year || year === 'Unknown') return 'Unknown';
  const yearNum = parseInt(year);
  if (isNaN(yearNum)) return 'Unknown';
  
  const period = Math.floor(yearNum / 5) * 5;
  return `${period}-${period + 4}`;
}

// Enhanced dashboard stats endpoint
router.get('/', async (req, res) => {
  try {
    // Run all aggregations in parallel
    const [
      basicStats,
      genreStats,
      categoryStats,
      authorStats,
      publisherStats,
      yearStats
    ] = await Promise.all([
      // Basic counts - NOW RESPECTING QUANTITY
      Book.aggregate([
        {
          $group: {
            _id: null,
            // Count total physical copies (sum of quantities)
            totalBooks: { 
              $sum: { $ifNull: ['$quantity', 1] }  // Default to 1 if quantity is null
            },
            // Count unique titles (for reference)
            uniqueTitles: { $sum: 1 },
            // Count pages only for books with status 'read', multiplied by quantity
            totalPagesRead: { 
              $sum: { 
                $cond: [
                  { $eq: ['$status', 'read'] },
                  { $multiply: [
                    { $ifNull: ['$pageCount', 0] },
                    { $ifNull: ['$quantity', 1] }
                  ]},
                  0
                ]
              }
            },
            // Total pages in library (all books * their quantities)
            totalPagesInLibrary: { 
              $sum: { 
                $multiply: [
                  { $ifNull: ['$pageCount', 0] },
                  { $ifNull: ['$quantity', 1] }
                ]
              }
            },
            // Count physical copies that are read
            booksRead: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'read'] },
                  { $ifNull: ['$quantity', 1] },
                  0
                ]
              }
            },
            // Count physical copies currently being read
            booksReading: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'reading'] },
                  { $ifNull: ['$quantity', 1] },
                  0
                ]
              }
            },
            // Count physical copies to read (includes 'to-read' and 'available' statuses)
            booksToRead: {
              $sum: {
                $cond: [
                  { $or: [
                    { $eq: ['$status', 'to-read'] },
                    { $eq: ['$status', 'available'] }
                  ]},
                  { $ifNull: ['$quantity', 1] },
                  0
                ]
              }
            },
            // Count physical copies that are loaned
            booksLoaned: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'loaned'] },
                  { $ifNull: ['$quantity', 1] },
                  0
                ]
              }
            },
            // Pages currently being read (for books with status 'reading')
            pagesCurrentlyReading: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'reading'] },
                  { $multiply: [
                    { $ifNull: ['$pageCount', 0] },
                    { $ifNull: ['$quantity', 1] }
                  ]},
                  0
                ]
              }
            },
            // Count unique titles that have page count data
            booksWithPages: { 
              $sum: { 
                $cond: [{ $gt: ['$pageCount', 0] }, 1, 0] 
              }
            }
          }
        }
      ]),
      
      // Genre distribution (counting physical copies)
      Book.aggregate([
        { $unwind: '$genres' },
        { 
          $group: { 
            _id: '$genres', 
            // Count physical copies per genre
            count: { $sum: { $ifNull: ['$quantity', 1] } } 
          } 
        },
        { $sort: { count: -1 } }
      ]),
      
      // Fiction vs Nonfiction (counting physical copies)
      Book.aggregate([
        { 
          $match: { 
            categoryType: { $exists: true, $ne: null } 
          } 
        },
        { 
          $group: { 
            _id: '$categoryType', 
            // Count physical copies per category
            count: { $sum: { $ifNull: ['$quantity', 1] } } 
          } 
        }
      ]),
      
      // Top authors (counting physical copies)
      Book.aggregate([
        { $unwind: '$authors' },
        { 
          $group: { 
            _id: '$authors', 
            // Count physical copies per author
            count: { $sum: { $ifNull: ['$quantity', 1] } } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      
      // Top publishers (counting physical copies)
      Book.aggregate([
        { 
          $match: { 
            publisher: { $exists: true, $ne: null, $ne: '' } 
          } 
        },
        { 
          $group: { 
            _id: '$publisher', 
            // Count physical copies per publisher
            count: { $sum: { $ifNull: ['$quantity', 1] } } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ]),
      
      // Publication years for heatmap (counting physical copies)
      Book.aggregate([
        {
          $project: {
            year: {
              $cond: {
                if: { $eq: ['$publishedDate', null] },
                then: 'Unknown',
                else: {
                  $substr: ['$publishedDate', 0, 4]
                }
              }
            },
            quantity: { $ifNull: ['$quantity', 1] }
          }
        },
        {
          $group: {
            _id: '$year',
            // Count physical copies per year
            count: { $sum: '$quantity' }
          }
        }
      ])
    ]);

    // Process basic stats
    const heroStats = basicStats[0] || {
      totalBooks: 0,
      uniqueTitles: 0,
      totalPagesRead: 0,
      totalPagesInLibrary: 0,
      booksRead: 0,
      booksReading: 0,
      booksToRead: 0,
      booksLoaned: 0,
      pagesCurrentlyReading: 0,
      booksWithPages: 0
    };

    // Count unique authors and genres (these remain as unique counts, not physical copies)
    const [uniqueAuthorsResult, uniqueGenresResult] = await Promise.all([
      Book.distinct('authors'),
      Book.distinct('genres')
    ]);

    heroStats.uniqueAuthors = uniqueAuthorsResult.length;
    heroStats.uniqueGenres = uniqueGenresResult.length;

    // Calculate total for genre distribution
    const totalGenreCount = genreStats.reduce((sum, g) => sum + g.count, 0);
    
    // Process genre distribution with percentages
    const genreDistribution = genreStats.map(genre => ({
      name: genre._id,
      count: genre.count,
      percentage: Math.round((genre.count / totalGenreCount) * 100)
    }));

    // Calculate diversity score
    const genreCounts = genreStats.map(g => g.count);
    const diversityScore = calculateDiversityScore(genreCounts);
    const diversityLabel = getDiversityLabel(diversityScore);

    // Process category breakdown
    const totalCategorized = categoryStats.reduce((sum, c) => sum + c.count, 0);
    const categoryBreakdown = {
      fiction: { count: 0, percentage: 0 },
      nonfiction: { count: 0, percentage: 0 }
    };

    categoryStats.forEach(cat => {
      const key = cat._id.toLowerCase();
      if (categoryBreakdown[key] !== undefined) {
        categoryBreakdown[key] = {
          count: cat.count,
          percentage: Math.round((cat.count / totalCategorized) * 100)
        };
      }
    });

    // Process top authors
    const topAuthors = authorStats.map(author => ({
      name: author._id,
      count: author.count
    }));

    // Process top publishers
    const topPublishers = publisherStats.map(publisher => ({
      name: publisher._id,
      count: publisher.count
    }));

    // Process publication years into 5-year periods
    const yearPeriods = {};
    yearStats.forEach(yearData => {
      const period = getYearPeriod(yearData._id);
      if (!yearPeriods[period]) {
        yearPeriods[period] = 0;
      }
      yearPeriods[period] += yearData.count;
    });

    // Convert to array and sort
    const publicationYearStats = Object.entries(yearPeriods)
      .map(([period, count]) => ({
        period,
        count,
        startYear: period === 'Unknown' ? null : parseInt(period.split('-')[0])
      }))
      .sort((a, b) => {
        if (a.period === 'Unknown') return 1;
        if (b.period === 'Unknown') return -1;
        return a.startYear - b.startYear;
      });

    // Find the decade with most books
    const decadeWithMostBooks = publicationYearStats
      .filter(p => p.period !== 'Unknown')
      .reduce((max, period) => (period.count > (max?.count || 0) ? period : max), null);

    // Compile final response
    const response = {
      heroStats: {
        totalBooks: heroStats.totalBooks,  // Physical copies
        uniqueTitles: heroStats.uniqueTitles,  // Unique book records
        totalPagesRead: heroStats.totalPagesRead,  // Pages from read books
        totalPagesInLibrary: heroStats.totalPagesInLibrary,  // All pages
        booksRead: heroStats.booksRead,  // Physical copies read
        booksReading: heroStats.booksReading,  // Physical copies being read
        booksToRead: heroStats.booksToRead,  // Physical copies to read
        booksLoaned: heroStats.booksLoaned,  // Physical copies loaned
        pagesCurrentlyReading: heroStats.pagesCurrentlyReading,
        uniqueAuthors: heroStats.uniqueAuthors,
        uniqueGenres: heroStats.uniqueGenres
      },
      genreDistribution,
      categoryBreakdown,
      funInsights: {
        diversityScore: {
          score: diversityScore,
          label: diversityLabel,
          totalGenres: uniqueGenresResult.length
        },
        topAuthors,
        topPublishers,
        favoritePublisher: topPublishers[0] || null,
        mostCollectedAuthor: topAuthors[0] || null,
        decadeFocus: decadeWithMostBooks ? {
          period: decadeWithMostBooks.period,
          count: decadeWithMostBooks.count,
          percentage: Math.round((decadeWithMostBooks.count / heroStats.totalBooks) * 100)
        } : null
      },
      publicationYearStats
    };

    res.json(response);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dashboard statistics',
      error: error.message 
    });
  }
});

module.exports = router;
