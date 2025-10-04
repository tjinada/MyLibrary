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
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (open) {
      setName(initialName);
      setError('');
    }
  }, [open, initialName]);

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
    
    onSave(trimmedName, editMode ? initialFilters : filters);
  };

  const getFilterSummary = () => {
    const currentFilters = editMode ? initialFilters : filters;
    const summary = [];
    
    // Genre filters
    if (currentFilters.genre !== 'all' && currentFilters.genre.length > 0) {
      const genres = Array.isArray(currentFilters.genre) 
        ? currentFilters.genre 
        : [currentFilters.genre];
      summary.push({ label: 'Include Genres', value: genres.join(', '), type: 'success' });
    }
    
    if (currentFilters.excludeGenres?.length > 0) {
      summary.push({ 
        label: 'Exclude Genres', 
        value: currentFilters.excludeGenres.join(', '), 
        type: 'error' 
      });
    }
    
    // Status
    if (currentFilters.status !== 'all') {
      const statusLabels = {
        'to-read': 'To Read',
        'reading': 'Reading',
        'read': 'Read',
        'loaned': 'Loaned'
      };
      summary.push({ 
        label: 'Status', 
        value: statusLabels[currentFilters.status] || currentFilters.status,
        type: 'info'
      });
    }
    
    // Editions
    if (currentFilters.includeEditions?.length > 0) {
      summary.push({ 
        label: 'Include Editions', 
        value: currentFilters.includeEditions.join(', '), 
        type: 'success' 
      });
    }
    
    if (currentFilters.excludeEditions?.length > 0) {
      summary.push({ 
        label: 'Exclude Editions', 
        value: currentFilters.excludeEditions.join(', '), 
        type: 'error' 
      });
    }
    
    // Collections
    if (currentFilters.includeCollections?.length > 0) {
      const collectionNames = currentFilters.includeCollections
        .map(id => collections.find(c => c._id === id)?.name || id)
        .join(', ');
      summary.push({ 
        label: 'Include Collections', 
        value: collectionNames,
        type: 'success' 
      });
    }
    
    if (currentFilters.excludeCollections?.length > 0) {
      const collectionNames = currentFilters.excludeCollections
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
      value: sortLabels[currentFilters.sort] || currentFilters.sort,
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
          Filters to Save:
        </Typography>
        
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
