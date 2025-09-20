import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  GridView as GridIcon,
  ViewList as ListIcon,
  Speed as QuickAddIcon,
  CollectionsBookmark as CollectionsIcon,
} from '@mui/icons-material';
import FilterPopover from '../Filters/FilterPopover';
import { spacing } from '../../theme/theme';

const StickyToolbar = ({
  onAddBook,
  onQuickAdd,
  onCreateCollection,
  viewMode,
  onViewModeChange,
  filters,
  onFilterChange,
  genres,
  bookCounts,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const activeFilterCount = [
    filters.status !== 'all',
    filters.genre !== 'all',
  ].filter(Boolean).length;

  const handleQuickAdd = () => {
    if (onQuickAdd) {
      onQuickAdd();
    } else {
      onAddBook();
    }
  };

  return (
    <Paper 
      elevation={2}
      sx={{ 
        position: 'sticky',
        top: 64, // Below the main header
        zIndex: 100,
        mb: 3, 
        bgcolor: 'background.paper',
        borderRadius: 0,
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ 
        p: 2,
        display: 'flex', 
        gap: 2, 
        alignItems: 'center',
        flexWrap: isTablet ? 'wrap' : 'nowrap',
        minHeight: isMobile ? spacing.mobileFilterBarHeight : spacing.filterBarHeight,
      }}>
        {/* Primary Actions */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<QuickAddIcon />}
            onClick={handleQuickAdd}
            size={isMobile ? 'medium' : 'large'}
            sx={{ 
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              boxShadow: theme.shadows[3],
              '&:hover': {
                boxShadow: theme.shadows[6],
                background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
              }
            }}
          >
            {isMobile ? 'Add' : 'Quick Add'}
          </Button>
          
          {!isMobile && (
            <Button
              variant="outlined"
              startIcon={<CollectionsIcon />}
              onClick={onCreateCollection}
              size="large"
              sx={{ 
                fontWeight: 600,
                borderWidth: 1.5,
              }}
            >
              Create Collection
            </Button>
          )}
        </Box>

        {!isMobile && <Divider orientation="vertical" flexItem />}

        {/* View Mode Toggle */}
        <Box sx={{ 
          display: 'flex', 
          bgcolor: theme.palette.action.hover,
          borderRadius: 1.5,
          p: 0.5,
        }}>
          <Tooltip title="Grid View">
            <IconButton 
              size="small"
              onClick={() => onViewModeChange('grid')}
              sx={{
                color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
                bgcolor: viewMode === 'grid' ? 'background.paper' : 'transparent',
                borderRadius: 1,
                '&:hover': {
                  bgcolor: viewMode === 'grid' ? 'background.paper' : theme.palette.action.hover,
                }
              }}
            >
              <GridIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="List View">
            <IconButton 
              size="small"
              onClick={() => onViewModeChange('list')}
              sx={{
                color: viewMode === 'list' ? 'primary.main' : 'text.secondary',
                bgcolor: viewMode === 'list' ? 'background.paper' : 'transparent',
                borderRadius: 1,
                '&:hover': {
                  bgcolor: viewMode === 'list' ? 'background.paper' : theme.palette.action.hover,
                }
              }}
            >
              <ListIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Filters */}
        <FilterPopover
          filters={filters}
          onFilterChange={onFilterChange}
          genres={genres}
          bookCounts={bookCounts}
          activeFilterCount={activeFilterCount}
        />
      </Box>
    </Paper>
  );
};

export default StickyToolbar;
