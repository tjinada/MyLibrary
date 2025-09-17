import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Rating,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  CalendarMonth as DateIcon,
  MenuBook as PagesIcon,
  Category as CategoryIcon,
  Person as AuthorIcon,
} from '@mui/icons-material';
import bookService from '../../services/bookService';

const BookDetailsModal = ({ open, onClose, book, onBookUpdated, onBookDeleted }) => {
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Edit form state
  const [editedBook, setEditedBook] = useState({
    status: '',
    rating: 0,
    notes: '',
    tags: [],
  });

  useEffect(() => {
    if (book) {
      setEditedBook({
        status: book.status || 'available',
        rating: book.rating || 0,
        notes: book.notes || '',
        tags: book.tags || [],
      });
      setTabValue(0); // Reset to details tab
      setEditMode(false); // Exit edit mode
    }
  }, [book]);

  if (!book) return null;

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await bookService.updateBook(book.isbn, editedBook);
      
      if (onBookUpdated) {
        onBookUpdated();
      }
      
      setEditMode(false);
    } catch (err) {
      setError('Failed to update book');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this book?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await bookService.deleteBook(book.isbn);
      
      if (onBookDeleted) {
        onBookDeleted();
      }
      
      onClose();
    } catch (err) {
      setError('Failed to delete book');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'reading': return 'primary';
      case 'loaned': return 'warning';
      case 'wishlist': return 'default';
      default: return 'default';
    }
  };

  return (
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
        pb: 1,
      }}>
        <Typography variant="h6" component="div" sx={{ pr: 2 }}>
          {book.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!editMode ? (
            <IconButton onClick={() => setEditMode(true)} size="small">
              <EditIcon />
            </IconButton>
          ) : (
            <>
              <IconButton onClick={handleSave} size="small" color="primary" disabled={loading}>
                <SaveIcon />
              </IconButton>
              <IconButton onClick={() => setEditMode(false)} size="small" disabled={loading}>
                <CancelIcon />
              </IconButton>
            </>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label="Details" />
          <Tab label="Description" />
          <Tab label="Notes" />
        </Tabs>

        {tabValue === 0 && (
          <Grid container spacing={3}>
            {/* Book Cover */}
            {book.coverImage && (
              <Grid item xs={12} sm={4}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  mb: 2,
                }}>
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      maxHeight: 400,
                      borderRadius: 8,
                      boxShadow: theme.shadows[4],
                    }}
                  />
                </Box>
              </Grid>
            )}

            {/* Book Details */}
            <Grid item xs={12} sm={book.coverImage ? 8 : 12}>
              {/* Status and Rating */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    {editMode ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={editedBook.status}
                          label="Status"
                          onChange={(e) => setEditedBook({...editedBook, status: e.target.value})}
                        >
                          <MenuItem value="available">Available</MenuItem>
                          <MenuItem value="reading">Reading</MenuItem>
                          <MenuItem value="loaned">Loaned</MenuItem>
                          <MenuItem value="wishlist">Wishlist</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip 
                          label={book.status} 
                          color={getStatusColor(book.status)}
                          size="small"
                        />
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Rating
                    </Typography>
                    <Rating 
                      value={editMode ? editedBook.rating : book.rating || 0}
                      onChange={(e, newValue) => {
                        if (editMode) {
                          setEditedBook({...editedBook, rating: newValue});
                        }
                      }}
                      readOnly={!editMode}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Book Information */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Book Information</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  {book.authors && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AuthorIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">Authors</Typography>
                      </Box>
                      <Typography variant="body1">{book.authors.join(', ')}</Typography>
                    </Grid>
                  )}
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">ISBN</Typography>
                    <Typography variant="body1">{book.isbn}</Typography>
                  </Grid>
                  
                  {book.publisher && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Publisher</Typography>
                      <Typography variant="body1">{book.publisher}</Typography>
                    </Grid>
                  )}
                  
                  {book.publishedDate && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DateIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">Published</Typography>
                      </Box>
                      <Typography variant="body1">
                        {new Date(book.publishedDate).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  )}
                  
                  {book.pageCount > 0 && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PagesIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">Pages</Typography>
                      </Box>
                      <Typography variant="body1">{book.pageCount}</Typography>
                    </Grid>
                  )}
                  
                  {book.genres?.length > 0 && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CategoryIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">Genres</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {book.genres.map((genre, index) => (
                          <Chip key={index} label={genre} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Description</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {book.description || 'No description available'}
            </Typography>
          </Paper>
        )}

        {tabValue === 2 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Personal Notes</Typography>
            <Divider sx={{ mb: 2 }} />
            {editMode ? (
              <TextField
                fullWidth
                multiline
                rows={6}
                value={editedBook.notes}
                onChange={(e) => setEditedBook({...editedBook, notes: e.target.value})}
                placeholder="Add your personal notes about this book..."
                variant="outlined"
              />
            ) : (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {book.notes || 'No notes yet. Click edit to add notes.'}
              </Typography>
            )}
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleDelete} 
          color="error"
          startIcon={<DeleteIcon />}
          disabled={loading}
        >
          Delete Book
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookDetailsModal;
