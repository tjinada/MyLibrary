import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import bookService from '../services/bookService';

const BookDetail = () => {
  const { isbn } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchBook();
  }, [isbn]);

  const fetchBook = async () => {
    try {
      const data = await bookService.getBook(isbn);
      setBook(data);
      setEditData({
        status: data.status,
        location: data.location || '',
        rating: data.rating || 0,
        notes: data.notes || '',
        tags: data.tags?.join(', ') || '',
      });
      setLoading(false);
    } catch (err) {
      setError('Failed to load book details');
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const updates = {
        ...editData,
        tags: editData.tags ? editData.tags.split(',').map(t => t.trim()) : [],
      };
      await bookService.updateBook(isbn, updates);
      await fetchBook();
      setEditDialog(false);
    } catch (err) {
      setError('Failed to update book');
    }
  };

  const handleDelete = async () => {
    try {
      await bookService.deleteBook(isbn);
      navigate('/library');
    } catch (err) {
      setError('Failed to delete book');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !book) {
    return (
      <Container>
        <Alert severity="error">{error || 'Book not found'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/library')} sx={{ mt: 2 }}>
          Back to Library
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/library')} sx={{ mb: 2 }}>
        Back to Library
      </Button>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            {book.coverImage && (
              <img
                src={book.coverImage}
                alt={book.title}
                style={{
                  width: '100%',
                  maxWidth: 300,
                  height: 'auto',
                  borderRadius: 8,
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            )}
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {book.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {book.authors?.join(', ')}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
              <Chip 
                label={book.status} 
                color={book.status === 'available' ? 'success' : 'primary'}
              />
              {book.rating > 0 && (
                <Rating value={book.rating} readOnly />
              )}
            </Box>

            <Grid container spacing={2} sx={{ my: 2 }}>
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
                  <Typography variant="body2" color="text.secondary">Published</Typography>
                  <Typography variant="body1">{book.publishedDate}</Typography>
                </Grid>
              )}
              {book.pageCount > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Pages</Typography>
                  <Typography variant="body1">{book.pageCount}</Typography>
                </Grid>
              )}
              {book.location && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <LocationIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    Location
                  </Typography>
                  <Typography variant="body1">{book.location}</Typography>
                </Grid>
              )}
            </Grid>

            {book.genres?.length > 0 && (
              <Box sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Genres
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {book.genres.map((genre, index) => (
                    <Chip key={index} label={genre} size="small" />
                  ))}
                </Box>
              </Box>
            )}

            {book.tags?.length > 0 && (
              <Box sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {book.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {book.notes && (
              <Box sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body2">{book.notes}</Typography>
              </Box>
            )}

            {book.description && (
              <Box sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2">{book.description}</Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditDialog(true)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialog(true)}
              >
                Delete
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Book Details</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editData.status}
                label="Status"
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="reading">Reading</MenuItem>
                <MenuItem value="loaned">Loaned</MenuItem>
                <MenuItem value="wishlist">Wishlist</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Location"
              value={editData.location}
              onChange={(e) => setEditData({ ...editData, location: e.target.value })}
              placeholder="e.g., Living Room - Shelf 2"
            />

            <Box>
              <Typography component="legend">Rating</Typography>
              <Rating
                value={editData.rating}
                onChange={(e, value) => setEditData({ ...editData, rating: value })}
              />
            </Box>

            <TextField
              label="Tags"
              value={editData.tags}
              onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
              placeholder="Comma separated tags"
              helperText="Separate tags with commas"
            />

            <TextField
              label="Notes"
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Book</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{book.title}" from your library?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookDetail;
