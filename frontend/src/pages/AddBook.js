import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import BarcodeScanner from '../components/Scanner/BarcodeScanner';
import bookService from '../services/bookService';

const AddBook = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isbn, setIsbn] = useState('');
  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const steps = ['Scan or Enter ISBN', 'Review Book Details', 'Add to Library'];

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
      setSuccess(true);
      setActiveStep(2);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/library');
      }, 2000);
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

  const handleReset = () => {
    setActiveStep(0);
    setIsbn('');
    setBookData(null);
    setError(null);
    setSuccess(false);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Add Book to Library
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Step 1: Scan or Enter ISBN */}
      {activeStep === 0 && (
        <Box>
          <BarcodeScanner 
            onScan={(scannedISBN) => {
              setIsbn(scannedISBN);
              handleISBNLookup(scannedISBN);
            }}
            onError={(err) => setError(err.message)}
          />

          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Or Enter ISBN Manually
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="ISBN"
                variant="outlined"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="Enter ISBN-10 or ISBN-13"
                disabled={loading}
              />
              <Button
                variant="contained"
                onClick={() => handleISBNLookup()}
                disabled={loading || !isbn}
                startIcon={<SearchIcon />}
              >
                Search
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Step 2: Review Book Details */}
      {activeStep === 1 && bookData && (
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4} md={3}>
                {bookData.coverImage && (
                  <CardMedia
                    component="img"
                    image={bookData.coverImage}
                    alt={bookData.title}
                    sx={{ 
                      width: '100%',
                      maxWidth: 200,
                      height: 'auto',
                      mx: 'auto',
                      display: 'block',
                      borderRadius: 1,
                    }}
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={8} md={9}>
                <Typography variant="h5" gutterBottom>
                  {bookData.title}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  by {bookData.authors?.join(', ')}
                </Typography>
                
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">ISBN</Typography>
                    <Typography variant="body1" gutterBottom>{bookData.isbn}</Typography>
                  </Grid>
                  {bookData.publisher && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Publisher</Typography>
                      <Typography variant="body1" gutterBottom>{bookData.publisher}</Typography>
                    </Grid>
                  )}
                  {bookData.publishedDate && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Published</Typography>
                      <Typography variant="body1" gutterBottom>{bookData.publishedDate}</Typography>
                    </Grid>
                  )}
                  {bookData.pageCount > 0 && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Pages</Typography>
                      <Typography variant="body1" gutterBottom>{bookData.pageCount}</Typography>
                    </Grid>
                  )}
                </Grid>

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
                    <Typography variant="body2" sx={{ maxHeight: 150, overflow: 'auto' }}>
                      {bookData.description}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
              <Button onClick={handleReset}>
                Start Over
              </Button>
              <Button
                variant="contained"
                onClick={handleAddBook}
                disabled={loading}
                startIcon={<AddIcon />}
              >
                Add to Library
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Success */}
      {activeStep === 2 && success && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Book successfully added to your library!
          </Alert>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Redirecting to library...
          </Typography>
          <Button onClick={() => navigate('/library')} variant="contained" sx={{ mt: 2 }}>
            Go to Library
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default AddBook;
