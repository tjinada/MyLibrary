import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Grid,
  Card,
  CardMedia,
  CardActions,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  Skeleton,
  useTheme,
  useMediaQuery,
  Fade,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Image as ImageIcon,
  PhotoLibrary as GalleryIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import CoverImageUpload from './CoverImageUpload';
import CoverSearchDialog from './CoverSearchDialog';
import bookService from '../../services/bookService';

const CoverImagePicker = ({ 
  open, 
  onClose, 
  book,
  currentCover,
  onCoverSelected,
  mode = 'modal' // 'modal' | 'inline' | 'drawer'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [availableCovers, setAvailableCovers] = useState([]);
  const [selectedCover, setSelectedCover] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Check if book exists in database (has been saved)
  const bookExists = book?._id ? true : false;

  // Fetch available covers on mount
  useEffect(() => {
    if (open && book?.isbn) {
      if (bookExists) {
        // Book exists in DB, fetch covers normally
        fetchAvailableCovers();
      } else {
        // Book not in DB yet, just show current cover and search options
        const covers = [];
        if (currentCover) {
          covers.push({
            id: 'current',
            url: currentCover,
            thumbnail: currentCover,
            source: 'Current',
            isActive: true
          });
        }
        setAvailableCovers(covers);
      }
    }
  }, [open, book, bookExists, currentCover]);

  const fetchAvailableCovers = async () => {
    if (!book?.isbn) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await bookService.getAllCovers(book.isbn);
      setAvailableCovers(response.covers || []);
      
      // Set initial selected cover
      const activeCover = response.covers?.find(c => c.isActive);
      if (activeCover) {
        setSelectedCover(activeCover);
      }
    } catch (err) {
      console.error('Error fetching covers:', err);
      setError('Failed to load available covers');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCover = (cover) => {
    setSelectedCover(cover);
  };

  const handleApplyCover = async () => {
    if (!selectedCover) return;
    
    // If book doesn't exist in DB yet, just pass the URL back
    if (!bookExists) {
      if (onCoverSelected) {
        onCoverSelected(selectedCover.url, selectedCover.source);
      }
      onClose();
      return;
    }
    
    // Book exists, update in database
    if (!book?.isbn) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await bookService.selectCover(book.isbn, selectedCover.url, selectedCover.source);
      setSuccessMessage('Cover updated successfully!');
      
      if (onCoverSelected) {
        onCoverSelected(selectedCover.url, selectedCover.source);
      }
      
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error applying cover:', err);
      setError('Failed to update cover');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = async (imageData, imageUrl) => {
    setShowUpload(false);
    
    // If book doesn't exist yet, just add to available covers
    if (!bookExists) {
      const newCover = {
        id: 'uploaded-' + Date.now(),
        url: imageUrl || imageData,
        thumbnail: imageUrl || imageData,
        source: 'Uploaded',
        isActive: false
      };
      setAvailableCovers(prev => [...prev, newCover]);
      setSelectedCover(newCover);
      setTabValue(0);
      setSuccessMessage('Cover uploaded successfully!');
      return;
    }
    
    // Book exists, upload to backend
    setLoading(true);
    
    try {
      await bookService.uploadCover(book.isbn, imageData, imageUrl);
      setSuccessMessage('Cover uploaded successfully!');
      
      // Refresh covers list
      await fetchAvailableCovers();
      
      // Switch to gallery tab
      setTabValue(0);
    } catch (err) {
      console.error('Error uploading cover:', err);
      setError('Failed to upload cover');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomCover = async () => {
    if (!book?.isbn || !bookExists) return;
    
    if (!window.confirm('Are you sure you want to delete your custom cover?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await bookService.deleteCoverImage(book.isbn);
      setSuccessMessage('Custom cover deleted');
      
      // Refresh covers list
      await fetchAvailableCovers();
    } catch (err) {
      console.error('Error deleting custom cover:', err);
      setError('Failed to delete custom cover');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSelect = async (coverUrl) => {
    setShowSearch(false);
    
    // If book doesn't exist yet, just add to available covers
    if (!bookExists) {
      const newCover = {
        id: 'search-' + Date.now(),
        url: coverUrl,
        thumbnail: coverUrl,
        source: 'Web Search',
        isActive: false
      };
      setAvailableCovers(prev => [...prev, newCover]);
      setSelectedCover(newCover);
      setTabValue(0);
      setSuccessMessage('Cover added successfully!');
      return;
    }
    
    // Book exists, upload to backend
    setLoading(true);
    
    try {
      // Upload the selected image from search
      await bookService.uploadCover(book.isbn, null, coverUrl);
      setSuccessMessage('Cover added successfully!');
      
      // Refresh covers list
      await fetchAvailableCovers();
      
      // Switch to gallery tab
      setTabValue(0);
    } catch (err) {
      console.error('Error adding cover from search:', err);
      setError('Failed to add cover');
    } finally {
      setLoading(false);
    }
  };

  const renderCoverGrid = () => {
    if (loading && availableCovers.length === 0) {
      return (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((n) => (
            <Grid item xs={6} sm={4} md={3} key={n}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      );
    }

    if (availableCovers.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <ImageIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">
            No covers available. Upload or search for covers.
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {availableCovers.map((cover) => (
          <Grid item xs={6} sm={4} md={3} key={cover.id}>
            <Fade in timeout={300}>
              <Card 
                sx={{ 
                  position: 'relative',
                  cursor: 'pointer',
                  border: selectedCover?.id === cover.id ? 2 : 0,
                  borderColor: 'primary.main',
                  transform: selectedCover?.id === cover.id ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 4,
                  }
                }}
                onClick={() => handleSelectCover(cover)}
              >
                <CardMedia
                  component="img"
                  image={cover.thumbnail || cover.url}
                  alt="Book cover"
                  sx={{ 
                    height: isMobile ? 150 : 200,
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.target.src = '/api/placeholder/150/200';
                  }}
                />
                
                {/* Selection indicator */}
                {selectedCover?.id === cover.id && (
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

                {/* Active badge */}
                {cover.isActive && (
                  <Chip
                    label="Current"
                    size="small"
                    color="success"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                    }}
                  />
                )}

                <CardActions sx={{ justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="caption" noWrap>
                    {cover.source}
                  </Typography>
                  {cover.source === 'User Upload' && (
                    <Tooltip title="Delete custom cover">
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomCover();
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GalleryIcon color="primary" />
            <Typography variant="h6">
              Select Book Cover
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {/* Success/Error Messages */}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Book Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="600">
              {book?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              by {book?.authors?.join(', ')}
            </Typography>
          </Box>

          {/* Tabs */}
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)}
            sx={{ mb: 2 }}
          >
            <Tab label="Available Covers" icon={<ImageIcon />} iconPosition="start" />
            <Tab label="Upload" icon={<UploadIcon />} iconPosition="start" />
            <Tab label="Search Web" icon={<SearchIcon />} iconPosition="start" />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ minHeight: 300 }}>
            {tabValue === 0 && renderCoverGrid()}
            
            {tabValue === 1 && (
              <Box>
                <CoverImageUpload
                  onUploadSuccess={handleUploadSuccess}
                  onError={setError}
                />
              </Box>
            )}
            
            {tabValue === 2 && (
              <Box>
                {/* Direct search UI without extra dialog */}
                <CoverSearchDialog
                  open={false}  // Use inline mode
                  book={book}
                  onSelectCover={handleSearchSelect}
                  mode="inline"
                />
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApplyCover}
            disabled={!selectedCover || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {loading ? 'Applying...' : 'Apply Cover'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <CoverImageUpload
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadSuccess={handleUploadSuccess}
        onError={setError}
      />

      {/* Search Dialog */}
      <CoverSearchDialog
        open={showSearch}
        onClose={() => setShowSearch(false)}
        book={book}
        onSelectCover={handleSearchSelect}
      />
    </>
  );
};

export default CoverImagePicker;
