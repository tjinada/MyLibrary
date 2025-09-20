import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Fade,
  Badge,
  useTheme,
  useMediaQuery,
  Zoom,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  QrCodeScanner as ScanIcon,
  LibraryAdd as AddIcon,
  Speed as QuickIcon,
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import MobileBarcodeScanner from '../Scanner/MobileBarcodeScanner';
import bookService from '../../services/bookService';

const QuickAddBooks = ({ open, onClose, onBooksAdded }) => {
  const [isbn, setIsbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [processingBook, setProcessingBook] = useState(false);
  const [confirmationMode, setConfirmationMode] = useState(false);
  
  // Book editing fields
  const [customGenres, setCustomGenres] = useState([]);
  const [customTags, setCustomTags] = useState([]);
  const [newGenre, setNewGenre] = useState('');
  const [newTag, setNewTag] = useState('');
  const [bookStatus, setBookStatus] = useState('to-read');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isbnInputRef = useRef(null);
  const successTimeoutRef = useRef(null);

  // Auto-focus ISBN input when not in confirmation mode
  useEffect(() => {
    if (open && !isMobile && !showScanner && !confirmationMode && isbnInputRef.current) {
      const timer = setTimeout(() => {
        isbnInputRef.current?.focus();
        isbnInputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, isMobile, showScanner, confirmationMode, recentlyAdded.length]);

  // Auto-show scanner on mobile
  useEffect(() => {
    if (open && isMobile && !confirmationMode) {
      setShowScanner(true);
    }
  }, [open, isMobile, confirmationMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleISBNSubmit = async (scannedISBN) => {
    const isbnToProcess = scannedISBN || isbn;
    
    if (!isbnToProcess) {
      setError('Please enter or scan an ISBN');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Look up the book
      const bookData = await bookService.lookupISBN(isbnToProcess);
      
      // Set up confirmation screen
      setCurrentBook(bookData);
      
      // Ensure Fiction or Nonfiction is in genres
      let genres = bookData.genres || [];
      if (!genres.includes('Fiction') && !genres.includes('Nonfiction')) {
        genres = ['Fiction', ...genres];
      }
      
      setCustomGenres(genres);
      setCustomTags(bookData.tags || []);
      setBookStatus('to-read');
      setConfirmationMode(true);
      
      // Clear ISBN for next entry
      setIsbn('');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Book not found. Please try another ISBN.');
      setCurrentBook(null);
      setConfirmationMode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGenre = () => {
    if (newGenre.trim() && !customGenres.includes(newGenre.trim())) {
      setCustomGenres([...customGenres, newGenre.trim()]);
      setNewGenre('');
    }
  };

  const handleRemoveGenre = (genreToRemove) => {
    // Don't allow removing Fiction/Nonfiction if it's the only one
    if ((genreToRemove === 'Fiction' || genreToRemove === 'Nonfiction')) {
      const hasOtherCategory = customGenres.includes(genreToRemove === 'Fiction' ? 'Nonfiction' : 'Fiction');
      if (!hasOtherCategory) {
        setError('You must have either Fiction or Nonfiction as a genre');
        return;
      }
    }
    setCustomGenres(customGenres.filter(g => g !== genreToRemove));
  };

  const handleToggleFictionNonfiction = (type) => {
    let newGenres = customGenres.filter(g => g !== 'Fiction' && g !== 'Nonfiction');
    newGenres = [type, ...newGenres];
    setCustomGenres(newGenres);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      setCustomTags([...customTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setCustomTags(customTags.filter(t => t !== tagToRemove));
  };

  const handleConfirmAdd = async () => {
    if (!currentBook) return;
    
    setProcessingBook(true);
    setError(null);
    
    try {
      // Prepare book data with custom fields
      const bookToAdd = {
        ...currentBook,
        genres: customGenres,
        tags: customTags,
        status: bookStatus,
      };
      
      await bookService.addBook(bookToAdd);
      
      // Add to recently added list
      setRecentlyAdded(prev => [{
        ...bookToAdd,
        timestamp: Date.now()
      }, ...prev.slice(0, 4)]); // Keep last 5 books
      
      // Show success animation
      setCurrentBook({ ...bookToAdd, success: true });
      setConfirmationMode(false);
      
      // Clear current book after animation
      successTimeoutRef.current = setTimeout(() => {
        setCurrentBook(null);
        // Refocus ISBN input for next scan
        if (!isMobile && isbnInputRef.current) {
          isbnInputRef.current.focus();
          isbnInputRef.current.select();
        }
      }, 1500);
      
      // Notify parent
      if (onBooksAdded) {
        onBooksAdded();
      }
      
    } catch (err) {
      if (err.response?.status === 409) {
        setError('This book already exists in your library');
      } else {
        setError(err.response?.data?.message || 'Failed to add book');
      }
    } finally {
      setProcessingBook(false);
    }
  };

  const handleCancelConfirmation = () => {
    setConfirmationMode(false);
    setCurrentBook(null);
    setCustomGenres([]);
    setCustomTags([]);
    setNewGenre('');
    setNewTag('');
    setBookStatus('to-read');
    
    // Refocus ISBN input
    if (!isMobile && isbnInputRef.current) {
      setTimeout(() => {
        isbnInputRef.current?.focus();
        isbnInputRef.current?.select();
      }, 100);
    }
  };

  const handleClose = () => {
    setIsbn('');
    setError(null);
    setShowScanner(false);
    setRecentlyAdded([]);
    setCurrentBook(null);
    setConfirmationMode(false);
    setCustomGenres([]);
    setCustomTags([]);
    setNewGenre('');
    setNewTag('');
    setBookStatus('to-read');
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { 
          minHeight: isMobile ? '100vh' : '600px',
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {confirmationMode && (
            <IconButton onClick={handleCancelConfirmation} size="small">
              <BackIcon />
            </IconButton>
          )}
          <QuickIcon color="primary" />
          <Typography variant="h6">
            {confirmationMode ? 'Confirm Book Details' : 'Quick Add Books'}
          </Typography>
          {!confirmationMode && (
            <Badge 
              badgeContent={recentlyAdded.length} 
              color="success"
              sx={{ ml: 2 }}
            >
              <AddIcon />
            </Badge>
          )}
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {!confirmationMode ? (
          // Scanner Mode
          <Box sx={{ display: 'flex', height: '100%' }}>
            {/* Main scanning area */}
            <Box sx={{ flex: 1, p: 2 }}>
              {/* Progress indicator */}
              {loading && <LinearProgress sx={{ mb: 2 }} />}
              
              {/* Error display */}
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 2 }}
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              {/* Success message */}
              {currentBook?.success && (
                <Zoom in>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Book successfully added! Ready for next scan.
                  </Alert>
                </Zoom>
              )}

              {/* Mobile scanner */}
              {isMobile && showScanner && (
                <Box sx={{ mb: 2 }}>
                  <MobileBarcodeScanner
                    onScan={handleISBNSubmit}
                    onError={(err) => setError(err.message)}
                    autoStart={true}
                  />
                </Box>
              )}

              {/* Desktop ISBN input */}
              {!isMobile && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Scan or type ISBN:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="ISBN"
                      variant="outlined"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      placeholder="Scan with handheld scanner or type"
                      disabled={loading || processingBook}
                      inputRef={isbnInputRef}
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !loading) {
                          handleISBNSubmit();
                        }
                      }}
                      InputProps={{
                        sx: { 
                          fontFamily: 'monospace',
                          fontSize: '1.1rem',
                          bgcolor: 'action.hover',
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleISBNSubmit()}
                      disabled={loading || !isbn || processingBook}
                    >
                      Lookup
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    💡 Tip: Your handheld scanner should automatically submit after scanning
                  </Typography>
                </Box>
              )}

              {/* Mobile manual entry option */}
              {isMobile && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Or enter manually:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="ISBN"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      disabled={loading || processingBook}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !loading) {
                          handleISBNSubmit();
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleISBNSubmit()}
                      disabled={loading || !isbn || processingBook}
                    >
                      Lookup
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Recently added sidebar */}
            {!isMobile && recentlyAdded.length > 0 && (
              <Box
                sx={{
                  width: 300,
                  borderLeft: 1,
                  borderColor: 'divider',
                  p: 2,
                  bgcolor: 'grey.50',
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Recently Added ({recentlyAdded.length})
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {recentlyAdded.map((book, index) => (
                    <Fade in key={book.isbn + book.timestamp}>
                      <Card sx={{ mb: 1 }}>
                        <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                          <Typography variant="body2" noWrap>
                            {book.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {book.authors?.[0]}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Fade>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          // Confirmation Mode
          <Box sx={{ p: 3 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}
            
            {currentBook && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  {/* Book cover */}
                  <Card>
                    {currentBook.coverImage ? (
                      <CardMedia
                        component="img"
                        image={currentBook.coverImage}
                        alt={currentBook.title}
                        sx={{ height: 'auto', maxHeight: 400 }}
                      />
                    ) : (
                      <Box sx={{ 
                        height: 300, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: 'grey.200'
                      }}>
                        <Typography color="text.secondary">No Cover</Typography>
                      </Box>
                    )}
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={8}>
                  <Typography variant="h5" gutterBottom>
                    {currentBook.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    by {currentBook.authors?.join(', ')}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">ISBN</Typography>
                        <Typography variant="body1">{currentBook.isbn}</Typography>
                      </Grid>
                      {currentBook.publisher && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Publisher</Typography>
                          <Typography variant="body1">{currentBook.publisher}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>

                  {/* Status */}
                  <Box sx={{ mt: 3 }}>
                    <TextField
                      select
                      label="Status"
                      value={bookStatus}
                      onChange={(e) => setBookStatus(e.target.value)}
                      size="small"
                      sx={{ minWidth: 150 }}
                      SelectProps={{ native: true }}
                    >
                      <option value="to-read">To Read</option>
                      <option value="reading">Reading</option>
                      <option value="read">Read</option>
                      <option value="loaned">Loaned</option>
                    </TextField>
                  </Box>

                  {/* Genres */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Genres
                    </Typography>
                    
                    {/* Fiction/Nonfiction Toggle */}
                    <Box sx={{ mb: 2 }}>
                      <Button
                        variant={customGenres.includes('Fiction') ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => handleToggleFictionNonfiction('Fiction')}
                        sx={{ mr: 1 }}
                      >
                        Fiction
                      </Button>
                      <Button
                        variant={customGenres.includes('Nonfiction') ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => handleToggleFictionNonfiction('Nonfiction')}
                      >
                        Nonfiction
                      </Button>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      {customGenres.map((genre, index) => (
                        <Chip
                          key={index}
                          label={genre}
                          size="small"
                          color={(genre === 'Fiction' || genre === 'Nonfiction') ? 'primary' : 'default'}
                          onDelete={(genre !== 'Fiction' && genre !== 'Nonfiction') || 
                                   (customGenres.includes('Fiction') && customGenres.includes('Nonfiction')) 
                                   ? () => handleRemoveGenre(genre) : undefined}
                        />
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
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
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleAddGenre}
                      >
                        Add
                      </Button>
                    </Box>
                  </Box>

                  {/* Tags */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      {customTags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          color="secondary"
                          onDelete={() => handleRemoveTag(tag)}
                        />
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
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
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleAddTag}
                      >
                        Add
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            )}
          </Box>
        )}

        {/* Mobile recently added section */}
        {!confirmationMode && isMobile && recentlyAdded.length > 0 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              Added: {recentlyAdded.length} books
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
              {recentlyAdded.map((book) => (
                <Chip
                  key={book.isbn + book.timestamp}
                  label={book.title}
                  size="small"
                  sx={{ flexShrink: 0 }}
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Confirmation Actions */}
      {confirmationMode && currentBook && (
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCancelConfirmation}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmAdd}
            disabled={processingBook}
            startIcon={processingBook ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {processingBook ? 'Adding...' : 'Add to Library'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default QuickAddBooks;
