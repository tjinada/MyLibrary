import React, { useState } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardMedia,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Add as AddIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import BarcodeScanner from '../Scanner/BarcodeScanner';
import bookService from '../../services/bookService';

const AddBookModal = ({ open, onClose, onBookAdded }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isbn, setIsbn] = useState('');
  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const steps = ['Enter ISBN', 'Review Details', 'Complete'];

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
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Book not found. Please try another ISBN.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async () => {
    if (!bookData) return;

    setLoading(true);
    setError(null);

    try {
      await bookService.addBook(bookData);
      setActiveStep(2);
      
      // Notify parent component
      if (onBookAdded) {
        onBookAdded();
      }
      
      // Auto close after success
      setTimeout(() => {
        handleClose();
      }, 1500);
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

  const handleClose = () => {
    setActiveStep(0);
    setIsbn('');
    setBookData(null);
    setError(null);
    onClose();
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setError(null);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {activeStep > 0 && activeStep < 2 && (
            <IconButton onClick={handleBack} size="small">
              <BackIcon />
            </IconButton>
          )}
          <Typography variant="h6">Add Book to Library</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Step 1: ISBN Input */}
        {activeStep === 0 && (
          <Box>
            <BarcodeScanner 
              onScan={(scannedISBN) => {
                setIsbn(scannedISBN);
                handleISBNLookup(scannedISBN);
              }}
              onError={(err) => setError(err.message)}
            />

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Or enter ISBN manually:
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
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleISBNLookup();
                    }
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
            </Box>
          </Box>
        )}

        {/* Step 2: Book Preview */}
        {activeStep === 1 && bookData && (
          <Grid container spacing={3}>
            {bookData.coverImage && (
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardMedia
                    component="img"
                    image={bookData.coverImage}
                    alt={bookData.title}
                    sx={{ height: 'auto', maxHeight: 400 }}
                  />
                </Card>
              </Grid>
            )}
            <Grid item xs={12} sm={bookData.coverImage ? 8 : 12}>
              <Typography variant="h5" gutterBottom>
                {bookData.title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                by {bookData.authors?.join(', ')}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">ISBN</Typography>
                    <Typography variant="body1">{bookData.isbn}</Typography>
                  </Grid>
                  {bookData.publisher && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Publisher</Typography>
                      <Typography variant="body1">{bookData.publisher}</Typography>
                    </Grid>
                  )}
                  {bookData.publishedDate && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Published</Typography>
                      <Typography variant="body1">{bookData.publishedDate}</Typography>
                    </Grid>
                  )}
                  {bookData.pageCount > 0 && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Pages</Typography>
                      <Typography variant="body1">{bookData.pageCount}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {bookData.genres?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Genres
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {bookData.genres.map((genre, index) => (
                      <Chip key={index} label={genre} size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              {bookData.description && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      maxHeight: 150, 
                      overflow: 'auto',
                      pr: 1,
                    }}
                  >
                    {bookData.description}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        )}

        {/* Step 3: Success */}
        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="success">
              Book successfully added to your library!
            </Alert>
          </Box>
        )}
      </DialogContent>

      {/* Actions */}
      {activeStep === 1 && (
        <DialogActions>
          <Button onClick={handleBack}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleAddBook}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {loading ? 'Adding...' : 'Add to Library'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default AddBookModal;
