import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Box,
} from '@mui/material';

const BookCard = ({ book }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/book/${book.isbn}`);
  };

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

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
        },
      }}
    >
      <CardActionArea onClick={handleClick} sx={{ flexGrow: 1 }}>
        <CardMedia
          component="img"
          height="200"
          image={book.coverImage || '/api/placeholder/150/200'}
          alt={book.title}
          sx={{ 
            objectFit: 'contain',
            bgcolor: 'grey.100',
            p: 1,
          }}
        />
        <CardContent>
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
            }}
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
          >
            {book.authors?.join(', ') || 'Unknown Author'}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip 
              label={book.status} 
              size="small" 
              color={getStatusColor(book.status)}
            />
            {book.rating && (
              <Typography variant="body2" color="text.secondary">
                ★ {book.rating}
              </Typography>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default BookCard;
