import React, { useState } from 'react';
import {
  Box,
  Button,
  Popover,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Badge,
  Chip,
  Checkbox,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  Diamond as DiamondIcon,
  AutoAwesome as SpecialIcon,
} from '@mui/icons-material';
import { statusColors } from '../../theme/theme';

const FilterPopover = ({ 
  filters, 
  onFilterChange, 
  genres, 
  bookCounts,
  activeFilterCount 
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedGenres, setSelectedGenres] = useState(
    filters.genre === 'all' ? [] : Array.isArray(filters.genre) ? filters.genre : [filters.genre]
  );

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handleFilterUpdate = (filterType, value) => {
    if (filterType === 'genre') {
      setSelectedGenres(value);
      onFilterChange({ ...filters, genre: value.length === 0 ? 'all' : value });
    } else {
      onFilterChange({ ...filters, [filterType]: value });
    }
  };

  const handleGenreChange = (event) => {
    const value = event.target.value;
    setSelectedGenres(value);
    onFilterChange({ ...filters, genre: value.length === 0 ? 'all' : value });
  };

  const clearGenres = () => {
    setSelectedGenres([]);
    onFilterChange({ ...filters, genre: 'all' });
  };

  return (
    <>
      <Badge badgeContent={activeFilterCount} color="primary">
        <Button
          variant={activeFilterCount > 0 ? 'contained' : 'outlined'}
          startIcon={<FilterIcon />}
          onClick={handleOpen}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          Filters
        </Button>
      </Badge>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 500,
            borderRadius: 2,
            mt: 1,
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filters
            </Typography>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Status Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
              Reading Status
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.status}
                onChange={(e) => handleFilterUpdate('status', e.target.value)}
                sx={{ borderRadius: 1.5 }}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ flexGrow: 1 }}>All Books</Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {bookCounts.all}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="to-read">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: statusColors['to-read'],
                        mr: 1
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>To Read</Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {bookCounts['to-read']}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="reading">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: statusColors['reading'],
                        mr: 1
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>Reading</Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {bookCounts.reading}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="read">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: statusColors['read'],
                        mr: 1
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>Read</Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {bookCounts.read}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="loaned">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: statusColors['loaned'],
                        mr: 1
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>Loaned</Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {bookCounts.loaned}
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Edition Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
              Edition Type
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.edition || 'all'}
                onChange={(e) => handleFilterUpdate('edition', e.target.value)}
                sx={{ borderRadius: 1.5 }}
              >
                <MenuItem value="all">All Editions</MenuItem>
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
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Genre Filter - Multiple Selection */}
          {genres && genres.length > 0 && (
            <>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Genres
                  </Typography>
                  {selectedGenres.length > 0 && (
                    <Button
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={clearGenres}
                      sx={{ textTransform: 'none' }}
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
                          selected.map((value) => (
                            <Chip 
                              key={value} 
                              label={value} 
                              size="small"
                              sx={{ 
                                height: 20,
                                fontSize: '0.75rem',
                                bgcolor: theme.palette.primary.main,
                                color: 'white',
                              }}
                            />
                          ))
                        )}
                      </Box>
                    )}
                    sx={{ borderRadius: 1.5 }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 250,
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
                          primary={genre.name}
                          secondary={`${genre.count} books`}
                          primaryTypographyProps={{ fontSize: '0.9rem' }}
                          secondaryTypographyProps={{ fontSize: '0.75rem' }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {selectedGenres.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {selectedGenres.length} genre{selectedGenres.length > 1 ? 's' : ''} selected
                  </Typography>
                )}
              </Box>
            </>
          )}

          {/* Clear Filters Button */}
          {(activeFilterCount > 0 || selectedGenres.length > 0) && (
            <>
              <Divider sx={{ mt: 2, mb: 2 }} />
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={() => {
                  setSelectedGenres([]);
                  onFilterChange({
                    search: '',
                    status: 'all',
                    genre: 'all',
                    edition: 'all',
                    sort: 'title',
                  });
                  handleClose();
                }}
                sx={{ textTransform: 'none' }}
              >
                Clear All Filters
              </Button>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default FilterPopover;
