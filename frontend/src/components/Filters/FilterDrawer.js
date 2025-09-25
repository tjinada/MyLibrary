import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Button,
  Chip,
  Checkbox,
  ListItemText,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Clear as ClearIcon,
  Diamond as DiamondIcon,
  AutoAwesome as SpecialIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { statusColors } from '../../theme/theme';

const FilterDrawer = ({ 
  open,
  onClose,
  filters, 
  onFilterChange, 
  genres, 
  bookCounts,
  activeFilterCount 
}) => {
  const theme = useTheme();
  
  // Derive selectedGenres from filters prop
  const selectedGenres = filters.genre === 'all' 
    ? [] 
    : Array.isArray(filters.genre) 
      ? filters.genre 
      : [filters.genre];

  const handleFilterUpdate = (filterType, value) => {
    if (filterType === 'genre') {
      onFilterChange({ ...filters, genre: value.length === 0 ? 'all' : value });
    } else {
      onFilterChange({ ...filters, [filterType]: value });
    }
  };

  const handleGenreChange = (event) => {
    const value = event.target.value;
    onFilterChange({ ...filters, genre: value.length === 0 ? 'all' : value });
  };

  const clearGenres = () => {
    onFilterChange({ ...filters, genre: 'all' });
  };

  const clearAllFilters = () => {
    onFilterChange({
      search: filters.search || '',  // Keep search if it exists
      status: 'all',
      genre: 'all',
      edition: 'all',
      sort: filters.sort || 'title',  // Keep sort preference
    });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '85%', sm: 320 },
          maxWidth: 320,
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box 
          sx={{ 
            p: 2, 
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterIcon sx={{ color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Filters
              </Typography>
              {activeFilterCount > 0 && (
                <Chip 
                  label={activeFilterCount}
                  size="small"
                  color="primary"
                  sx={{ height: 20, minWidth: 20 }}
                />
              )}
            </Box>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {/* Status Filter */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Reading Status
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.status}
                onChange={(e) => handleFilterUpdate('status', e.target.value)}
                sx={{ 
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  '& .MuiSelect-select': {
                    py: 1.5,
                  }
                }}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ flexGrow: 1 }}>All Books</Box>
                    <Chip 
                      label={bookCounts.all}
                      size="small"
                      sx={{ height: 18, fontSize: '0.7rem' }}
                    />
                  </Box>
                </MenuItem>
                <MenuItem value="to-read">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box 
                      sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: statusColors['to-read'],
                        mr: 1
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>To Read</Box>
                    <Chip 
                      label={bookCounts['to-read']}
                      size="small"
                      sx={{ height: 18, fontSize: '0.7rem' }}
                    />
                  </Box>
                </MenuItem>
                <MenuItem value="reading">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box 
                      sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: statusColors['reading'],
                        mr: 1
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>Reading</Box>
                    <Chip 
                      label={bookCounts.reading}
                      size="small"
                      sx={{ height: 18, fontSize: '0.7rem' }}
                    />
                  </Box>
                </MenuItem>
                <MenuItem value="read">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box 
                      sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: statusColors['read'],
                        mr: 1
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>Read</Box>
                    <Chip 
                      label={bookCounts.read}
                      size="small"
                      sx={{ height: 18, fontSize: '0.7rem' }}
                    />
                  </Box>
                </MenuItem>
                <MenuItem value="loaned">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box 
                      sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: statusColors['loaned'],
                        mr: 1
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>Loaned</Box>
                    <Chip 
                      label={bookCounts.loaned}
                      size="small"
                      sx={{ height: 18, fontSize: '0.7rem' }}
                    />
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Paper>

          {/* Edition Filter */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              mb: 2, 
              bgcolor: alpha(theme.palette.secondary.main, 0.02),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Edition Type
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.edition || 'all'}
                onChange={(e) => handleFilterUpdate('edition', e.target.value)}
                sx={{ 
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  '& .MuiSelect-select': {
                    py: 1.5,
                  }
                }}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    All Editions
                  </Box>
                </MenuItem>
                <MenuItem value="signed">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <SpecialIcon fontSize="small" sx={{ color: theme.palette.warning.main, mr: 1 }} />
                    <Box sx={{ flexGrow: 1 }}>Signed Edition</Box>
                  </Box>
                </MenuItem>
                <MenuItem value="deluxe">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <DiamondIcon fontSize="small" sx={{ color: theme.palette.secondary.main, mr: 1 }} />
                    <Box sx={{ flexGrow: 1 }}>Deluxe Edition</Box>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Paper>

          {/* Genre Filter - Multiple Selection */}
          {genres && genres.length > 0 && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                mb: 2, 
                bgcolor: alpha(theme.palette.success.main, 0.02),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Genres
                </Typography>
                {selectedGenres.length > 0 && (
                  <Button
                    size="small"
                    startIcon={<ClearIcon sx={{ fontSize: 16 }} />}
                    onClick={clearGenres}
                    sx={{ 
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      py: 0.25,
                    }}
                  >
                    Clear
                  </Button>
                )}
              </Box>
              
              <FormControl fullWidth size="small">
                <Select
                  multiple
                  value={selectedGenres}
                  onChange={handleGenreChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          All Genres
                        </Typography>
                      ) : (
                        selected.slice(0, 3).map((value) => (
                          <Chip 
                            key={value} 
                            label={value} 
                            size="small"
                            sx={{ 
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: theme.palette.success.main,
                              color: 'white',
                            }}
                          />
                        ))
                      )}
                      {selected.length > 3 && (
                        <Chip 
                          label={`+${selected.length - 3}`}
                          size="small"
                          sx={{ 
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: theme.palette.grey[500],
                            color: 'white',
                          }}
                        />
                      )}
                    </Box>
                  )}
                  sx={{ 
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    '& .MuiSelect-select': {
                      py: 1.5,
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {genres.map((genre) => (
                    <MenuItem key={genre.name} value={genre.name}>
                      <Checkbox 
                        checked={selectedGenres.indexOf(genre.name) > -1}
                        size="small"
                        sx={{ p: 0.5, mr: 1 }}
                      />
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{genre.name}</Typography>
                            <Chip 
                              label={genre.count}
                              size="small"
                              sx={{ 
                                height: 16,
                                fontSize: '0.65rem',
                                ml: 1,
                              }}
                            />
                          </Box>
                        }
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {selectedGenres.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {selectedGenres.length} genre{selectedGenres.length > 1 ? 's' : ''} selected
                </Typography>
              )}
            </Paper>
          )}
        </Box>

        {/* Footer with Clear Button */}
        {(activeFilterCount > 0 || selectedGenres.length > 0) && (
          <Box 
            sx={{ 
              p: 2, 
              borderTop: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
            }}
          >
            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={() => {
                clearAllFilters();
                onClose();
              }}
              startIcon={<ClearIcon />}
              sx={{ 
                textTransform: 'none',
                py: 1,
                borderRadius: 1,
              }}
            >
              Clear All Filters
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default FilterDrawer;
