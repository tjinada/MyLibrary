import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Box,
  Rating,
} from '@mui/material';

const BookCard = ({ book, onClick }) => {
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
        <CardMedia
          component="img"
          sx={{ 
            height: 280,
            objectFit: 'cover',
            bgcolor: 'grey.100',
          }}
          image={book.coverImage || '/api/placeholder/200/280'}
          alt={book.title}
        />
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
