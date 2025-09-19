import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
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
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  QrCodeScanner as ScanIcon,
  LibraryAdd as AddIcon,
  Speed as QuickIcon,
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
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isbnInputRef = useRef(null);
  const successTimeoutRef = useRef(null);

  // Auto-focus ISBN input on mount and after each book add (desktop only)
  useEffect(() => {
    if (open && !isMobile && !showScanner && isbnInputRef.current) {
      const timer = setTimeout(() => {
        isbnInputRef.current?.focus();
        isbnInputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, isMobile, showScanner, recentlyAdded.length]);

  // Auto-show scanner on mobile
  useEffect(() => {
    if (open && isMobile) {
      setShowScanner(true);
    }
  }, [open, isMobile]);

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
      setCurrentBook(bookData);
      
      // Automatically add the book
      await addBookToLibrary(bookData);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Book not found. Please try another ISBN.');
      setCurrentBook(null);
    } finally {
      setLoading(false);
      // Clear ISBN for next entry
      setIsbn('');
      if (!isMobile && isbnInputRef.current) {
        isbnInputRef.current.focus();
      }
    }
  };

  const addBookToLibrary = async (bookData) => {
    setProcessingBook(true);
    try {
      await bookService.addBook(bookData);
      
      // Add to recently added list
      setRecentlyAdded(prev => [{
        ...bookData,
        timestamp: Date.now()
      }, ...prev.slice(0, 4)]); // Keep last 5 books
      
      // Show success animation
      setCurrentBook({ ...bookData, success: true });
      
      // Clear current book after animation
      successTimeoutRef.current = setTimeout(() => {
        setCurrentBook(null);
      }, 2000);
      
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

  const handleClose = () => {
    setIsbn('');
    setError(null);
    setShowScanner(false);
    setRecentlyAdded([]);
    setCurrentBook(null);
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
          <QuickIcon color="primary" />
          <Typography variant="h6">
            Quick Add Books
          </Typography>
          <Badge 
            badgeContent={recentlyAdded.length} 
            color="success"
            sx={{ ml: 2 }}
          >
            <AddIcon />
          </Badge>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
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
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => handleISBNSubmit()}
                    disabled={loading || !isbn || processingBook}
                  >
                    Add
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  💡 Tip: Your handheld scanner should automatically submit after scanning
                </Typography>
              </Box>
            )}

            {/* Current book being processed */}
            {currentBook && (
              <Zoom in>
                <Card 
                  sx={{ 
                    mb: 2,
                    border: currentBook.success ? '2px solid' : '1px solid',
                    borderColor: currentBook.success ? 'success.main' : 'divider',
                    position: 'relative',
                    overflow: 'visible',
                  }}
                >
                  {currentBook.success && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        zIndex: 1,
                      }}
                    >
                      <CheckIcon 
                        sx={{ 
                          fontSize: 40,
                          color: 'success.main',
                          backgroundColor: 'background.paper',
                          borderRadius: '50%',
                        }}
                      />
                    </Box>
                  )}
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {currentBook.coverImage && (
                        <CardMedia
                          component="img"
                          sx={{ width: 60, height: 90, objectFit: 'cover' }}
                          image={currentBook.coverImage}
                          alt={currentBook.title}
                        />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" noWrap>
                          {currentBook.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {currentBook.authors?.join(', ')}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={currentBook.primaryCategory || 'Uncategorized'} 
                            size="small"
                            color={currentBook.success ? 'success' : 'default'}
                          />
                        </Box>
                      </Box>
                    </Box>
                    {processingBook && (
                      <LinearProgress sx={{ mt: 2 }} />
                    )}
                  </CardContent>
                </Card>
              </Zoom>
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
                    Add
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

        {/* Mobile recently added section */}
        {isMobile && recentlyAdded.length > 0 && (
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
    </Dialog>
  );
};

export default QuickAddBooks;
