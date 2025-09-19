import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  Collapse,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  GridView as GridIcon,
  ViewList as ListIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  FilterAlt as ActiveFilterIcon,
  Speed as QuickAddIcon,
  QrCodeScanner as ScanIcon,
  Keyboard as ManualIcon,
  ArrowDropDown as ArrowDownIcon,
  CollectionsBookmark as CollectionsIcon,
} from '@mui/icons-material';
import StatusFilter from '../Filters/StatusFilter';
import GenreFilter from '../Filters/GenreFilter';
import SortControl from '../Filters/SortControl';

const ImprovedToolbar = ({
  onAddBook,
  onQuickAdd,
  onCreateCollection,
  viewMode,
  onViewModeChange,
  filters,
  onFilterChange,
  genres,
  bookCounts,
  hasActiveFilters,
  onClearFilters,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);

  const handleFilterChange = (filterType, value) => {
    onFilterChange({ ...filters, [filterType]: value });
  };

  const activeFilterCount = [
    filters.status !== 'all',
    filters.genre !== 'all',
    filters.search !== '',
  ].filter(Boolean).length;

  const handleAddMenuOpen = (event) => {
    setAddMenuAnchor(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchor(null);
  };

  const handleQuickAdd = () => {
    handleAddMenuClose();
    if (onQuickAdd) {
      onQuickAdd();
    } else {
      onAddBook();
    }
  };

  const handleManualAdd = () => {
    handleAddMenuClose();
    onAddBook('manual');
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        mb: 3, 
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Main toolbar */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        alignItems: 'center',
        flexWrap: isTablet ? 'wrap' : 'nowrap',
      }}>
        {/* Add Book and Collection Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isMobile ? (
            // Mobile: Single button that opens quick add
            <Button
              variant="contained"
              startIcon={<QuickAddIcon />}
              onClick={handleQuickAdd}
              size="large"
              sx={{ 
                minWidth: 140,
                fontWeight: 600,
                boxShadow: 2,
                bgcolor: 'success.main',
                '&:hover': {
                  boxShadow: 4,
                  bgcolor: 'success.dark',
                }
              }}
            >
              Quick Add
            </Button>
          ) : (
            // Desktop: Split button with options
            <Box sx={{ display: 'flex' }}>
              <Button
                variant="contained"
                startIcon={<QuickAddIcon />}
                onClick={handleQuickAdd}
                size="large"
                sx={{ 
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  fontWeight: 600,
                  boxShadow: 2,
                  bgcolor: 'success.main',
                  '&:hover': {
                    boxShadow: 4,
                    bgcolor: 'success.dark',
                  }
                }}
              >
                Quick Add
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleAddMenuOpen}
                sx={{ 
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  borderLeft: '1px solid rgba(255,255,255,0.3)',
                  minWidth: 'auto',
                  px: 1,
                  boxShadow: 2,
                  bgcolor: 'success.main',
                  '&:hover': {
                    boxShadow: 4,
                    bgcolor: 'success.dark',
                  }
                }}
              >
                <ArrowDownIcon />
              </Button>
              <Menu
                anchorEl={addMenuAnchor}
                open={Boolean(addMenuAnchor)}
                onClose={handleAddMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={handleQuickAdd}>
                  <ListItemIcon>
                    <QuickAddIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Quick Add" 
                    secondary="Fast continuous scanning"
                  />
                </MenuItem>
                <MenuItem onClick={handleManualAdd}>
                  <ListItemIcon>
                    <ManualIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Manual Add" 
                    secondary="Add with full details"
                  />
                </MenuItem>
              </Menu>
            </Box>
          )}
          
          {/* Create Collection Button */}
          <Button
            variant="outlined"
            startIcon={<CollectionsIcon />}
            onClick={onCreateCollection}
            size="large"
            sx={{ 
              fontWeight: 600,
              display: { xs: 'none', sm: 'flex' },
            }}
          >
            Create Collection
          </Button>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

        {/* View Mode Toggle */}
        <Box sx={{ 
          display: 'flex', 
          bgcolor: 'action.hover',
          borderRadius: 1,
          p: 0.5,
        }}>
          <Tooltip title="Grid View">
            <IconButton 
              size="small"
              onClick={() => onViewModeChange('grid')}
              sx={{
                color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
                bgcolor: viewMode === 'grid' ? 'background.paper' : 'transparent',
                '&:hover': {
                  bgcolor: viewMode === 'grid' ? 'background.paper' : 'action.hover',
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
                '&:hover': {
                  bgcolor: viewMode === 'list' ? 'background.paper' : 'action.hover',
                }
              }}
            >
              <ListIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Filter Controls - Desktop */}
        {!isTablet && (
          <>
            <StatusFilter
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              bookCounts={bookCounts}
            />
            
            {genres.length > 0 && (
              <GenreFilter
                value={filters.genre}
                onChange={(value) => handleFilterChange('genre', value)}
                genres={genres}
              />
            )}
            
            <SortControl
              value={filters.sort}
              onChange={(value) => handleFilterChange('sort', value)}
            />
          </>
        )}

        {/* Filter Toggle (Mobile/Tablet) */}
        {isTablet && (
          <Button
            variant={showFilters ? 'contained' : 'outlined'}
            size="medium"
            startIcon={activeFilterCount > 0 ? <ActiveFilterIcon /> : <FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            endIcon={activeFilterCount > 0 && (
              <Chip 
                label={activeFilterCount} 
                size="small" 
                color={showFilters ? 'primary' : 'default'}
                sx={{ 
                  height: 20,
                  bgcolor: showFilters ? 'primary.dark' : 'primary.main',
                  color: 'primary.contrastText',
                }}
              />
            )}
          >
            Filters
          </Button>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && !isTablet && (
          <Tooltip title="Clear all filters">
            <IconButton
              onClick={onClearFilters}
              size="small"
              sx={{ 
                color: 'error.main',
                bgcolor: 'error.lighter',
                '&:hover': {
                  bgcolor: 'error.light',
                }
              }}
            >
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Filter Controls - Mobile/Tablet */}
      {isTablet && (
        <Collapse in={showFilters}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <StatusFilter
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              bookCounts={bookCounts}
            />
            
            {genres.length > 0 && (
              <GenreFilter
                value={filters.genre}
                onChange={(value) => handleFilterChange('genre', value)}
                genres={genres}
              />
            )}
            
            <SortControl
              value={filters.sort}
              onChange={(value) => handleFilterChange('sort', value)}
            />

            {hasActiveFilters && (
              <Button
                variant="text"
                startIcon={<ClearIcon />}
                onClick={onClearFilters}
                size="small"
                color="error"
              >
                Clear All
              </Button>
            )}
          </Box>
        </Collapse>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && !isTablet && (
        <>
          <Divider sx={{ mt: 2, mb: 1 }} />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              Active filters:
            </Typography>
            {filters.search && (
              <Chip 
                label={`Search: "${filters.search}"`} 
                size="small" 
                onDelete={() => handleFilterChange('search', '')}
              />
            )}
            {filters.status !== 'all' && (
              <Chip 
                label={`Status: ${filters.status}`} 
                size="small" 
                onDelete={() => handleFilterChange('status', 'all')}
              />
            )}
            {filters.genre !== 'all' && (
              <Chip 
                label={`Genre: ${filters.genre}`} 
                size="small" 
                onDelete={() => handleFilterChange('genre', 'all')}
              />
            )}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ImprovedToolbar;
