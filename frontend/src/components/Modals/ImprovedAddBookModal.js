import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Grid,
  Card,
  CardMedia,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Switch,
  Divider,
  Fade,
  Slide,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Add as AddIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  QrCodeScanner as ScannerIcon,
  LibraryAdd as MultiAddIcon,
} from '@mui/icons-material';
import BarcodeScanner from '../Scanner/BarcodeScanner';
import bookService from '../../services/bookService';

const AddBookModal = ({ open, onClose, onBookAdded }) => {
  const [isbn, setIsbn] = useState('');
  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Multi-add mode
  const [multiAddMode, setMultiAddMode] = useState(false);
  const [booksAdded, setBooksAdded] = useState(0);
  
  // View states
  const [showScanner, setShowScanner] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isbnInputRef = useRef(null);
  
  // Auto-focus ISBN input when modal opens or after adding a book
  useEffect(() => {
    if (open && !isMobile && !showScanner && !showConfirmation) {
      // Small delay to ensure the modal is fully rendered
      setTimeout(() => {
        if (isbnInputRef.current) {
          isbnInputRef.current.focus();
        }
      }, 100);
    }
  }, [open, isMobile, showScanner, showConfirmation]);

  // Handle ISBN lookup
  const handleISBNLookup = async (scannedISBN) => {
    const isbnToLookup = scannedISBN || isbn;
    
    if (!isbnToLookup) {
      setError('Please enter or scan an ISBN');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await bookService.lookupISBN(isbnToLookup);
      setBookData(data);
      setShowConfirmation(true);
      setShowScanner(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Book not found. Please try another ISBN.');
      // Clear ISBN field for retry
      setIsbn('');
      if (isbnInputRef.current) {
        isbnInputRef.current.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle adding book to library
  const handleAddBook = async () => {
    if (!bookData) return;

    setLoading(true);
    setError(null);

    try {
      await bookService.addBook(bookData);
      setBooksAdded(prev => prev + 1);
      
      // Success feedback
      setSuccessMessage(`"${bookData.title}" added successfully!`);
      
      // Clear states for next book
      setBookData(null);
      setIsbn('');
      setShowConfirmation(false);
      
      // Notify parent
      if (onBookAdded) {
        onBookAdded();
      }
      
      if (multiAddMode) {
        // Show success briefly, then reset for next book
        setTimeout(() => {
          setSuccessMessage('');
          // Auto-focus ISBN input for next scan
          if (!isMobile && isbnInputRef.current) {
            isbnInputRef.current.focus();
          }
          // On mobile, show scanner again
          if (isMobile) {
            setShowScanner(true);
          }
        }, 1500);
      } else {
        // Single add mode - close after success
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setError('This book already exists in your library');
      } else {
        setError(err.response?.data?.message || 'Failed to add book');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setIsbn('');
    setBookData(null);
    setError(null);
    setSuccessMessage('');
    setShowScanner(false);
    setShowConfirmation(false);
    setMultiAddMode(false);
    setBooksAdded(0);
    onClose();
  };

  // Handle back action
  const handleBack = () => {
    setShowConfirmation(false);
    setBookData(null);
    setError(null);
    setIsbn('');
    if (isbnInputRef.current) {
      isbnInputRef.current.focus();
    }
  };

  // Handle scanner toggle
  const toggleScanner = () => {
    setShowScanner(!showScanner);
    setError(null);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showConfirmation && (
            <IconButton onClick={handleBack} size="small">
              <BackIcon />
            </IconButton>
          )}
          <Typography variant="h6">
            {multiAddMode ? `Add Books (${booksAdded} added)` : 'Add Book to Library'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Success Message */}
        {successMessage && (
          <Fade in>
            <Alert 
              severity="success" 
              icon={<CheckIcon />}
              sx={{ mb: 2 }}
            >
              {successMessage}
            </Alert>
          </Fade>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Multi-add toggle */}
        {!showConfirmation && !successMessage && (
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={multiAddMode}
                  onChange={(e) => setMultiAddMode(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MultiAddIcon fontSize="small" />
                  <Typography variant="body2">
                    Multiple Book Mode {multiAddMode && `(${booksAdded} added)`}
                  </Typography>
                </Box>
              }
            />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 5 }}>
              {multiAddMode 
                ? 'Keep scanning books continuously' 
                : 'Add a single book and close'}
            </Typography>
          </Box>
        )}

        {/* ISBN Input Section */}
        {!showConfirmation && !successMessage && (
          <Box>
            {/* Mobile-only scanner section */}
            {isMobile && (
              <>
                {showScanner ? (
                  <Box>
                    <BarcodeScanner 
                      onScan={(scannedISBN) => {
                        setIsbn(scannedISBN);
                        handleISBNLookup(scannedISBN);
                      }}
                      onError={(err) => setError(err.message)}
                    />
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={toggleScanner}
                      sx={{ mt: 2 }}
                    >
                      Use Manual Entry Instead
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<ScannerIcon />}
                      onClick={toggleScanner}
                      sx={{ mb: 2 }}
                    >
                      Scan Barcode
                    </Button>
                    <Divider sx={{ my: 2 }}>OR</Divider>
                  </Box>
                )}
              </>
            )}

            {/* Manual ISBN entry (always shown on desktop, conditional on mobile) */}
            {(!isMobile || !showScanner) && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {isMobile ? 'Enter ISBN manually:' : 'Scan or type ISBN:'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="ISBN"
                    variant="outlined"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="Enter ISBN-10 or ISBN-13"
                    disabled={loading}
                    inputRef={isbnInputRef}
                    autoFocus={!isMobile}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !loading) {
                        handleISBNLookup();
                      }
                    }}
                    InputProps={{
                      sx: { fontFamily: 'monospace' }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => handleISBNLookup()}
                    disabled={loading || !isbn}
                    startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </Box>
                {!isMobile && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Use your handheld barcode scanner or type the ISBN
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Book Confirmation */}
        {showConfirmation && bookData && (
          <Slide direction="left" in={showConfirmation} mountOnEnter unmountOnExit>
            <Box>
              <Typography variant="h6" gutterBottom>
                Confirm Book Details
              </Typography>
              
              <Card sx={{ mb: 2 }}>
                <Grid container>
                  {bookData.coverImage && (
                    <Grid item xs={4}>
                      <CardMedia
                        component="img"
                        image={bookData.coverImage}
                        alt={bookData.title}
                        sx={{ height: 'auto', maxHeight: 200 }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </Grid>
                  )}
                  <Grid item xs={bookData.coverImage ? 8 : 12}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom noWrap>
                        {bookData.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        by {bookData.authors?.join(', ')}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        ISBN: {bookData.isbn}
                      </Typography>
                      {bookData.publishedDate && (
                        <Typography variant="caption" display="block">
                          Published: {bookData.publishedDate}
                        </Typography>
                      )}
                      {bookData.primaryCategory && (
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={bookData.primaryCategory} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                          <Chip 
                            label={bookData.categoryType || 'Fiction'} 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Card>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Wrong Book
                </Button>
                <Button
                  variant="contained"
                  onClick={handleAddBook}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                >
                  {loading ? 'Adding...' : 'Add to Library'}
                </Button>
              </Box>
            </Box>
          </Slide>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddBookModal;
