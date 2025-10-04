import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  Divider,
  IconButton,
  Button,
  Chip,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  useTheme,
  alpha,
  Paper,
  Grid,
} from '@mui/material';
import {
  Close as CloseIcon,
  Clear as ClearIcon,
  Diamond as DiamondIcon,
  AutoAwesome as SpecialIcon,
  FilterList as FilterIcon,
  MenuBook as BookIcon,
  AutoStories as ReadingIcon,
  CheckCircle as ReadIcon,
  Schedule as LoanedIcon,
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
  
  // Derive excludedGenres from filters prop
  const excludedGenres = filters.excludeGenres || [];

  const handleStatusChange = (event) => {
    onFilterChange({ ...filters, status: event.target.value });
  };

  const handleEditionChange = (event) => {
    onFilterChange({ ...filters, edition: event.target.value });
  };

  const handleGenreToggle = (genreName) => {
    const currentGenres = [...selectedGenres];
    const index = currentGenres.indexOf(genreName);
    
    if (index > -1) {
      currentGenres.splice(index, 1);
    } else {
      currentGenres.push(genreName);
    }
    
    onFilterChange({ ...filters, genre: currentGenres.length === 0 ? 'all' : currentGenres });
  };
  
  const handleExcludeGenreToggle = (genreName) => {
    const currentExcluded = [...excludedGenres];
    const index = currentExcluded.indexOf(genreName);
    
    if (index > -1) {
      currentExcluded.splice(index, 1);
    } else {
      currentExcluded.push(genreName);
    }
    
    onFilterChange({ ...filters, excludeGenres: currentExcluded });
  };

  const clearGenres = () => {
    onFilterChange({ ...filters, genre: 'all' });
  };
  
  const clearExcludedGenres = () => {
    onFilterChange({ ...filters, excludeGenres: [] });
  };

  const clearAllFilters = () => {
    onFilterChange({
      search: filters.search || '',  // Keep search if it exists
      status: 'all',
      genre: 'all',
      excludeGenres: [],
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
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BookIcon sx={{ fontSize: 18 }} />
              Reading Status
            </Typography>
            <RadioGroup
              value={filters.status}
              onChange={handleStatusChange}
              sx={{ pl: 1 }}
            >
              <FormControlLabel 
                value="all" 
                control={<Radio size="small" />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">All Books</Typography>
                    <Chip label={bookCounts.all} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
                  </Box>
                }
              />
              <FormControlLabel 
                value="to-read" 
                control={<Radio size="small" sx={{ color: statusColors['to-read'] }} />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColors['to-read'] }} />
                    <Typography variant="body2">To Read</Typography>
                    <Chip label={bookCounts['to-read']} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
                  </Box>
                }
              />
              <FormControlLabel 
                value="reading" 
                control={<Radio size="small" sx={{ color: statusColors['reading'] }} />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColors['reading'] }} />
                    <Typography variant="body2">Reading</Typography>
                    <Chip label={bookCounts.reading} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
                  </Box>
                }
              />
              <FormControlLabel 
                value="read" 
                control={<Radio size="small" sx={{ color: statusColors['read'] }} />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColors['read'] }} />
                    <Typography variant="body2">Read</Typography>
                    <Chip label={bookCounts.read} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
                  </Box>
                }
              />
              <FormControlLabel 
                value="loaned" 
                control={<Radio size="small" sx={{ color: statusColors['loaned'] }} />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColors['loaned'] }} />
                    <Typography variant="body2">Loaned</Typography>
                    <Chip label={bookCounts.loaned} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
                  </Box>
                }
              />
            </RadioGroup>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Edition Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <SpecialIcon sx={{ fontSize: 18 }} />
              Edition Type
            </Typography>
            <RadioGroup
              value={filters.edition || 'all'}
              onChange={handleEditionChange}
              sx={{ pl: 1 }}
            >
              <FormControlLabel 
                value="all" 
                control={<Radio size="small" />} 
                label={<Typography variant="body2">All Editions</Typography>}
              />
              <FormControlLabel 
                value="signed" 
                control={<Radio size="small" sx={{ color: theme.palette.warning.main }} />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SpecialIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                    <Typography variant="body2">Signed Edition</Typography>
                  </Box>
                }
              />
              <FormControlLabel 
                value="deluxe" 
                control={<Radio size="small" sx={{ color: theme.palette.secondary.main }} />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DiamondIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
                    <Typography variant="body2">Deluxe Edition</Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Genre Filter - Two Column Checkboxes */}
          {genres && genres.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, color: theme.palette.success.main }}>
                  <ReadingIcon sx={{ fontSize: 18 }} />
                  Include Genres
                  {selectedGenres.length > 0 && (
                    <Chip 
                      label={selectedGenres.length} 
                      size="small" 
                      color="success"
                      sx={{ height: 18, minWidth: 18, ml: 0.5 }}
                    />
                  )}
                </Typography>
                {selectedGenres.length > 0 && (
                  <Button
                    size="small"
                    onClick={clearGenres}
                    sx={{ 
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      py: 0,
                      minWidth: 'auto',
                    }}
                  >
                    Clear
                  </Button>
                )}
              </Box>
              
              <Grid container spacing={1} sx={{ pl: 1 }}>
                {genres.map((genre) => (
                  <Grid item xs={6} key={genre.name}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedGenres.includes(genre.name)}
                          onChange={() => handleGenreToggle(genre.name)}
                          disabled={excludedGenres.includes(genre.name)}
                          sx={{ 
                            py: 0.5,
                            color: theme.palette.success.main,
                            '&.Mui-checked': {
                              color: theme.palette.success.main,
                            },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {genre.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            ({genre.count})
                          </Typography>
                        </Box>
                      }
                      sx={{ 
                        m: 0, 
                        width: '100%',
                        '& .MuiFormControlLabel-label': {
                          width: '100%',
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          {/* Exclude Genres Filter - Two Column Checkboxes */}
          {genres && genres.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, color: theme.palette.error.main }}>
                  <CloseIcon sx={{ fontSize: 18 }} />
                  Exclude Genres
                  {excludedGenres.length > 0 && (
                    <Chip 
                      label={excludedGenres.length} 
                      size="small" 
                      color="error"
                      sx={{ height: 18, minWidth: 18, ml: 0.5 }}
                    />
                  )}
                </Typography>
                {excludedGenres.length > 0 && (
                  <Button
                    size="small"
                    onClick={clearExcludedGenres}
                    sx={{ 
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      py: 0,
                      minWidth: 'auto',
                    }}
                  >
                    Clear
                  </Button>
                )}
              </Box>
              
              <Grid container spacing={1} sx={{ pl: 1 }}>
                {genres.map((genre) => (
                  <Grid item xs={6} key={genre.name}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={excludedGenres.includes(genre.name)}
                          onChange={() => handleExcludeGenreToggle(genre.name)}
                          disabled={selectedGenres.includes(genre.name)}
                          sx={{ 
                            py: 0.5,
                            color: theme.palette.error.main,
                            '&.Mui-checked': {
                              color: theme.palette.error.main,
                            },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {genre.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            ({genre.count})
                          </Typography>
                        </Box>
                      }
                      sx={{ 
                        m: 0, 
                        width: '100%',
                        '& .MuiFormControlLabel-label': {
                          width: '100%',
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
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
