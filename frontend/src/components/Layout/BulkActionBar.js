import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  IconButton,
  Checkbox,
  Menu,
  MenuItem,
  Divider,
  Slide,
  Chip,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckBox as SelectAllIcon,
  IndeterminateCheckBox as DeselectIcon,
  Edit as EditIcon,
  CollectionsBookmark as CollectionIcon,
  Delete as DeleteIcon,
  AutoStories as StatusIcon,
} from '@mui/icons-material';
import { statusColors } from '../../theme/theme';

const BulkActionBar = ({
  visible,
  selectedCount,
  totalCount,
  onClose,
  onSelectAll,
  onClearSelection,
  onBulkStatusChange,
  onBulkAddToCollection,
  onBulkDelete,
  isProcessing = false,
}) => {
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);

  const handleStatusMenuOpen = (event) => {
    setStatusMenuAnchor(event.currentTarget);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };

  const handleStatusChange = (newStatus) => {
    onBulkStatusChange(newStatus);
    handleStatusMenuClose();
  };

  const allSelected = selectedCount === totalCount;

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          background: 'linear-gradient(to right, #1e293b 0%, #334155 100%)',
          color: 'white',
          borderRadius: '16px 16px 0 0',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}>
            {/* Left side - Selection info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={onClose}
                size="small"
                sx={{ 
                  color: 'white',
                  bgcolor: alpha('#fff', 0.1),
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.2),
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
              
              <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
              
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
              </Typography>
              
              {!allSelected ? (
                <Button
                  size="small"
                  startIcon={<SelectAllIcon />}
                  onClick={onSelectAll}
                  sx={{ 
                    color: 'white',
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.1),
                    }
                  }}
                >
                  Select All ({totalCount})
                </Button>
              ) : (
                <Chip
                  label="All selected"
                  size="small"
                  sx={{ 
                    bgcolor: alpha('#10b981', 0.2),
                    color: '#10b981',
                    fontWeight: 600,
                  }}
                />
              )}
              
              {selectedCount > 0 && (
                <Button
                  size="small"
                  startIcon={<DeselectIcon />}
                  onClick={onClearSelection}
                  sx={{ 
                    color: 'white',
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.1),
                    }
                  }}
                >
                  Clear
                </Button>
              )}
            </Box>

            {/* Right side - Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isProcessing && (
                <CircularProgress size={24} sx={{ color: 'white', mr: 2 }} />
              )}
              
              {/* Change Status */}
              <Button
                variant="contained"
                size="medium"
                startIcon={<StatusIcon />}
                onClick={handleStatusMenuOpen}
                disabled={selectedCount === 0 || isProcessing}
                sx={{
                  bgcolor: alpha('#fff', 0.15),
                  color: 'white',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.25),
                  },
                  '&:disabled': {
                    bgcolor: alpha('#fff', 0.05),
                    color: alpha('#fff', 0.3),
                  }
                }}
              >
                Status
              </Button>
              
              {/* Add to Collection */}
              <Button
                variant="contained"
                size="medium"
                startIcon={<CollectionIcon />}
                onClick={onBulkAddToCollection}
                disabled={selectedCount === 0 || isProcessing}
                sx={{
                  bgcolor: alpha('#fff', 0.15),
                  color: 'white',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.25),
                  },
                  '&:disabled': {
                    bgcolor: alpha('#fff', 0.05),
                    color: alpha('#fff', 0.3),
                  }
                }}
              >
                Collection
              </Button>
              
              {/* Delete */}
              <Button
                variant="contained"
                size="medium"
                startIcon={<DeleteIcon />}
                onClick={onBulkDelete}
                disabled={selectedCount === 0 || isProcessing}
                sx={{
                  bgcolor: alpha('#ef4444', 0.8),
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#ef4444',
                  },
                  '&:disabled': {
                    bgcolor: alpha('#fff', 0.05),
                    color: alpha('#fff', 0.3),
                  }
                }}
              >
                Delete
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Status Change Menu */}
        <Menu
          anchorEl={statusMenuAnchor}
          open={Boolean(statusMenuAnchor)}
          onClose={handleStatusMenuClose}
          PaperProps={{
            sx: {
              minWidth: 200,
              borderRadius: 2,
            }
          }}
        >
          <MenuItem onClick={() => handleStatusChange('to-read')}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: statusColors['to-read'],
                }} 
              />
              <Typography>To Read</Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange('reading')}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: statusColors['reading'],
                }} 
              />
              <Typography>Reading</Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange('read')}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: statusColors['read'],
                }} 
              />
              <Typography>Read</Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={() => handleStatusChange('loaned')}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: statusColors['loaned'],
                }} 
              />
              <Typography>Loaned</Typography>
            </Box>
          </MenuItem>
        </Menu>
      </Paper>
    </Slide>
  );
};

export default BulkActionBar;
