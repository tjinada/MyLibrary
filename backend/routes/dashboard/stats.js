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
      // Basic counts with pages read calculation
      Book.aggregate([
        {
          $group: {
            _id: null,
            totalBooks: { $sum: 1 },
            // Changed: Only count pages for books with status 'read'
            totalPagesRead: { 
              $sum: { 
                $cond: [
                  { $eq: ['$status', 'read'] },
                  { $ifNull: ['$pageCount', 0] },
                  0
                ]
              }
            },
            // Also track total pages in library for reference
            totalPagesInLibrary: { $sum: { $ifNull: ['$pageCount', 0] } },
            // Count books that are read
            booksRead: {
              $sum: {
                $cond: [{ $eq: ['$status', 'read'] }, 1, 0]
              }
            },
            // Count books currently being read
            booksReading: {
              $sum: {
                $cond: [{ $eq: ['$status', 'reading'] }, 1, 0]
              }
            },
            // Pages currently being read
            pagesCurrentlyReading: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'reading'] },
                  { $ifNull: ['$pageCount', 0] },
                  0
                ]
              }
            },
            booksWithPages: { 
              $sum: { 
                $cond: [{ $gt: ['$pageCount', 0] }, 1, 0] 
              }
            }
          }
        }
      ]),
      
      // Genre distribution
      Book.aggregate([
        { $unwind: '$genres' },
        { 
          $group: { 
            _id: '$genres', 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } }
      ]),
      
      // Fiction vs Nonfiction
      Book.aggregate([
        { 
          $match: { 
            categoryType: { $exists: true, $ne: null } 
          } 
        },
        { 
          $group: { 
            _id: '$categoryType', 
            count: { $sum: 1 } 
          } 
        }
      ]),
      
      // Top authors
      Book.aggregate([
        { $unwind: '$authors' },
        { 
          $group: { 
            _id: '$authors', 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      
      // Top publishers
      Book.aggregate([
        { 
          $match: { 
            publisher: { $exists: true, $ne: null, $ne: '' } 
          } 
        },
        { 
          $group: { 
            _id: '$publisher', 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ]),
      
      // Publication years for heatmap
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
            }
          }
        },
        {
          $group: {
            _id: '$year',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Process basic stats
    const heroStats = basicStats[0] || {
      totalBooks: 0,
      totalPagesRead: 0,
      totalPagesInLibrary: 0,
      booksRead: 0,
      booksReading: 0,
      pagesCurrentlyReading: 0,
      booksWithPages: 0
    };

    // Count unique authors and genres
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
        totalBooks: heroStats.totalBooks,
        totalPagesRead: heroStats.totalPagesRead,  // Changed from totalPages
        totalPagesInLibrary: heroStats.totalPagesInLibrary,  // Added for reference
        booksRead: heroStats.booksRead,  // Added
        booksReading: heroStats.booksReading,  // Added
        pagesCurrentlyReading: heroStats.pagesCurrentlyReading,  // Added
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
