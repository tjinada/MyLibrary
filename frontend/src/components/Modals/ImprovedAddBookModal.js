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
  FormControl,
  Select,
  MenuItem,
  Autocomplete,
  Rating,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Add as AddIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  QrCodeScanner as ScannerIcon,
  LibraryAdd as MultiAddIcon,
  Diamond as DiamondIcon,
  AutoAwesome as SpecialIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import BarcodeScanner from '../Scanner/BarcodeScanner';
import bookService from '../../services/bookService';
import { ALLOWED_GENRES } from '../../constants/bookConstants';

const AddBookModal = ({ open, onClose, onBookAdded }) => {
  const [isbn, setIsbn] = useState('');
  const [bookData, setBookData] = useState(null);
  const [editedBookData, setEditedBookData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Custom fields state
  const [customGenres, setCustomGenres] = useState([]);
  const [customTags, setCustomTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [selectedEdition, setSelectedEdition] = useState('standard');
  const [bookRating, setBookRating] = useState(null);
  
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
      setEditedBookData(data);
      
      // Initialize custom fields with existing data
      let genres = data.genres || [];
      const categoryGenre = data.categoryType === 'Nonfiction' ? 'Nonfiction' : 'Fiction';
      if (!genres.includes(categoryGenre) && ALLOWED_GENRES.includes(categoryGenre)) {
        genres = [categoryGenre, ...genres];
      }
      // Filter to only allowed genres
      genres = genres.filter(g => ALLOWED_GENRES.includes(g));
      setCustomGenres(genres);
      setCustomTags(data.tags || []);
      setSelectedEdition(data.edition || 'standard');
      setBookRating(null); // Reset rating for new book
      
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

  // Handle tag management
  const handleAddTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      setCustomTags([...customTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setCustomTags(customTags.filter(t => t !== tagToRemove));
  };

  // Handle adding book to library
  const handleAddBook = async () => {
    if (!bookData) return;

    setLoading(true);
    setError(null);

    try {
      // Prepare book data with selected fields
      const bookToAdd = {
        ...bookData,
        ...editedBookData,
        genres: customGenres,
        tags: customTags,
        edition: selectedEdition,
        rating: bookRating, // Include rating if set
      };
      
      await bookService.addBook(bookToAdd);
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
    setEditedBookData(null);
    setError(null);
    setSuccessMessage('');
    setShowScanner(false);
    setShowConfirmation(false);
    setMultiAddMode(false);
    setBooksAdded(0);
    setCustomGenres([]);
    setCustomTags([]);
    setNewTag('');
    setSelectedEdition('standard');
    setBookRating(null);
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
              
              <Grid container spacing={2}>
                {/* Book Cover */}
                {bookData.coverImage && (
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardMedia
                        component="img"
                        image={bookData.coverImage}
                        alt={bookData.title}
                        sx={{ height: 'auto', maxHeight: 300 }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </Card>
                  </Grid>
                )}
                
                {/* Book Details */}
                <Grid item xs={12} sm={bookData.coverImage ? 8 : 12}>
                  <Typography variant="h5" gutterBottom>
                    {bookData.title}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    by {bookData.authors?.join(', ')}
                  </Typography>
                  
                  <Grid container spacing={1} sx={{ mt: 1, mb: 2 }}>
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
                  </Grid>

                  {/* Rating */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Rating
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Rating
                        value={bookRating}
                        onChange={(event, newValue) => {
                          setBookRating(newValue);
                        }}
                        size="large"
                        icon={<StarIcon fontSize="inherit" />}
                        emptyIcon={<StarBorderIcon fontSize="inherit" />}
                        sx={{
                          '& .MuiRating-iconFilled': {
                            color: theme.palette.warning.main,
                          },
                          '& .MuiRating-iconHover': {
                            color: theme.palette.warning.dark,
                          },
                        }}
                      />
                      {bookRating && (
                        <Typography variant="body2" color="text.secondary">
                          {bookRating} star{bookRating !== 1 ? 's' : ''}
                        </Typography>
                      )}
                      {bookRating && (
                        <Button
                          size="small"
                          onClick={() => setBookRating(null)}
                          sx={{ textTransform: 'none' }}
                        >
                          Clear
                        </Button>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Optional - Rate this book if you've read it
                    </Typography>
                  </Box>

                  {/* Status Selection */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Status
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={bookData.status || 'to-read'}
                        onChange={(e) => setEditedBookData({...editedBookData, status: e.target.value})}
                      >
                        <MenuItem value="to-read">To Read</MenuItem>
                        <MenuItem value="reading">Reading</MenuItem>
                        <MenuItem value="read">Read</MenuItem>
                        <MenuItem value="loaned">Loaned</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Edition Selection */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Edition
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={selectedEdition}
                        onChange={(e) => setSelectedEdition(e.target.value)}
                      >
                        <MenuItem value="standard">Standard Edition</MenuItem>
                        <MenuItem value="special">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SpecialIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
                            Special Edition
                          </Box>
                        </MenuItem>
                        <MenuItem value="deluxe">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DiamondIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                            Deluxe Edition
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Genres - Select from allowed list */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Genres
                    </Typography>
                    <Autocomplete
                      multiple
                      size="small"
                      options={ALLOWED_GENRES}
                      value={customGenres}
                      onChange={(event, newValue) => {
                        setCustomGenres(newValue);
                      }}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            size="small"
                            color="primary"
                            {...getTagProps({ index })}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          placeholder="Select genres..."
                        />
                      )}
                    />
                  </Box>

                  {/* Tags */}
                  <Box sx={{ mb: 2 }}>
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
                        sx={{ flexGrow: 1 }}
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
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  onClick={handleBack}
                  disabled={loading}
                >
                  Cancel
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
