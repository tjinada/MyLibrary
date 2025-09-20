import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Divider,
  TextField,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  LibraryBooks as LibraryBooksIcon
} from '@mui/icons-material';
import collectionService from '../../services/collectionService';
import CreateCollectionModal from './CreateCollectionModal';

const ManageCollectionsModal = ({ 
  open, 
  onClose, 
  book,
  onCollectionsUpdated 
}) => {
  const [collections, setCollections] = useState([]);
  const [bookCollections, setBookCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (open && book) {
      fetchCollections();
    }
  }, [open, book]);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allCollections = await collectionService.getCollections();
      setCollections(allCollections);
      
      // Set which collections this book belongs to
      const bookCollectionIds = book.collections?.map(c => 
        typeof c === 'string' ? c : c._id
      ) || [];
      setBookCollections(bookCollectionIds);
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCollection = (collectionId) => {
    setBookCollections(prev => {
      if (prev.includes(collectionId)) {
        return prev.filter(id => id !== collectionId);
      } else {
        return [...prev, collectionId];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Find collections to add and remove
      const originalCollections = book.collections?.map(c => 
        typeof c === 'string' ? c : c._id
      ) || [];
      
      const toAdd = bookCollections.filter(id => !originalCollections.includes(id));
      const toRemove = originalCollections.filter(id => !bookCollections.includes(id));

      console.log('Collections update:', {
        original: originalCollections,
        selected: bookCollections,
        toAdd,
        toRemove
      });

      // Process additions
      for (const collectionId of toAdd) {
        console.log(`Adding book ${book._id} to collection ${collectionId}`);
        await collectionService.addBookToCollection(collectionId, book._id);
      }

      // Process removals
      for (const collectionId of toRemove) {
        console.log(`Removing book ${book._id} from collection ${collectionId}`);
        await collectionService.removeBookFromCollection(collectionId, book._id);
      }

      if (onCollectionsUpdated) {
        onCollectionsUpdated();
      }

      onClose();
    } catch (err) {
      console.error('Error updating collections:', err);
      setError(err.response?.data?.message || 'Failed to update collections');
    } finally {
      setSaving(false);
    }
  };

  const handleCollectionCreated = async (newCollection) => {
    // The collection was already created with this book if it was in initialBooks
    // Just update the local state
    setCollections(prev => [...prev, newCollection]);
    
    // Check if this book was added to the new collection
    if (newCollection.books?.some(b => (b._id || b) === book._id)) {
      setBookCollections(prev => [...prev, newCollection._id]);
    }
    
    setCreateModalOpen(false);
  };

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!book) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">Manage Collections</Typography>
              <Typography variant="body2" color="text.secondary">
                {book.title}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setCreateModalOpen(true)}
              color="primary"
              disabled={loading || saving}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <TextField
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
              disabled={loading || saving}
            />

            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : filteredCollections.length === 0 ? (
              <Box textAlign="center" p={3}>
                <LibraryBooksIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">
                  {searchTerm ? 'No collections found' : 'No collections yet'}
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setCreateModalOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Create First Collection
                </Button>
              </Box>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {filteredCollections.map((collection) => (
                  <ListItem
                    key={collection._id}
                    dense
                    button
                    onClick={() => handleToggleCollection(collection._id)}
                    disabled={saving}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={bookCollections.includes(collection._id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={collection.name}
                      secondary={
                        <Box component="span">
                          {collection.bookCount} book{collection.bookCount !== 1 ? 's' : ''}
                          {collection.collectionType === 'series' && ' • Series'}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={saving && <CircularProgress size={20} />}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <CreateCollectionModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCollectionCreated={handleCollectionCreated}
        initialBooks={[book]}
      />
    </>
  );
};

export default ManageCollectionsModal;
