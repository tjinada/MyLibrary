import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Collapse,
  Grid,
  alpha
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LibraryBooks as LibraryBooksIcon,
  Collections as CollectionsIcon
} from '@mui/icons-material';

const CollectionCard = ({ 
  collection, 
  expanded = false, 
  onToggleExpand,
  onClick,
  onEdit,
  onDelete,
  viewMode = 'grid',
  compact = false
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [localExpanded, setLocalExpanded] = useState(expanded);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    if (onEdit) onEdit(collection);
  };

  const handleDelete = () => {
    handleMenuClose();
    if (onDelete) onDelete(collection);
  };

  const handleExpandClick = (event) => {
    event.stopPropagation();
    const newExpanded = !localExpanded;
    setLocalExpanded(newExpanded);
    if (onToggleExpand) {
      onToggleExpand(collection._id, newExpanded);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(collection);
    }
  };

  const renderCompositeCover = () => {
    const covers = collection.books?.slice(0, 4).map(book => book.coverImage).filter(Boolean) || [];
    
    if (covers.length === 0) {
      return (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.200'
          }}
        >
          <LibraryBooksIcon sx={{ fontSize: 60, color: 'grey.500' }} />
        </Box>
      );
    }

    if (covers.length === 1 || collection.coverImage) {
      return (
        <Box
          component="img"
          src={collection.coverImage || covers[0]}
          alt={collection.name}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      );
    }

    // Create 2x2 grid of covers
    return (
      <Grid container sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {[0, 1, 2, 3].map((index) => (
          <Grid item xs={6} key={index} sx={{ height: '50%' }}>
            {covers[index] ? (
              <Box
                component="img"
                src={covers[index]}
                alt=""
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRight: index % 2 === 0 ? '1px solid white' : 'none',
                  borderBottom: index < 2 ? '1px solid white' : 'none'
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  bgcolor: 'grey.200',
                  borderRight: index % 2 === 0 ? '1px solid white' : 'none',
                  borderBottom: index < 2 ? '1px solid white' : 'none'
                }}
              />
            )}
          </Grid>
        ))}
      </Grid>
    );
  };

  // For compact grid view (same size as book cards)
  if (compact && viewMode === 'grid') {
    return (
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 6,
            transform: 'translateY(-4px)',
          }
        }}
        onClick={handleCardClick}
      >
        {/* Collection indicator badge */}
        <Chip
          icon={<CollectionsIcon />}
          label="Collection"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 2,
            bgcolor: alpha('#1976d2', 0.9),
            color: 'white',
            fontWeight: 'bold',
          }}
        />

        {/* Cover Image */}
        <Box
          sx={{
            position: 'relative',
            paddingTop: '150%', // 2:3 aspect ratio like book covers
            overflow: 'hidden',
            bgcolor: 'grey.200',
          }}
        >
          {renderCompositeCover()}
        </Box>
        
        {/* Title and Info */}
        <CardContent sx={{ flexGrow: 1, p: 1 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 'bold',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '2.5em',
              mb: 0.5
            }}
          >
            {collection.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {collection.bookCount || 0} books
            {collection.collectionType === 'series' && ' • Series'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'list') {
    return (
      <Card 
        sx={{ 
          mb: 2,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)'
          }
        }}
      >
        <CardActionArea onClick={handleCardClick}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" flex={1}>
                <CollectionsIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box flex={1}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {collection.name}
                  </Typography>
                  {collection.description && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {collection.description}
                    </Typography>
                  )}
                  <Box display="flex" gap={1} mt={1}>
                    <Chip 
                      label={`${collection.bookCount || 0} books`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    {collection.collectionType === 'series' && (
                      <Chip label="Series" size="small" color="secondary" />
                    )}
                  </Box>
                </Box>
              </Box>
              
              <Box display="flex" alignItems="center">
                <IconButton 
                  onClick={handleExpandClick}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  {localExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <IconButton onClick={handleMenuOpen} size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </Box>

            <Collapse in={localExpanded} timeout="auto" unmountOnExit>
              <Box mt={2} pl={5}>
                <Grid container spacing={1}>
                  {collection.books?.map((book, index) => (
                    <Grid item xs={12} sm={6} md={4} key={book._id || index}>
                      <Typography variant="body2" noWrap>
                        {collection.collectionType === 'series' && `${index + 1}. `}
                        {book.title}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Collapse>
          </CardContent>
        </CardActionArea>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>Edit Collection</MenuItem>
          <MenuItem onClick={handleDelete}>Delete Collection</MenuItem>
        </Menu>
      </Card>
    );
  }

  // Regular grid view (non-compact)
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
        }
      }}
    >
      {/* Collection indicator badge */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 2,
          display: 'flex',
          gap: 0.5
        }}
      >
        <Chip
          icon={<CollectionsIcon />}
          label="Collection"
          size="small"
          sx={{
            bgcolor: alpha('#1976d2', 0.9),
            color: 'white',
            fontWeight: 'bold'
          }}
        />
      </Box>

      {/* Menu button */}
      <IconButton
        onClick={handleMenuOpen}
        size="small"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 2,
          bgcolor: alpha('#fff', 0.8),
          '&:hover': {
            bgcolor: alpha('#fff', 0.95)
          }
        }}
      >
        <MoreVertIcon />
      </IconButton>

      <CardActionArea onClick={handleCardClick} sx={{ flexGrow: 1 }}>
        <Box sx={{ height: 280, position: 'relative', overflow: 'hidden' }}>
          {renderCompositeCover()}
        </Box>
        
        <CardContent sx={{ flexGrow: 0 }}>
          <Typography 
            variant="h6" 
            component="div" 
            noWrap 
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            {collection.name}
          </Typography>
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Chip 
              label={`${collection.bookCount || 0} books`} 
              size="small" 
              color="primary"
            />
            {collection.collectionType === 'series' && (
              <Chip label="Series" size="small" color="secondary" />
            )}
          </Box>

          {collection.description && (
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
              {collection.description}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>Edit Collection</MenuItem>
        <MenuItem onClick={handleDelete}>Delete Collection</MenuItem>
      </Menu>
    </Card>
  );
};

export default CollectionCard;
