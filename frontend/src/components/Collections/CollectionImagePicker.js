import React, { useState, useEffect } from 'react';
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
  Collections as CollectionsIcon,
  AutoAwesome as AutoIcon,
} from '@mui/icons-material';
import CoverImageUpload from '../CoverImage/CoverImageUpload';
import EnhancedCoverSearch from '../CoverImage/EnhancedCoverSearch';
import collectionService from '../../services/collectionService';

const CollectionImagePicker = ({ 
  open, 
  onClose, 
  collection,
  currentImage,
  onImageSelected,
  mode = 'modal' // 'modal' | 'inline' | 'drawer'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [availableImages, setAvailableImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch available images on mount
  useEffect(() => {
    if (open && collection) {
      fetchAvailableImages();
    }
  }, [open, collection]);

  const fetchAvailableImages = async () => {
    if (!collection) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const images = [];
      
      // Add current custom image if exists
      if (collection.coverImage && !collection.coverBookId) {
        images.push({
          id: 'custom',
          url: collection.coverImage,
          thumbnail: collection.coverImage,
          source: 'Custom',
          isActive: true
        });
      }
      
      // Add book covers from collection
      if (collection.books && collection.books.length > 0) {
        collection.books.forEach((book, index) => {
          if (book.coverImage) {
            images.push({
              id: book._id || `book-${index}`,
              url: book.coverImage,
              thumbnail: book.coverImage,
              source: 'Book Cover',
              bookTitle: book.title,
              isActive: collection.coverBookId === book._id
            });
          }
        });
      }
      
      setAvailableImages(images);
      
      // Set initial selected image
      const activeImage = images.find(img => img.isActive);
      if (activeImage) {
        setSelectedImage(activeImage);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Failed to load available images');
    } finally {
      setLoading(false);
    }
  };

  const generateCompositeImage = () => {
    // This would ideally create a composite image from multiple book covers
    // For now, we'll just use the first book's cover
    if (collection?.books && collection.books.length > 0) {
      const firstBookWithCover = collection.books.find(book => book.coverImage);
      if (firstBookWithCover) {
        return {
          id: 'composite',
          url: firstBookWithCover.coverImage,
          thumbnail: firstBookWithCover.coverImage,
          source: 'Auto-generated',
          isComposite: true
        };
      }
    }
    return null;
  };

  const handleSelectImage = (image) => {
    setSelectedImage(image);
  };

  const handleApplyImage = async () => {
    if (!selectedImage || !collection) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Determine if this is a book cover or custom image
      const bookId = selectedImage.id !== 'custom' && selectedImage.id !== 'composite' 
        ? selectedImage.id 
        : null;
      
      // Update collection with new image
      await collectionService.updateCollection(collection._id, {
        coverImage: selectedImage.url,
        coverBookId: bookId
      });
      
      setSuccessMessage('Collection image updated successfully!');
      
      if (onImageSelected) {
        onImageSelected(selectedImage.url, bookId);
      }
      
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error applying image:', err);
      setError('Failed to update collection image');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = async (imageData, imageUrl) => {
    setShowUpload(false);
    
    const newImage = {
      id: 'uploaded-' + Date.now(),
      url: imageUrl || imageData,
      thumbnail: imageUrl || imageData,
      source: 'Custom',
      isActive: false
    };
    
    setAvailableImages(prev => [newImage, ...prev]);
    setSelectedImage(newImage);
    setTabValue(0);
    setSuccessMessage('Image uploaded successfully!');
  };

  const handleSearchSelect = async (imageUrl) => {
    const newImage = {
      id: 'search-' + Date.now(),
      url: imageUrl,
      thumbnail: imageUrl,
      source: 'Web',
      isActive: false
    };
    
    setAvailableImages(prev => [newImage, ...prev]);
    setSelectedImage(newImage);
    setTabValue(0);
    setSuccessMessage('Image added successfully!');
  };

  const handleDeleteCustomImage = async () => {
    if (!collection?._id) return;
    
    if (!window.confirm('Are you sure you want to remove the custom image?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await collectionService.updateCollection(collection._id, {
        coverImage: null,
        coverBookId: null
      });
      
      setSuccessMessage('Custom image removed');
      
      // Refresh images list
      await fetchAvailableImages();
    } catch (err) {
      console.error('Error deleting custom image:', err);
      setError('Failed to delete custom image');
    } finally {
      setLoading(false);
    }
  };

  const renderImageGrid = () => {
    if (loading && availableImages.length === 0) {
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

    // Add auto-generated option if available
    const composite = generateCompositeImage();
    const allImages = composite ? [composite, ...availableImages] : availableImages;

    if (allImages.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <ImageIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">
            No images available. Upload or search for images.
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {allImages.map((image) => (
          <Grid item xs={6} sm={4} md={3} key={image.id}>
            <Fade in timeout={300}>
              <Card 
                sx={{ 
                  position: 'relative',
                  cursor: 'pointer',
                  border: selectedImage?.id === image.id ? 2 : 0,
                  borderColor: 'primary.main',
                  transform: selectedImage?.id === image.id ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 4,
                  }
                }}
                onClick={() => handleSelectImage(image)}
              >
                <CardMedia
                  component="img"
                  image={image.thumbnail || image.url}
                  alt="Collection image"
                  sx={{ 
                    height: isMobile ? 150 : 200,
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.target.src = '/api/placeholder/150/200';
                  }}
                />
                
                {/* Selection indicator */}
                {selectedImage?.id === image.id && (
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
                {image.isActive && (
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

                {/* Auto-generated badge */}
                {image.isComposite && (
                  <Chip
                    icon={<AutoIcon />}
                    label="Auto"
                    size="small"
                    color="info"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                    }}
                  />
                )}

                <CardActions sx={{ justifyContent: 'space-between', py: 1 }}>
                  <Box>
                    <Typography variant="caption" noWrap display="block">
                      {image.source}
                    </Typography>
                    {image.bookTitle && (
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {image.bookTitle}
                      </Typography>
                    )}
                  </Box>
                  {image.source === 'Custom' && (
                    <Tooltip title="Delete custom image">
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomImage();
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

  // Create a modified search component for collections
  const CollectionSearchComponent = () => {
    // We'll create a search context specific for collections
    const searchQuery = collection ? {
      title: collection.name,
      authors: [''], // Collections don't have authors
      description: collection.description
    } : null;

    return (
      <EnhancedCoverSearch
        book={searchQuery} // Pass collection data as "book" for compatibility
        onSelectCover={handleSearchSelect}
        mode="inline"
      />
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
            <CollectionsIcon color="primary" />
            <Typography variant="h6">
              Select Collection Image
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

          {/* Collection Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="600">
              {collection?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {collection?.bookCount || 0} books • {collection?.collectionType || 'Custom'} collection
            </Typography>
            {collection?.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {collection.description}
              </Typography>
            )}
          </Box>

          {/* Tabs */}
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)}
            sx={{ mb: 2 }}
          >
            <Tab label="Available Images" icon={<ImageIcon />} iconPosition="start" />
            <Tab label="Upload" icon={<UploadIcon />} iconPosition="start" />
            <Tab label="Search Web" icon={<SearchIcon />} iconPosition="start" />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ minHeight: 300 }}>
            {tabValue === 0 && renderImageGrid()}
            
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
                <CollectionSearchComponent />
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
            onClick={handleApplyImage}
            disabled={!selectedImage || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {loading ? 'Applying...' : 'Apply Image'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CollectionImagePicker;
