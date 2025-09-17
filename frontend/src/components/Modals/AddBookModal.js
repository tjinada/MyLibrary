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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Add as AddIcon,
  ArrowBack as BackIcon,
  ArrowBackIos as PrevIcon,
  ArrowForwardIos as NextIcon,
  Image as ImageIcon,
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

  // Cover selection state
  const [coverOptions, setCoverOptions] = useState([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(0);

  // Custom fields state
  const [customGenres, setCustomGenres] = useState([]);
  const [customTags, setCustomTags] = useState([]);
  const [newGenre, setNewGenre] = useState('');
  const [newTag, setNewTag] = useState('');

  const steps = ['Enter ISBN', 'Review Details', 'Complete'];

  // Generate multiple cover URLs for selection
  const generateCoverOptions = (bookData) => {
    const options = [];
    
    // Add primary cover if available
    if (bookData.coverImage) {
      options.push({
        url: bookData.coverImage,
        source: 'Primary (Google Books)',
        quality: 'High'
      });
    }

    // Add Google Books alternatives
    if (bookData.googleBooksId) {
      // High quality
      options.push({
        url: `https://books.google.com/books/content?id=${bookData.googleBooksId}&printsec=frontcover&img=1&zoom=0&source=gbs_api`,
        source: 'Google Books (Direct)',
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

    // Add Open Library alternatives
    if (bookData.isbn) {
      // Large
      options.push({
        url: `https://covers.openlibrary.org/b/isbn/${bookData.isbn}-L.jpg`,
        source: 'Open Library',
        quality: 'Large'
      });
      
      // Medium
      options.push({
        url: `https://covers.openlibrary.org/b/isbn/${bookData.isbn}-M.jpg`,
        source: 'Open Library',
        quality: 'Medium'
      });
      
      // Small
      options.push({
        url: `https://covers.openlibrary.org/b/isbn/${bookData.isbn}-S.jpg`,
        source: 'Open Library',
        quality: 'Small'
      });
    }

    // Remove duplicates based on URL
    const uniqueOptions = options.filter((option, index, self) =>
      index === self.findIndex(o => o.url === option.url)
    );

    return uniqueOptions;
  };

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
      
      // Generate cover options
      const options = generateCoverOptions(data);
      setCoverOptions(options);
      setSelectedCoverIndex(0);
      
      // Initialize custom fields with existing genres
      setCustomGenres(data.genres || []);
      setCustomTags(data.tags || []);
      
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Book not found. Please try another ISBN.');
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
    setCustomGenres(customGenres.filter(g => g !== genreToRemove));
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

  const handleAddBook = async () => {
    if (!bookData) return;

    setLoading(true);
    setError(null);

    try {
      // Prepare book data with selected cover and custom fields
      const bookToAdd = {
        ...bookData,
        coverImage: coverOptions[selectedCoverIndex]?.url || bookData.coverImage,
        genres: customGenres,
        tags: customTags,
      };

      await bookService.addBook(bookToAdd);
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
    setCoverOptions([]);
    setSelectedCoverIndex(0);
    setCustomGenres([]);
    setCustomTags([]);
    setNewGenre('');
    setNewTag('');
    onClose();
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setError(null);
    }
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

        {/* Step 2: Book Preview with Cover Selection */}
        {activeStep === 1 && bookData && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              {/* Cover Selection */}
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
                        alt={bookData.title}
                        sx={{ height: 'auto', maxHeight: 400 }}
                        onError={(e) => {
                          e.target.src = '/api/placeholder/200/300';
                        }}
                      />
                      
                      {/* Cover navigation buttons */}
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
                      
                      {/* Cover info */}
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
            </Grid>
            
            <Grid item xs={12} sm={8}>
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

              {/* Genres with ability to add custom */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Genres
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {customGenres.map((genre, index) => (
                    <Chip
                      key={index}
                      label={genre}
                      size="small"
                      onDelete={() => handleRemoveGenre(genre)}
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
                        handleAddGenre();
                      }
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleAddGenre}
                    startIcon={<AddIcon />}
                  >
                    Add
                  </Button>
                </Box>
              </Box>

              {/* Tags - New field */}
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
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleAddTag}
                    startIcon={<AddIcon />}
                  >
                    Add
                  </Button>
                </Box>
              </Box>

              {/* Description */}
              {bookData.description && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      maxHeight: 100, 
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
