import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import BookGrid from '../components/Books/BookGrid';
import bookService from '../services/bookService';

const Search = () => {
  const [query, setQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [localResults, setLocalResults] = useState([]);
  const [googleResults, setGoogleResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (tabValue === 0) {
        // Search local library
        const results = await bookService.searchLibrary(query);
        setLocalResults(results);
      } else {
        // Search Google Books
        const results = await bookService.searchGoogleBooks(query);
        setGoogleResults(results);
      }
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Search Books
      </Typography>

      <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by title, author, ISBN..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      <Tabs value={tabValue} onChange={(e, value) => setTabValue(value)} sx={{ mb: 3 }}>
        <Tab label="My Library" />
        <Tab label="Google Books" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {tabValue === 0 && (
            localResults.length > 0 ? (
              <BookGrid books={localResults} />
            ) : query && !loading ? (
              <Typography color="text.secondary" align="center">
                No books found in your library
              </Typography>
            ) : null
          )}

          {tabValue === 1 && (
            googleResults.length > 0 ? (
              <Typography color="text.secondary" align="center">
                Google Books results will be displayed here
              </Typography>
            ) : query && !loading ? (
              <Typography color="text.secondary" align="center">
                No books found on Google Books
              </Typography>
            ) : null
          )}
        </>
      )}
    </Container>
  );
};

export default Search;
