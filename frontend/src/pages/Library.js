import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Chip,
} from '@mui/material';
import BookGrid from '../components/Books/BookGrid';
import bookService from '../services/bookService';

const Library = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    sort: '-addedDate',
  });

  useEffect(() => {
    fetchBooks();
  }, [page, filters]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await bookService.getBooks({
        page,
        limit: 24,
        status: filters.status || undefined,
        sort: filters.sort,
      });
      setBooks(data.books);
      setTotalPages(data.totalPages);
      setLoading(false);
    } catch (err) {
      setError('Failed to load books');
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Library
      </Typography>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="reading">Reading</MenuItem>
                <MenuItem value="loaned">Loaned</MenuItem>
                <MenuItem value="wishlist">Wishlist</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sort}
                label="Sort By"
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <MenuItem value="-addedDate">Recently Added</MenuItem>
                <MenuItem value="title">Title (A-Z)</MenuItem>
                <MenuItem value="-title">Title (Z-A)</MenuItem>
                <MenuItem value="authors">Author</MenuItem>
                <MenuItem value="-rating">Rating</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Book count */}
      {!loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {books.length > 0 ? `Showing ${books.length} books` : 'No books found'}
        </Typography>
      )}

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : books.length > 0 ? (
        <>
          <BookGrid books={books} />
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No books in your library yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Start by adding some books to your collection
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Library;
