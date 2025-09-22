import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardMedia,
  CardActions,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Skeleton,
  Chip,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  OpenInNew as OpenIcon,
  ImageSearch as ImageSearchIcon,
  ContentCopy as CopyIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import bookService from '../../services/bookService';

const CoverSearchDialog = ({ 
  open, 
  onClose, 
  book,
  onSelectCover,
  mode = 'dialog' // 'dialog' or 'inline'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCover, setSelectedCover] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleGoogleImageSearch = () => {
    // Generate Google Images search URL
    const isbn = book?.isbn || '';
    const title = book?.title || '';
    const authors = book?.authors?.join(' ') || '';
    
    let searchQuery = '';
    if (isbn) {
      // Use ISBN as primary search term
      searchQuery = `${isbn}+book+cover`;
    } else {
      // Fallback to title and author
      searchQuery = `${title} ${authors} book cover`.replace(/\s+/g, '+');
    }
    
    // Open Google Images in new tab with the search
    const googleUrl = `https://www.google.com/search?q=${searchQuery}&udm=2`;
    window.open(googleUrl, '_blank');
    
    // Show URL input field for user to paste the image URL
    setShowUrlInput(true);
    setError(null);
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      setError('Please enter an image URL');
      return;
    }
    
    try {
      // Use the URL as the selected cover
      setSelectedCover({
        url: urlInput.trim(),
        thumbnail: urlInput.trim(),
        source: 'other',  // Use enum value for web sources
        title: 'Imported from URL'
      });
      
      setError(null);
      setShowUrlInput(false);
    } catch (err) {
      console.error('Error importing URL:', err);
      setError('Invalid image URL. Please check and try again.');
    }
  };

  const handleApply = () => {
    if (selectedCover) {
      onSelectCover(selectedCover.url);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedCover(null);
    setError(null);
    setUrlInput('');
    setShowUrlInput(false);
    if (onClose) onClose();
  };

  // Content to render (same for both dialog and inline modes)
  const renderContent = () => (
    <>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Box>
        {/* Google Images Search Button */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<ImageSearchIcon />}
            onClick={handleGoogleImageSearch}
            sx={{ 
              mb: 2,
              minWidth: isMobile ? '100%' : 300
            }}
          >
            Search on Google Images
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            This will open Google Images in a new tab
          </Typography>
        </Box>

        {/* Instructions Box */}
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            mb: 3,
            bgcolor: 'background.default'
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            How to copy image URL from Google:
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Click on the book cover image you want
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Click on the preview image that appears on the right
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              Right-click on the enlarged image
            </Typography>
            <Typography component="li" variant="body2">
              Select "Copy image address" (not "Copy image")
            </Typography>
          </Box>
        </Paper>

        {/* URL Import Section */}
        {showUrlInput && (
          <Paper 
            sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: 'primary.light',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light',
              color: (theme) => theme.palette.mode === 'dark' ? 'primary.contrastText' : 'inherit'
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Step 2: Paste the image URL here
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Paste image URL here..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleUrlImport();
                  }
                }}
                sx={{
                  bgcolor: 'background.paper',
                  '& .MuiInputBase-input': {
                    bgcolor: 'background.paper',
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={handleUrlImport}
                disabled={!urlInput.trim()}
              >
                Import
              </Button>
            </Box>
          </Paper>
        )}

        {/* Selected Cover Preview */}
        {selectedCover && selectedCover.source === 'other' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Selected Cover Preview
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'start' }}>
              <Card sx={{ 
                width: 150,
                border: 2, 
                borderColor: 'primary.main',
              }}>
                <CardMedia
                  component="img"
                  image={selectedCover.url}
                  alt="Selected cover"
                  sx={{ 
                    height: 225,
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    setError('Failed to load image. Please check the URL.');
                    setSelectedCover(null);
                  }}
                />
              </Card>
              <Box sx={{ flex: 1 }}>
                <Alert severity="success" icon={<CheckIcon />}>
                  Cover ready to use!
                </Alert>
                {mode === 'inline' ? (
                  <Button
                    variant="contained"
                    onClick={() => onSelectCover(selectedCover.url)}
                    sx={{ mt: 2 }}
                    startIcon={<CheckIcon />}
                  >
                    Use This Cover
                  </Button>
                ) : null}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </>
  );

  // If inline mode, render content directly
  if (mode === 'inline') {
    return renderContent();
  }

  // Otherwise render as a dialog
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
      }}>
        <Typography variant="h6">
          Search for Book Covers
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Book Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Searching covers for:
          </Typography>
          <Typography variant="subtitle1" fontWeight="600">
            {book?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            by {book?.authors?.join(', ')}
          </Typography>
        </Box>

        {renderContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!selectedCover}
          startIcon={<CheckIcon />}
        >
          Use Selected Cover
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CoverSearchDialog;