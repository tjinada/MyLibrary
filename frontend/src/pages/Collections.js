import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Toolbar as MuiToolbar,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  InputAdornment,
  Fade
} from '@mui/material';
import {
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  Add as AddIcon,
  Search as SearchIcon,
  CollectionsBookmark as CollectionIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import CollectionGrid from '../components/Collections/CollectionGrid';
import CollectionList from '../components/Collections/CollectionList';
import CreateCollectionModal from '../components/Collections/CreateCollectionModal';
import { useCollections } from '../contexts/CollectionContext';
import { useAuth } from '../contexts/AuthContext';

const Collections = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    collections,
    loading,
    error,
    fetchCollections,
    deleteCollection
  } = useCollections();

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('collectionsViewMode') || 'grid';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filteredCollections, setFilteredCollections] = useState([]);

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections(true); // Include books for preview
  }, []);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('collectionsViewMode', viewMode);
  }, [viewMode]);

  // Filter collections based on search
  useEffect(() => {
    if (!collections) return;
    
    const filtered = collections.filter(collection => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        collection.name.toLowerCase().includes(query) ||
        (collection.description && collection.description.toLowerCase().includes(query))
      );
    });
    
    setFilteredCollections(filtered);
  }, [collections, searchQuery]);

  const handleCollectionClick = (collection) => {
    navigate(`/collections/${collection._id}`);
  };

  const handleEditCollection = async (collection, updates) => {
    // This will be handled by the collection update functionality
    console.log('Edit collection:', collection._id, updates);
  };

  const handleDeleteCollection = async (collectionId) => {
    if (window.confirm('Are you sure you want to delete this collection? Books will not be deleted.')) {
      try {
        await deleteCollection(collectionId);
      } catch (error) {
        console.error('Error deleting collection:', error);
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <MuiToolbar /> {/* Spacer for fixed header */}
      
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Page Title */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <CollectionIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            My Collections
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Organize your books into custom collections and series
          </Typography>
        </Box>

        {/* Toolbar */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 3,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, maxWidth: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />

          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="grid">
              <GridViewIcon />
            </ToggleButton>
            <ToggleButton value="list">
              <ListViewIcon />
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Create Collection Button */}
          {isAuthenticated && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
            >
              New Collection
            </Button>
          )}
        </Paper>

        {/* Collection Count */}
        {!loading && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {filteredCollections.length === 0 
              ? (searchQuery ? 'No collections found' : 'No collections yet')
              : `${filteredCollections.length} collection${filteredCollections.length !== 1 ? 's' : ''}`
            }
          </Typography>
        )}

        {/* Content Area */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        ) : filteredCollections.length === 0 ? (
          <Fade in timeout={500}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 8, 
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              <Typography 
                variant="h5" 
                color="text.secondary" 
                gutterBottom
                sx={{ fontWeight: 500 }}
              >
                {searchQuery ? 'No collections match your search' : 'No collections yet'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Create your first collection to organize your books'
                }
              </Typography>
              {!searchQuery && isAuthenticated && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ mt: 3 }}
                  onClick={() => setCreateModalOpen(true)}
                >
                  Create First Collection
                </Button>
              )}
            </Paper>
          </Fade>
        ) : (
          <Fade in timeout={500}>
            <Box>
              {viewMode === 'grid' ? (
                <CollectionGrid 
                  collections={filteredCollections}
                  onCollectionClick={handleCollectionClick}
                  onEditCollection={handleEditCollection}
                  onDeleteCollection={handleDeleteCollection}
                />
              ) : (
                <CollectionList
                  collections={filteredCollections}
                  onCollectionClick={handleCollectionClick}
                  onEditCollection={handleEditCollection}
                  onDeleteCollection={handleDeleteCollection}
                />
              )}
            </Box>
          </Fade>
        )}
      </Container>

      {/* Create Collection Modal */}
      <CreateCollectionModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCollectionCreated={(collection) => {
          setCreateModalOpen(false);
          navigate(`/collections/${collection._id}`);
        }}
      />
    </Box>
  );
};

export default Collections;
