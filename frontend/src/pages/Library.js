import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  Paper,
  Toolbar as MuiToolbar,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import Header from '../components/Layout/Header';
import Toolbar from '../components/Layout/Toolbar';
import SearchBar from '../components/Search/SearchBar';
import BookGrid from '../components/Books/BookGrid';
import BookList from '../components/Books/BookList';
import AddBookModal from '../components/Modals/AddBookModal';
import BookDetailsModal from '../components/Modals/BookDetailsModal';
import bookService from '../services/bookService';

const Library = () => {
  // State management
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('libraryViewMode') || 'grid';
  });
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    genre: 'all',
    sort: '-addedDate',
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const itemsPerPage = viewMode === 'grid' ? 24 : 20;

  // Fetch books on component mount
  useEffect(() => {
    fetchBooks();
  }, []);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('libraryViewMode', viewMode);
  }, [viewMode]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await bookService.getBooks({
        page: 1,
        limit: 1000, // Get all books for client-side filtering
      });
      setBooks(data.books);
      setError(null);
    } catch (err) {
      setError('Failed to load books');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let filtered = [...books];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(book => 
        book.title?.toLowerCase().includes(searchLower) ||
        book.authors?.some(author => author.toLowerCase().includes(searchLower)) ||
        book.isbn?.includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(book => book.status === filters.status);
    }

    // Genre filter
    if (filters.genre !== 'all') {
      filtered = filtered.filter(book => 
        book.genres?.includes(filters.genre)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      const sortField = filters.sort.replace('-', '');
      const sortOrder = filters.sort.startsWith('-') ? -1 : 1;

      if (sortField === 'title') {
        return sortOrder * (a.title || '').localeCompare(b.title || '');
      }
      if (sortField === 'authors') {
        const aAuthor = a.authors?.[0] || '';
        const bAuthor = b.authors?.[0] || '';
        return sortOrder * aAuthor.localeCompare(bAuthor);
      }
      if (sortField === 'rating') {
        return sortOrder * ((a.rating || 0) - (b.rating || 0));
      }
      if (sortField === 'addedDate') {
        return sortOrder * (new Date(a.addedDate) - new Date(b.addedDate));
      }
      return 0;
    });

    return filtered;
  }, [books, filters]);

  // Pagination
  const paginatedBooks = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBooks.slice(startIndex, endIndex);
  }, [filteredBooks, page, itemsPerPage]);

  // Calculate total pages
  useEffect(() => {
    setTotalPages(Math.ceil(filteredBooks.length / itemsPerPage));
    setPage(1); // Reset to first page when filters change
  }, [filteredBooks.length, itemsPerPage]);

  // Extract genres from books
  const genres = useMemo(() => {
    const genreMap = new Map();
    books.forEach(book => {
      book.genres?.forEach(genre => {
        genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
      });
    });
    return Array.from(genreMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 genres
  }, [books]);

  // Calculate book counts by status
  const bookCounts = useMemo(() => {
    const counts = {
      all: books.length,
      available: 0,
      reading: 0,
      loaned: 0,
      wishlist: 0,
    };
    books.forEach(book => {
      if (counts[book.status] !== undefined) {
        counts[book.status]++;
      }
    });
    return counts;
  }, [books]);

  // Check if any filters are active
  const hasActiveFilters = filters.search !== '' || 
                          filters.status !== 'all' || 
                          filters.genre !== 'all';

  // Handler functions
  const handleSearch = useCallback((searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      genre: 'all',
      sort: '-addedDate',
    });
  }, []);

  const handleBookAdded = useCallback(() => {
    fetchBooks(); // Refresh the book list
    setAddBookModalOpen(false);
  }, []);

  const handleBookClick = useCallback((book) => {
    setSelectedBook(book);
    setDetailsModalOpen(true);
  }, []);

  const handleBookUpdated = useCallback(() => {
    fetchBooks(); // Refresh the book list
  }, []);

  const handleBookDeleted = useCallback(() => {
    fetchBooks(); // Refresh the book list
    setDetailsModalOpen(false);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <MuiToolbar /> {/* Spacer for fixed header */}
      
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Page Title and Search */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              textAlign: 'center',
              mb: 3,
              color: 'text.primary',
            }}
          >
            My Book Collection
          </Typography>
          
          {/* Search Bar */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            mb: 3,
          }}>
            <SearchBar onSearch={handleSearch} />
          </Box>
        </Box>

        {/* Toolbar with filters */}
        <Toolbar
          onAddBook={() => setAddBookModalOpen(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filters={filters}
          onFilterChange={handleFilterChange}
          genres={genres}
          bookCounts={bookCounts}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Results summary */}
        {!loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3,
          }}>
            <Typography variant="body2" color="text.secondary">
              {filteredBooks.length === 0 
                ? 'No books found'
                : `Showing ${Math.min((page - 1) * itemsPerPage + 1, filteredBooks.length)}-${Math.min(page * itemsPerPage, filteredBooks.length)} of ${filteredBooks.length} books`
              }
            </Typography>
            {totalPages > 1 && !isMobile && (
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                size="small"
                siblingCount={0}
                boundaryCount={1}
              />
            )}
          </Box>
        )}

        {/* Content area */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        ) : filteredBooks.length === 0 ? (
          <Fade in timeout={500}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 8, 
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              <Typography 
                variant="h5" 
                color="text.secondary" 
                gutterBottom
                sx={{ fontWeight: 500 }}
              >
                {hasActiveFilters ? 'No books match your filters' : 'Your library is empty'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {hasActiveFilters 
                  ? 'Try adjusting your filters or search terms'
                  : 'Start by adding some books to your collection'
                }
              </Typography>
              {!hasActiveFilters && (
                <Box sx={{ mt: 3 }}>
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      fontSize: 80,
                      color: 'text.disabled',
                      mb: 2,
                    }}
                  >
                    📚
                  </Typography>
                </Box>
              )}
            </Paper>
          </Fade>
        ) : (
          <Fade in timeout={500}>
            <Box>
              {viewMode === 'grid' ? (
                <BookGrid books={paginatedBooks} onBookClick={handleBookClick} />
              ) : (
                <BookList books={paginatedBooks} onBookClick={handleBookClick} />
              )}
              
              {/* Pagination - Bottom for mobile or when multiple pages */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    color="primary"
                    size={isMobile ? 'medium' : 'large'}
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </Container>

      {/* Add Book Modal */}
      <AddBookModal
        open={addBookModalOpen}
        onClose={() => setAddBookModalOpen(false)}
        onBookAdded={handleBookAdded}
      />

      {/* Book Details Modal */}
      <BookDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        book={selectedBook}
        onBookUpdated={handleBookUpdated}
        onBookDeleted={handleBookDeleted}
      />
    </Box>
  );
};

export default Library;
