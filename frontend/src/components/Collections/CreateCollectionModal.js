import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Checkbox,
  Typography,
  InputAdornment,
  Chip,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Book as BookIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Check as CheckIcon,
  CollectionsBookmark as CollectionsIcon,
} from '@mui/icons-material';
import collectionService from '../../services/collectionService';
import bookService from '../../services/bookService';

const CreateCollectionModal = ({ open, onClose, onCollectionCreated, initialBooks = [] }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    displayInLibrary: true
  });
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [booksLoaded, setBooksLoaded] = useState(false);
  const fetchInProgress = useRef(false);

  const steps = ['Collection Details', 'Add Books', 'Review & Create'];

  useEffect(() => {
    if (open) {
      // Reset form when opening
      setActiveStep(0);
      setFormData({
        name: '',
        description: '',
        displayInLibrary: true
      });
      // Properly initialize selected books from initialBooks
      const initialBookIds = initialBooks.map(b => {
        if (typeof b === 'string') return b;
        if (b && b._id) return b._id;
        return null;
      }).filter(Boolean);
      setSelectedBooks(initialBookIds);
      setSearchQuery('');
      setError(null);
      // Don't reset booksLoaded here to prevent re-fetching
      
      // Fetch books once when dialog opens
      fetchBooks();
    } else {
      // Reset when dialog closes
      setBooksLoaded(false);
      setAllBooks([]);
      setFilteredBooks([]);
    }
  }, [open]); // Remove initialBooks from dependencies to prevent repeated fetches

  useEffect(() => {
    // Filter books based on search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = allBooks.filter(book => 
        book.title?.toLowerCase().includes(query) ||
        book.authors?.some(author => author.toLowerCase().includes(query)) ||
        book.isbn?.includes(query)
      );
      setFilteredBooks(filtered);
    } else {
      setFilteredBooks(allBooks);
    }
  }, [searchQuery, allBooks]);

  const fetchBooks = async () => {
    // Only fetch once per dialog open
    if (fetchInProgress.current || booksLoaded) return;
    
    fetchInProgress.current = true;
    
    try {
      const data = await bookService.getBooks({ limit: 1000 });
      if (data && data.books) {
        setAllBooks(data.books);
        setFilteredBooks(data.books);
      }
    } catch (err) {
      // Silently handle errors - user can still create empty collections
      console.log('Could not load books list');
    } finally {
      setBooksLoaded(true);
      fetchInProgress.current = false;
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate collection details
      if (!formData.name.trim()) {
        setError('Collection name is required');
        return;
      }
    }
    setError(null);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleToggleBook = (bookId) => {
    setSelectedBooks(prev => {
      if (prev.includes(bookId)) {
        return prev.filter(id => id !== bookId);
      } else {
        return [...prev, bookId];
      }
    });
  };

  const handleToggleAll = () => {
    if (selectedBooks.length === filteredBooks.length) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks(filteredBooks.map(book => book._id));
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create the collection first without books
      const newCollection = await collectionService.createCollection(formData);

      // Add ALL selected books to the collection
      // Ensure we're not skipping any books
      if (selectedBooks.length > 0) {
        console.log('Adding books to collection:', selectedBooks);
        
        // Make sure we're passing all book IDs
        const bookIdsToAdd = selectedBooks.filter(id => {
          // Validate that these are valid MongoDB ObjectIds
          return id && id.match(/^[0-9a-fA-F]{24}$/);
        });
        
        if (bookIdsToAdd.length > 0) {
          const updatedCollection = await collectionService.bulkAddBooks(
            newCollection._id, 
            bookIdsToAdd
          );
          
          // Verify all books were added
          console.log('Collection after adding books:', {
            id: updatedCollection._id,
            bookCount: updatedCollection.bookCount,
            actualBooks: updatedCollection.books?.length
          });
          
          // Use the updated collection with books
          if (onCollectionCreated) {
            onCollectionCreated(updatedCollection);
          }
        } else {
          // No valid books to add, use original collection
          if (onCollectionCreated) {
            onCollectionCreated(newCollection);
          }
        }
      } else {
        // No books selected
        if (onCollectionCreated) {
          onCollectionCreated(newCollection);
        }
      }

      onClose();
    } catch (err) {
      console.error('Error creating collection:', err);
      setError(err.response?.data?.message || 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        // Collection Details
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="name"
              label="Collection Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              autoFocus
              placeholder="e.g., Throne of Glass Series"
              disabled={loading}
              error={!!error && !formData.name.trim() && activeStep === 0}
              helperText={error && !formData.name.trim() && activeStep === 0 ? 'Collection name is required' : ''}
            />

            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Optional description of this collection"
              disabled={loading}
            />

            <FormControlLabel
              control={
                <Switch
                  name="displayInLibrary"
                  checked={formData.displayInLibrary}
                  onChange={(e) => setFormData({ ...formData, displayInLibrary: e.target.checked })}
                  disabled={loading}
                />
              }
              label="Display in main library view"
            />
          </Box>
        );

      case 1:
        // Add Books
        return (
          <Box sx={{ mt: 2 }}>
            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder="Search books by title, author, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {/* Select All / Selection Count */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filteredBooks.length > 0 && selectedBooks.length === filteredBooks.length}
                    indeterminate={selectedBooks.length > 0 && selectedBooks.length < filteredBooks.length}
                    onChange={handleToggleAll}
                  />
                }
                label="Select All"
              />
              <Typography variant="body2" color="text.secondary">
                {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''} selected
              </Typography>
            </Box>

            {/* Book List */}
            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
              <List dense>
                {filteredBooks.length === 0 ? (
                  <ListItem>
                    <ListItemText 
                      primary="No books found" 
                      secondary={searchQuery ? "Try a different search term" : "No books in your library yet"}
                    />
                  </ListItem>
                ) : (
                  filteredBooks.map((book) => (
                    <ListItem
                      key={book._id}
                      disablePadding
                      dense
                    >
                      <ListItemButton onClick={() => handleToggleBook(book._id)}>
                        <Checkbox
                          edge="start"
                          checked={selectedBooks.includes(book._id)}
                          tabIndex={-1}
                          disableRipple
                        />
                        <ListItemAvatar>
                          <Avatar variant="rounded" sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                            {book.coverImage ? (
                              <img 
                                src={book.coverImage} 
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <BookIcon sx={{ fontSize: 18 }} />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={book.title}
                          secondary={book.authors?.join(', ')}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))
                )}
              </List>
            </Paper>
          </Box>
        );

      case 2:
        // Review & Create
        return (
          <Box sx={{ mt: 2 }}>
            <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CollectionsIcon color="primary" />
                Collection Summary
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography variant="body1" gutterBottom>{formData.name}</Typography>
                
                {formData.description && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Description
                    </Typography>
                    <Typography variant="body1" gutterBottom>{formData.description}</Typography>
                  </>
                )}
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  Books to Add
                </Typography>
                <Typography variant="body1">
                  {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''} selected
                </Typography>
                
                {selectedBooks.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {allBooks
                      .filter(book => selectedBooks.includes(book._id))
                      .slice(0, 5)
                      .map(book => (
                        <Chip
                          key={book._id}
                          label={book.title}
                          size="small"
                          variant="outlined"
                        />
                      ))
                    }
                    {selectedBooks.length > 5 && (
                      <Chip
                        label={`+${selectedBooks.length - 5} more`}
                        size="small"
                        variant="filled"
                        color="primary"
                      />
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6">Create New Collection</Typography>
        <Stepper activeStep={activeStep} sx={{ mt: 1.5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel 
                StepIconProps={{ 
                  sx: { 
                    fontSize: '1.2rem',
                    '&.MuiStepIcon-root': { width: 28, height: 28 }
                  } 
                }}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontSize: '0.85rem',
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>
      
      <DialogContent>
        {error && activeStep === 2 && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {getStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading} startIcon={<BackIcon />}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button 
            onClick={handleNext} 
            variant="contained"
            disabled={loading || (activeStep === 0 && !formData.name.trim())}
            endIcon={<NextIcon />}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {loading ? 'Creating...' : 'Create Collection'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateCollectionModal;
