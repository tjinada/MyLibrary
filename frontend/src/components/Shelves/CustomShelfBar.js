import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Add as AddIcon, 
  MoreVert as MoreIcon,
  Settings as SettingsIcon 
} from '@mui/icons-material';

const CustomShelfBar = ({ 
  shelves, 
  activeShelfId, 
  onApplyShelf, 
  onEditShelf,
  onDeleteShelf,
  onCreateShelf,
  onManageShelves
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedShelf, setSelectedShelf] = useState(null);

  const handleMenuOpen = (event, shelf) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedShelf(shelf);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedShelf(null);
  };

  const handleEdit = () => {
    if (selectedShelf) {
      onEditShelf(selectedShelf);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedShelf) {
      onDeleteShelf(selectedShelf._id);
    }
    handleMenuClose();
  };

  if (shelves.length === 0) {
    return null;
  }

  return (
    <Box sx={{ 
      mb: 2,
      pb: 1,
      borderBottom: `1px solid ${theme.palette.divider}`
    }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        alignItems: 'center',
        overflowX: 'auto',
        pb: 1,
        '&::-webkit-scrollbar': { 
          height: 6 
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 3
        }
      }}>
        <Typography 
          variant="body2" 
          sx={{ 
            mr: 1, 
            color: 'text.secondary',
            whiteSpace: 'nowrap',
            fontWeight: 500
          }}
        >
          My Shelves:
        </Typography>
        
        {shelves.map(shelf => (
          <Box key={shelf._id} sx={{ position: 'relative', display: 'flex' }}>
            <Button
              variant={activeShelfId === shelf._id ? 'contained' : 'outlined'}
              onClick={() => onApplyShelf(shelf)}
              size={isMobile ? 'small' : 'medium'}
              sx={{ 
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                textTransform: 'none',
                pr: activeShelfId === shelf._id ? 4 : 2
              }}
            >
              {shelf.name}
            </Button>
            
            {activeShelfId === shelf._id && (
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, shelf)}
                sx={{ 
                  position: 'absolute',
                  right: 2,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: 0.5
                }}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}
        
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onCreateShelf}
          size={isMobile ? 'small' : 'medium'}
          sx={{ 
            minWidth: 'auto',
            textTransform: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          New Shelf
        </Button>

        {shelves.length > 3 && (
          <IconButton
            size="small"
            onClick={onManageShelves}
            sx={{ ml: 1 }}
            title="Manage Shelves"
          >
            <SettingsIcon />
          </IconButton>
        )}
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          Edit Shelf
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          Delete Shelf
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CustomShelfBar;
