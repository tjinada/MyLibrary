import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardMedia,
  CardActions,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Skeleton,
  Chip,
  useTheme,
  useMediaQuery,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import bookService from '../../services/bookService';

const CoverSearchDialog = ({ 
  open, 
  onClose, 
  book,
  onSelectCover 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCover, setSelectedCover] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Initialize search query with book title and author
  React.useEffect(() => {
    if (open && book) {
      const defaultQuery = `${book.title} ${book.authors?.join(' ')} book cover`;
      setSearchQuery(defaultQuery);
    }
  }, [open, book]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      // If book doesn't exist in DB, use alternative search
      if (!book?._id) {
        // Use the fallback search service directly
        const searchService = require('../../services/bookService').default;
        // Search using Google Books API or other sources
        const results = await searchService.searchGoogleBooks(searchQuery);
        
        // Convert results to our format
        const suggestions = results.items?.map(item => ({
          url: item.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://'),
          thumbnail: item.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://'),
          title: item.volumeInfo?.title,
          source: 'Google Books',
          valid: true
        })).filter(s => s.url) || [];
        
        setSearchResults(suggestions);
        
        if (suggestions.length === 0) {
          setError('No covers found. Try different search terms.');
        }
      } else {
        // Book exists, use normal search
        const response = await bookService.searchCovers(book.isbn, searchQuery);
        setSearchResults(response.suggestions || []);
        
        if (response.suggestions.length === 0) {
          setError('No covers found. Try different search terms.');
        }
      }
    } catch (err) {
      console.error('Error searching covers:', err);
      setError('Failed to search for covers. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCover = (cover) => {
    setSelectedCover(cover);
  };

  const handleApply = () => {
    if (selectedCover) {
      onSelectCover(selectedCover.url);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCover(null);
    setError(null);
    setHasSearched(false);
    onClose();
  };

  const renderSearchResults = () => {
    if (loading) {
      return (
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Grid item xs={6} sm={4} md={3} key={n}>
              <Skeleton variant="rectangular" height={200} />
              <Skeleton variant="text" sx={{ mt: 1 }} />
            </Grid>
          ))}
        </Grid>
      );
    }

    if (searchResults.length === 0 && hasSearched) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <SearchIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">
            No results found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try different search terms
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {searchResults.map((result, index) => (
          <Grid item xs={6} sm={4} md={3} key={index}>
            <Card 
              sx={{ 
                position: 'relative',
                cursor: 'pointer',
                border: selectedCover?.url === result.url ? 2 : 0,
                borderColor: 'primary.main',
                transform: selectedCover?.url === result.url ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: 4,
                }
              }}
              onClick={() => handleSelectCover(result)}
            >
              <CardMedia
                component="img"
                image={result.thumbnail || result.url}
                alt={result.title || 'Book cover'}
                sx={{ 
                  height: isMobile ? 150 : 200,
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              
              {/* Selection indicator */}
              {selectedCover?.url === result.url && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckIcon fontSize="small" />
                </Box>
              )}

              <CardActions sx={{ p: 1 }}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                    {result.source}
                  </Typography>
                  {result.contextLink && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(result.contextLink, '_blank');
                      }}
                      sx={{ mt: -0.5 }}
                    >
                      <OpenIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Typography variant="h6">
          Search for Book Covers
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Book Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Searching covers for:
          </Typography>
          <Typography variant="subtitle1" fontWeight="600">
            {book?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            by {book?.authors?.join(', ')}
          </Typography>
        </Box>

        {/* Search Input */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Search Query"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleSearch();
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                    startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Tip: Try variations like "{book?.title} cover", "{book?.title} {book?.authors?.[0]}", or ISBN
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search Results */}
        <Box sx={{ minHeight: 200 }}>
          {!hasSearched && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SearchIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">
                Click search to find book covers from Google Images and other sources
              </Typography>
            </Box>
          )}
          
          {renderSearchResults()}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!selectedCover}
          startIcon={<CheckIcon />}
        >
          Use Selected Cover
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CoverSearchDialog;
