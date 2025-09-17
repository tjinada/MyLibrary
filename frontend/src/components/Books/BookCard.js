import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Box,
  Rating,
  Skeleton,
} from '@mui/material';
import { MenuBook as BookIcon } from '@mui/icons-material';

const BookCard = ({ book, onClick }) => {
  const [imageStatus, setImageStatus] = useState('loading'); // 'loading', 'loaded', 'error'
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const imageRef = useRef(null);
  const mountedRef = useRef(true);

  // Keep track of whether component is mounted
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'reading':
        return 'primary';
      case 'loaned':
        return 'warning';
      case 'wishlist':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(book);
    }
  };

  // Get high quality cover URL
  const getHighQualityCover = (url) => {
    if (!url) return null;
    
    // Ensure HTTPS
    let cleanUrl = url;
    if (cleanUrl.startsWith('http://')) {
      cleanUrl = cleanUrl.replace('http://', 'https://');
    }
    
    // If it's a Google Books URL, ensure we're getting high quality
    if (cleanUrl.includes('books.google.com') || cleanUrl.includes('googleapis.com')) {
      // Replace zoom parameter with zoom=0 for full resolution
      if (cleanUrl.includes('zoom=')) {
        cleanUrl = cleanUrl.replace(/zoom=\d+/, 'zoom=0');
      } else if (cleanUrl.includes('?')) {
        cleanUrl += '&zoom=0';
      } else {
        cleanUrl += '?zoom=0';
      }
    }
    
    return cleanUrl;
  };

  // Get all possible image URLs for this book
  const getImageUrls = () => {
    const urls = [];
    
    // Primary cover image
    if (book.coverImage) {
      urls.push(getHighQualityCover(book.coverImage));
    }
    
    // Open Library fallback
    if (book.isbn) {
      urls.push(`https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`);
    }
    
    // Google Books direct API fallback
    if (book.googleBooksId) {
      urls.push(`https://books.google.com/books/content?id=${book.googleBooksId}&printsec=frontcover&img=1&zoom=0&source=gbs_api`);
    }
    
    return urls.filter(Boolean);
  };

  // Load image with fallback logic
  useEffect(() => {
    const urls = getImageUrls();
    if (urls.length === 0) {
      setImageStatus('error');
      return;
    }

    let currentIndex = 0;
    let isCancelled = false;

    const tryLoadImage = (url) => {
      if (isCancelled || !mountedRef.current) return;

      const img = new Image();
      
      img.onload = () => {
        if (!isCancelled && mountedRef.current) {
          setCurrentImageUrl(url);
          setImageStatus('loaded');
        }
      };

      img.onerror = () => {
        if (isCancelled || !mountedRef.current) return;
        
        // Try next URL
        currentIndex++;
        if (currentIndex < urls.length) {
          tryLoadImage(urls[currentIndex]);
        } else {
          // All URLs failed
          setImageStatus('error');
        }
      };

      // Start loading
      img.src = url;
    };

    // Start with the first URL
    setImageStatus('loading');
    tryLoadImage(urls[0]);

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [book.coverImage, book.isbn, book.googleBooksId]); // Only re-run if book data changes

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
        },
      }}
    >
      <CardActionArea 
        onClick={handleClick} 
        sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        {/* Book Cover */}
        <Box sx={{ 
          position: 'relative',
          height: 280,
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {/* Loading skeleton */}
          {imageStatus === 'loading' && (
            <Skeleton 
              variant="rectangular" 
              animation="wave"
              sx={{ 
                position: 'absolute',
                width: '100%', 
                height: '100%',
              }} 
            />
          )}
          
          {/* Error/No image fallback */}
          {imageStatus === 'error' && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
                bgcolor: 'grey.50',
              }}
            >
              <BookIcon 
                sx={{ 
                  fontSize: 80,
                  color: 'action.disabled',
                  opacity: 0.3,
                  mb: 1,
                }} 
              />
              <Typography variant="caption" color="text.disabled">
                No cover available
              </Typography>
            </Box>
          )}
          
          {/* Loaded image */}
          {imageStatus === 'loaded' && currentImageUrl && (
            <img
              ref={imageRef}
              src={currentImageUrl}
              alt={book.title}
              style={{
                height: '100%',
                width: '100%',
                objectFit: 'contain',
                backgroundColor: '#f5f5f5',
                padding: '8px',
              }}
              loading="lazy"
            />
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography 
            gutterBottom 
            variant="subtitle1" 
            component="h3"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '3em',
              fontWeight: 500,
              lineHeight: 1.5,
            }}
            title={book.title}
          >
            {book.title}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mb: 1,
            }}
            title={book.authors?.join(', ')}
          >
            {book.authors?.join(', ') || 'Unknown Author'}
          </Typography>

          <Box sx={{ mt: 'auto', pt: 1 }}>
            {book.rating ? (
              <Rating 
                value={book.rating} 
                readOnly 
                size="small" 
                sx={{ mb: 1 }}
              />
            ) : null}
            
            <Chip 
              label={book.status} 
              size="small" 
              color={getStatusColor(book.status)}
              sx={{ fontWeight: 500 }}
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default BookCard;
