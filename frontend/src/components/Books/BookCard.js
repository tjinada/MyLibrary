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
} from '@mui/material';
import { MenuBook as BookIcon } from '@mui/icons-material';

const BookCard = ({ book, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.log(`Failed to load cover for "${book.title}"`);
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
          {hasValidCover && !imageError && (
            <img
              src={book.coverImage}
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
              loading="lazy"
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
