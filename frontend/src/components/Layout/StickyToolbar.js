import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  useTheme,
  useMediaQuery,
  alpha,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  GridView as GridIcon,
  ViewList as ListIcon,
  Speed as QuickAddIcon,
  CollectionsBookmark as CollectionsIcon,
  CheckBox as SelectIcon,
  Sort as SortIcon,
  ArrowUpward,
  ArrowDownward,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import FilterDrawer from '../Filters/FilterDrawer';
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
  selectionMode,
  onToggleSelectionMode,
  showCollectionsOnly,
  onToggleCollectionsOnly,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const activeFilterCount = [
    filters.status !== 'all',
    filters.genre !== 'all' && (Array.isArray(filters.genre) ? filters.genre.length > 0 : true),
    filters.edition !== 'all',
  ].filter(Boolean).length;

  const handleQuickAdd = () => {
    if (onQuickAdd) {
      onQuickAdd();
    } else {
      onAddBook();
    }
  };

  return (
    <>
      <Paper 
      elevation={2}
      sx={{ 
        position: 'sticky',
        top: 64, // Below the main header
        zIndex: 100,
        mb: 2, 
        bgcolor: 'background.paper',
        borderRadius: 0,
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ 
        p: 1.5,
        display: 'flex', 
        gap: 1.5, 
        alignItems: 'center',
        flexWrap: isTablet ? 'wrap' : 'nowrap',
        minHeight: 48,
      }}>
        {/* Primary Actions */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<QuickAddIcon />}
            onClick={handleQuickAdd}
            size="small"
            sx={{ 
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              boxShadow: theme.shadows[2],
              '&:hover': {
                boxShadow: theme.shadows[4],
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
              size="small"
              sx={{ 
                fontWeight: 600,
                borderWidth: 1,
              }}
            >
              Create Collection
            </Button>
          )}
        </Box>

        {!isMobile && <Divider orientation="vertical" flexItem />}

        {/* View Mode, Collections Toggle, and Selection Toggle */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
          
          {/* Selection Mode Toggle */}
          <Tooltip title={selectionMode ? 'Exit selection mode' : 'Select multiple books'}>
            <IconButton
              size="small"
              onClick={onToggleSelectionMode}
              sx={{
                bgcolor: selectionMode ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: selectionMode ? 'primary.main' : 'text.secondary',
                border: '1px solid',
                borderColor: selectionMode ? 'primary.main' : 'divider',
                borderRadius: 1,
                '&:hover': {
                  bgcolor: selectionMode 
                    ? alpha(theme.palette.primary.main, 0.2)
                    : alpha(theme.palette.action.hover, 0.5),
                  borderColor: 'primary.main',
                },
              }}
            >
              <SelectIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Collections Toggle Button */}
        <Tooltip title={showCollectionsOnly ? 'Show all items' : 'Show collections only'}>
          <Button
            size="small"
            onClick={onToggleCollectionsOnly}
            variant={showCollectionsOnly ? 'contained' : 'outlined'}
            startIcon={<CollectionsIcon />}
            sx={{
              minWidth: 'auto',
              px: 2,
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: showCollectionsOnly ? 600 : 400,
              bgcolor: showCollectionsOnly ? 'secondary.main' : 'transparent',
              color: showCollectionsOnly ? 'white' : 'text.primary',
              borderColor: showCollectionsOnly ? 'secondary.main' : 'divider',
              '&:hover': {
                bgcolor: showCollectionsOnly 
                  ? 'secondary.dark'
                  : alpha(theme.palette.secondary.main, 0.1),
                borderColor: 'secondary.main',
              },
            }}
          >
            {!isMobile && (showCollectionsOnly ? 'Collections' : 'Collections')}
          </Button>
        </Tooltip>

        {/* Sort Dropdown */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SortIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <FormControl size="small" sx={{ minWidth: isMobile ? 120 : 150 }}>
            <Select
              value={filters.sort}
              onChange={(e) => onFilterChange({ ...filters, sort: e.target.value })}
              displayEmpty
              sx={{ 
                borderRadius: 2,
                bgcolor: 'background.paper',
                '& .MuiSelect-select': {
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                },
              }}
              renderValue={(value) => {
                const sortOptions = {
                  'title': { label: 'Title (A-Z)', icon: <ArrowUpward sx={{ fontSize: 16 }} /> },
                  '-title': { label: 'Title (Z-A)', icon: <ArrowDownward sx={{ fontSize: 16 }} /> },
                  '-addedDate': { label: 'Recently Added', icon: <ArrowDownward sx={{ fontSize: 16 }} /> },
                  'addedDate': { label: 'Oldest First', icon: <ArrowUpward sx={{ fontSize: 16 }} /> },
                };
                const option = sortOptions[value] || sortOptions['title'];
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {!isMobile && option.icon}
                    <Typography variant="body2">
                      {isMobile ? option.label.split(' ')[0] : option.label}
                    </Typography>
                  </Box>
                );
              }}
            >
              <MenuItem value="title">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowUpward sx={{ fontSize: 16 }} />
                  Title (A-Z)
                </Box>
              </MenuItem>
              <MenuItem value="-title">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowDownward sx={{ fontSize: 16 }} />
                  Title (Z-A)
                </Box>
              </MenuItem>
              <MenuItem value="-addedDate">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowDownward sx={{ fontSize: 16 }} />
                  Recently Added
                </Box>
              </MenuItem>
              <MenuItem value="addedDate">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowUpward sx={{ fontSize: 16 }} />
                  Oldest First
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>



        {/* Filters */}
        <Badge badgeContent={activeFilterCount} color="primary">
          <Button
            variant={activeFilterCount > 0 ? 'contained' : 'outlined'}
            startIcon={<FilterIcon />}
            onClick={() => setFilterDrawerOpen(true)}
            size="small"
            sx={{
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Filters
          </Button>
        </Badge>
      </Box>
    </Paper>

    {/* Filter Drawer */}
    <FilterDrawer
      open={filterDrawerOpen}
      onClose={() => setFilterDrawerOpen(false)}
      filters={filters}
      onFilterChange={onFilterChange}
      genres={genres}
      bookCounts={bookCounts}
      activeFilterCount={activeFilterCount}
    />
  </>
  );
};

export default StickyToolbar;
