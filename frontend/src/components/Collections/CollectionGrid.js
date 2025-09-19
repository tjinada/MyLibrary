import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const CollectionGrid = ({ collections, onCollectionClick, onEditCollection, onDeleteCollection }) => {
  const { isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedCollection, setSelectedCollection] = React.useState(null);

  const handleMenuOpen = (event, collection) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCollection(collection);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCollection(null);
  };

  const handleEdit = () => {
    if (selectedCollection && onEditCollection) {
      onEditCollection(selectedCollection);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedCollection && onDeleteCollection) {
      onDeleteCollection(selectedCollection._id);
    }
    handleMenuClose();
  };

  const generateCoverDisplay = (collection) => {
    // If collection has a cover image, use it
    if (collection.coverImage) {
      return (
        <CardMedia
          component="img"
          height="200"
          image={collection.coverImage}
          alt={collection.name}
          sx={{ objectFit: 'cover' }}
        />
      );
    }

    // Otherwise, create a 2x2 grid of book covers
    const bookCovers = collection.books?.slice(0, 4).map(book => book.coverImage).filter(Boolean) || [];
    
    if (bookCovers.length > 0) {
      return (
        <Box
          sx={{
            height: 200,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: 0.5,
            bgcolor: 'background.default',
            p: 0.5
          }}
        >
          {[...Array(4)].map((_, index) => (
            <Box
              key={index}
              sx={{
                bgcolor: bookCovers[index] ? 'transparent' : 'action.hover',
                backgroundImage: bookCovers[index] ? `url(${bookCovers[index]})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 0.5
              }}
            />
          ))}
        </Box>
      );
    }

    // Fallback: show icon
    return (
      <Box
        sx={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover'
        }}
      >
        <ViewIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
      </Box>
    );
  };

  return (
    <>
      <Grid container spacing={3}>
        {collections.map((collection) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={collection._id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              {isAuthenticated && (
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'background.paper',
                    zIndex: 1,
                    '&:hover': {
                      bgcolor: 'background.default'
                    }
                  }}
                  size="small"
                  onClick={(e) => handleMenuOpen(e, collection)}
                >
                  <MoreIcon />
                </IconButton>
              )}

              <CardActionArea 
                onClick={() => onCollectionClick(collection)}
                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
              >
                {generateCoverDisplay(collection)}
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography 
                    gutterBottom 
                    variant="h6" 
                    component="h2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '3.6em'
                    }}
                  >
                    {collection.name}
                  </Typography>
                  
                  {collection.description && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mb: 1
                      }}
                    >
                      {collection.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
                    <Chip 
                      label={`${collection.bookCount || 0} books`} 
                      size="small" 
                      variant="outlined"
                    />
                    {collection.collectionType !== 'custom' && (
                      <Chip 
                        label={collection.collectionType} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onCollectionClick(selectedCollection); handleMenuClose(); }}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View
        </MenuItem>
        {isAuthenticated && (
          <>
            <MenuItem onClick={handleEdit}>
              <EditIcon sx={{ mr: 1 }} fontSize="small" />
              Edit
            </MenuItem>
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
              Delete
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default CollectionGrid;
