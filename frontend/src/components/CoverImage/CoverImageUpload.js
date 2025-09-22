import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  ContentPaste as PasteIcon,
} from '@mui/icons-material';

const CoverImageUpload = ({ 
  onUploadSuccess, 
  onError,
  open,
  onClose 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [inputMode, setInputMode] = useState('file'); // 'file' | 'url'
  
  const fileInputRef = useRef(null);
  const theme = useTheme();

  // Handle file selection
  const handleFileSelect = (files) => {
    if (files && files[0]) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        onError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        onError('Image size must be less than 5MB');
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, []);

  // Handle paste from clipboard
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFileSelect([file]);
        }
      }
    }
  }, []);

  // Handle URL input
  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      onError('Please enter an image URL');
      return;
    }
    
    setLoading(true);
    try {
      // Validate URL format
      const url = new URL(imageUrl);
      if (!url.protocol.startsWith('http')) {
        throw new Error('Invalid URL protocol');
      }
      
      // Set preview
      setPreviewUrl(imageUrl);
      setInputMode('file');
    } catch (err) {
      onError('Please enter a valid image URL');
    } finally {
      setLoading(false);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!previewUrl) {
      onError('No image selected');
      return;
    }
    
    setLoading(true);
    try {
      // If it's a URL, pass it directly
      if (previewUrl.startsWith('http')) {
        await onUploadSuccess(null, previewUrl);
      } else {
        // It's a base64 image
        await onUploadSuccess(previewUrl);
      }
      
      // Clear preview
      setPreviewUrl(null);
      setImageUrl('');
    } catch (err) {
      onError('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  // Clear selection
  const handleClear = () => {
    setPreviewUrl(null);
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add paste event listener
  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  if (!open && onClose) {
    return null;
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Mode Toggle */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant={inputMode === 'file' ? 'contained' : 'outlined'}
          onClick={() => setInputMode('file')}
          startIcon={<ImageIcon />}
          size="small"
        >
          Upload File
        </Button>
        <Button
          variant={inputMode === 'url' ? 'contained' : 'outlined'}
          onClick={() => setInputMode('url')}
          startIcon={<LinkIcon />}
          size="small"
        >
          From URL
        </Button>
      </Box>

      {inputMode === 'file' ? (
        <>
          {/* Drag & Drop Zone */}
          <Paper
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              p: 3,
              border: 2,
              borderStyle: 'dashed',
              borderColor: dragActive ? 'primary.main' : 'divider',
              bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            
            {previewUrl ? (
              <Box sx={{ position: 'relative' }}>
                <img
                  src={previewUrl}
                  alt="Cover preview"
                  style={{
                    width: '100%',
                    maxHeight: 400,
                    objectFit: 'contain',
                  }}
                  onError={() => {
                    setPreviewUrl(null);
                    onError('Failed to load image');
                  }}
                />
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'background.paper',
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <UploadIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Drag & Drop Image Here
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  or click to browse files
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <PasteIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    You can also paste an image from clipboard (Ctrl+V)
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>

          {/* File requirements */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Requirements: JPEG, PNG, or WebP • Max 5MB • Min 200x300px • 2:3 aspect ratio preferred
            </Typography>
          </Box>
        </>
      ) : (
        <>
          {/* URL Input */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/book-cover.jpg"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleUrlSubmit();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleUrlSubmit}
              disabled={loading || !imageUrl.trim()}
            >
              Load
            </Button>
          </Box>

          {/* URL Preview */}
          {previewUrl && previewUrl.startsWith('http') && (
            <Paper sx={{ p: 2, position: 'relative' }}>
              <img
                src={previewUrl}
                alt="Cover preview"
                style={{
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'contain',
                }}
                onError={() => {
                  setPreviewUrl(null);
                  onError('Failed to load image from URL');
                }}
              />
              <IconButton
                onClick={handleClear}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'background.paper',
                }}
              >
                <CloseIcon />
              </IconButton>
            </Paper>
          )}
        </>
      )}

      {/* Action Buttons */}
      {previewUrl && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
          <Button onClick={handleClear}>
            Clear
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {loading ? 'Uploading...' : 'Upload Cover'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CoverImageUpload;
