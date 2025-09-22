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
import CompositeImageGenerator from './CompositeImageGenerator';
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
  const [compositeImage, setCompositeImage] = useState(null);
  const [generatingComposite, setGeneratingComposite] = useState(false);
  
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

  const handleCompositeGenerated = (dataUrl) => {
    if (dataUrl) {
      const compositeImageObj = {
        id: 'composite',
        url: dataUrl,
        thumbnail: dataUrl,
        source: 'Auto-generated Grid',
        isComposite: true
      };
      setCompositeImage(compositeImageObj);
      setGeneratingComposite(false);
    }
  };

  const getBookCoversForComposite = () => {
    if (!collection?.books || collection.books.length === 0) return [];
    
    // Get up to 4 book covers for the composite
    return collection.books
      .filter(book => book.coverImage)
      .slice(0, 4)
      .map(book => book.coverImage);
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

    // Add auto-generated composite if available
    const allImages = compositeImage ? [compositeImage, ...availableImages] : availableImages;

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
                    label="Grid"
                    size="small"
                    color="secondary"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      fontWeight: 600,
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

          {/* Auto-Generate Section - Always visible on Tab 0 */}
          {tabValue === 0 && getBookCoversForComposite().length >= 2 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Auto-Generate Collection Cover:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card 
                    sx={{ 
                      position: 'relative',
                      border: 2,
                      borderColor: 'secondary.main',
                      borderStyle: 'dashed',
                      bgcolor: 'background.default',
                      height: 300,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {!compositeImage ? (
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <AutoIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          Generate Grid Cover
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Creates a {getBookCoversForComposite().length <= 2 ? '1×2' : '2×2'} grid from book covers
                        </Typography>
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() => setGeneratingComposite(true)}
                          disabled={generatingComposite}
                          startIcon={generatingComposite ? <CircularProgress size={20} /> : <AutoIcon />}
                        >
                          {generatingComposite ? 'Generating...' : 'Generate'}
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                        <Box
                          component="img"
                          src={compositeImage.url}
                          alt="Generated composite"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            bgcolor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            p: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="caption">Auto-generated Grid</Typography>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleSelectImage(compositeImage)}
                            sx={{ minWidth: 'auto', px: 2 }}
                          >
                            Use This
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Card>
                </Grid>
              </Grid>
              
              {/* Hidden canvas for generation */}
              {generatingComposite && (
                <Box sx={{ position: 'absolute', left: -9999 }}>
                  <CompositeImageGenerator
                    bookCovers={getBookCoversForComposite()}
                    width={400}
                    height={600}
                    onImageGenerated={handleCompositeGenerated}
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Tab Content */}
          <Box sx={{ minHeight: 300 }}>
            {tabValue === 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                  Select from Existing Images:
                </Typography>
                {renderImageGrid()}
              </Box>
            )}
            
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
