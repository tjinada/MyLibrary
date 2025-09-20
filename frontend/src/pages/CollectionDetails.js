import React, { useState, useEffect } from 'react';
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
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack as BackIcon,
  DragIndicator as DragIcon,
  CollectionsBookmark as CollectionIcon
} from '@mui/icons-material';
import Header from '../components/Layout/Header';
import BookGrid from '../components/Books/BookGrid';
import BookList from '../components/Books/BookList';
import { useCollections } from '../contexts/CollectionContext';
import { useAuth } from '../contexts/AuthContext';
import collectionService from '../services/collectionService';
import CollectionDebugDialog from '../components/Debug/CollectionDebugDialog';

const CollectionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { updateCollection, deleteCollection, removeBookFromCollection, reorderBooks } = useCollections();
  
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);
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
          bookCount: prev.bookCount - 1
        }));
      } catch (error) {
        console.error('Error removing book:', error);
      }
    }
  };

  const handleBookClick = (book) => {
    // Navigate to book details or open book modal
    console.log('Book clicked:', book);
  };

  const handleReorderBooks = async (newOrder) => {
    try {
      await reorderBooks(id, newOrder);
      fetchCollection(); // Refresh to get updated order
    } catch (error) {
      console.error('Error reordering books:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Header />
        <MuiToolbar />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={60} />
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
          <Button sx={{ mt: 2 }} onClick={() => navigate('/collections')}>
            Back to Collections
          </Button>
        </Container>
      </Box>
    );
  }

  // Get books in proper order for series
  // Ensure we're displaying ALL books in the collection
  const displayBooks = useMemo(() => {
    if (!collection) return [];
    
    // For series with defined order, use bookOrder
    if (collection.collectionType === 'series' && collection.bookOrder?.length > 0) {
      return collection.bookOrder;
    }
    
    // Otherwise use all books in the collection
    return collection.books || [];
  }, [collection]);
  
  // Debug logging
  useEffect(() => {
    if (collection) {
      console.log('Collection details:', {
        id: collection._id,
        name: collection.name,
        bookCount: collection.bookCount,
        actualBooksLength: collection.books?.length,
        bookOrderLength: collection.bookOrder?.length,
        displayBooksLength: displayBooks.length
      });
    }
  }, [collection, displayBooks]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <MuiToolbar />
      
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            component="button"
            variant="body2"
            onClick={() => navigate('/')}
            sx={{ cursor: 'pointer' }}
          >
            Library
          </Link>
          <Link 
            component="button"
            variant="body2"
            onClick={() => navigate('/collections')}
            sx={{ cursor: 'pointer' }}
          >
            Collections
          </Link>
          <Typography variant="body2" color="text.primary">
            {collection.name}
          </Typography>
        </Breadcrumbs>

        {/* Collection Header */}
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <CollectionIcon sx={{ fontSize: 48, color: 'primary.main', mt: 1 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                  {collection.name}
                </Typography>
                <Chip 
                  label={collection.collectionType} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                />
                <Chip 
                  label={`${collection.bookCount || 0} books`} 
                  size="small"
                />
              </Box>
              
              {collection.description && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {collection.description}
                </Typography>
              )}

              {isAuthenticated && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setEditDialogOpen(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={handleDeleteCollection}
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
          </Box>
        </Paper>

        {/* Books Display */}
        {displayBooks && displayBooks.length > 0 ? (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Books in Collection ({displayBooks.length} {displayBooks.length === 1 ? 'book' : 'books'})
            </Typography>
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
          </Box>
        ) : (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 6, 
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No books in this collection yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add books from your library to this collection
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ mt: 3 }}
              onClick={() => navigate('/')}
            >
              Browse Library
            </Button>
          </Paper>
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
                <MenuItem value="custom">Custom</MenuItem>
                <MenuItem value="series">Series</MenuItem>
                <MenuItem value="theme">Theme</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditCollection} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CollectionDetails;
