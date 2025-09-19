import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  CollectionsBookmark as CollectionIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const CollectionList = ({ collections, onCollectionClick, onEditCollection, onDeleteCollection }) => {
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

  return (
    <>
      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        <List>
          {collections.map((collection, index) => (
            <ListItem
              key={collection._id}
              divider={index < collections.length - 1}
              secondaryAction={
                isAuthenticated && (
                  <IconButton 
                    edge="end" 
                    onClick={(e) => handleMenuOpen(e, collection)}
                  >
                    <MoreIcon />
                  </IconButton>
                )
              }
              disablePadding
            >
              <ListItemButton onClick={() => onCollectionClick(collection)}>
                <ListItemAvatar>
                  <Avatar
                    variant="rounded"
                    sx={{ 
                      bgcolor: 'primary.main',
                      width: 56,
                      height: 56
                    }}
                  >
                    {collection.coverImage ? (
                      <img 
                        src={collection.coverImage} 
                        alt={collection.name}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                      />
                    ) : (
                      <CollectionIcon />
                    )}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" component="span" sx={{ fontWeight: 500 }}>
                        {collection.name}
                      </Typography>
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
                  }
                  secondary={
                    collection.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {collection.description}
                      </Typography>
                    )
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>

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

export default CollectionList;
