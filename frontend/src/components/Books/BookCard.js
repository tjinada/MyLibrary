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
  Checkbox,
  useTheme,
  alpha,
} from '@mui/material';
import { MenuBook as BookIcon } from '@mui/icons-material';
import BookStatusChip, { BookEditionBadge } from './BookStatusChip';
import BookCardActions from './BookCardActions';
import { dimensions } from '../../theme/theme';

const BookCard = ({ 
  book, 
  onClick, 
  showRemoveButton, 
  onRemove,
  onQuickEdit,
  onAddToCollection,
  selectionMode = false,
  isSelected = false,
  onToggleSelection
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
    if (selectionMode && onToggleSelection) {
      onToggleSelection(book._id || book.isbn);
    } else if (onClick) {
      onClick(book);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e) => {
    console.log(`Failed to load cover for "${book.title}": ${book.coverImage}`);
    
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
        border: selectionMode && isSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
        '&:hover': {
          transform: selectionMode ? 'none' : 'translateY(-4px)',
          boxShadow: selectionMode ? theme.shadows[4] : theme.shadows[8],
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
        {/* Selection Checkbox or Status Chip - Top Left */}
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            left: 6,
            zIndex: 3,
          }}
        >
          {selectionMode ? (
            <Checkbox
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                if (onToggleSelection) {
                  onToggleSelection(book._id || book.isbn);
                }
              }}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 1,
                p: 0.25,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 1)',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: 18,
                },
              }}
            />
          ) : (
            <BookStatusChip status={book.status || 'to-read'} size="small" />
          )}
        </Box>

        {/* Edition Badge - Top Right */}
        {book.edition && book.edition !== 'standard' && (
          <Box
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              zIndex: 3,
            }}
          >
            <BookEditionBadge edition={book.edition} size="small" />
          </Box>
        )}

        {/* Quantity Display - Bottom Center of Cover (More Visible) */}
        {book.quantity && book.quantity > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 3,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 'bold',
                color: theme.palette.secondary.main,
                fontSize: '0.75rem',
              }}
            >
              {book.quantity} copies
            </Typography>
          </Box>
        )}

        {/* Hover Actions Overlay - Only show when not in selection mode */}
        {!selectionMode && (
          <BookCardActions
            visible={isHovered}
            onView={() => onClick(book)}
            onEdit={onQuickEdit}
            onAddToCollection={onAddToCollection}
            onRemove={showRemoveButton ? onRemove : null}
            showRemove={showRemoveButton}
          />
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
              p: 1.5,
            }}
          >
            <BookIcon 
              sx={{ 
                fontSize: 36,
                color: 'white',
                opacity: 0.9,
                mb: 0.5,
              }} 
            />
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'white',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.7rem',
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
                  fontSize: '0.6rem',
                  mt: 0.25,
                }}
              >
                {book.authors[0]}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Book Info Section - Smaller Height */}
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          p: 1,
          pb: '8px !important',
          minHeight: 60,
          maxHeight: 80,
        }}
      >
        <Typography 
          variant="caption" 
          component="h3"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            fontWeight: 600,
            lineHeight: 1.2,
            fontSize: '0.75rem',
            color: 'text.primary',
            mb: 0.25,
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
              fontSize: '0.65rem',
              mb: 'auto',
            }}
            title={book.authors?.join(', ')}
          >
            {book.authors?.join(', ')}
          </Typography>
        )}

        {/* Rating at the bottom - Smaller */}
        {book.rating > 0 && (
          <Box sx={{ mt: 0.25 }}>
            <Rating 
              value={book.rating} 
              readOnly 
              size="small"
              precision={0.5}
              sx={{ 
                fontSize: '0.75rem',
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
