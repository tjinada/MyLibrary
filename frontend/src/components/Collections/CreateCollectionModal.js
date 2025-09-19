import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import collectionService from '../../services/collectionService';

const CreateCollectionModal = ({ open, onClose, onCollectionCreated, initialBooks = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    collectionType: 'custom',
    displayInLibrary: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'displayInLibrary' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create the collection
      const newCollection = await collectionService.createCollection(formData);

      // If initial books were provided, add them to the collection
      if (initialBooks.length > 0) {
        const bookIds = initialBooks.map(book => book._id);
        await collectionService.bulkAddBooks(newCollection._id, bookIds);
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        collectionType: 'custom',
        displayInLibrary: true
      });

      // Notify parent component
      if (onCollectionCreated) {
        onCollectionCreated(newCollection);
      }

      onClose();
    } catch (err) {
      console.error('Error creating collection:', err);
      setError(err.response?.data?.message || 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        description: '',
        collectionType: 'custom',
        displayInLibrary: true
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>Create New Collection</DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            name="name"
            label="Collection Name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            autoFocus
            placeholder="e.g., Throne of Glass Series"
            disabled={loading}
          />

          <TextField
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={2}
            placeholder="Optional description of this collection"
            disabled={loading}
          />

          <FormControl fullWidth>
            <InputLabel>Collection Type</InputLabel>
            <Select
              name="collectionType"
              value={formData.collectionType}
              onChange={handleChange}
              label="Collection Type"
              disabled={loading}
            >
              <MenuItem value="custom">Custom Collection</MenuItem>
              <MenuItem value="series">Book Series (Ordered)</MenuItem>
              <MenuItem value="theme">Theme/Topic</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                name="displayInLibrary"
                checked={formData.displayInLibrary}
                onChange={handleChange}
                disabled={loading}
              />
            }
            label="Display in main library view"
          />

          {initialBooks.length > 0 && (
            <Alert severity="info">
              {initialBooks.length} book{initialBooks.length === 1 ? '' : 's'} will be added to this collection
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name.trim()}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Creating...' : 'Create Collection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateCollectionModal;
