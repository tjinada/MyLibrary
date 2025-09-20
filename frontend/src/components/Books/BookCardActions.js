import React from 'react';
import { Box, IconButton, Tooltip, Fade } from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  CollectionsBookmark as CollectionIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const BookCardActions = ({ 
  visible, 
  onView, 
  onEdit, 
  onAddToCollection, 
  onRemove,
  showRemove = false 
}) => {
  const handleClick = (event, callback) => {
    event.stopPropagation();
    if (callback) callback();
  };

  return (
    <Fade in={visible} timeout={200}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          zIndex: 2,
          borderRadius: 'inherit',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details" placement="top">
            <IconButton
              size="small"
              onClick={(e) => handleClick(e, onView)}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'white',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s',
              }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Quick Edit" placement="top">
            <IconButton
              size="small"
              onClick={(e) => handleClick(e, onEdit)}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                color: 'secondary.main',
                '&:hover': {
                  bgcolor: 'white',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s',
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Add to Collection" placement="top">
            <IconButton
              size="small"
              onClick={(e) => handleClick(e, onAddToCollection)}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                color: 'success.main',
                '&:hover': {
                  bgcolor: 'white',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s',
              }}
            >
              <CollectionIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {showRemove && onRemove && (
            <Tooltip title="Remove from Collection" placement="top">
              <IconButton
                size="small"
                onClick={(e) => handleClick(e, onRemove)}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: 'white',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Fade>
  );
};

export default BookCardActions;
