import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Rating,
  TextField,
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Grow,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  alpha,
  Autocomplete,
  Badge,
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
  Remove as RemoveIcon,
  LocalOffer as TagIcon,
  ArrowBackIos as PrevIcon,
  ArrowForwardIos as NextIcon,
  Image as ImageIcon,
  CollectionsBookmark as CollectionsIcon,
  Inventory as InventoryIcon,
  MoreVert as MoreIcon,
  Business as PublisherIcon,
  Numbers as IsbnIcon,
  Star as StarIcon,
  Diamond as DiamondIcon,
  AutoAwesome as SpecialIcon,
  PhotoLibrary as PhotoLibraryIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import bookService from '../../services/bookService';
import StatusPills from './StatusPills';
import BookStatusChip, { BookEditionBadge } from '../Books/BookStatusChip';
import CoverImagePicker from '../CoverImage/CoverImagePicker';
import { ALLOWED_GENRES } from '../../constants/bookConstants';

const BookDetailsModal = ({ 
  open, 
  onClose, 
  book, 
  onBookUpdated, 
  onBookDeleted, 
  onManageCollections,
  openInEditMode = false 
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(openInEditMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteQuantity, setDeleteQuantity] = useState(1);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [copies, setCopies] = useState([]);
  const [currentCopyIndex, setCurrentCopyIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Edit form state
  const [editedBook, setEditedBook] = useState({
    title: '',
    status: '',
    rating: 0,
    notes: '',
    tags: [],
    genres: [],
    coverImage: '',
    quantity: 1,
    edition: 'standard',
  });
  const [newTag, setNewTag] = useState('');
  const [currentBookData, setCurrentBookData] = useState(null);
  
  // Cover selection state
  const [coverOptions, setCoverOptions] = useState([]);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(0);

  // Generate cover options for the book
  const generateCoverOptions = (bookData) => {
    const options = [];
    
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

    if (bookData.googleBooksId) {
      options.push({
        url: `https://books.google.com/books/content?id=${bookData.googleBooksId}&printsec=frontcover&img=1&zoom=0&source=gbs_api`,
        source: 'Google Books',
        quality: 'High'
      });
      
      options.push({
        url: `https://books.google.com/books/content?id=${bookData.googleBooksId}&printsec=frontcover&img=1&zoom=1&source=gbs_api`,
        source: 'Google Books',
        quality: 'Medium'
      });
    }

    if (bookData.isbn) {
      const cleanIsbn = bookData.isbn.replace(/[-\s]/g, '');
      
      options.push({
        url: `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`,
        source: 'Open Library',
        quality: 'Large'
      });
      
      options.push({
        url: `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`,
        source: 'Open Library',
        quality: 'Medium'
      });
    }

    return options.filter((option, index, self) =>
      index === self.findIndex(o => o.url === option.url)
    );
  };

  useEffect(() => {
    if (book) {
      const bookData = {
        title: book.title || '',
        status: book.status || 'to-read',
        rating: book.rating || 0,
        notes: book.notes || '',
        tags: book.tags || [],
        genres: book.genres || [],
        coverImage: book.coverImage || '',
        quantity: book.quantity || 1,
        edition: book.edition || 'standard',
      };
      
      setEditedBook(bookData);
      setCurrentBookData(book);
      
      // Initialize copies
      if (book.copies && book.copies.length > 0) {
        console.log('Loading existing copies:', book.copies); // Debug log
        setCopies(book.copies.map(copy => ({
          ...copy,
          id: copy._id || copy.id || `copy_${copy.copyNumber}`,
          // Ensure all fields exist with their values
          copyNumber: copy.copyNumber,
          edition: copy.edition || 'standard',
          status: copy.status || 'to-read',
          rating: copy.rating || 0,
          notes: copy.notes || '',
          loanedTo: copy.loanedTo || '',
          loanedDate: copy.loanedDate || null,
          _id: copy._id // Preserve the MongoDB _id
        })));
      } else {
        console.log('Creating default copies for quantity:', book.quantity || 1); // Debug log
        // Create default copies based on quantity
        const quantity = book.quantity || 1;
        const defaultCopies = [];
        for (let i = 0; i < quantity; i++) {
          defaultCopies.push({
            id: `copy_${i + 1}`,
            copyNumber: i + 1,
            edition: book.edition || 'standard',
            status: book.status || 'to-read',
            rating: i === 0 ? (book.rating || 0) : 0,
            notes: i === 0 ? (book.notes || '') : '',
            loanedTo: '',
            loanedDate: null,
          });
        }
        setCopies(defaultCopies);
      }
      
      const options = generateCoverOptions(book);
      setCoverOptions(options);
      setSelectedCoverIndex(0);
      
      setTabValue(0);
      setEditMode(openInEditMode);
      setNewTag('');
      setError(null);
      setCurrentCopyIndex(0);  // Reset to first copy
    }
  }, [book, openInEditMode]);

  if (!book) return null;
  
  const displayBook = currentBookData || book;

  // Quick status update (no need to enter edit mode)
  const handleQuickStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedBook = await bookService.updateBook(book.isbn, { status: newStatus });
      
      setCurrentBookData(updatedBook);
      setEditedBook(prev => ({ ...prev, status: newStatus }));
      
      if (onBookUpdated) {
        onBookUpdated(updatedBook);
      }
    } catch (err) {
      setError('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleCoverSelected = async (coverUrl, source) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear image cache for this book
      if (displayBook.coverImage) {
        const img = new Image();
        img.src = coverUrl; // Preload new image
      }
      
      // Update the cover image
      const updatedBook = await bookService.updateBook(book.isbn, { 
        coverImage: coverUrl,
        coverImageSource: source 
      });
      
      setCurrentBookData(updatedBook);
      setEditedBook(prev => ({ ...prev, coverImage: coverUrl }));
      
      // Regenerate cover options with new cover
      const options = generateCoverOptions(updatedBook);
      setCoverOptions(options);
      setSelectedCoverIndex(0);
      
      if (onBookUpdated) {
        onBookUpdated(updatedBook);
      }
      
      setShowCoverPicker(false);
    } catch (err) {
      setError('Failed to update cover');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCopy = () => {
    const newCopy = {
      id: `copy_${copies.length + 1}_${Date.now()}`,
      copyNumber: copies.length + 1,
      edition: 'standard',
      status: 'to-read',
      rating: 0,
      notes: '',
      loanedTo: '',
      loanedDate: null,
    };
    setCopies([...copies, newCopy]);
    setEditedBook({ ...editedBook, quantity: copies.length + 1 });
  };

  const handleRemoveCopy = (copyId) => {
    if (copies.length <= 1) {
      setError('Cannot remove the last copy');
      return;
    }
    
    const currentCopy = copies[currentCopyIndex];
    const updatedCopies = copies.filter(c => c.id !== copyId);
    
    // Renumber copies
    updatedCopies.forEach((copy, index) => {
      copy.copyNumber = index + 1;
    });
    
    // Adjust current index if needed
    if (currentCopy.id === copyId) {
      // If we're removing the current copy, move to the previous one or stay at 0
      setCurrentCopyIndex(Math.max(0, currentCopyIndex - 1));
    } else if (currentCopyIndex >= updatedCopies.length) {
      // If the index is now out of bounds, adjust it
      setCurrentCopyIndex(updatedCopies.length - 1);
    }
    
    setCopies(updatedCopies);
    setEditedBook({ ...editedBook, quantity: updatedCopies.length });
  };

  const handleCopyUpdate = (copyId, field, value) => {
    setCopies(prevCopies => prevCopies.map(copy => 
      copy.id === copyId ? { ...copy, [field]: value } : copy
    ));
  };

  const handlePreviousCopy = () => {
    setCurrentCopyIndex((prev) => (prev > 0 ? prev - 1 : copies.length - 1));
  };

  const handleNextCopy = () => {
    setCurrentCopyIndex((prev) => (prev < copies.length - 1 ? prev + 1 : 0));
  };

  const getCurrentCopy = () => {
    return copies[currentCopyIndex] || copies[0] || {};
  };

  const handleSave = async () => {
    // Validate title
    if (!editedBook.title || !editedBook.title.trim()) {
      setError('Title is required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare copies for backend - ensure all copies are included
      const preparedCopies = copies.map((copy, index) => {
        const preparedCopy = {
          copyNumber: copy.copyNumber || index + 1,
          edition: copy.edition || 'standard',
          status: copy.status || 'to-read',
          rating: copy.rating || 0,
          notes: copy.notes || '',
          loanedTo: copy.loanedTo || '',
          loanedDate: copy.loanedDate || null,
        };
        
        // Preserve MongoDB _id if it exists (important for updates)
        if (copy._id && typeof copy._id === 'string' && copy._id.length === 24) {
          preparedCopy._id = copy._id;
        }
        
        return preparedCopy;
      });
      
      console.log('Saving copies:', preparedCopies); // Debug log
      
      const updates = {
        ...editedBook,
        copies: preparedCopies,
        quantity: copies.length,
        coverImage: coverOptions[selectedCoverIndex] 
          ? coverOptions[selectedCoverIndex].url 
          : editedBook.coverImage
      };
      
      const updatedBook = await bookService.updateBook(book.isbn, updates);
      
      console.log('Book updated, received:', updatedBook); // Debug log
      
      setCurrentBookData(updatedBook);
      
      // Update copies from response to get any new _id values
      if (updatedBook.copies && updatedBook.copies.length > 0) {
        setCopies(updatedBook.copies.map(copy => ({
          ...copy,
          id: copy._id || copy.id || `copy_${copy.copyNumber}`,
          // Ensure all fields exist
          copyNumber: copy.copyNumber,
          edition: copy.edition || 'standard',
          status: copy.status || 'to-read',
          rating: copy.rating || 0,
          notes: copy.notes || '',
          loanedTo: copy.loanedTo || '',
          loanedDate: copy.loanedDate || null,
        })));
      }
      
      setEditedBook({
        title: updatedBook.title || '',
        status: updatedBook.status || 'to-read',
        rating: updatedBook.rating || 0,
        notes: updatedBook.notes || '',
        tags: updatedBook.tags || [],
        genres: updatedBook.genres || [],
        coverImage: updatedBook.coverImage || '',
        quantity: updatedBook.quantity || 1,
        edition: updatedBook.edition || 'standard',
      });
      
      if (onBookUpdated) {
        onBookUpdated(updatedBook);
      }
      
      // If opened in edit mode (quick edit), close the modal after saving
      if (openInEditMode) {
        onClose();
      } else {
        setEditMode(false);
      }
    } catch (err) {
      console.error('Error saving book:', err);
      setError('Failed to update book');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const currentQuantity = currentBookData?.quantity || book?.quantity || 1;
    
    if (currentQuantity > 1) {
      setDeleteQuantity(1);
      setShowDeleteDialog(true);
    } else {
      if (window.confirm('Are you sure you want to delete this book?')) {
        await performDelete(1);
      }
    }
    setMenuAnchorEl(null);
  };
  
  const performDelete = async (quantityToDelete) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentQuantity = currentBookData?.quantity || book?.quantity || 1;
      const newQuantity = currentQuantity - quantityToDelete;
      
      if (newQuantity <= 0) {
        await bookService.deleteBook(book.isbn);
        if (onBookDeleted) {
          onBookDeleted();
        }
        onClose();
      } else {
        const response = await bookService.updateQuantity(book.isbn, newQuantity);
        setCurrentBookData({ ...currentBookData, quantity: newQuantity });
        setEditedBook({ ...editedBook, quantity: newQuantity });
        
        if (onBookUpdated) {
          onBookUpdated({ ...book, quantity: newQuantity });
        }
      }
      
      setShowDeleteDialog(false);
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
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            overflow: 'hidden',
          }
        }}
      >
        {/* Custom Dialog Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {displayBook.title}
            </Typography>
            
            {/* Copy Navigation */}
            {copies.length > 1 && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                ml: 'auto',
                mr: 2,
                bgcolor: alpha(theme.palette.common.white, 0.1),
                borderRadius: 2,
                px: 1,
                py: 0.5,
              }}>
                <IconButton 
                  size="small" 
                  onClick={handlePreviousCopy}
                  sx={{ 
                    color: 'white',
                    p: 0.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.common.white, 0.2),
                    }
                  }}
                >
                  <PrevIcon fontSize="small" />
                </IconButton>
                
                <Typography variant="body2" sx={{ mx: 1, minWidth: 60, textAlign: 'center' }}>
                  Copy {currentCopyIndex + 1} of {copies.length}
                </Typography>
                
                <IconButton 
                  size="small" 
                  onClick={handleNextCopy}
                  sx={{ 
                    color: 'white',
                    p: 0.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.common.white, 0.2),
                    }
                  }}
                >
                  <NextIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {!editMode ? (
              <>
                <Tooltip title="Edit">
                  <IconButton 
                    onClick={() => setEditMode(true)} 
                    size="small"
                    sx={{ color: 'white' }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="More options">
                  <IconButton 
                    onClick={(e) => setMenuAnchorEl(e.currentTarget)}
                    size="small"
                    sx={{ color: 'white' }}
                  >
                    <MoreIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  size="small"
                  disabled={loading}
                  sx={{ 
                    color: 'white',
                    bgcolor: alpha(theme.palette.common.white, 0.15),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.common.white, 0.25),
                    }
                  }}
                >
                  Save
                </Button>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    setEditMode(false);
                    const resetBook = currentBookData || book;
                    
                    // Reset book data
                    setEditedBook({
                      title: resetBook.title || '',
                      status: resetBook.status || 'to-read',
                      rating: resetBook.rating || 0,
                      notes: resetBook.notes || '',
                      tags: resetBook.tags || [],
                      genres: resetBook.genres || [],
                      coverImage: resetBook.coverImage || '',
                      quantity: resetBook.quantity || 1,
                      edition: resetBook.edition || 'standard',
                    });
                    
                    // Reset copies to original state
                    if (resetBook.copies && resetBook.copies.length > 0) {
                      setCopies(resetBook.copies.map(copy => ({
                        ...copy,
                        id: copy._id || `copy_${copy.copyNumber}`,
                      })));
                    } else {
                      // Recreate default copies
                      const quantity = resetBook.quantity || 1;
                      const defaultCopies = [];
                      for (let i = 0; i < quantity; i++) {
                        defaultCopies.push({
                          id: `copy_${i + 1}`,
                          copyNumber: i + 1,
                          edition: resetBook.edition || 'standard',
                          status: resetBook.status || 'to-read',
                          rating: i === 0 ? (resetBook.rating || 0) : 0,
                          notes: i === 0 ? (resetBook.notes || '') : '',
                          loanedTo: '',
                          loanedDate: null,
                        });
                      }
                      setCopies(defaultCopies);
                    }
                    
                    setSelectedCoverIndex(0);
                  }}
                  size="small"
                  disabled={loading}
                  sx={{ color: 'white' }}
                >
                  Cancel
                </Button>
              </>
            )}
            <IconButton 
              onClick={onClose} 
              size="small"
              sx={{ color: 'white', ml: 1 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {error && (
            <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Two Column Layout */}
          <Grid container>
            {/* Left Column - Book Cover & Rating */}
            <Grid item xs={12} md={3} sx={{ 
              bgcolor: isTablet ? 'background.paper' : 'grey.50',
              p: 2,
              borderRight: isTablet ? 'none' : '1px solid',
              borderColor: 'divider',
            }}>
              <Fade in timeout={500}>
                <Box>
                  {/* Book Cover */}
                  <Card 
                    elevation={2}
                    sx={{ 
                      mb: 2,
                      borderRadius: 1,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {editMode && coverOptions.length > 0 ? (
                      <>
                        <CardMedia
                          component="img"
                          image={coverOptions[selectedCoverIndex].url}
                          alt={book.title}
                          sx={{ 
                            height: 'auto',
                            maxHeight: 400,
                            width: '100%',
                            objectFit: 'contain',
                            bgcolor: 'grey.100',
                          }}
                          onError={(e) => {
                            e.target.src = '/api/placeholder/300/450';
                          }}
                        />
                        
                        {coverOptions.length > 1 && (
                          <>
                            <IconButton
                              onClick={handlePrevCover}
                              sx={{
                                position: 'absolute',
                                left: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                bgcolor: alpha(theme.palette.common.black, 0.5),
                                color: 'white',
                                '&:hover': { 
                                  bgcolor: alpha(theme.palette.common.black, 0.7),
                                },
                              }}
                            >
                              <PrevIcon />
                            </IconButton>
                            <IconButton
                              onClick={handleNextCover}
                              sx={{
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                bgcolor: alpha(theme.palette.common.black, 0.5),
                                color: 'white',
                                '&:hover': { 
                                  bgcolor: alpha(theme.palette.common.black, 0.7),
                                },
                              }}
                            >
                              <NextIcon />
                            </IconButton>
                          </>
                        )}
                        
                        <Box sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          bgcolor: alpha(theme.palette.common.black, 0.7),
                          color: 'white',
                          p: 1,
                        }}>
                          <Typography variant="caption">
                            {coverOptions[selectedCoverIndex].source} - {coverOptions[selectedCoverIndex].quality}
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      displayBook.coverImage && (
                        <CardMedia
                          component="img"
                          image={displayBook.coverImage}
                          alt={displayBook.title}
                          sx={{ 
                            height: 'auto',
                            maxHeight: 400,
                            width: '100%',
                            objectFit: 'contain',
                            bgcolor: 'grey.100',
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )
                    )}
                  </Card>

                  {/* Browse Covers Button */}
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<PhotoLibraryIcon />}
                    onClick={() => setShowCoverPicker(true)}
                    sx={{ mb: 2 }}
                  >
                    Browse Covers
                  </Button>

                  {/* Rating */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Your Rating
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                      <Rating 
                        value={editMode ? editedBook.rating : displayBook.rating || 0}
                        onChange={(e, newValue) => {
                          if (editMode) {
                            setEditedBook({...editedBook, rating: newValue});
                          }
                        }}
                        readOnly={!editMode}
                        size="medium"
                        precision={0.5}
                        icon={<StarIcon fontSize="inherit" />}
                        emptyIcon={<StarIcon fontSize="inherit" />}
                        sx={{
                          '& .MuiRating-iconFilled': {
                            color: theme.palette.warning.main,
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Current Copy Details */}
                  {copies.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        mb: 2
                      }}>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                          Copy Details
                        </Typography>
                        {editMode && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={handleAddCopy}
                              variant="outlined"
                              sx={{ textTransform: 'none' }}
                            >
                              Add Copy
                            </Button>
                            {copies.length > 1 && (
                              <Button
                                size="small"
                                startIcon={<RemoveIcon />}
                                onClick={() => handleRemoveCopy(getCurrentCopy().id)}
                                variant="outlined"
                                color="error"
                                sx={{ textTransform: 'none' }}
                              >
                                Remove Copy
                              </Button>
                            )}
                          </Box>
                        )}
                      </Box>
                      
                      {(() => {
                        const currentCopy = getCurrentCopy();
                        return (
                          <Paper 
                            variant="outlined" 
                            sx={{ 
                              p: 2,
                              borderRadius: 1,
                              bgcolor: theme.palette.grey[50],
                            }}
                          >
                            <Grid container spacing={2}>
                              {/* Edition */}
                              <Grid item xs={12} sm={6}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
                                  Edition Type
                                </Typography>
                                {editMode ? (
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={currentCopy.edition || 'standard'}
                                      onChange={(e) => handleCopyUpdate(currentCopy.id, 'edition', e.target.value)}
                                      sx={{ 
                                        bgcolor: 'background.paper',
                                      }}
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
                                    </Select>
                                  </FormControl>
                                ) : (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {currentCopy.edition === 'signed' && <SpecialIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />}
                                    {currentCopy.edition === 'deluxe' && <DiamondIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />}
                                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                      {currentCopy.edition || 'standard'} Edition
                                    </Typography>
                                  </Box>
                                )}
                              </Grid>

                              {/* Status */}
                              <Grid item xs={12} sm={6}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
                                  Reading Status
                                </Typography>
                                {editMode ? (
                                  <FormControl fullWidth size="small">
                                    <Select
                                      value={currentCopy.status || 'to-read'}
                                      onChange={(e) => handleCopyUpdate(currentCopy.id, 'status', e.target.value)}
                                      sx={{ 
                                        bgcolor: 'background.paper',
                                      }}
                                    >
                                      <MenuItem value="to-read">To Read</MenuItem>
                                      <MenuItem value="reading">Reading</MenuItem>
                                      <MenuItem value="read">Read</MenuItem>
                                      <MenuItem value="loaned">Loaned</MenuItem>
                                    </Select>
                                  </FormControl>
                                ) : (
                                  <Chip 
                                    label={currentCopy.status ? currentCopy.status.replace('-', ' ') : 'to-read'}
                                    size="small"
                                    color={currentCopy.status === 'read' ? 'success' : currentCopy.status === 'loaned' ? 'warning' : 'default'}
                                    sx={{ textTransform: 'capitalize' }}
                                  />
                                )}
                              </Grid>

                              {/* Loaned To (if status is loaned) */}
                              {currentCopy.status === 'loaned' && (
                                <Grid item xs={12}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
                                    Loaned To
                                  </Typography>
                                  {editMode ? (
                                    <TextField
                                      fullWidth
                                      size="small"
                                      placeholder="Person's name..."
                                      value={currentCopy.loanedTo || ''}
                                      onChange={(e) => handleCopyUpdate(currentCopy.id, 'loanedTo', e.target.value)}
                                      sx={{ bgcolor: 'background.paper' }}
                                    />
                                  ) : (
                                    <Typography variant="body2">
                                      {currentCopy.loanedTo || 'Not specified'}
                                    </Typography>
                                  )}
                                </Grid>
                              )}

                              {/* Copy-specific Rating */}
                              <Grid item xs={12}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
                                  Copy Rating
                                </Typography>
                                <Rating 
                                  value={currentCopy.rating || 0}
                                  onChange={(e, newValue) => {
                                    if (editMode) {
                                      handleCopyUpdate(currentCopy.id, 'rating', newValue);
                                    }
                                  }}
                                  readOnly={!editMode}
                                  size="small"
                                  precision={0.5}
                                />
                              </Grid>

                              {/* Copy-specific Notes */}
                              <Grid item xs={12}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
                                  Copy Notes
                                </Typography>
                                {editMode ? (
                                  <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    size="small"
                                    placeholder="Notes specific to this copy..."
                                    value={currentCopy.notes || ''}
                                    onChange={(e) => handleCopyUpdate(currentCopy.id, 'notes', e.target.value)}
                                    sx={{ bgcolor: 'background.paper' }}
                                  />
                                ) : (
                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {currentCopy.notes || 'No notes for this copy'}
                                  </Typography>
                                )}
                              </Grid>
                            </Grid>
                          </Paper>
                        );
                      })()}
                    </Box>
                  )}
                </Box>
              </Fade>
            </Grid>

            {/* Right Column - Book Details */}
            <Grid item xs={12} md={9} sx={{ p: 2 }}>
              <Grow in timeout={700}>
                <Box>
                  {/* Status Pills - Always Visible */}
                  <Box sx={{ mb: 2 }}>
                    <StatusPills
                      status={displayBook.status}
                      onChange={handleQuickStatusChange}
                      disabled={loading}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Tabs for organized content */}
                  <Tabs 
                    value={tabValue} 
                    onChange={(e, v) => setTabValue(v)}
                    sx={{ 
                      mb: 2,
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 600,
                        minHeight: 40,
                        py: 1,
                      }
                    }}
                  >
                    <Tab label="Details" />
                    <Tab label="Description" />
                    <Tab label="Notes" />
                    <Tab label="Collections" />
                  </Tabs>

                  {/* Tab Content */}
                  {tabValue === 0 && (
                    <Fade in timeout={300}>
                      <Box>
                        <Grid container spacing={2}>
                          {/* Title */}
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Title
                              </Typography>
                            </Box>
                            {editMode ? (
                              <TextField
                                fullWidth
                                size="small"
                                value={editedBook.title}
                                onChange={(e) => setEditedBook({...editedBook, title: e.target.value})}
                                variant="outlined"
                                required
                                error={!editedBook.title.trim()}
                                helperText={!editedBook.title.trim() ? "Title is required" : ""}
                              />
                            ) : (
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {displayBook.title}
                              </Typography>
                            )}
                          </Grid>

                          {/* Authors */}
                          {book.authors && (
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <AuthorIcon fontSize="small" color="action" />
                                <Typography variant="subtitle2" color="text.secondary">
                                  Authors
                                </Typography>
                              </Box>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {book.authors.join(', ')}
                              </Typography>
                            </Grid>
                          )}

                          {/* ISBN */}
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <IsbnIcon fontSize="small" color="action" />
                              <Typography variant="subtitle2" color="text.secondary">
                                ISBN
                              </Typography>
                            </Box>
                            <Typography variant="body1">{book.isbn}</Typography>
                          </Grid>

                          {/* Publisher */}
                          {book.publisher && (
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <PublisherIcon fontSize="small" color="action" />
                                <Typography variant="subtitle2" color="text.secondary">
                                  Publisher
                                </Typography>
                              </Box>
                              <Typography variant="body1">{book.publisher}</Typography>
                            </Grid>
                          )}

                          {/* Published Date */}
                          {book.publishedDate && (
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <DateIcon fontSize="small" color="action" />
                                <Typography variant="subtitle2" color="text.secondary">
                                  Published
                                </Typography>
                              </Box>
                              <Typography variant="body1">
                                {new Date(book.publishedDate).toLocaleDateString()}
                              </Typography>
                            </Grid>
                          )}

                          {/* Edition Type */}
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              {book.edition === 'deluxe' ? <DiamondIcon fontSize="small" color="action" /> : <SpecialIcon fontSize="small" color="action" />}
                              <Typography variant="subtitle2" color="text.secondary">
                                Edition
                              </Typography>
                            </Box>
                            {editMode ? (
                              <FormControl fullWidth size="small">
                                <Select
                                  value={editedBook.edition || 'standard'}
                                  onChange={(e) => setEditedBook({...editedBook, edition: e.target.value})}
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
                                </Select>
                              </FormControl>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BookEditionBadge edition={displayBook.edition} />
                                {!displayBook.edition || displayBook.edition === 'standard' ? (
                                  <Typography variant="body1">Standard Edition</Typography>
                                ) : null}
                              </Box>
                            )}
                          </Grid>

                          {/* Page Count */}
                          {book.pageCount > 0 && (
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <PagesIcon fontSize="small" color="action" />
                                <Typography variant="subtitle2" color="text.secondary">
                                  Pages
                                </Typography>
                              </Box>
                              <Typography variant="body1">{book.pageCount}</Typography>
                            </Grid>
                          )}

                          {/* Genres */}
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <CategoryIcon fontSize="small" color="action" />
                              <Typography variant="subtitle2" color="text.secondary">
                                Genres
                              </Typography>
                            </Box>
                            {editMode ? (
                              <Autocomplete
                                multiple
                                size="small"
                                options={ALLOWED_GENRES}
                                value={editedBook.genres}
                                onChange={(event, newValue) => {
                                  setEditedBook({...editedBook, genres: newValue});
                                }}
                                renderTags={(value, getTagProps) =>
                                  value.map((option, index) => (
                                    <Chip
                                      label={option}
                                      size="small"
                                      {...getTagProps({ index })}
                                      sx={{ 
                                        bgcolor: theme.palette.primary.main,
                                        color: 'white',
                                        '& .MuiChip-deleteIcon': {
                                          color: 'rgba(255, 255, 255, 0.7)',
                                          '&:hover': {
                                            color: 'white',
                                          },
                                        },
                                      }}
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
                            ) : (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {displayBook.genres && displayBook.genres.length > 0 ? (
                                  displayBook.genres.map((genre, index) => (
                                    <Chip 
                                      key={index} 
                                      label={genre} 
                                      size="small"
                                      sx={{ 
                                        bgcolor: theme.palette.primary.main,
                                        color: 'white',
                                      }}
                                    />
                                  ))
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    No genres added
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Grid>

                          {/* Tags */}
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <TagIcon fontSize="small" color="action" />
                              <Typography variant="subtitle2" color="text.secondary">
                                Tags
                              </Typography>
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
                                    sx={{ flexGrow: 1 }}
                                  />
                                  <IconButton 
                                    size="small" 
                                    onClick={handleAddTag}
                                    sx={{ 
                                      bgcolor: theme.palette.secondary.main,
                                      color: 'white',
                                      '&:hover': {
                                        bgcolor: theme.palette.secondary.dark,
                                      }
                                    }}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {displayBook.tags && displayBook.tags.length > 0 ? (
                                  displayBook.tags.map((tag, index) => (
                                    <Chip 
                                      key={index} 
                                      label={tag} 
                                      size="small" 
                                      color="secondary" 
                                    />
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
                      </Box>
                    </Fade>
                  )}

                  {tabValue === 1 && (
                    <Fade in timeout={300}>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {book.description || 'No description available'}
                        </Typography>
                      </Paper>
                    </Fade>
                  )}

                  {tabValue === 2 && (
                    <Fade in timeout={300}>
                      <Box>
                        {editMode ? (
                          <TextField
                            fullWidth
                            multiline
                            rows={8}
                            value={editedBook.notes}
                            onChange={(e) => setEditedBook({...editedBook, notes: e.target.value})}
                            placeholder="Add your personal notes about this book..."
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                bgcolor: 'background.paper',
                              }
                            }}
                          />
                        ) : (
                          <Paper sx={{ p: 2, bgcolor: 'grey.50', minHeight: 200 }}>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                              {displayBook.notes || 'No notes yet. Click edit to add notes.'}
                            </Typography>
                          </Paper>
                        )}
                      </Box>
                    </Fade>
                  )}

                  {tabValue === 3 && (
                    <Fade in timeout={300}>
                      <Box>
                        {displayBook.collections && displayBook.collections.length > 0 ? (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              This book is in the following collections:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                              {displayBook.collections.map((collection) => (
                                <Chip
                                  key={collection._id || collection}
                                  label={collection.name || collection}
                                  color="primary"
                                  icon={<CollectionsIcon />}
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
                          sx={{
                            py: 1.5,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          }}
                        >
                          Manage Collections
                        </Button>
                      </Box>
                    </Fade>
                  )}
                </Box>
              </Grow>
            </Grid>
          </Grid>
        </DialogContent>

        {/* Dialog Actions - Minimal Footer */}
        <DialogActions sx={{ p: 1, bgcolor: 'grey.50' }}>
          <Button onClick={onClose} size="small" sx={{ ml: 'auto' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* More Options Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            width: 200,
            borderRadius: 2,
          }
        }}
      >
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Book</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Quantity Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Delete Copies
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            You have <strong>{currentBookData?.quantity || book?.quantity || 1} copies</strong> of this book.
            How many would you like to delete?
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 2,
            my: 3
          }}>
            <IconButton 
              onClick={() => setDeleteQuantity(Math.max(1, deleteQuantity - 1))}
              disabled={deleteQuantity <= 1}
              color="primary"
            >
              <RemoveIcon />
            </IconButton>
            
            <TextField
              type="number"
              value={deleteQuantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                const max = currentBookData?.quantity || book?.quantity || 1;
                setDeleteQuantity(Math.min(Math.max(1, val), max));
              }}
              inputProps={{ 
                min: 1, 
                max: currentBookData?.quantity || book?.quantity || 1,
                style: { textAlign: 'center' }
              }}
              sx={{ width: 100 }}
            />
            
            <IconButton 
              onClick={() => {
                const max = currentBookData?.quantity || book?.quantity || 1;
                setDeleteQuantity(Math.min(deleteQuantity + 1, max));
              }}
              disabled={deleteQuantity >= (currentBookData?.quantity || book?.quantity || 1)}
              color="primary"
            >
              <AddIcon />
            </IconButton>
          </Box>
          
          <Alert 
            severity={deleteQuantity === (currentBookData?.quantity || book?.quantity || 1) ? "warning" : "info"}
          >
            {deleteQuantity === (currentBookData?.quantity || book?.quantity || 1)
              ? "This will remove the book entirely from your library."
              : `This will leave ${(currentBookData?.quantity || book?.quantity || 1) - deleteQuantity} ${((currentBookData?.quantity || book?.quantity || 1) - deleteQuantity) === 1 ? 'copy' : 'copies'} in your library.`
            }
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button 
              onClick={() => setShowDeleteDialog(false)}
              fullWidth
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => performDelete(deleteQuantity)}
              color="error"
              variant="contained"
              fullWidth
              startIcon={<DeleteIcon />}
            >
              Delete {deleteQuantity} {deleteQuantity === 1 ? 'Copy' : 'Copies'}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Cover Image Picker Dialog */}
      <CoverImagePicker
        open={showCoverPicker}
        onClose={() => setShowCoverPicker(false)}
        book={currentBookData || book}
        currentCover={displayBook.coverImage}
        onCoverSelected={handleCoverSelected}
      />
    </>
  );
};

export default BookDetailsModal;
