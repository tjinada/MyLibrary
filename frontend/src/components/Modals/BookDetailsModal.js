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
  Card,
  CardMedia,
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
  Add as AddIcon,
  LocalOffer as TagIcon,
  ArrowBackIos as PrevIcon,
  ArrowForwardIos as NextIcon,
  Image as ImageIcon,
  CollectionsBookmark as CollectionsIcon,
} from '@mui/icons-material';
import bookService from '../../services/bookService';

const BookDetailsModal = ({ open, onClose, book, onBookUpdated, onBookDeleted, onManageCollections }) => {
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
    genres: [],
    coverImage: '',
    categoryType: 'Fiction', // Add Fiction/Nonfiction
  });
  const [newTag, setNewTag] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [currentBookData, setCurrentBookData] = useState(null);
  
  // Cover selection state
  const [coverOptions, setCoverOptions] = useState([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(0);

  // Generate cover options for the book
  const generateCoverOptions = (bookData) => {
    const options = [];
    
    // Current cover (if exists)
    if (bookData.coverImage) {
      let currentUrl = bookData.coverImage;
      if (currentUrl.startsWith('http://')) {
        currentUrl = currentUrl.replace('http://', 'https://');
      }
      options.push({
        url: currentUrl,
        source: 'Current Cover',
        quality: 'Original'
      });
    }

    // Google Books alternatives
    if (bookData.googleBooksId) {
      // High quality
      options.push({
        url: `https://books.google.com/books/content?id=${bookData.googleBooksId}&printsec=frontcover&img=1&zoom=0&source=gbs_api`,
        source: 'Google Books',
        quality: 'High'
      });
      
      // Medium quality
      options.push({
        url: `https://books.google.com/books/content?id=${bookData.googleBooksId}&printsec=frontcover&img=1&zoom=1&source=gbs_api`,
        source: 'Google Books',
        quality: 'Medium'
      });

      // Thumbnail
      options.push({
        url: `https://books.google.com/books/content?id=${bookData.googleBooksId}&printsec=frontcover&img=1&zoom=5&source=gbs_api`,
        source: 'Google Books',
        quality: 'Thumbnail'
      });
    }

    // Open Library alternatives
    if (bookData.isbn) {
      const cleanIsbn = bookData.isbn.replace(/[-\s]/g, '');
      
      // Large
      options.push({
        url: `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`,
        source: 'Open Library',
        quality: 'Large'
      });
      
      // Medium
      options.push({
        url: `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`,
        source: 'Open Library',
        quality: 'Medium'
      });
      
      // Small
      options.push({
        url: `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-S.jpg`,
        source: 'Open Library',
        quality: 'Small'
      });
    }

    // Remove duplicates
    const uniqueOptions = options.filter((option, index, self) =>
      index === self.findIndex(o => o.url === option.url)
    );

    return uniqueOptions;
  };

  useEffect(() => {
    if (book) {
      const bookData = {
        status: book.status || 'to-read',
        rating: book.rating || 0,
        notes: book.notes || '',
        tags: book.tags || [],
        genres: book.genres || [],
        coverImage: book.coverImage || '',
        categoryType: book.categoryType || 'Fiction',
      };
      
      setEditedBook(bookData);
      setCurrentBookData(book); // Store current book data
      
      // Generate cover options
      const options = generateCoverOptions(book);
      setCoverOptions(options);
      setSelectedCoverIndex(0);
      
      setTabValue(0); // Reset to details tab
      setEditMode(false); // Exit edit mode
      setNewTag('');
      setNewGenre('');
    }
  }, [book]);

  if (!book) return null;
  
  // Use currentBookData for display if available (after updates), otherwise use original book
  const displayBook = currentBookData || book;

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Include selected cover if changed
      const updates = {
        ...editedBook,
        coverImage: coverOptions[selectedCoverIndex] 
          ? coverOptions[selectedCoverIndex].url 
          : editedBook.coverImage
      };
      
      const updatedBook = await bookService.updateBook(book.isbn, updates);
      
      // Update local state immediately with the returned data
      setCurrentBookData(updatedBook);
      setEditedBook({
        status: updatedBook.status || 'to-read',
        rating: updatedBook.rating || 0,
        notes: updatedBook.notes || '',
        tags: updatedBook.tags || [],
        genres: updatedBook.genres || [],
        coverImage: updatedBook.coverImage || '',
        categoryType: updatedBook.categoryType || 'Fiction',
      });
      
      if (onBookUpdated) {
        onBookUpdated(updatedBook);
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

  const handleAddTag = () => {
    if (newTag.trim() && !editedBook.tags.includes(newTag.trim())) {
      setEditedBook({
        ...editedBook,
        tags: [...editedBook.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditedBook({
      ...editedBook,
      tags: editedBook.tags.filter(t => t !== tagToRemove)
    });
  };

  const handleAddGenre = () => {
    if (newGenre.trim() && !editedBook.genres.includes(newGenre.trim())) {
      setEditedBook({
        ...editedBook,
        genres: [...editedBook.genres, newGenre.trim()]
      });
      setNewGenre('');
    }
  };

  const handleRemoveGenre = (genreToRemove) => {
    setEditedBook({
      ...editedBook,
      genres: editedBook.genres.filter(g => g !== genreToRemove)
    });
  };

  const handlePrevCover = () => {
    setSelectedCoverIndex((prev) => 
      prev > 0 ? prev - 1 : coverOptions.length - 1
    );
  };

  const handleNextCover = () => {
    setSelectedCoverIndex((prev) => 
      prev < coverOptions.length - 1 ? prev + 1 : 0
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'to-read': return 'info';
      case 'reading': return 'primary';
      case 'read': return 'success';
      case 'loaned': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'to-read': return 'To Read';
      case 'reading': return 'Reading';
      case 'read': return 'Read';
      case 'loaned': return 'Loaned';
      default: return status;
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
              <IconButton onClick={() => {
                setEditMode(false);
                // Reset to original values
                setEditedBook({
                  status: book.status || 'to-read',
                  rating: book.rating || 0,
                  notes: book.notes || '',
                  tags: book.tags || [],
                  genres: book.genres || [],
                  coverImage: book.coverImage || '',
                });
                setSelectedCoverIndex(0);
              }} size="small" disabled={loading}>
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
          <Tab label="Collections" />
        </Tabs>

        {tabValue === 0 && (
          <Grid container spacing={3}>
            {/* Book Cover */}
            <Grid item xs={12} sm={4}>
              <Box>
                {editMode ? (
                  // Edit mode - show cover selection with navigation
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ImageIcon fontSize="small" />
                      Select Cover ({selectedCoverIndex + 1} of {coverOptions.length})
                    </Typography>
                    <Card sx={{ position: 'relative' }}>
                      {coverOptions.length > 0 && (
                        <>
                          <CardMedia
                            component="img"
                            image={coverOptions[selectedCoverIndex].url}
                            alt={book.title}
                            sx={{ height: 'auto', maxHeight: 400 }}
                            onError={(e) => {
                              e.target.src = '/api/placeholder/200/300';
                            }}
                          />
                          
                          {/* Navigation buttons */}
                          {coverOptions.length > 1 && (
                            <>
                              <IconButton
                                onClick={handlePrevCover}
                                sx={{
                                  position: 'absolute',
                                  left: 0,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                                  color: 'white',
                                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                                }}
                              >
                                <PrevIcon />
                              </IconButton>
                              <IconButton
                                onClick={handleNextCover}
                                sx={{
                                  position: 'absolute',
                                  right: 0,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                                  color: 'white',
                                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                                }}
                              >
                                <NextIcon />
                              </IconButton>
                            </>
                          )}
                          
                          {/* Cover info overlay */}
                          <Box sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            p: 1,
                          }}>
                            <Typography variant="caption">
                              {coverOptions[selectedCoverIndex].source} - {coverOptions[selectedCoverIndex].quality}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Card>
                  </Box>
                ) : (
                  // View mode - show current cover
                  <Box>
                    {book.coverImage && (
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
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Book Details */}
            <Grid item xs={12} sm={8}>
              {/* Status and Rating */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  {/* Fiction/Nonfiction Category */}
                  <Grid item xs={12}>
                    {editMode ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Category Type</InputLabel>
                        <Select
                          value={editedBook.categoryType}
                          label="Category Type"
                          onChange={(e) => setEditedBook({...editedBook, categoryType: e.target.value})}
                        >
                          <MenuItem value="Fiction">Fiction</MenuItem>
                          <MenuItem value="Nonfiction">Nonfiction</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Category</Typography>
                        <Chip 
                          label={displayBook.categoryType || 'Fiction'} 
                          color={displayBook.categoryType === 'Fiction' ? 'primary' : 'secondary'}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {editMode ? (
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={editedBook.status}
                          label="Status"
                          onChange={(e) => setEditedBook({...editedBook, status: e.target.value})}
                        >
                          <MenuItem value="to-read">To Read</MenuItem>
                          <MenuItem value="reading">Reading</MenuItem>
                          <MenuItem value="read">Read</MenuItem>
                          <MenuItem value="loaned">Loaned</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip 
                          label={getStatusLabel(book.status)} 
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
                  
                  {(book.genres?.length > 0 || editMode) && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CategoryIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">Genres</Typography>
                      </Box>
                      {editMode ? (
                        <Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                            {editedBook.genres.map((genre, index) => (
                              <Chip
                                key={index}
                                label={genre}
                                size="small"
                                variant="outlined"
                                onDelete={() => handleRemoveGenre(genre)}
                              />
                            ))}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              size="small"
                              placeholder="Add genre..."
                              value={newGenre}
                              onChange={(e) => setNewGenre(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddGenre();
                                }
                              }}
                            />
                            <IconButton size="small" onClick={handleAddGenre}>
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {book.genres.map((genre, index) => (
                            <Chip key={index} label={genre} size="small" variant="outlined" />
                          ))}
                        </Box>
                      )}
                    </Grid>
                  )}
                  
                  {/* Tags section */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <TagIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">Tags</Typography>
                    </Box>
                    {editMode ? (
                      <Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                          {editedBook.tags.map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              color="secondary"
                              onDelete={() => handleRemoveTag(tag)}
                            />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            size="small"
                            placeholder="Add tag..."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                          />
                          <IconButton size="small" onClick={handleAddTag}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {book.tags && book.tags.length > 0 ? (
                          book.tags.map((tag, index) => (
                            <Chip key={index} label={tag} size="small" color="secondary" />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No tags added
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Grid>
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

        {tabValue === 3 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CollectionsIcon />
                Collections
              </Box>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {book.collections && book.collections.length > 0 ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  This book is in the following collections:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {book.collections.map((collection) => (
                    <Chip
                      key={collection._id || collection}
                      label={collection.name || collection}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This book is not in any collections yet.
              </Typography>
            )}
            
            <Button
              variant="contained"
              startIcon={<CollectionsIcon />}
              onClick={onManageCollections}
              fullWidth
            >
              Manage Collections
            </Button>
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
