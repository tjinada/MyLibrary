import React, { useState } from 'react';
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
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  MenuBook as BookIcon,
  RemoveCircle as RemoveIcon 
} from '@mui/icons-material';

const BookCard = ({ book, onClick, showRemoveButton, onRemove }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(book.coverImage);
  const imageRef = React.useRef(null);

  // Update image source when book prop changes
  React.useEffect(() => {
    let timeoutId;
    
    if (book.coverImage !== imageSrc) {
      setImageSrc(book.coverImage);
      setImageError(false);
      
      // Check if image is already cached/loaded
      if (book.coverImage) {
        const img = new Image();
        img.src = book.coverImage;
        
        // If image is already cached, it will have naturalWidth > 0
        if (img.complete && img.naturalWidth > 0) {
          setImageLoaded(true);
        } else {
          setImageLoaded(false);
          
          // Fallback: Force show image after 500ms even if onLoad hasn't fired
          // This handles the case where cached images don't trigger onLoad
          timeoutId = setTimeout(() => {
            if (imageRef.current && imageRef.current.complete) {
              setImageLoaded(true);
            }
          }, 500);
        }
      } else {
        setImageLoaded(false);
      }
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [book.coverImage, book.isbn, imageSrc]); // Include all dependencies

  const getStatusColor = (status) => {
    switch (status) {
      case 'to-read':
        return 'info';
      case 'reading':
        return 'primary';
      case 'read':
        return 'success';
      case 'loaned':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'to-read':
        return 'To Read';
      case 'reading':
        return 'Reading';
      case 'read':
        return 'Read';
      case 'loaned':
        return 'Loaned';
      default:
        return status;
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(book);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e) => {
    console.log(`Failed to load cover for "${book.title}": ${book.coverImage}`);
    
    // Try to reload with HTTPS if it was HTTP
    if (imageSrc && imageSrc.startsWith('http://')) {
      const httpsSrc = imageSrc.replace('http://', 'https://');
      console.log(`Retrying with HTTPS: ${httpsSrc}`);
      setImageSrc(httpsSrc);
      setImageError(false);
      return;
    }
    
    setImageError(true);
    setImageLoaded(true);
  };

  // Check if we have a validated cover from the backend
  const hasValidCover = book.coverImage && book.coverQualityScore > 0;

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
          paddingTop: '150%', // 2:3 aspect ratio to match collection cards
          bgcolor: 'grey.100',
          overflow: 'hidden',
        }}>
          {/* Remove Button */}
          {showRemoveButton && onRemove && (
            <Tooltip title="Remove from collection">
              <IconButton
                size="small"
                onClick={handleRemove}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  zIndex: 1,
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'error.light',
                    color: 'white',
                  },
                }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {/* Loading skeleton */}
          {!imageLoaded && hasValidCover && (
            <Skeleton 
              variant="rectangular" 
              animation="wave"
              sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%', 
                height: '100%',
              }} 
            />
          )}
          
          {/* Show cover image if we have a validated one and no error */}
          {hasValidCover && !imageError && imageSrc && (
            <img
              ref={imageRef}
              key={`${book.isbn}-${imageSrc}`} // Use ISBN + src as key for uniqueness
              src={imageSrc}
              alt={book.title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                display: imageLoaded ? 'block' : 'none',
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="eager" // Change to eager for better reliability
            />
          )}
          
          {/* Fallback when no valid cover or error - create a custom book cover */}
          {(!hasValidCover || imageError) && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.light',
                background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                p: 2,
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  mb: 1,
                  fontSize: '0.9rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {book.title}
              </Typography>
              <BookIcon 
                sx={{ 
                  fontSize: 60,
                  color: 'white',
                  opacity: 0.7,
                  my: 1,
                }} 
              />
              {book.authors && book.authors[0] && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'white',
                    opacity: 0.9,
                    textAlign: 'center',
                    fontSize: '0.7rem',
                  }}
                >
                  {book.authors[0]}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 1 }}>
          <Typography 
            gutterBottom 
            variant="body2" 
            component="h3"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '2.5em',
              fontWeight: 600,
              lineHeight: 1.3,
              fontSize: '0.875rem',
            }}
            title={book.title}
          >
            {book.title}
          </Typography>
          
          {book.authors && book.authors.length > 0 && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                mb: 0.5,
                fontSize: '0.75rem',
              }}
              title={book.authors?.join(', ')}
            >
              {book.authors?.join(', ')}
            </Typography>
          )}

          <Box sx={{ mt: 'auto' }}>
            {book.rating ? (
              <Rating 
                value={book.rating} 
                readOnly 
                size="small" 
                sx={{ mb: 0.5 }}
              />
            ) : null}
            
            <Chip 
              label={getStatusLabel(book.status)} 
              size="small" 
              color={getStatusColor(book.status)}
              sx={{ fontWeight: 500, fontSize: '0.7rem' }}
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default BookCard;
