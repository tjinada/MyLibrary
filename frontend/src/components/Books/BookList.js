import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Box,
  Paper,
  Divider,
  Rating,
  useTheme,
  useMediaQuery,
} from '@mui/material';

const BookList = ({ books, onBookClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  const handleClick = (book) => {
    if (onBookClick) {
      onBookClick(book);
    }
  };

  return (
    <Paper elevation={1}>
      <List sx={{ p: 0 }}>
        {books.map((book, index) => (
          <React.Fragment key={book._id || book.isbn}>
            <ListItem
              alignItems="flex-start"
              sx={{
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                py: 2,
              }}
              onClick={() => handleClick(book)}
            >
              <ListItemAvatar>
                <Avatar
                  variant="rounded"
                  src={book.coverImage || '/api/placeholder/60/90'}
                  alt={book.title}
                  sx={{ 
                    width: isMobile ? 50 : 60, 
                    height: isMobile ? 75 : 90,
                    mr: 2,
                  }}
                />
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Typography variant="subtitle1" component="span" sx={{ fontWeight: 500 }}>
                      {book.title}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {book.authors?.join(', ') || 'Unknown Author'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      {book.rating ? (
                        <Rating value={book.rating} readOnly size="small" />
                      ) : null}
                      
                      <Chip
                        label={getStatusLabel(book.status)}
                        size="small"
                        color={getStatusColor(book.status)}
                      />
                      
                      {book.genres?.slice(0, 2).map((genre, idx) => (
                        <Chip
                          key={idx}
                          label={genre}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      
                      {book.publishedDate && (
                        <Typography variant="caption" color="text.secondary">
                          {new Date(book.publishedDate).getFullYear()}
                        </Typography>
                      )}
                    </Box>
                    
                    {!isMobile && book.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {book.description}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
            {index < books.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default BookList;
