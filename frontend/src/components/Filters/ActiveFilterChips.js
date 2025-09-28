import React from 'react';
import { Box, Chip, Typography, Fade } from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';

const ActiveFilterChips = ({ filters, onRemoveFilter, onClearAll }) => {
  const activeFilters = [];

  if (filters.search) {
    activeFilters.push({
      key: 'search',
      label: `Search: "${filters.search}"`,
      value: filters.search,
    });
  }

  if (filters.status !== 'all') {
    activeFilters.push({
      key: 'status',
      label: `Status: ${filters.status.charAt(0).toUpperCase() + filters.status.slice(1).replace('-', ' ')}`,
      value: filters.status,
    });
  }

  if (filters.genre !== 'all' && (!Array.isArray(filters.genre) || filters.genre.length > 0)) {
    // Handle both single genre and multiple genres
    const genreLabel = Array.isArray(filters.genre) 
      ? filters.genre.join(', ')
      : filters.genre;
    
    activeFilters.push({
      key: 'genre',
      label: `Genre: ${genreLabel}`,
      value: filters.genre,
    });
  }

  if (filters.edition && filters.edition !== 'all') {
    const editionLabel = filters.edition === 'signed' ? 'Signed Edition' : 
                         filters.edition === 'deluxe' ? 'Deluxe Edition' : 
                         filters.edition;
    activeFilters.push({
      key: 'edition',
      label: `Edition: ${editionLabel}`,
      value: filters.edition,
    });
  }

  if (filters.viewType && filters.viewType !== 'all') {
    const viewLabel = filters.viewType === 'books' ? 'Books Only' : 
                      filters.viewType === 'collections' ? 'Collections Only' : 
                      filters.viewType;
    activeFilters.push({
      key: 'viewType',
      label: `View: ${viewLabel}`,
      value: filters.viewType,
    });
  }

  if (activeFilters.length === 0) return null;

  return (
    <Fade in={activeFilters.length > 0} timeout={300}>
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1, 
          alignItems: 'center', 
          flexWrap: 'wrap',
          p: 1.5,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          mb: 2,
        }}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.secondary',
            fontWeight: 500,
            mr: 0.5,
          }}
        >
          Active filters:
        </Typography>
        
        {activeFilters.map((filter) => (
          <Chip
            key={filter.key}
            label={filter.label}
            size="small"
            onDelete={() => onRemoveFilter(filter.key)}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '& .MuiChip-deleteIcon': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: 'white',
                },
              },
            }}
          />
        ))}
        
        {activeFilters.length > 1 && (
          <Chip
            label="Clear all"
            size="small"
            variant="outlined"
            color="error"
            onClick={onClearAll}
            icon={<ClearIcon fontSize="small" />}
            sx={{
              ml: 1,
              borderWidth: 1.5,
              '&:hover': {
                bgcolor: 'error.main',
                color: 'white',
                borderColor: 'error.main',
              },
            }}
          />
        )}
      </Box>
    </Fade>
  );
};

export default ActiveFilterChips;
