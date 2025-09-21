import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Skeleton,
  Radio,
  useTheme,
  alpha,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Star as StarIcon,
  ImageSearch as ImageSearchIcon
} from '@mui/icons-material';

const CoverSelectionDialog = ({ 
  open, 
  onClose, 
  onSelect, 
  isbn, 
  googleBooksId,
  currentCoverUrl,
  bookTitle 
}) => {
  const theme = useTheme();
  const [covers, setCovers] = useState([]);
  const [selectedCover, setSelectedCover] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoadStates, setImageLoadStates] = useState({});

  useEffect(() => {
    if (open) {
      fetchAllCovers();
    }
  }, [open, isbn, googleBooksId]);

  const fetchAllCovers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/books/covers/fetch-all', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          isbn, 
          googleBooksId, 
          currentCoverUrl 
        })
      });

      const data = await response.json();
      
      if (data.success && data.covers.length > 0) {
        setCovers(data.covers);
        setSelectedCover(data.defaultCover?.id || data.covers[0].id);
      } else if (data.covers.length === 0) {
        setError('No covers found for this book');
      } else {
        setError(data.message || 'Failed to fetch covers');
      }
    } catch (err) {
      setError('Failed to fetch covers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = (coverId) => {
    setImageLoadStates(prev => ({ ...prev, [coverId]: 'loaded' }));
  };

  const handleImageError = (coverId) => {
    setImageLoadStates(prev => ({ ...prev, [coverId]: 'error' }));
  };

  const handleSelect = () => {
    const selected = covers.find(c => c.id === selectedCover);
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  const getSourceColor = (source) => {
    switch(source) {
      case 'librarything': return theme.palette.primary.main;
      case 'google': return theme.palette.secondary.main;
      case 'openlibrary': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  const getQualityBadge = (score) => {
    if (score >= 90) return { label: 'Best', color: 'success' };
    if (score >= 70) return { label: 'Good', color: 'primary' };
    if (score >= 50) return { label: 'Fair', color: 'warning' };
    return { label: 'Low', color: 'default' };
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">Select Cover Image</Typography>
            <Typography variant="caption" color="text.secondary">
              {bookTitle || 'Choose the best cover for your book'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Searching for covers...</Typography>
          </Box>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && covers.length === 0 && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={300}>
            <ImageSearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No covers found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try searching with a different ISBN or adding manually
            </Typography>
          </Box>
        )}

        {!loading && covers.length > 0 && (
          <>
            <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>
              Found {covers.length} cover{covers.length !== 1 ? 's' : ''} from multiple sources. 
              Click to select, then confirm your choice.
            </Alert>

            <Grid container spacing={2}>
              {covers.map((cover) => {
                const isSelected = selectedCover === cover.id;
                const imageState = imageLoadStates[cover.id];
                const quality = getQualityBadge(cover.score);

                return (
                  <Grid item xs={6} sm={4} md={3} key={cover.id}>
                    <Card
                      onClick={() => setSelectedCover(cover.id)}
                      sx={{
                        cursor: 'pointer',
                        position: 'relative',
                        border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: theme.shadows[4]
                        }
                      }}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 2,
                            bgcolor: 'primary.main',
                            borderRadius: '50%',
                            p: 0.5,
                            display: 'flex'
                          }}
                        >
                          <CheckIcon sx={{ color: 'white', fontSize: 16 }} />
                        </Box>
                      )}

                      {/* Default/Best badge */}
                      {cover.score >= 90 && (
                        <Tooltip title="Highest Quality">
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              zIndex: 2,
                              bgcolor: alpha(theme.palette.warning.main, 0.9),
                              borderRadius: '50%',
                              p: 0.5,
                              display: 'flex'
                            }}
                          >
                            <StarIcon sx={{ color: 'white', fontSize: 16 }} />
                          </Box>
                        </Tooltip>
                      )}

                      {/* Cover Image */}
                      <Box
                        sx={{
                          position: 'relative',
                          paddingTop: '150%', // 2:3 aspect ratio
                          bgcolor: 'grey.100',
                          overflow: 'hidden'
                        }}
                      >
                        {imageState !== 'loaded' && (
                          <Skeleton
                            variant="rectangular"
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%'
                            }}
                          />
                        )}
                        
                        {imageState === 'error' ? (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'grey.200'
                            }}
                          >
                            <ErrorIcon color="disabled" />
                          </Box>
                        ) : (
                          <img
                            src={cover.url}
                            alt={`Cover option ${cover.id}`}
                            onLoad={() => handleImageLoad(cover.id)}
                            onError={() => handleImageError(cover.id)}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: imageState === 'loaded' ? 'block' : 'none'
                            }}
                          />
                        )}
                      </Box>

                      {/* Cover Info */}
                      <CardContent sx={{ p: 1 }}>
                        <Box display="flex" flexDirection="column" gap={0.5}>
                          <Chip
                            label={cover.sourceName}
                            size="small"
                            sx={{
                              bgcolor: alpha(getSourceColor(cover.source), 0.1),
                              color: getSourceColor(cover.source),
                              fontWeight: 'medium',
                              height: 20
                            }}
                          />
                          <Box display="flex" justifyContent="space-between">
                            <Chip
                              label={quality.label}
                              size="small"
                              color={quality.color}
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {cover.sizeLabel || cover.label}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSelect}
          variant="contained"
          disabled={!selectedCover || loading}
          startIcon={<CheckIcon />}
        >
          Use Selected Cover
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CoverSelectionDialog;
