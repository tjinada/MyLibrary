import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  Paper,
  Toolbar as MuiToolbar,
  useTheme,
  useMediaQuery,
  Fade,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
} from '@mui/material';
import {
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  LibraryBooks as LibraryBooksIcon,
  CollectionsBookmark as CollectionsIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import ImprovedToolbar from '../components/Layout/ImprovedToolbar';
import SearchBar from '../components/Search/SearchBar';
import BookGrid from '../components/Books/BookGrid';
import BookList from '../components/Books/BookList';
import CollectionCard from '../components/Collections/CollectionCard';
import QuickAddBooks from '../components/Modals/QuickAddBooks';
import AddBookModal from '../components/Modals/AddBookModal';
import BookDetailsModal from '../components/Modals/BookDetailsModal';
import ManageCollectionsModal from '../components/Collections/ManageCollectionsModal';
import CreateCollectionModal from '../components/Collections/CreateCollectionModal';
import bookService from '../services/bookService';
import libraryService from '../services/libraryService';
import imagePreloader from '../utils/imagePreloader';
import { useCollections } from '../contexts/CollectionContext';

const Library = () => {
  const navigate = useNavigate();
  const { expandedCollections, toggleCollection } = useCollections();
  
  // State management
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('libraryViewMode') || 'grid';
  });
  const [libraryView, setLibraryView] = useState(() => {
    return localStorage.getItem('libraryDisplayMode') || 'unified';
  });
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [manualAddModalOpen, setManualAddModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [manageCollectionsOpen, setManageCollectionsOpen] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    genre: 'all',
    sort: 'title',
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const itemsPerPage = viewMode === 'grid' ? 24 : 20;

  // Fetch library data
  useEffect(() => {
    fetchLibrary();
  }, [filters.status, filters.genre, filters.sort, libraryView]);

  // Save view preferences
  useEffect(() => {
    localStorage.setItem('libraryViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('libraryDisplayMode', libraryView);
  }, [libraryView]);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      
      if (libraryView === 'books-only') {
        // Fetch only books
        const data = await bookService.getBooks({
          page: 1,
          limit: 1000,
          status: filters.status !== 'all' ? filters.status : undefined,
          genre: filters.genre !== 'all' ? filters.genre : undefined,
        });
        
        // Transform to library item format
        const items = data.books.map(book => ({
          type: 'book',
          data: book
        }));
        
        setLibraryItems(items);
        
        // Preload images
        const imageUrls = data.books
          .map(book => book.coverImage)
          .filter(Boolean);
        imagePreloader.preloadMultiple(imageUrls);
      } else {
        // Fetch unified library view
        const data = await libraryService.getUnifiedLibrary({
          search: '',
          status: filters.status,
          genre: filters.genre,
          sort: filters.sort,
          viewMode: libraryView,
          includeCollections: true,
          expandCollections: false,
          limit: 1000
        });
        
        setLibraryItems(data.items);
        
        // Preload images for books and collections
        const bookImages = data.items
          .filter(item => item.type === 'book')
          .map(item => item.data.coverImage)
          .filter(Boolean);
          
        const collectionImages = data.items
          .filter(item => item.type === 'collection')
          .flatMap(item => item.data.books?.slice(0, 4).map(b => b.coverImage) || [])
          .filter(Boolean);
          
        imagePreloader.preloadMultiple([...bookImages, ...collectionImages]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load library:', err);
      setError('Failed to load library');
      setLibraryItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter items (client-side for search)
  const filteredItems = useMemo(() => {
    if (!filters.search) return libraryItems;
    
    const searchLower = filters.search.toLowerCase();
    return libraryItems.filter(item => {
      if (item.type === 'book') {
        const book = item.data;
        return (
          book.title?.toLowerCase().includes(searchLower) ||
          book.authors?.some(author => author.toLowerCase().includes(searchLower)) ||
          book.isbn?.includes(searchLower)
        );
      } else if (item.type === 'collection') {
        const collection = item.data;
        return (
          collection.name?.toLowerCase().includes(searchLower) ||
          collection.description?.toLowerCase().includes(searchLower) ||
          collection.books?.some(book => 
            book.title?.toLowerCase().includes(searchLower) ||
            book.authors?.some(author => author.toLowerCase().includes(searchLower))
          )
        );
      }
      return false;
    });
  }, [libraryItems, filters.search]);

  // Pagination
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, page, itemsPerPage]);

  // Calculate total pages
  useEffect(() => {
    setTotalPages(Math.ceil(filteredItems.length / itemsPerPage));
    setPage(1);
  }, [filteredItems.length, itemsPerPage]);

  // Extract genres from items
  const genres = useMemo(() => {
    const genreMap = new Map();
    libraryItems.forEach(item => {
      if (item.type === 'book') {
        const book = item.data;
        if (book.primaryCategory) {
          genreMap.set(book.primaryCategory, (genreMap.get(book.primaryCategory) || 0) + 1);
        } else if (book.genres) {
          book.genres.forEach(genre => {
            genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
          });
        }
      }
    });
    return Array.from(genreMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [libraryItems]);

  // Calculate book counts
  const bookCounts = useMemo(() => {
    const counts = {
      all: 0,
      'to-read': 0,
      reading: 0,
      read: 0,
      loaned: 0,
    };
    
    libraryItems.forEach(item => {
      if (item.type === 'book') {
        counts.all++;
        const status = item.data.status === 'available' ? 'to-read' : item.data.status;
        if (counts[status] !== undefined) {
          counts[status]++;
        }
      } else if (item.type === 'collection') {
        counts.all += item.data.bookCount || 0;
        // Count books in collections by status if expanded
        if (expandedCollections.has(item.data._id) && item.data.books) {
          item.data.books.forEach(book => {
            const status = book.status === 'available' ? 'to-read' : book.status;
            if (counts[status] !== undefined) {
              counts[status]++;
            }
          });
        }
      }
    });
    
    return counts;
  }, [libraryItems, expandedCollections]);

  // Handler functions
  const handleSearch = useCallback((searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      genre: 'all',
      sort: 'title',
    });
  }, []);

  const handleBooksAdded = useCallback(() => {
    imagePreloader.clearCache();
    fetchLibrary();
  }, []);

  const handleOpenAddModal = useCallback((mode) => {
    if (mode === 'manual') {
      setManualAddModalOpen(true);
    } else {
      setQuickAddModalOpen(true);
    }
  }, []);

  const handleItemClick = useCallback((item) => {
    if (item.type === 'book') {
      setSelectedBook(item.data);
      setDetailsModalOpen(true);
    } else if (item.type === 'collection') {
      navigate(`/collections/${item.data._id}`);
    }
  }, [navigate]);

  const handleBookClick = useCallback((book) => {
    setSelectedBook(book);
    setDetailsModalOpen(true);
  }, []);

  const handleBookUpdated = useCallback(() => {
    fetchLibrary();
  }, []);

  const handleBookDeleted = useCallback(() => {
    fetchLibrary();
    setDetailsModalOpen(false);
  }, []);

  const handleCollectionToggle = useCallback((collectionId, expanded) => {
    toggleCollection(collectionId);
  }, [toggleCollection]);

  const hasActiveFilters = filters.search !== '' || 
                          filters.status !== 'all' || 
                          filters.genre !== 'all';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <MuiToolbar />
      
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Page Title and Search */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              textAlign: 'center',
              mb: 3,
              color: 'text.primary',
            }}
          >
            My Book Collection
          </Typography>
          
          {/* Search Bar */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            mb: 3,
          }}>
            <SearchBar onSearch={handleSearch} />
          </Box>
          
          {/* Library View Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <ToggleButtonGroup
              value={libraryView}
              exclusive
              onChange={(e, newView) => newView && setLibraryView(newView)}
              size="small"
            >
              <ToggleButton value="unified">
                <ViewModuleIcon sx={{ mr: 1 }} />
                All Books & Collections
              </ToggleButton>
              <ToggleButton value="books-only">
                <LibraryBooksIcon sx={{ mr: 1 }} />
                Books Only
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Toolbar with filters */}
        <ImprovedToolbar
          onAddBook={handleOpenAddModal}
          onQuickAdd={() => setQuickAddModalOpen(true)}
          onCreateCollection={() => setCreateCollectionOpen(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filters={filters}
          onFilterChange={handleFilterChange}
          genres={genres}
          bookCounts={bookCounts}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Results summary */}
        {!loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3,
          }}>
            <Typography variant="body2" color="text.secondary">
              {filteredItems.length === 0 
                ? 'No items found'
                : `Showing ${Math.min((page - 1) * itemsPerPage + 1, filteredItems.length)}-${Math.min(page * itemsPerPage, filteredItems.length)} of ${filteredItems.length} items`
              }
            </Typography>
            {totalPages > 1 && !isMobile && (
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                size="small"
                siblingCount={0}
                boundaryCount={1}
              />
            )}
          </Box>
        )}

        {/* Content area */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        ) : filteredItems.length === 0 ? (
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
                {hasActiveFilters ? 'No items match your filters' : 'Your library is empty'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {hasActiveFilters 
                  ? 'Try adjusting your filters or search terms'
                  : 'Start by adding some books to your collection'
                }
              </Typography>
              {!hasActiveFilters && (
                <Box sx={{ mt: 3 }}>
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      fontSize: 80,
                      color: 'text.disabled',
                      mb: 2,
                    }}
                  >
                    📚
                  </Typography>
                </Box>
              )}
            </Paper>
          </Fade>
        ) : (
          <Fade in timeout={500}>
            <Box>
              {viewMode === 'grid' ? (
                <Grid container spacing={2}>
                  {paginatedItems.map((item) => {
                    if (item.type === 'collection') {
                      return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={item.data._id}>
                          <CollectionCard
                            collection={item.data}
                            expanded={expandedCollections.has(item.data._id)}
                            onToggleExpand={handleCollectionToggle}
                            onClick={() => navigate(`/collections/${item.data._id}`)}
                            viewMode={viewMode}
                          />
                        </Grid>
                      );
                    } else {
                      // Render book - the grid will be handled by parent
                      return null;
                    }
                  })}
                </Grid>
              ) : (
                // List view
                <Box>
                  {paginatedItems.map((item) => {
                    if (item.type === 'collection') {
                      return (
                        <CollectionCard
                          key={item.data._id}
                          collection={item.data}
                          expanded={expandedCollections.has(item.data._id)}
                          onToggleExpand={handleCollectionToggle}
                          onClick={() => navigate(`/collections/${item.data._id}`)}
                          viewMode="list"
                        />
                      );
                    }
                    return null;
                  })}
                </Box>
              )}
              
              {/* Render books separately */}
              {viewMode === 'grid' ? (
                <BookGrid 
                  books={paginatedItems.filter(item => item.type === 'book').map(item => item.data)} 
                  onBookClick={handleBookClick}
                />
              ) : (
                <BookList 
                  books={paginatedItems.filter(item => item.type === 'book').map(item => item.data)} 
                  onBookClick={handleBookClick}
                />
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    color="primary"
                    size={isMobile ? 'medium' : 'large'}
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </Container>

      {/* Quick Add Books Modal */}
      <QuickAddBooks
        open={quickAddModalOpen}
        onClose={() => setQuickAddModalOpen(false)}
        onBooksAdded={handleBooksAdded}
      />

      {/* Manual Add Book Modal */}
      <AddBookModal
        open={manualAddModalOpen}
        onClose={() => setManualAddModalOpen(false)}
        onBookAdded={handleBooksAdded}
      />

      {/* Book Details Modal */}
      <BookDetailsModal
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedBook(null);
        }}
        book={selectedBook}
        onBookUpdated={handleBookUpdated}
        onBookDeleted={handleBookDeleted}
        onManageCollections={() => {
          setManageCollectionsOpen(true);
        }}
      />

      {/* Manage Collections Modal */}
      {selectedBook && (
        <ManageCollectionsModal
          open={manageCollectionsOpen}
          onClose={() => setManageCollectionsOpen(false)}
          book={selectedBook}
          onCollectionsUpdated={() => {
            handleBookUpdated();
            setManageCollectionsOpen(false);
          }}
        />
      )}
      
      {/* Create Collection Modal */}
      <CreateCollectionModal
        open={createCollectionOpen}
        onClose={() => setCreateCollectionOpen(false)}
        onCollectionCreated={(collection) => {
          setCreateCollectionOpen(false);
          fetchLibrary(); // Refresh library to show new collection
          navigate(`/collections/${collection._id}`);
        }}
      />
    </Box>
  );
};

export default Library;
