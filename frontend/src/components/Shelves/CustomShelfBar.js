import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import { 
  MoreVert as MoreIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon 
} from '@mui/icons-material';

const CustomShelfBar = ({ 
  shelves, 
  activeShelfId, 
  onApplyShelf, 
  onEditShelf,
  onDeleteShelf,
  onManageShelves
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [hoveredShelfId, setHoveredShelfId] = useState(null);

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
          <Box 
            key={shelf._id} 
            sx={{ 
              position: 'relative', 
              display: 'flex',
              '&:hover .shelf-menu-btn': {
                opacity: 1
              }
            }}
            onMouseEnter={() => setHoveredShelfId(shelf._id)}
            onMouseLeave={() => setHoveredShelfId(null)}
          >
            <Button
              variant={activeShelfId === shelf._id ? 'contained' : 'outlined'}
              onClick={() => onApplyShelf(shelf)}
              size={isMobile ? 'small' : 'medium'}
              sx={{ 
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                textTransform: 'none',
                pr: hoveredShelfId === shelf._id || activeShelfId === shelf._id ? 5 : 2,
                transition: 'padding-right 0.2s'
              }}
            >
              {shelf.name}
            </Button>
            
            {/* Menu button - shows on hover or when shelf is active */}
            {(hoveredShelfId === shelf._id || activeShelfId === shelf._id) && (
              <IconButton
                className="shelf-menu-btn"
                size="small"
                onClick={(e) => handleMenuOpen(e, shelf)}
                sx={{ 
                  position: 'absolute',
                  right: 2,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: 0.5,
                  opacity: activeShelfId === shelf._id ? 1 : 0.7,
                  transition: 'opacity 0.2s',
                  bgcolor: activeShelfId === shelf._id ? 'rgba(255,255,255,0.2)' : 'transparent',
                  '&:hover': {
                    bgcolor: activeShelfId === shelf._id ? 'rgba(255,255,255,0.3)' : 'action.hover'
                  }
                }}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}

        {shelves.length > 3 && (
          <Tooltip title="Manage Shelves">
            <IconButton
              size="small"
              onClick={onManageShelves}
              sx={{ ml: 1 }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Shelf
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Shelf
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CustomShelfBar;
