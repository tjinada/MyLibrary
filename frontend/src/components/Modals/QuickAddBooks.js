import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
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
  MenuItem,
  Autocomplete,
  Rating,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  ListItemText,
  Checkbox,
  Divider,
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
  AutoAwesome as SpecialIcon,
  Diamond as DiamondIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Image as ImageIcon,
  CollectionsBookmark as CollectionIcon,
  AddCircleOutline as AddNewIcon,
} from '@mui/icons-material';
import MobileBarcodeScanner from '../Scanner/MobileBarcodeScanner';
import CoverImagePicker from '../CoverImage/CoverImagePicker';
import bookService from '../../services/bookService';
import collectionService from '../../services/collectionService';
import { ALLOWED_GENRES } from '../../constants/bookConstants';

// Helper to add books to collection
const addBooksToCollection = (collectionId, bookIsbns) => {
  return collectionService.bulkAddBooks(collectionId, bookIsbns);
};

const QuickAddBooks = ({ open, onClose, onBooksAdded }) => {
  const [isbn, setIsbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [processingBook, setProcessingBook] = useState(false);
  const [confirmationMode, setConfirmationMode] = useState(false);
  const [duplicateBook, setDuplicateBook] = useState(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  
  // Book editing fields
  const [customGenres, setCustomGenres] = useState([]);
  const [customTags, setCustomTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [bookStatus, setBookStatus] = useState('to-read');
  const [bookEdition, setBookEdition] = useState('standard');
  const [bookRating, setBookRating] = useState(null);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [selectedCoverUrl, setSelectedCoverUrl] = useState(null);
  
  // Collections
  const [availableCollections, setAvailableCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isbnInputRef = useRef(null);
  const successTimeoutRef = useRef(null);

  // Fetch collections when modal opens
  useEffect(() => {
    if (open) {
      fetchCollections();
    }
  }, [open]);

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

  const fetchCollections = async () => {
    try {
      const collections = await collectionService.getCollections();
      setAvailableCollections(collections || []);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      setAvailableCollections([]);
    }
  };

  const handleCreateNewCollection = async () => {
    if (!newCollectionName.trim()) return;
    
    setCreatingCollection(true);
    try {
      const newCollection = await collectionService.createCollection({
        name: newCollectionName,
        description: newCollectionDescription,
        displayInLibrary: true
      });
      
      // Add the new collection to available collections
      setAvailableCollections(prev => [...prev, newCollection]);
      
      // Select the new collection
      setSelectedCollections(prev => [...prev, newCollection._id]);
      
      // Close dialog and reset
      setShowNewCollectionDialog(false);
      setNewCollectionName('');
      setNewCollectionDescription('');
    } catch (error) {
      console.error('Failed to create collection:', error);
      setError('Failed to create collection');
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleISBNSubmit = async (scannedISBN) => {
    const isbnToProcess = scannedISBN || isbn;
    
    if (!isbnToProcess) {
      setError('Please enter or scan an ISBN');
      return;
    }

    setLoading(true);
    setError(null);
    // Reset cover selection from previous book
    setSelectedCoverUrl(null);

    try {
      // Look up the book
      const bookData = await bookService.lookupISBN(isbnToProcess);
      
      // Set up confirmation screen
      setCurrentBook(bookData);
      
      // Add Fiction or Nonfiction to genres based on categoryType
      let genres = bookData.genres || [];
      const categoryGenre = bookData.categoryType === 'Nonfiction' ? 'Nonfiction' : 'Fiction';
      if (!genres.includes(categoryGenre) && ALLOWED_GENRES.includes(categoryGenre)) {
        genres = [categoryGenre, ...genres];
      }
      // Filter to only allowed genres
      genres = genres.filter(g => ALLOWED_GENRES.includes(g));
      
      setCustomGenres(genres);
      setCustomTags(bookData.tags || []);
      setBookStatus('to-read');
      setBookEdition('standard'); // Reset edition to standard
      setBookRating(null); // Reset rating for new book
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
        edition: bookEdition,
        rating: bookRating, // Include rating if set
        coverImage: selectedCoverUrl || currentBook.coverImage, // Use selected cover if changed
      };
      
      const response = await bookService.addBook(bookToAdd);
      
      // Handle both response formats:
      // - Normal add: response is the book object directly
      // - Duplicate add: response has { book, message, isDuplicate, newQuantity }
      const addedBook = response.book || response;
      const bookIsbn = addedBook.isbn || bookToAdd.isbn;
      
      console.log('Book added successfully:', bookIsbn);
      
      // Add to selected collections
      if (selectedCollections.length > 0 && bookIsbn) {
        try {
          // Add small delay to ensure book is fully saved in database
          await new Promise(resolve => setTimeout(resolve, 500));
          
          await Promise.all(
            selectedCollections.map(collectionId =>
              addBooksToCollection(collectionId, [bookIsbn])
                .catch(err => {
                  console.error(`Failed to add to collection ${collectionId}:`, err);
                  // Don't fail the entire operation if one collection fails
                  return null;
                })
            )
          );
        } catch (collectionError) {
          console.error('Error adding to collections:', collectionError);
          // Don't show error - book was added successfully
        }
      }
      
      // Add to recently added list
      setRecentlyAdded(prev => [{
        ...addedBook,
        timestamp: Date.now(),
        quantity: response.newQuantity || addedBook.quantity || 1
      }, ...prev.slice(0, 4)]); // Keep last 5 books
      
      // Show success animation
      setCurrentBook({ ...bookToAdd, success: true });
      setConfirmationMode(false);
      
      // Clear current book and all related states after animation
      successTimeoutRef.current = setTimeout(() => {
        setCurrentBook(null);
        setSelectedCoverUrl(null); // Clear selected cover
        setSelectedCollections([]); // Clear selected collections
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
        // Book already exists - show duplicate dialog
        setDuplicateBook(err.response.data.existingBook);
        setShowDuplicateDialog(true);
        setProcessingBook(false);
        return;
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
    setNewTag('');
    setBookStatus('to-read');
    setBookEdition('standard');
    setBookRating(null);
    setSelectedCoverUrl(null);
    setShowCoverPicker(false);
    setSelectedCollections([]);
    
    // Refocus ISBN input
    if (!isMobile && isbnInputRef.current) {
      setTimeout(() => {
        isbnInputRef.current?.focus();
        isbnInputRef.current?.select();
      }, 100);
    }
  };

  const handleAddDuplicate = async () => {
    if (!currentBook || !duplicateBook) return;
    
    setShowDuplicateDialog(false);
    setProcessingBook(true);
    
    try {
      // Add the book with allowDuplicate flag
      const bookToAdd = {
        ...currentBook,
        genres: customGenres,
        tags: customTags,
        status: bookStatus,
        edition: bookEdition,
        rating: bookRating, // Include rating if set
        coverImage: selectedCoverUrl || currentBook.coverImage, // Use selected cover if changed
        allowDuplicate: true,
      };
      
      const response = await bookService.addBook(bookToAdd);
      
      // Get the actual book from response
      const addedBook = response.book || response;
      const bookIsbn = addedBook.isbn || bookToAdd.isbn;
      
      // Add to selected collections
      if (selectedCollections.length > 0 && bookIsbn) {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          await Promise.all(
            selectedCollections.map(collectionId =>
              addBooksToCollection(collectionId, [bookIsbn])
                .catch(err => {
                  console.error(`Failed to add to collection ${collectionId}:`, err);
                  return null;
                })
            )
          );
        } catch (collectionError) {
          console.error('Error adding to collections:', collectionError);
        }
      }
      
      // Add to recently added list with updated quantity
      setRecentlyAdded(prev => [{
        ...addedBook,
        timestamp: Date.now(),
        quantity: response.newQuantity
      }, ...prev.slice(0, 4)]);
      
      // Show success
      setCurrentBook({ ...addedBook, success: true });
      setConfirmationMode(false);
      setDuplicateBook(null);
      
      // Clear after animation
      successTimeoutRef.current = setTimeout(() => {
        setCurrentBook(null);
        setSelectedCoverUrl(null); // Clear selected cover
        setSelectedCollections([]); // Clear selected collections
        if (!isMobile && isbnInputRef.current) {
          isbnInputRef.current.focus();
          isbnInputRef.current.select();
        }
      }, 1500);
      
      if (onBooksAdded) {
        onBooksAdded();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add duplicate book');
    } finally {
      setProcessingBook(false);
    }
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateDialog(false);
    setDuplicateBook(null);
    setProcessingBook(false);
    // Go back to confirmation mode
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
    setNewTag('');
    setBookStatus('to-read');
    setBookEdition('standard');
    setBookRating(null);
    setSelectedCoverUrl(null);
    setShowCoverPicker(false);
    setDuplicateBook(null);
    setShowDuplicateDialog(false);
    setSelectedCollections([]);
    setNewCollectionName('');
    setNewCollectionDescription('');
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={confirmationMode ? "md" : "sm"}
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { 
          minHeight: isMobile ? '100vh' : confirmationMode ? '400px' : '300px',
          maxHeight: isMobile ? '100vh' : confirmationMode ? '80vh' : '400px',
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider',
        py: 1.5,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
          <Box sx={{ p: 2 }}>
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
              <Box>
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
                    Lookup
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  💡 Tip: Your handheld scanner should automatically submit after scanning
                </Typography>
                
                {/* Recently added - inline for desktop */}
                {recentlyAdded.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Recently Added ({recentlyAdded.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                      {recentlyAdded.map((book, index) => (
                        <Chip
                          key={book.isbn + book.timestamp}
                          label={book.title}
                          variant="outlined"
                          color="success"
                          size="small"
                          sx={{ height: 24, fontSize: '0.75rem' }}
                          icon={book.quantity > 1 ? <Badge badgeContent={book.quantity} color="secondary" /> : null}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
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
        ) : (
          // Confirmation Mode
          <Box sx={{ p: 2 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 1 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}
            
            {currentBook && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  {/* Book cover */}
                  <Card sx={{ height: '100%', position: 'relative' }}>
                    {(currentBook.coverImage || selectedCoverUrl) ? (
                      <>
                        <CardMedia
                          component="img"
                          image={selectedCoverUrl || currentBook.coverImage}
                          alt={currentBook.title}
                          sx={{ 
                            height: 'auto', 
                            maxHeight: isMobile ? 250 : 350,
                            width: '100%',
                            objectFit: 'contain'
                          }}
                        />
                        {/* Change Cover Button */}
                        <Box sx={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          left: 0, 
                          right: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                          p: 1,
                          display: 'flex',
                          justifyContent: 'center'
                        }}>
                          <Button
                            size="small"
                            startIcon={<ImageIcon />}
                            onClick={() => setShowCoverPicker(true)}
                            sx={{ 
                              color: 'white',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.1)'
                              }
                            }}
                          >
                            Change Cover
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ 
                        height: isMobile ? 250 : 300, 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: 'grey.200',
                        p: 2
                      }}>
                        <ImageIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography color="text.secondary" align="center" gutterBottom>
                          No Cover
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<ImageIcon />}
                          onClick={() => setShowCoverPicker(true)}
                          size="small"
                        >
                          Add Cover
                        </Button>
                      </Box>
                    )}
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    {currentBook.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    by {currentBook.authors?.join(', ')}
                  </Typography>
                  
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">ISBN</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {currentBook.isbn}
                        </Typography>
                      </Grid>
                      {currentBook.publisher && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Publisher</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {currentBook.publisher}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>

                  {/* Rating - NEW */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Rating
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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

                  {/* Status and Edition - Same Row */}
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Status
                        </Typography>
                        <TextField
                          select
                          value={bookStatus}
                          onChange={(e) => setBookStatus(e.target.value)}
                          size="small"
                          fullWidth
                          SelectProps={{ native: true }}
                        >
                          <option value="to-read">To Read</option>
                          <option value="reading">Reading</option>
                          <option value="read">Read</option>
                          <option value="loaned">Loaned</option>
                        </TextField>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Edition
                        </Typography>
                        <TextField
                          select
                          value={bookEdition}
                          onChange={(e) => setBookEdition(e.target.value)}
                          size="small"
                          fullWidth
                          SelectProps={{ native: false }}
                        >
                          <MenuItem value="standard">Standard Edition</MenuItem>
                          <MenuItem value="signed">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <SpecialIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
                              Signed Edition
                            </Box>
                          </MenuItem>
                          <MenuItem value="deluxe">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DiamondIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                              Deluxe Edition
                            </Box>
                          </MenuItem>
                        </TextField>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Genres - Using Autocomplete with allowed genres */}
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

                  {/* Collections */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Add to Collections
                    </Typography>
                    
                    <FormControl fullWidth size="small">
                      <Select
                        multiple
                        value={selectedCollections}
                        onChange={(e) => setSelectedCollections(e.target.value)}
                        input={<OutlinedInput />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                No collections selected
                              </Typography>
                            ) : (
                              selected.map((value) => {
                                const collection = availableCollections.find(c => c._id === value);
                                return (
                                  <Chip
                                    key={value}
                                    label={collection?.name || value}
                                    size="small"
                                    icon={<CollectionIcon sx={{ fontSize: 16 }} />}
                                    sx={{ 
                                      bgcolor: theme.palette.primary.main,
                                      color: 'white',
                                      '& .MuiChip-icon': { color: 'white' }
                                    }}
                                  />
                                );
                              })
                            )}
                          </Box>
                        )}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 250,
                            },
                          },
                        }}
                      >
                        <MenuItem
                          value="__create_new__"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowNewCollectionDialog(true);
                          }}
                          sx={{ borderBottom: `1px solid ${theme.palette.divider}`, mb: 1 }}
                        >
                          <AddNewIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                          <Typography color="primary">Create New Collection</Typography>
                        </MenuItem>
                        {availableCollections.map((collection) => (
                          <MenuItem key={collection._id} value={collection._id}>
                            <Checkbox
                              size="small"
                              checked={selectedCollections.includes(collection._id)}
                              sx={{ p: 0, mr: 1 }}
                            />
                            <ListItemText
                              primary={collection.name}
                              secondary={`${collection.books?.length || 0} books`}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {selectedCollections.length > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        This book will be added to {selectedCollections.length} collection{selectedCollections.length > 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Tags */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {customTags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          onDelete={() => handleRemoveTag(tag)}
                        />
                      ))}
                      {customTags.length === 0 && (
                        <Typography variant="body2" color="text.disabled">
                          No tags added
                        </Typography>
                      )}
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
                        sx={{ flex: 1, maxWidth: 300 }}
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
      
      {/* Duplicate Book Dialog */}
      <Dialog
        open={showDuplicateDialog}
        onClose={handleCancelDuplicate}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Alert severity="warning" icon={false} sx={{ p: 0, bgcolor: 'transparent' }}>
              ⚠️
            </Alert>
            Book Already Exists
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>"{duplicateBook?.title}"</strong> by {duplicateBook?.authors?.join(', ')} 
            is already in your library.
          </DialogContentText>
          {duplicateBook?.quantity && duplicateBook.quantity > 1 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              You currently have {duplicateBook.quantity} {duplicateBook.quantity === 1 ? 'copy' : 'copies'} of this book.
            </Alert>
          )}
          <DialogContentText sx={{ mt: 2 }}>
            Would you like to add another copy?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDuplicate}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddDuplicate} 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
          >
            Add Another Copy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cover Image Picker Modal */}
      <CoverImagePicker
        open={showCoverPicker}
        onClose={() => setShowCoverPicker(false)}
        book={currentBook}
        currentCover={selectedCoverUrl || currentBook?.coverImage}
        onCoverSelected={(coverUrl) => {
          setSelectedCoverUrl(coverUrl);
          setShowCoverPicker(false);
        }}
      />

      {/* Create New Collection Dialog */}
      <Dialog
        open={showNewCollectionDialog}
        onClose={() => setShowNewCollectionDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Create New Collection
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Collection Name"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              margin="normal"
              autoFocus
              required
            />
            <TextField
              fullWidth
              label="Description (optional)"
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowNewCollectionDialog(false);
            setNewCollectionName('');
            setNewCollectionDescription('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateNewCollection}
            variant="contained"
            disabled={!newCollectionName.trim() || creatingCollection}
            startIcon={creatingCollection ? <CircularProgress size={16} /> : <AddNewIcon />}
          >
            {creatingCollection ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default QuickAddBooks;
