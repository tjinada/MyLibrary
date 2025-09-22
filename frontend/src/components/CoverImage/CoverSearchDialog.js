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
  ImageSearch as ImageSearchIcon,
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
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Initialize search query with book title and author
  React.useEffect(() => {
    if (open && book) {
      const defaultQuery = `${book.title} ${book.authors?.join(' ')} book cover`;
      setSearchQuery(defaultQuery);
    }
  }, [open, book]);

  const handleGoogleImageSearch = () => {
    // Generate Google Images search URL
    const isbn = book?.isbn || '';
    const title = book?.title || '';
    const authors = book?.authors?.join(' ') || '';
    
    let searchQuery = '';
    if (isbn) {
      // Use ISBN as primary search term
      searchQuery = `${isbn}+book+cover`;
    } else {
      // Fallback to title and author
      searchQuery = `${title} ${authors} book cover`.replace(/\s+/g, '+');
    }
    
    // Open Google Images in new tab with the search
    const googleUrl = `https://www.google.com/search?q=${searchQuery}&udm=2`;
    window.open(googleUrl, '_blank');
    
    // Show URL input field for user to paste the image URL
    setShowUrlInput(true);
    setError(null);
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      setError('Please enter an image URL');
      return;
    }
    
    try {
      // Use the URL as the selected cover
      setSelectedCover({
        url: urlInput.trim(),
        thumbnail: urlInput.trim(),
        source: 'Google Images',
        title: 'Imported from URL'
      });
      
      setError(null);
      setShowUrlInput(false);
    } catch (err) {
      console.error('Error importing URL:', err);
      setError('Invalid image URL. Please check and try again.');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    console.log('Starting search with query:', searchQuery);
    
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      // Always use Google Books search for covers
      const results = await bookService.searchGoogleBooks(searchQuery);
      console.log('Search results received:', results);
      
      // Extract cover images from book results
      const suggestions = [];
      
      if (results.items) {
        console.log(`Found ${results.items.length} items`);
        
        results.items.forEach((item, index) => {
          console.log(`Item ${index}:`, item.volumeInfo?.title);
          const imageLinks = item.volumeInfo?.imageLinks;
          console.log(`Image links for item ${index}:`, imageLinks);
          
          if (imageLinks) {
            // Try to get the highest quality image available
            const imageUrl = imageLinks.extraLarge || 
                           imageLinks.large || 
                           imageLinks.medium || 
                           imageLinks.thumbnail || 
                           imageLinks.smallThumbnail;
            
            console.log(`Selected image URL for item ${index}:`, imageUrl);
            
            if (imageUrl) {
              suggestions.push({
                url: imageUrl.replace('http://', 'https://'),
                thumbnail: (imageLinks.thumbnail || imageLinks.smallThumbnail || imageUrl).replace('http://', 'https://'),
                title: item.volumeInfo?.title,
                source: 'Google Books',
                valid: true
              });
            }
          }
        });
      } else {
        console.log('No items in search results');
        console.log('Full response structure:', JSON.stringify(results, null, 2));
      }
      
      console.log(`Total suggestions created: ${suggestions.length}`);
      console.log('Suggestions:', suggestions);
      
      setSearchResults(suggestions);
      
      if (suggestions.length === 0) {
        setError('No covers found. Try different search terms.');
      }
    } catch (err) {
      console.error('Error searching covers:', err);
      console.error('Error details:', err.response?.data);
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
    setUrlInput('');
    setShowUrlInput(false);
    onClose();
  };

  const renderSearchResults = () => {
    console.log('Rendering search results...');
    console.log('Loading:', loading);
    console.log('HasSearched:', hasSearched);
    console.log('SearchResults length:', searchResults.length);
    console.log('SearchResults:', searchResults);
    
    if (loading) {
      console.log('Showing loading skeletons');
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
      console.log('No results to show after search');
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

    console.log('Rendering grid with results');
    return (
      <Grid container spacing={2}>
        {searchResults.map((result, index) => {
          console.log(`Rendering result ${index}:`, result);
          return (
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
          );
        })}
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

        {/* Search Options */}
        <Box sx={{ mb: 3 }}>
          {/* Google Images Search Button */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ImageSearchIcon />}
              onClick={handleGoogleImageSearch}
              sx={{ flex: isMobile ? '1 1 100%' : 'none' }}
            >
              Search on Google Images
            </Button>
            
            <Typography variant="body2" color="text.secondary" sx={{ 
              display: 'flex', 
              alignItems: 'center',
              flex: isMobile ? '1 1 100%' : 1
            }}>
              Click to search Google Images, then copy the image URL and paste below
            </Typography>
          </Box>

          {/* URL Import Section */}
          {showUrlInput && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Step 2: Paste the image URL from Google Images
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Paste image URL here (right-click on image → Copy image address)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUrlImport();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleUrlImport}
                  disabled={!urlInput.trim()}
                >
                  Import
                </Button>
              </Box>
            </Box>
          )}

          {/* Alternative: Search with Google Books API */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Alternative: Search Google Books (limited results)
            </Typography>
            <TextField
              fullWidth
              size="small"
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
                      size="small"
                      onClick={handleSearch}
                      disabled={loading || !searchQuery.trim()}
                      startIcon={loading ? <CircularProgress size={16} /> : <SearchIcon />}
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search Results */}
        <Box sx={{ minHeight: 200 }}>
          {/* Show selected cover if imported from URL */}
          {selectedCover && selectedCover.source === 'Google Images' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Selected Cover (from URL)
              </Typography>
              <Card sx={{ 
                maxWidth: 200, 
                border: 2, 
                borderColor: 'primary.main',
                p: 1
              }}>
                <CardMedia
                  component="img"
                  image={selectedCover.url}
                  alt="Selected cover"
                  sx={{ 
                    height: 250,
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    setError('Failed to load image. Please check the URL.');
                    setSelectedCover(null);
                  }}
                />
                <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                  ✓ Ready to use
                </Typography>
              </Card>
            </Box>
          )}
          
          {!hasSearched && !loading && !selectedCover && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ImageSearchIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">
                Use the Google Images button above to find book covers
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Or search Google Books below for limited results
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
