import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Toolbar as MuiToolbar,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Fade,
  useTheme,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  Divider,
  alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack,
  GridView as GridIcon,
  ViewList as ListIcon,
  CollectionsBookmark as CollectionIcon,
  AutoStories as SeriesIcon,
  Category as ThemeIcon,
  Style as CustomIcon,
  CalendarToday as DateIcon,
  Person as AuthorIcon,
  MenuBook as BookIcon,
  LibraryBooks as LibraryIcon,
  Share as ShareIcon,
  MoreVert as MoreIcon,
  Description as DescriptionIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import Header from '../components/Layout/Header';
import BookGrid from '../components/Books/BookGrid';
import BookList from '../components/Books/BookList';
import BookDetailsModal from '../components/Modals/BookDetailsModal';
import ManageCollectionsModal from '../components/Collections/ManageCollectionsModal';
import AddBooksToCollectionModal from '../components/Collections/AddBooksToCollectionModal';
import CollectionImagePicker from '../components/Collections/CollectionImagePicker';
import { useCollections } from '../contexts/CollectionContext';
import { useAuth } from '../contexts/AuthContext';
import collectionService from '../services/collectionService';
import CollectionDebugDialog from '../components/Debug/CollectionDebugDialog';

const CollectionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useAuth();
  const { updateCollection, deleteCollection, removeBookFromCollection, reorderBooks } = useCollections();
  
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [manageCollectionsOpen, setManageCollectionsOpen] = useState(false);
  const [addBooksModalOpen, setAddBooksModalOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    collectionType: 'custom'
  });

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      const data = await collectionService.getCollection(id);
      setCollection(data);
      setEditData({
        name: data.name,
        description: data.description || '',
        collectionType: data.collectionType
      });
    } catch (err) {
      setError('Failed to load collection');
      console.error('Error fetching collection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCollection = async () => {
    try {
      await updateCollection(id, editData);
      setCollection(prev => ({ ...prev, ...editData }));
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating collection:', error);
    }
  };

  const handleDeleteCollection = async () => {
    if (window.confirm(`Are you sure you want to delete the collection "${collection.name}"?\n\nIMPORTANT: Only the collection will be deleted. All books will remain in your library.`)) {
      try {
        await deleteCollection(id);
        navigate('/collections');
      } catch (error) {
        console.error('Error deleting collection:', error);
        alert('Failed to delete collection. Please try again.');
      }
    }
  };

  const handleRemoveBook = async (bookId) => {
    if (window.confirm('Remove this book from the collection?')) {
      try {
        await removeBookFromCollection(id, bookId);
        setCollection(prev => ({
          ...prev,
          books: prev.books.filter(b => b._id !== bookId),
          bookOrder: prev.bookOrder ? prev.bookOrder.filter(b => b._id !== bookId) : [],
          bookCount: prev.bookCount - 1
        }));
      } catch (error) {
        console.error('Error removing book:', error);
        alert('Failed to remove book. Please try again.');
      }
    }
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setDetailsModalOpen(true);
  };

  const handleReorderBooks = async (newOrder) => {
    try {
      await reorderBooks(id, newOrder);
      fetchCollection();
    } catch (error) {
      console.error('Error reordering books:', error);
    }
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Get the appropriate icon for collection type
  const getCollectionIcon = (type) => {
    switch(type) {
      case 'series':
        return <SeriesIcon sx={{ fontSize: 40 }} />;
      case 'theme':
        return <ThemeIcon sx={{ fontSize: 40 }} />;
      default:
        return <CustomIcon sx={{ fontSize: 40 }} />;
    }
  };

  // Get collection type color
  const getTypeColor = (type) => {
    switch(type) {
      case 'series':
        return theme.palette.info.main;
      case 'theme':
        return theme.palette.success.main;
      default:
        return theme.palette.primary.main;
    }
  };

  // Get collection type label with better naming
  const getTypeLabel = (type) => {
    switch(type) {
      case 'series':
        return 'Book Series';
      case 'theme':
        return 'Themed Collection';
      default:
        return 'Custom Collection';
    }
  };

  const displayBooks = useMemo(() => {
    if (!collection) return [];
    if (collection.collectionType === 'series' && collection.bookOrder?.length > 0) {
      return collection.bookOrder;
    }
    return collection.books || [];
  }, [collection]);

  // Calculate collection statistics
  const collectionStats = useMemo(() => {
    if (!collection || !displayBooks.length) return null;
    
    const uniqueAuthors = new Set();
    const genres = new Set();
    let totalPages = 0;
    let readCount = 0;
    
    displayBooks.forEach(book => {
      if (book.authors) {
        book.authors.forEach(author => uniqueAuthors.add(author));
      }
      if (book.genres) {
        book.genres.forEach(genre => genres.add(genre));
      }
      if (book.pageCount) {
        totalPages += book.pageCount;
      }
      if (book.status === 'read') {
        readCount++;
      }
    });
    
    return {
      bookCount: displayBooks.length,
      authorCount: uniqueAuthors.size,
      genreCount: genres.size,
      totalPages,
      readCount,
      readPercentage: Math.round((readCount / displayBooks.length) * 100)
    };
  }, [collection, displayBooks]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Header />
        <MuiToolbar />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={60} thickness={4} />
        </Box>
      </Box>
    );
  }

  if (error || !collection) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Header />
        <MuiToolbar />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Alert severity="error">{error || 'Collection not found'}</Alert>
          <Button sx={{ mt: 2 }} onClick={() => navigate('/collections')} startIcon={<ArrowBack />}>
            Back to Collections
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <MuiToolbar />
      
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Back to Library Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{
              textTransform: 'none',
              color: 'text.primary',
              fontWeight: 500,
              '&:hover': {
                bgcolor: 'action.hover',
                color: 'primary.main',
              },
              padding: '6px 12px',
              borderRadius: 2,
            }}
          >
            Back to Library
          </Button>
        </Box>

        {/* Enhanced Collection Header */}
        <Fade in timeout={600}>
          <Paper 
            elevation={0}
            sx={{ 
              mb: 4,
              borderRadius: 3,
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${alpha(getTypeColor(collection.collectionType), 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
              border: `1px solid ${alpha(getTypeColor(collection.collectionType), 0.2)}`,
            }}
          >
            {/* Hero Section - Compact 2-row design */}
            <Box sx={{ 
              p: { xs: 3, md: 4 },
              background: `linear-gradient(135deg, ${alpha(getTypeColor(collection.collectionType), 0.15)} 0%, transparent 100%)`,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                {/* Icon Container */}
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${getTypeColor(collection.collectionType)} 0%, ${alpha(getTypeColor(collection.collectionType), 0.8)} 100%)`,
                    color: 'white',
                    boxShadow: theme.shadows[4],
                    flexShrink: 0,
                    display: isMobile ? 'none' : 'flex',
                  }}
                >
                  {getCollectionIcon(collection.collectionType)}
                </Box>
                
                {/* Content */}
                <Box sx={{ flexGrow: 1 }}>
                  {/* Row 1: Title, Badge, and Action Buttons */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    mb: 2.5,
                    flexWrap: 'wrap'
                  }}>
                    {/* Title and Badge */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: isMobile ? 1 : 0 }}>
                      <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        component="h1" 
                        sx={{ 
                          fontWeight: 700,
                          background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.text.primary, 0.8)} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {collection.name}
                      </Typography>
                      <Chip 
                        label={getTypeLabel(collection.collectionType)}
                        size="small"
                        sx={{
                          bgcolor: alpha(getTypeColor(collection.collectionType), 0.15),
                          color: getTypeColor(collection.collectionType),
                          borderColor: getTypeColor(collection.collectionType),
                          fontWeight: 600,
                        }}
                        variant="outlined"
                      />
                    </Box>
                    
                    {/* Spacer for desktop */}
                    {!isMobile && <Box sx={{ flexGrow: 1 }} />}
                    
                    {/* Action Buttons */}
                    {isAuthenticated && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => setAddBooksModalOpen(true)}
                          size={isMobile ? "small" : "medium"}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            boxShadow: theme.shadows[2],
                            '&:hover': {
                              boxShadow: theme.shadows[4],
                            }
                          }}
                        >
                          Add Books
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => setEditDialogOpen(true)}
                          size={isMobile ? "small" : "medium"}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 500,
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<ImageIcon />}
                          onClick={() => setImagePickerOpen(true)}
                          size={isMobile ? "small" : "medium"}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 500,
                          }}
                        >
                          Change Image
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          color="error"
                          onClick={handleDeleteCollection}
                          size={isMobile ? "small" : "medium"}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 500,
                          }}
                        >
                          Delete
                        </Button>
                        {process.env.NODE_ENV === 'development' && (
                          <Button
                            size="small"
                            onClick={() => setDebugDialogOpen(true)}
                            color="warning"
                          >
                            Debug
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                  
                  {/* Row 2: Statistics and Description */}
                  <Box>
                    {/* Description */}
                    {collection.description && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                        <DescriptionIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.3 }} />
                        <Typography variant="body1" color="text.secondary">
                          {collection.description}
                        </Typography>
                      </Box>
                    )}

                    {/* Statistics Cards */}
                    {collectionStats && (
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Paper
                          elevation={0}
                          sx={{
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BookIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {collectionStats.bookCount} {collectionStats.bookCount === 1 ? 'Book' : 'Books'}
                            </Typography>
                          </Box>
                        </Paper>
                        
                        {collectionStats.authorCount > 0 && (
                          <Paper
                            elevation={0}
                            sx={{
                              px: 2,
                              py: 1,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.info.main, 0.08),
                              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AuthorIcon sx={{ fontSize: 18, color: 'info.main' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {collectionStats.authorCount} {collectionStats.authorCount === 1 ? 'Author' : 'Authors'}
                              </Typography>
                            </Box>
                          </Paper>
                        )}
                        
                        {collectionStats.readPercentage > 0 && (
                          <Paper
                            elevation={0}
                            sx={{
                              px: 2,
                              py: 1,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.success.main, 0.08),
                              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              {collectionStats.readPercentage}% Read
                            </Typography>
                          </Paper>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Fade>

        {/* Books Section */}
        {displayBooks && displayBooks.length > 0 ? (
          <Fade in timeout={800}>
            <Box>
              {/* Section Header with View Toggle */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3,
              }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <BookIcon sx={{ color: 'primary.main' }} />
                  Collection Books
                </Typography>
                
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  size="small"
                  sx={{
                    bgcolor: 'background.paper',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                  }}
                >
                  <ToggleButton 
                    value="grid" 
                    aria-label="grid view"
                    sx={{ px: 2 }}
                  >
                    <GridIcon sx={{ mr: 1 }} />
                    Grid
                  </ToggleButton>
                  <ToggleButton 
                    value="list" 
                    aria-label="list view"
                    sx={{ px: 2 }}
                  >
                    <ListIcon sx={{ mr: 1 }} />
                    List
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Books Display */}
              <Paper 
                elevation={0}
                sx={{ 
                  p: viewMode === 'grid' ? 2 : 0,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                {viewMode === 'grid' ? (
                  <BookGrid 
                    books={displayBooks} 
                    onBookClick={handleBookClick}
                    showRemoveButton={isAuthenticated}
                    onRemoveBook={handleRemoveBook}
                  />
                ) : (
                  <BookList 
                    books={displayBooks} 
                    onBookClick={handleBookClick}
                    showRemoveButton={isAuthenticated}
                    onRemoveBook={handleRemoveBook}
                    draggable={collection.collectionType === 'series' && isAuthenticated}
                    onReorder={handleReorderBooks}
                  />
                )}
              </Paper>
            </Box>
          </Fade>
        ) : (
          <Fade in timeout={800}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 8, 
                textAlign: 'center',
                borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, white 100%)`,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ mb: 3 }}>
                <BookIcon sx={{ fontSize: 80, color: 'text.disabled', opacity: 0.5 }} />
              </Box>
              <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                No books in this collection yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Start building your collection by adding books from your library
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                }}
                onClick={() => setAddBooksModalOpen(true)}
              >
                Add Books to Collection
              </Button>
            </Paper>
          </Fade>
        )}
      </Container>

      {/* Debug Dialog (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <CollectionDebugDialog
          open={debugDialogOpen}
          onClose={() => setDebugDialogOpen(false)}
          collectionId={id}
        />
      )}

      {/* Edit Collection Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Collection</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={editData.collectionType}
                onChange={(e) => setEditData({ ...editData, collectionType: e.target.value })}
                label="Type"
              >
                <MenuItem value="custom">Custom Collection</MenuItem>
                <MenuItem value="series">Book Series</MenuItem>
                <MenuItem value="theme">Themed Collection</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditCollection} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Book Details Modal */}
      <BookDetailsModal
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedBook(null);
        }}
        book={selectedBook}
        onBookUpdated={() => {
          fetchCollection();
        }}
        onBookDeleted={() => {
          fetchCollection();
          setDetailsModalOpen(false);
        }}
        onManageCollections={() => {
          setManageCollectionsOpen(true);
        }}
      />

      {/* Manage Collections Modal */}
      {selectedBook && (
        <ManageCollectionsModal
          open={manageCollectionsOpen}
          onClose={() => setManageCollectionsOpen(false)}
          book={selectedBook}
          onCollectionsUpdated={() => {
            fetchCollection();
            setManageCollectionsOpen(false);
          }}
        />
      )}

      {/* Add Books to Collection Modal */}
      {collection && (
        <AddBooksToCollectionModal
          open={addBooksModalOpen}
          onClose={() => setAddBooksModalOpen(false)}
          collection={collection}
          onBooksAdded={() => {
            fetchCollection();
            setAddBooksModalOpen(false);
          }}
        />
      )}

      {/* Collection Image Picker */}
      {collection && (
        <CollectionImagePicker
          open={imagePickerOpen}
          onClose={() => setImagePickerOpen(false)}
          collection={collection}
          currentImage={collection.coverImage}
          onImageSelected={(imageUrl, bookId) => {
            fetchCollection();
            setImagePickerOpen(false);
          }}
        />
      )}
    </Box>
  );
};

export default CollectionDetails;
