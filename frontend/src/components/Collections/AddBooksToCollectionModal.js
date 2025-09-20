import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Alert,
  InputAdornment,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import bookService from '../../services/bookService';
import collectionService from '../../services/collectionService';

const AddBooksToCollectionModal = ({ open, onClose, collection, onBooksAdded }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooks, setSelectedBooks] = useState(new Set());
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailableBooks();
    } else {
      // Reset state when modal closes
      setSearchTerm('');
      setSelectedBooks(new Set());
      setError(null);
    }
  }, [open]);

  const fetchAvailableBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all books
      const response = await bookService.getBooks({ limit: 1000 });
      
      // Filter out books already in collection
      const existingBookIds = new Set(collection.books?.map(b => b._id || b));
      const availableBooks = response.books.filter(book => !existingBookIds.has(book._id));
      
      setBooks(availableBooks);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  // Filter books based on search
  const filteredBooks = useMemo(() => {
    if (!searchTerm) return books;
    
    const searchLower = searchTerm.toLowerCase();
    return books.filter(book => 
      book.title?.toLowerCase().includes(searchLower) ||
      book.authors?.some(author => author.toLowerCase().includes(searchLower)) ||
      book.isbn?.includes(searchTerm)
    );
  }, [books, searchTerm]);

  const handleToggleBook = (bookId) => {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(bookId)) {
      newSelected.delete(bookId);
    } else {
      newSelected.add(bookId);
    }
    setSelectedBooks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedBooks.size === filteredBooks.length) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(filteredBooks.map(b => b._id)));
    }
  };

  const handleAddBooks = async () => {
    if (selectedBooks.size === 0) return;
    
    try {
      setAdding(true);
      setError(null);
      
      // Add books to collection using bulkAddBooks
      await collectionService.bulkAddBooks(
        collection._id,
        Array.from(selectedBooks)
      );
      
      // Notify parent of success
      if (onBooksAdded) {
        onBooksAdded();
      }
      
      onClose();
    } catch (err) {
      console.error('Error adding books to collection:', err);
      setError('Failed to add books to collection');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh', display: 'flex', flexDirection: 'column' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          <Typography variant="h6">
            Add Books to {collection?.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 0 }}>
        {error && (
          <Alert severity="error" sx={{ mx: 2, mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search and Actions Bar */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search books by title, author, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={handleSelectAll}
                disabled={loading || filteredBooks.length === 0}
              >
                {selectedBooks.size === filteredBooks.length ? 'Deselect All' : 'Select All'}
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {selectedBooks.size} of {filteredBooks.length} books selected
            </Typography>
          </Box>
        </Box>

        {/* Books List */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredBooks.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography color="text.secondary">
                {books.length === 0 
                  ? 'All books are already in this collection'
                  : 'No books match your search'
                }
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredBooks.map((book) => (
                <ListItem
                  key={book._id}
                  button
                  onClick={() => handleToggleBook(book._id)}
                  selected={selectedBooks.has(book._id)}
                  sx={{ 
                    borderRadius: 1, 
                    mb: 0.5,
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                    }
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedBooks.has(book._id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  
                  <ListItemAvatar>
                    {book.coverImage ? (
                      <Avatar
                        variant="rounded"
                        src={book.coverImage}
                        alt={book.title}
                        sx={{ width: 40, height: 60 }}
                      />
                    ) : (
                      <Avatar
                        variant="rounded"
                        sx={{ width: 40, height: 60, bgcolor: 'grey.300' }}
                      >
                        📚
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={book.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {book.authors?.join(', ')}
                        </Typography>
                        {book.genres && book.genres.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            {book.genres.slice(0, 2).map((genre, index) => (
                              <Chip 
                                key={index} 
                                label={genre} 
                                size="small" 
                                variant="outlined"
                              />
                            ))}
                            {book.genres.length > 2 && (
                              <Chip 
                                label={`+${book.genres.length - 2}`} 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAddBooks}
          disabled={selectedBooks.size === 0 || adding}
          startIcon={adding ? <CircularProgress size={20} /> : <CheckIcon />}
        >
          {adding 
            ? 'Adding...' 
            : `Add ${selectedBooks.size} ${selectedBooks.size === 1 ? 'Book' : 'Books'}`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBooksToCollectionModal;
