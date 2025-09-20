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
  useTheme,
  alpha,
} from '@mui/material';
import { MenuBook as BookIcon } from '@mui/icons-material';
import BookStatusChip from './BookStatusChip';
import BookCardActions from './BookCardActions';
import { dimensions } from '../../theme/theme';

const BookCard = ({ 
  book, 
  onClick, 
  showRemoveButton, 
  onRemove,
  onQuickEdit,
  onAddToCollection 
}) => {
  const theme = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(book.coverImage);
  const [isHovered, setIsHovered] = useState(false);
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
        
        if (img.complete && img.naturalWidth > 0) {
          setImageLoaded(true);
        } else {
          setImageLoaded(false);
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
  }, [book.coverImage, book.isbn, imageSrc]);

  const handleClick = () => {
    if (onClick) {
      onClick(book);
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

  const hasValidCover = book.coverImage && book.coverQualityScore > 0;

  return (
    <Card 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: theme.shadows[12],
        },
      }}
    >
      {/* Book Cover Container with Fixed Aspect Ratio */}
      <Box 
        onClick={handleClick}
        sx={{ 
          position: 'relative',
          width: '100%',
          aspectRatio: `${dimensions.bookCoverAspectRatio}`,
          bgcolor: 'grey.100',
          overflow: 'hidden',
        }}
      >
        {/* Status Chip - Top Left */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 3,
          }}
        >
          <BookStatusChip status={book.status || 'to-read'} size="small" />
        </Box>

        {/* Quantity Badge - Top Right */}
        {book.quantity && book.quantity > 1 && (
          <Chip
            label={`×${book.quantity}`}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 3,
              bgcolor: alpha(theme.palette.secondary.main, 0.9),
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.7rem',
              height: 20,
              '& .MuiChip-label': {
                px: 0.75,
              },
            }}
          />
        )}

        {/* Hover Actions Overlay */}
        <BookCardActions
          visible={isHovered}
          onView={() => onClick(book)}
          onEdit={onQuickEdit}
          onAddToCollection={onAddToCollection}
          onRemove={showRemoveButton ? onRemove : null}
          showRemove={showRemoveButton}
        />

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
        
        {/* Cover Image */}
        {hasValidCover && !imageError && imageSrc && (
          <img
            ref={imageRef}
            key={`${book.isbn}-${imageSrc}`}
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
            loading="eager"
          />
        )}
        
        {/* Fallback Book Cover Design */}
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
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              p: 2,
            }}
          >
            <BookIcon 
              sx={{ 
                fontSize: 48,
                color: 'white',
                opacity: 0.9,
                mb: 1,
              }} 
            />
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'white',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.8rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {book.title}
            </Typography>
            {book.authors && book.authors[0] && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'white',
                  opacity: 0.8,
                  textAlign: 'center',
                  fontSize: '0.65rem',
                  mt: 0.5,
                }}
              >
                {book.authors[0]}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Book Info Section - Fixed Height */}
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          p: 1.5,
          pb: '12px !important',
          minHeight: 90,
        }}
      >
        <Typography 
          variant="subtitle2" 
          component="h3"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '2.4em',
            fontWeight: 600,
            lineHeight: 1.2,
            fontSize: '0.875rem',
            color: 'text.primary',
            mb: 0.5,
          }}
          title={book.title}
        >
          {book.title}
        </Typography>
        
        {book.authors && book.authors.length > 0 && (
          <Typography 
            variant="caption" 
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'text.secondary',
              fontSize: '0.75rem',
              mb: 'auto',
            }}
            title={book.authors?.join(', ')}
          >
            {book.authors?.join(', ')}
          </Typography>
        )}

        {/* Rating at the bottom */}
        {book.rating > 0 && (
          <Box sx={{ mt: 0.5 }}>
            <Rating 
              value={book.rating} 
              readOnly 
              size="small"
              precision={0.5}
              sx={{ 
                fontSize: '1rem',
                color: theme.palette.warning.main,
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BookCard;
