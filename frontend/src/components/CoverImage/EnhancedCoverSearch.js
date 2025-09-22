import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  TextField,
  Grid,
  Card,
  CardMedia,
  CardActions,
  IconButton,
  Chip,
  LinearProgress,
  Tooltip,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  OpenInNew as OpenIcon,
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  Check as CheckIcon,
  Image as ImageIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const EnhancedCoverSearch = ({ 
  book,
  onSelectCover,
  mode = 'inline'
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [selectedCover, setSelectedCover] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [autoSearchResults, setAutoSearchResults] = useState([]);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Search sources configuration
  const searchSources = [
    {
      name: 'Google Images',
      icon: '🔍',
      color: '#4285f4',
      generateUrl: () => {
        const isbn = book?.isbn || '';
        const title = book?.title || '';
        const authors = book?.authors?.join(' ') || '';
        
        let query = isbn ? `${isbn} book cover` : `${title} ${authors} book cover`;
        return `https://www.google.com/search?q=${encodeURIComponent(query)}&udm=2`;
      },
      instructions: 'Click image → Click preview on right → Right-click → "Copy image address"'
    },
    {
      name: 'Bing Images',
      icon: '🔎',
      color: '#0078d4',
      generateUrl: () => {
        const isbn = book?.isbn || '';
        const title = book?.title || '';
        const authors = book?.authors?.join(' ') || '';
        
        let query = isbn ? `${isbn} book cover` : `${title} ${authors} book cover`;
        return `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
      },
      instructions: 'Click image → Right-click on large preview → "Copy image link"'
    },
    {
      name: 'DuckDuckGo',
      icon: '🦆',
      color: '#de5833',
      generateUrl: () => {
        const isbn = book?.isbn || '';
        const title = book?.title || '';
        const authors = book?.authors?.join(' ') || '';
        
        let query = isbn ? `${isbn} book cover` : `${title} ${authors} book cover`;
        return `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
      },
      instructions: 'Click image → Right-click on preview → "Copy image link"'
    },
    {
      name: 'Amazon',
      icon: '📚',
      color: '#ff9900',
      generateUrl: () => {
        const isbn = book?.isbn || '';
        if (isbn) {
          return `https://www.amazon.com/s?k=${isbn}`;
        }
        const title = book?.title || '';
        return `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=stripbooks`;
      },
      instructions: 'Find book → Right-click cover image → "Copy image address"'
    },
    {
      name: 'Goodreads',
      icon: '📖',
      color: '#372213',
      generateUrl: () => {
        const title = book?.title || '';
        const authors = book?.authors?.join(' ') || '';
        return `https://www.goodreads.com/search?q=${encodeURIComponent(title + ' ' + authors)}`;
      },
      instructions: 'Find book → Click cover → Right-click large image → "Copy image address"'
    }
  ];

  // Try to auto-fetch covers from known sources
  useEffect(() => {
    if (book && !searchAttempted) {
      attemptAutoSearch();
    }
  }, [book]);

  const attemptAutoSearch = async () => {
    setLoading(true);
    setSearchAttempted(true);
    const results = [];

    try {
      // Check if Google Books cover exists
      if (book?.isbn) {
        const googleBooksUrl = `https://books.google.com/books/content?id=${book.googleBooksId || book.isbn}&printsec=frontcover&img=1&zoom=0&source=gbs_api`;
        results.push({
          url: googleBooksUrl,
          source: 'Google Books',
          thumbnail: googleBooksUrl.replace('zoom=0', 'zoom=1'),
          canCheck: true
        });

        // Check Open Library
        const openLibraryUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
        results.push({
          url: openLibraryUrl,
          source: 'Open Library',
          thumbnail: `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`,
          canCheck: true
        });
      }

      setAutoSearchResults(results);
    } catch (err) {
      console.error('Auto search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateImageUrl = async (url) => {
    setValidatingUrl(true);
    try {
      // Create a temporary image element to validate the URL
      const img = new Image();
      img.src = url;
      
      return new Promise((resolve) => {
        img.onload = () => {
          setValidatingUrl(false);
          resolve(true);
        };
        img.onerror = () => {
          setValidatingUrl(false);
          resolve(false);
        };
        
        // Timeout after 5 seconds
        setTimeout(() => {
          setValidatingUrl(false);
          resolve(false);
        }, 5000);
      });
    } catch (err) {
      setValidatingUrl(false);
      return false;
    }
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      setError('Please enter an image URL');
      return;
    }
    
    setError(null);
    const isValid = await validateImageUrl(urlInput.trim());
    
    if (!isValid) {
      setError('Could not load image from this URL. Please check the URL and try again.');
      return;
    }
    
    const newCover = {
      url: urlInput.trim(),
      thumbnail: urlInput.trim(),
      source: 'other',
      title: 'Custom URL'
    };
    
    setSelectedCover(newCover);
    
    // Notify parent
    if (onSelectCover) {
      onSelectCover(newCover.url);
    }
  };

  const handleAutoResultSelect = async (result) => {
    // Validate the URL first
    const isValid = await validateImageUrl(result.url);
    
    if (!isValid) {
      setError(`This source doesn't have a cover for this book. Try another source.`);
      return;
    }
    
    setSelectedCover(result);
    setUrlInput(result.url);
    
    if (onSelectCover) {
      onSelectCover(result.url);
    }
  };

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Auto-found covers */}
      {autoSearchResults.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
            Quick Select - Found Covers:
          </Typography>
          <Grid container spacing={2}>
            {autoSearchResults.map((result, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedCover?.url === result.url ? 2 : 0,
                    borderColor: 'primary.main',
                    position: 'relative',
                    '&:hover': {
                      boxShadow: 3
                    }
                  }}
                  onClick={() => handleAutoResultSelect(result)}
                >
                  <CardMedia
                    component="img"
                    height="180"
                    image={result.thumbnail}
                    alt={result.source}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div style="height: 180px; display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
                          <span style="color: #999;">No cover found</span>
                        </div>
                      `;
                    }}
                  />
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
                  <CardActions>
                    <Chip label={result.source} size="small" variant="outlined" />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* If no auto results found */}
      {searchAttempted && autoSearchResults.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No covers found automatically. Try searching manually below:
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Manual Search Section */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Manual Search - External Sites:
        </Typography>
        
        {/* Search Source Buttons */}
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {searchSources.map((source) => (
            <Grid item xs={6} sm={4} md="auto" key={source.name}>
              <Tooltip title={source.instructions} arrow placement="top">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<span>{source.icon}</span>}
                  endIcon={<OpenIcon fontSize="small" />}
                  onClick={() => window.open(source.generateUrl(), '_blank')}
                  sx={{
                    borderColor: source.color,
                    color: source.color,
                    '&:hover': {
                      borderColor: source.color,
                      bgcolor: `${source.color}10`,
                    },
                    width: '100%',
                  }}
                >
                  {source.name}
                </Button>
              </Tooltip>
            </Grid>
          ))}
        </Grid>

        {/* Instructions */}
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            mb: 3,
            bgcolor: 'background.default'
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CopyIcon fontSize="small" />
            How to get image URL:
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Click one of the search buttons above
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Find the book cover you want
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Right-click on the cover image
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Select "Copy image address" (not "Copy image")
            </Typography>
            <Typography component="li" variant="body2">
              Paste the URL below
            </Typography>
          </Box>
        </Paper>

        {/* URL Input */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Paste image URL here..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleUrlImport();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon />
                </InputAdornment>
              ),
            }}
            disabled={validatingUrl}
          />
          <Button
            variant="contained"
            onClick={handleUrlImport}
            disabled={!urlInput.trim() || validatingUrl}
            startIcon={validatingUrl ? <LinearProgress size={20} /> : null}
          >
            {validatingUrl ? 'Checking...' : 'Import'}
          </Button>
        </Box>

        {/* Selected Cover Preview */}
        {selectedCover && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Selected Cover Preview
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'start' }}>
              <Card sx={{ 
                width: 150,
                border: 2, 
                borderColor: 'primary.main',
              }}>
                <CardMedia
                  component="img"
                  image={selectedCover.url}
                  alt="Selected cover"
                  sx={{ 
                    height: 225,
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    setError('Failed to load image. Please check the URL.');
                    setSelectedCover(null);
                  }}
                />
              </Card>
              <Box sx={{ flex: 1 }}>
                <Alert severity="success" icon={<CheckIcon />}>
                  Cover ready to use!
                </Alert>
                {mode === 'inline' && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Click 'Apply Cover' below to save your selection
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default EnhancedCoverSearch;
