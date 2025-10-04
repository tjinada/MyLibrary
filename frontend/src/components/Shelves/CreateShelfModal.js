import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert
} from '@mui/material';

const CreateShelfModal = ({ 
  open, 
  onClose, 
  onSave, 
  filters,
  collections = [],
  editMode = false,
  initialName = '',
  initialFilters = null
}) => {
  const [name, setName] = useState(initialName);
  const [currentFilters, setCurrentFilters] = useState(initialFilters);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (open) {
      setName(initialName);
      setCurrentFilters(initialFilters);
      setError('');
    }
  }, [open, initialName, initialFilters]);

  const handleSave = () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Shelf name is required');
      return;
    }
    
    if (trimmedName.length > 50) {
      setError('Shelf name must be 50 characters or less');
      return;
    }
    
    // In edit mode, use currentFilters (which may have been updated)
    // In create mode, use the current filters from the Library
    onSave(trimmedName, editMode ? currentFilters : filters);
  };
  
  const handleUpdateFilters = () => {
    setCurrentFilters(filters);
  };

  const getFilterSummary = () => {
    // In edit mode, show currentFilters (which may have been updated)
    // In create mode, show filters from Library
    const filtersToShow = editMode ? (currentFilters || initialFilters || filters) : filters;
    
    // Safety check - if filtersToShow is still null/undefined, return empty array
    if (!filtersToShow) {
      return [];
    }
    
    const summary = [];
    
    // Genre filters
    if (filtersToShow.genre !== 'all' && filtersToShow.genre.length > 0) {
      const genres = Array.isArray(filtersToShow.genre) 
        ? filtersToShow.genre 
        : [filtersToShow.genre];
      summary.push({ label: 'Include Genres', value: genres.join(', '), type: 'success' });
    }
    
    if (filtersToShow.excludeGenres?.length > 0) {
      summary.push({ 
        label: 'Exclude Genres', 
        value: filtersToShow.excludeGenres.join(', '), 
        type: 'error' 
      });
    }
    
    // Status
    if (filtersToShow.status !== 'all') {
      const statusLabels = {
        'to-read': 'To Read',
        'reading': 'Reading',
        'read': 'Read',
        'loaned': 'Loaned'
      };
      summary.push({ 
        label: 'Status', 
        value: statusLabels[filtersToShow.status] || filtersToShow.status,
        type: 'info'
      });
    }
    
    // Editions
    if (filtersToShow.includeEditions?.length > 0) {
      summary.push({ 
        label: 'Include Editions', 
        value: filtersToShow.includeEditions.join(', '), 
        type: 'success' 
      });
    }
    
    if (filtersToShow.excludeEditions?.length > 0) {
      summary.push({ 
        label: 'Exclude Editions', 
        value: filtersToShow.excludeEditions.join(', '), 
        type: 'error' 
      });
    }
    
    // Collections
    if (filtersToShow.includeCollections?.length > 0) {
      const collectionNames = filtersToShow.includeCollections
        .map(id => collections.find(c => c._id === id)?.name || id)
        .join(', ');
      summary.push({ 
        label: 'Include Collections', 
        value: collectionNames,
        type: 'success' 
      });
    }
    
    if (filtersToShow.excludeCollections?.length > 0) {
      const collectionNames = filtersToShow.excludeCollections
        .map(id => collections.find(c => c._id === id)?.name || id)
        .join(', ');
      summary.push({ 
        label: 'Exclude Collections', 
        value: collectionNames,
        type: 'error' 
      });
    }
    
    // Sort
    const sortLabels = {
      'title': 'Title (A-Z)',
      '-title': 'Title (Z-A)',
      'authors': 'Author (A-Z)',
      '-authors': 'Author (Z-A)',
      'addedDate': 'Oldest First',
      '-addedDate': 'Newest First'
    };
    summary.push({ 
      label: 'Sort', 
      value: sortLabels[filtersToShow.sort] || filtersToShow.sort,
      type: 'info'
    });
    
    return summary;
  };

  const filterSummary = getFilterSummary();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editMode ? 'Edit Shelf' : 'Create Custom Shelf'}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Shelf Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          error={!!error}
          helperText={error || `${name.length}/50 characters`}
          required
          autoFocus
          sx={{ mt: 2, mb: 3 }}
          inputProps={{ maxLength: 50 }}
        />
        
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          {editMode ? 'Current Filters:' : 'Filters to Save:'}
        </Typography>
        
        {editMode && (
          <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
            You can update the filters by applying new filters in the library, then click "Update Filters" below.
          </Alert>
        )}
        
        {filterSummary.length === 0 ? (
          <Alert severity="warning" sx={{ mt: 1 }}>
            No filters are currently active. The shelf will show all books.
          </Alert>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1,
            mt: 1,
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1
          }}>
            {filterSummary.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    minWidth: 140,
                    color: 'text.secondary'
                  }}
                >
                  {item.label}:
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: item.type === 'error' ? 'error.main' : 
                           item.type === 'success' ? 'success.main' : 
                           'text.primary'
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
        
        {editMode && (
          <Button
            variant="outlined"
            onClick={handleUpdateFilters}
            sx={{ mt: 2 }}
            fullWidth
          >
            🔄 Update Filters from Current View
          </Button>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!name.trim()}
        >
          {editMode ? 'Update' : 'Create'} Shelf
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateShelfModal;
