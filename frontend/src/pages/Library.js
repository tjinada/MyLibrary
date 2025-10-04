import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  Paper,
  useTheme,
  useMediaQuery,
  Fade,
  Grid,
  Grow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  alpha,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import StickyToolbar from '../components/Layout/StickyToolbar';
import SearchBar from '../components/Search/SearchBar';
import ActiveFilterChips from '../components/Filters/ActiveFilterChips';
import BookCard from '../components/Books/BookCard';
import BookList from '../components/Books/BookList';
import CollectionCard from '../components/Collections/CollectionCard';
import BulkActionBar from '../components/Layout/BulkActionBar';
import LibraryStats from '../components/Layout/LibraryStats';
import QuickAddBooks from '../components/Modals/QuickAddBooks';
import AddBookModal from '../components/Modals/AddBookModal';
import BookDetailsModal from '../components/Modals/BookDetailsModal';
import ManageCollectionsModal from '../components/Collections/ManageCollectionsModal';
import CreateCollectionModal from '../components/Collections/CreateCollectionModal';
import CustomShelfBar from '../components/Shelves/CustomShelfBar';
import CreateShelfModal from '../components/Shelves/CreateShelfModal';
import ManageShelvesModal from '../components/Shelves/ManageShelvesModal';
import bookService from '../services/bookService';
import collectionService from '../services/collectionService';
import customShelfService from '../services/customShelfService';
import imagePreloader from '../utils/imagePreloader';
import { useCollections } from '../contexts/CollectionContext';
import useSelection from '../hooks/useSelection';
import { spacing } from '../theme/theme';

const Library = () => {
  const navigate = useNavigate();
  const { expandedCollections, toggleCollection } = useCollections();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State management
  const [libraryItems, setLibraryItems] = useState([]);
  const [allLibraryItems, setAllLibraryItems] = useState([]);
  const [allBooksForGenres, setAllBooksForGenres] = useState({ books: [], collections: [] });
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('libraryViewMode') || 'grid';
  });
  
  // Modal states
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [manualAddModalOpen, setManualAddModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [manageCollectionsOpen, setManageCollectionsOpen] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [bulkCollectionsOpen, setBulkCollectionsOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [openInEditMode, setOpenInEditMode] = useState(false);
  
  // Custom shelf states
  const [customShelves, setCustomShelves] = useState([]);
  const [activeShelfId, setActiveShelfId] = useState(null);
  const [createShelfModalOpen, setCreateShelfModalOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState(null);
  const [manageShelvesModalOpen, setManageShelvesModalOpen] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    genre: 'all',
    excludeGenres: [],
    includeEditions: [],
    excludeEditions: [],
    includeCollections: [],
    excludeCollections: [],
    edition: 'all',
    sort: 'title',
  });
  
  // Separate state for showing collections
  const [showCollectionsOnly, setShowCollectionsOnly] = useState(false);

  const itemsPerPage = viewMode === 'grid' ? 50 : 20;

  // Selection hook
  const {
    selectedIds,
    selectedCount,
    selectedItems,
    selectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    enterSelectionMode,
    exitSelectionMode,
  } = useSelection(libraryItems.filter(item => item.type === 'book'));

  // Fetch library data
  useEffect(() => {
    fetchLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.status, 
    filters.genre, 
    filters.excludeGenres, 
    filters.includeEditions,
    filters.excludeEditions,
    filters.includeCollections,
    filters.excludeCollections,
    filters.edition, 
    filters.sort, 
    showCollectionsOnly
  ]);

  // Fetch custom shelves on mount
  useEffect(() => {
    fetchCustomShelves();
  }, []);

  // Save view preferences
  useEffect(() => {
    localStorage.setItem('libraryViewMode', viewMode);
  }, [viewMode]);

  // Exit selection mode when changing pages or filters
  useEffect(() => {
    if (selectionMode) {
      exitSelectionMode();
    }
  }, [page, filters]);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      
      const allBooksData = await bookService.getBooks({
        page: 1,
        limit: 1000,
        status: filters.status !== 'all' ? filters.status : undefined,
        excludeGenres: filters.excludeGenres.length > 0 ? filters.excludeGenres : undefined,
        includeEditions: filters.includeEditions.length > 0 ? filters.includeEditions : undefined,
        excludeEditions: filters.excludeEditions.length > 0 ? filters.excludeEditions : undefined,
        includeCollections: filters.includeCollections.length > 0 ? filters.includeCollections : undefined,
        excludeCollections: filters.excludeCollections.length > 0 ? filters.excludeCollections : undefined,
      });
      
      const collectionsData = await collectionService.getCollections(true);
      
      setAllBooksForGenres({ books: allBooksData.books, collections: collectionsData });
      
      let booksToDisplay = allBooksData.books;
      
      // Apply exclude genres filter
      if (filters.excludeGenres.length > 0) {
        booksToDisplay = booksToDisplay.filter(book => {
          const bookGenres = new Set();
          if (book.primaryCategory) bookGenres.add(book.primaryCategory);
          if (book.genres && Array.isArray(book.genres)) {
            book.genres.forEach(genre => bookGenres.add(genre));
          }
          
          // Book must NOT have any excluded genres
          return !filters.excludeGenres.some(excludedGenre => bookGenres.has(excludedGenre));
        });
      }
      
      // Apply include genres filter
      if (filters.genre !== 'all') {
        const genreFilters = Array.isArray(filters.genre) ? filters.genre : [filters.genre];
        booksToDisplay = booksToDisplay.filter(book => {
          if (genreFilters.length === 0) return true;
          
          // Collect all genres for this book
          const bookGenres = new Set();
          if (book.primaryCategory) bookGenres.add(book.primaryCategory);
          if (book.genres && Array.isArray(book.genres)) {
            book.genres.forEach(genre => bookGenres.add(genre));
          }
          
          // If book has no genres at all, categorize as "Uncategorized"
          if (bookGenres.size === 0) {
            bookGenres.add('Uncategorized');
          }
          
          // AND condition: book must have ALL selected genres
          return genreFilters.every(filterGenre => bookGenres.has(filterGenre));
        });
      }
      
      if (filters.status !== 'all') {
        booksToDisplay = booksToDisplay.filter(book => book.status === filters.status);
      }
      
      if (filters.edition !== 'all') {
        booksToDisplay = booksToDisplay.filter(book => book.edition === filters.edition);
      }
      
      // Apply exclude editions filter
      if (filters.excludeEditions.length > 0) {
        booksToDisplay = booksToDisplay.filter(book => 
          !filters.excludeEditions.includes(book.edition)
        );
      }
      
      // Apply include editions filter
      if (filters.includeEditions.length > 0) {
        booksToDisplay = booksToDisplay.filter(book =>
          filters.includeEditions.includes(book.edition)
        );
      }
      
      // Apply exclude collections filter
      if (filters.excludeCollections.length > 0) {
        booksToDisplay = booksToDisplay.filter(book => {
          const bookCollections = book.collections || [];
          // If book is in ANY excluded collection, hide it
          return !filters.excludeCollections.some(excludedId =>
            bookCollections.some(bookColId =>
              (typeof bookColId === 'object' ? bookColId._id : bookColId) === excludedId
            )
          );
        });
      }
      
      // Apply include collections filter
      if (filters.includeCollections.length > 0) {
        booksToDisplay = booksToDisplay.filter(book => {
          const bookCollections = book.collections || [];
          // Book must be in at least one included collection
          return filters.includeCollections.some(includedId =>
            bookCollections.some(bookColId =>
              (typeof bookColId === 'object' ? bookColId._id : bookColId) === includedId
            )
          );
        });
      }
      
      const booksInCollections = new Set();
      (collectionsData || []).forEach(collection => {
        collection.books?.forEach(book => {
          if (typeof book === 'object' && book._id) {
            booksInCollections.add(book._id);
          } else if (typeof book === 'string') {
            booksInCollections.add(book);
          }
        });
      });
      
      const allBookItems = booksToDisplay.map(book => ({
        type: 'book',
        sortKey: book.title.toLowerCase().replace(/^(the |a |an )/i, ''),
        data: book,
        inCollection: book.collections && book.collections.length > 0
      }));
      
      // Show all books (including those in collections) when:
      // - Searching, filtering by genre/status/edition/excludeGenres/editions/collections, or sorting by date
      const showAllBooks = filters.search !== '' || 
                           filters.genre !== 'all' || 
                           filters.status !== 'all' || 
                           filters.edition !== 'all' ||
                           filters.excludeGenres.length > 0 ||
                           filters.includeEditions.length > 0 ||
                           filters.excludeEditions.length > 0 ||
                           filters.includeCollections.length > 0 ||
                           filters.excludeCollections.length > 0 ||
                           filters.sort === '-addedDate' || 
                           filters.sort === 'addedDate';
      const displayBookItems = showAllBooks 
        ? allBookItems
        : allBookItems.filter(item => !item.inCollection);
      
      // Always prepare collection items, they'll be filtered based on viewType
      const collectionItems = (collectionsData || [])
        .filter(c => c.displayInLibrary !== false)
        .map(collection => ({
          type: 'collection',
          sortKey: (collection.sortName || collection.name).toLowerCase().replace(/^(the |a |an )/i, ''),
          data: collection
        }));
      
      // Apply view logic
      let displayItems = [];
      
      if (showCollectionsOnly) {
        // When showing collections only, display all collections
        displayItems = collectionItems;
      } else {
        // Normal behavior - show books and conditionally show collections
        const showCollections = filters.genre === 'all' && 
                                filters.status === 'all' && 
                                filters.edition === 'all' &&
                                filters.excludeGenres.length === 0 &&
                                filters.includeEditions.length === 0 &&
                                filters.excludeEditions.length === 0 &&
                                filters.includeCollections.length === 0 &&
                                filters.excludeCollections.length === 0 &&
                                filters.search === '';
        
        displayItems = showCollections 
          ? [...displayBookItems, ...collectionItems]
          : displayBookItems;
      }
      
      displayItems.sort((a, b) => {
        if (filters.sort === 'title' || filters.sort === '-title') {
          const multiplier = filters.sort.startsWith('-') ? -1 : 1;
          return multiplier * a.sortKey.localeCompare(b.sortKey);
        }
        
        if (filters.sort === '-addedDate' || filters.sort === 'addedDate') {
          const multiplier = filters.sort.startsWith('-') ? -1 : 1;
          
          if (a.type === 'collection' && b.type === 'book') return 1;
          if (a.type === 'book' && b.type === 'collection') return -1;
          
          if (a.type === 'book' && b.type === 'book') {
            return multiplier * (new Date(a.data.addedDate) - new Date(b.data.addedDate));
          }
          
          return a.sortKey.localeCompare(b.sortKey);
        }
        
        if (filters.sort === 'authors' || filters.sort === '-authors') {
          const multiplier = filters.sort.startsWith('-') ? -1 : 1;
          
          // Collections always come after books when sorting by author
          if (a.type === 'collection' && b.type === 'book') return 1;
          if (a.type === 'book' && b.type === 'collection') return -1;
          
          if (a.type === 'book' && b.type === 'book') {
            // Extract last name from first author for sorting
            const getAuthorLastName = (book) => {
              if (!book.authors || book.authors.length === 0) return '';
              const firstAuthor = book.authors[0];
              const nameParts = firstAuthor.trim().split(/\s+/);
              return nameParts[nameParts.length - 1].toLowerCase();
            };
            
            const aName = getAuthorLastName(a.data);
            const bName = getAuthorLastName(b.data);
            return multiplier * aName.localeCompare(bName);
          }
          
          return a.sortKey.localeCompare(b.sortKey);
        }
        
        return 0;
      });
      
      setLibraryItems(displayItems);
      setAllLibraryItems([...allBookItems, ...collectionItems]);
      
      const bookImages = allBookItems
        .map(item => item.data.coverImage)
        .filter(Boolean);
        
      const collectionImages = collectionItems
        .flatMap(item => item.data.books?.slice(0, 4).map(b => b.coverImage) || [])
        .filter(Boolean);
        
      imagePreloader.preloadMultiple([...bookImages, ...collectionImages]);
      
      setError(null);
    } catch (err) {
      console.error('Failed to load library:', err);
      setError('Failed to load library');
      setLibraryItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch custom shelves
  const fetchCustomShelves = async () => {
    try {
      const data = await customShelfService.getShelves();
      setCustomShelves(data.shelves || []);
    } catch (error) {
      console.error('Failed to fetch custom shelves:', error);
    }
  };

  // Shelf handlers
  const handleApplyShelf = useCallback((shelf) => {
    // Normalize shelf filters before applying
    const normalizedFilters = {
      ...shelf.filters,
      // Ensure arrays for new filter types
      includeEditions: shelf.filters.includeEditions || [],
      excludeEditions: shelf.filters.excludeEditions || [],
      includeCollections: shelf.filters.includeCollections || [],
      excludeCollections: shelf.filters.excludeCollections || [],
      excludeGenres: shelf.filters.excludeGenres || [],
      // Normalize genre - if it's an array with 'all', convert to 'all'
      genre: (Array.isArray(shelf.filters.genre) && shelf.filters.genre.includes('all')) 
        ? 'all' 
        : (shelf.filters.genre || 'all'),
      // Ensure all other fields have defaults
      status: shelf.filters.status || 'all',
      edition: shelf.filters.edition || 'all',
      sort: shelf.filters.sort || 'title',
      search: shelf.filters.search || ''
    };
    
    setFilters(normalizedFilters);
    setActiveShelfId(shelf._id);
  }, []);

  const handleClearShelf = useCallback(() => {
    setActiveShelfId(null);
  }, []);

  const handleSaveAsShelf = async (name) => {
    try {
      const newShelf = await customShelfService.createShelf({
        name: name.trim(),
        filters: { ...filters }
      });
      setCustomShelves([...customShelves, newShelf]);
      setActiveShelfId(newShelf._id);
      setCreateShelfModalOpen(false);
    } catch (error) {
      if (error.response?.status === 409) {
        alert('A shelf with this name already exists. Please choose a different name.');
      } else {
        console.error('Failed to create shelf:', error);
        alert('Failed to create shelf. Please try again.');
      }
    }
  };

  const handleEditShelf = async (shelf) => {
    setEditingShelf(shelf);
    setCreateShelfModalOpen(true);
  };

  const handleUpdateShelf = async (name, updatedFilters) => {
    if (!editingShelf) return;
    
    try {
      const updated = await customShelfService.updateShelf(editingShelf._id, {
        name: name.trim(),
        filters: updatedFilters // Use the updated filters from the modal
      });
      setCustomShelves(shelves => 
        shelves.map(s => s._id === editingShelf._id ? updated : s)
      );
      setEditingShelf(null);
      setCreateShelfModalOpen(false);
    } catch (error) {
      if (error.response?.status === 409) {
        alert('A shelf with this name already exists. Please choose a different name.');
      } else {
        console.error('Failed to update shelf:', error);
        alert('Failed to update shelf. Please try again.');
      }
    }
  };

  const handleDeleteShelf = async (shelfId) => {
    try {
      await customShelfService.deleteShelf(shelfId);
      setCustomShelves(shelves => shelves.filter(s => s._id !== shelfId));
      if (activeShelfId === shelfId) {
        setActiveShelfId(null);
      }
    } catch (error) {
      console.error('Failed to delete shelf:', error);
      alert('Failed to delete shelf. Please try again.');
    }
  };

  const handleReorderShelves = async (reorderedShelves) => {
    try {
      const shelfIds = reorderedShelves.map(s => s._id);
      await customShelfService.reorderShelves(shelfIds);
      setCustomShelves(reorderedShelves);
    } catch (error) {
      console.error('Failed to reorder shelves:', error);
    }
  };

  // Filter items (client-side for search)
  const filteredItems = useMemo(() => {
    const itemsToSearch = filters.search ? allLibraryItems : libraryItems;
    
    if (!filters.search) return libraryItems;
    
    setIsSearching(true);
    const searchLower = filters.search.toLowerCase();
    const matchedItems = [];
    const addedBookIds = new Set();
    
    itemsToSearch.forEach(item => {
      if (item.type === 'collection') {
        const collection = item.data;
        const collectionMatches = 
          collection.name?.toLowerCase().includes(searchLower) ||
          collection.description?.toLowerCase().includes(searchLower);
        
        if (collectionMatches) {
          matchedItems.push(item);
          collection.books?.forEach(book => {
            const bookId = typeof book === 'object' ? book._id : book;
            if (bookId) addedBookIds.add(bookId);
          });
        }
      }
    });
    
    itemsToSearch.forEach(item => {
      if (item.type === 'book') {
        const book = item.data;
        const bookMatches = 
          book.title?.toLowerCase().includes(searchLower) ||
          book.authors?.some(author => author.toLowerCase().includes(searchLower)) ||
          book.isbn?.includes(searchLower) ||
          book.genres?.some(genre => genre.toLowerCase().includes(searchLower)) ||
          book.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (bookMatches) {
          matchedItems.push(item);
        }
      }
    });
    
    setIsSearching(false);
    return matchedItems;
  }, [libraryItems, allLibraryItems, filters.search]);

  // Get only book items for bulk operations
  const bookItems = useMemo(() => {
    return filteredItems.filter(item => item.type === 'book');
  }, [filteredItems]);

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

  // Calculate dynamic genre counts based on active filters
  const genres = useMemo(() => {
    const genreMap = new Map();
    
    // Start with books that match the current status filter
    let booksForGenreCounting = allBooksForGenres.books || [];
    
    if (filters.status !== 'all') {
      booksForGenreCounting = booksForGenreCounting.filter(book => 
        book.status === filters.status
      );
    }
    
    // Get currently selected genres
    const currentGenreFilters = filters.genre === 'all' 
      ? [] 
      : Array.isArray(filters.genre) ? filters.genre : [filters.genre];
    
    // Count genres based on books that match ALL current filters
    booksForGenreCounting.forEach(book => {
      // Collect all genres for this book
      const bookGenres = new Set();
      if (book.primaryCategory) bookGenres.add(book.primaryCategory);
      if (book.genres && Array.isArray(book.genres)) {
        book.genres.forEach(genre => bookGenres.add(genre));
      }
      
      // If book has no genres at all, categorize as "Uncategorized"
      if (bookGenres.size === 0) {
        bookGenres.add('Uncategorized');
      }
      
      // If genre filters are active, only count books that match ALL selected genres
      if (currentGenreFilters.length > 0) {
        const matchesAllFilters = currentGenreFilters.every(filterGenre => 
          bookGenres.has(filterGenre)
        );
        
        if (!matchesAllFilters) {
          return; // Skip this book if it doesn't match all current genre filters
        }
      }
      
      // Now count each genre this book has
      bookGenres.forEach(genre => {
        // For each genre, check if adding it to the filter would still show this book
        // This means the book must have this genre AND all currently selected genres
        if (currentGenreFilters.length === 0 || !currentGenreFilters.includes(genre)) {
          // Only count this genre if it's not already selected
          genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
        } else {
          // If this genre is already selected, still count it
          genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
        }
      });
    });
    
    // Convert to array and filter out genres with 0 count
    return Array.from(genreMap.entries())
      .filter(([name, count]) => count > 0) // Hide genres with 0 results
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [allBooksForGenres, filters.status, filters.genre]);

  // Calculate book counts
  const bookCounts = useMemo(() => {
    const counts = {
      all: 0,
      'to-read': 0,
      reading: 0,
      read: 0,
      loaned: 0,
    };
    
    if (allBooksForGenres.books) {
      allBooksForGenres.books.forEach(book => {
        const quantity = book.quantity || 1;
        counts.all += quantity;
        const status = book.status === 'available' ? 'to-read' : book.status;
        if (counts[status] !== undefined) {
          counts[status] += quantity;
        }
      });
    }
    
    return counts;
  }, [allBooksForGenres]);

  // Calculate total library stats
  const libraryStats = useMemo(() => {
    const totalBooks = allBooksForGenres.books?.reduce((sum, book) => sum + (book.quantity || 1), 0) || 0;
    const unreadBooks = allBooksForGenres.books?.reduce((sum, book) => {
      if (book.status === 'to-read') {
        return sum + (book.quantity || 1);
      }
      return sum;
    }, 0) || 0;
    
    return {
      totalBooks,
      unreadBooks,
    };
  }, [allBooksForGenres]);

  // Handler functions
  const handleSearch = useCallback((searchTerm) => {
    // If searching, turn off collections-only mode
    if (searchTerm && showCollectionsOnly) {
      setShowCollectionsOnly(false);
    }
    setFilters(prev => ({ ...prev, search: searchTerm }));
  }, [showCollectionsOnly]);

  const handleToggleCollectionsOnly = useCallback(() => {
    if (!showCollectionsOnly) {
      // When turning ON collections view, clear all filters
      setFilters({
        search: '',
        status: 'all',
        genre: 'all',
        excludeGenres: [],
        edition: 'all',
        sort: 'title',
      });
      setShowCollectionsOnly(true);
    } else {
      // When turning OFF collections view, just toggle it off
      setShowCollectionsOnly(false);
    }
  }, [showCollectionsOnly]);

  const handleFilterChange = useCallback((newFilters) => {
    // If any filter is being set (not 'all'), turn off collections mode
    const hasActiveFilter = newFilters.status !== 'all' || 
                           newFilters.genre !== 'all' || 
                           newFilters.edition !== 'all' ||
                           (newFilters.excludeGenres && newFilters.excludeGenres.length > 0);
    
    if (hasActiveFilter && showCollectionsOnly) {
      setShowCollectionsOnly(false);
    }
    
    setFilters(newFilters);
  }, [showCollectionsOnly]);

  const handleRemoveFilter = useCallback((filterKey) => {
    if (filterKey === 'excludeGenres') {
      setFilters(prev => ({
        ...prev,
        excludeGenres: []
      }));
    } else if (filterKey === 'includeEditions') {
      setFilters(prev => ({
        ...prev,
        includeEditions: []
      }));
    } else if (filterKey === 'excludeEditions') {
      setFilters(prev => ({
        ...prev,
        excludeEditions: []
      }));
    } else if (filterKey === 'includeCollections') {
      setFilters(prev => ({
        ...prev,
        includeCollections: []
      }));
    } else if (filterKey === 'excludeCollections') {
      setFilters(prev => ({
        ...prev,
        excludeCollections: []
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [filterKey]: filterKey === 'search' ? '' : 'all'
      }));
    }
    // Clear active shelf when filters are manually changed
    if (activeShelfId) {
      setActiveShelfId(null);
    }
  }, [activeShelfId]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      genre: 'all',
      excludeGenres: [],
      includeEditions: [],
      excludeEditions: [],
      includeCollections: [],
      excludeCollections: [],
      edition: 'all',
      sort: 'title',
    });
    setShowCollectionsOnly(false);
    setActiveShelfId(null);
  }, []);

  const handleBooksAdded = useCallback((newBooks) => {
    // Handle both single book and array of books
    const booksToAdd = Array.isArray(newBooks) ? newBooks : (newBooks ? [newBooks] : []);
    
    if (booksToAdd.length === 0) {
      // If no books provided, fall back to fetching from server
      imagePreloader.clearCache();
      fetchLibrary();
      return;
    }
    
    // Always update allBooksForGenres for genre counts etc
    setAllBooksForGenres(prev => ({
      ...prev,
      books: [...prev.books, ...booksToAdd]
    }));
    
    // Don't add books to display if showing collections only
    if (showCollectionsOnly) {
      imagePreloader.clearCache();
      return;
    }
    
    // Process each new book
    booksToAdd.forEach(newBook => {
      // Check if book matches current filters
      let matchesFilters = true;
      
      if (filters.status !== 'all' && newBook.status !== filters.status) {
        matchesFilters = false;
      }
      
      if (filters.genre !== 'all') {
        const genreFilters = Array.isArray(filters.genre) ? filters.genre : [filters.genre];
        const bookGenres = new Set();
        if (newBook.primaryCategory) bookGenres.add(newBook.primaryCategory);
        if (newBook.genres && Array.isArray(newBook.genres)) {
          newBook.genres.forEach(genre => bookGenres.add(genre));
        }
        if (bookGenres.size === 0) bookGenres.add('Uncategorized');
        
        if (!genreFilters.every(filterGenre => bookGenres.has(filterGenre))) {
          matchesFilters = false;
        }
      }
      
      if (filters.edition !== 'all' && newBook.edition !== filters.edition) {
        matchesFilters = false;
      }
      
      // Only add to display if it matches filters and not in collections-only mode
      if (matchesFilters && !showCollectionsOnly) {
        const newBookItem = {
          type: 'book',
          sortKey: newBook.title.toLowerCase().replace(/^(the |a |an )/i, ''),
          data: newBook,
          inCollection: newBook.collections && newBook.collections.length > 0
        };
        
        setLibraryItems(prev => {
          const updated = [...prev, newBookItem];
          
          // Apply current sort
          updated.sort((a, b) => {
            if (filters.sort === 'title' || filters.sort === '-title') {
              const multiplier = filters.sort.startsWith('-') ? -1 : 1;
              return multiplier * a.sortKey.localeCompare(b.sortKey);
            }
            
            if (filters.sort === '-addedDate' || filters.sort === 'addedDate') {
              const multiplier = filters.sort.startsWith('-') ? -1 : 1;
              
              if (a.type === 'collection' && b.type === 'book') return 1;
              if (a.type === 'book' && b.type === 'collection') return -1;
              
              if (a.type === 'book' && b.type === 'book') {
                return multiplier * (new Date(a.data.addedDate) - new Date(b.data.addedDate));
              }
              
              return a.sortKey.localeCompare(b.sortKey);
            }
            
            if (filters.sort === 'authors' || filters.sort === '-authors') {
              const multiplier = filters.sort.startsWith('-') ? -1 : 1;
              
              if (a.type === 'collection' && b.type === 'book') return 1;
              if (a.type === 'book' && b.type === 'collection') return -1;
              
              if (a.type === 'book' && b.type === 'book') {
                const getAuthorLastName = (book) => {
                  if (!book.authors || book.authors.length === 0) return '';
                  const firstAuthor = book.authors[0];
                  const nameParts = firstAuthor.trim().split(/\s+/);
                  return nameParts[nameParts.length - 1].toLowerCase();
                };
                
                const aName = getAuthorLastName(a.data);
                const bName = getAuthorLastName(b.data);
                return multiplier * aName.localeCompare(bName);
              }
              
              return a.sortKey.localeCompare(b.sortKey);
            }
            
            return 0;
          });
          
          return updated;
        });
        
        // Also add to allLibraryItems
        setAllLibraryItems(prev => [...prev, newBookItem]);
      }
    });
    
    // Clear image cache
    imagePreloader.clearCache();
  }, [filters, showCollectionsOnly]);

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
    if (!selectionMode) {
      setSelectedBook(book);
      setDetailsModalOpen(true);
    }
  }, [selectionMode]);

  const handleQuickEdit = useCallback((book) => {
    setSelectedBook(book);
    setDetailsModalOpen(true);
    // Set a flag to open in edit mode
    setOpenInEditMode(true);
  }, []);

  const handleAddToCollection = useCallback((book) => {
    setSelectedBook(book);
    setManageCollectionsOpen(true);
  }, []);

  const handleBookUpdated = useCallback((updatedBook) => {
    // Update the book in the local state immediately for instant feedback
    if (updatedBook) {
      // Update in allBooksForGenres which is used for filtering
      setAllBooksForGenres(prev => {
        const updatedBooks = prev.books.map(book => 
          book.isbn === updatedBook.isbn ? updatedBook : book
        );
        return { ...prev, books: updatedBooks };
      });
      
      // Check if the book should still be visible with current filters
      let bookMatchesFilters = true;
      
      // Check status filter
      if (filters.status !== 'all' && updatedBook.status !== filters.status) {
        bookMatchesFilters = false;
      }
      
      // Check genre filter
      if (filters.genre !== 'all') {
        const genreFilters = Array.isArray(filters.genre) ? filters.genre : [filters.genre];
        const bookGenres = new Set();
        if (updatedBook.primaryCategory) bookGenres.add(updatedBook.primaryCategory);
        if (updatedBook.genres && Array.isArray(updatedBook.genres)) {
          updatedBook.genres.forEach(genre => bookGenres.add(genre));
        }
        if (bookGenres.size === 0) bookGenres.add('Uncategorized');
        
        if (!genreFilters.every(filterGenre => bookGenres.has(filterGenre))) {
          bookMatchesFilters = false;
        }
      }
      
      // Check edition filter
      if (filters.edition !== 'all' && updatedBook.edition !== filters.edition) {
        bookMatchesFilters = false;
      }
      
      // Update or remove the book from library items based on filter match
      setLibraryItems(prev => {
        if (bookMatchesFilters) {
          // Update the book if it matches filters
          return prev.map(item => {
            if (item.type === 'book' && item.data.isbn === updatedBook.isbn) {
              return { 
                ...item, 
                data: updatedBook,
                sortKey: updatedBook.title.toLowerCase().replace(/^(the |a |an )/i, ''),
              };
            }
            return item;
          });
        } else {
          // Remove the book if it doesn't match filters anymore
          return prev.filter(item => 
            !(item.type === 'book' && item.data.isbn === updatedBook.isbn)
          );
        }
      });
      
      // Always update in allLibraryItems
      setAllLibraryItems(prev => prev.map(item => {
        if (item.type === 'book' && item.data.isbn === updatedBook.isbn) {
          return { 
            ...item, 
            data: updatedBook,
            sortKey: updatedBook.title.toLowerCase().replace(/^(the |a |an )/i, ''),
          };
        }
        return item;
      }));
      
      // Also update the selected book if it's the same
      setSelectedBook(prev => {
        if (prev?.isbn === updatedBook.isbn) {
          return updatedBook;
        }
        return prev;
      });
    }
    
    // Clear image cache to force reload
    imagePreloader.clearCache();
    
    // Don't fetch from server - just update local state to maintain filters
  }, [filters]);

  const handleBookDeleted = useCallback(() => {
    fetchLibrary();
    setDetailsModalOpen(false);
  }, []);

  const handleCollectionToggle = useCallback((collectionId, expanded) => {
    toggleCollection(collectionId);
  }, [toggleCollection]);

  const handleToggleSelectionMode = useCallback(() => {
    if (selectionMode) {
      exitSelectionMode();
    } else {
      enterSelectionMode();
    }
  }, [selectionMode, enterSelectionMode, exitSelectionMode]);

  // Bulk action handlers
  const handleBulkStatusChange = useCallback(async (newStatus) => {
    try {
      setIsProcessing(true);
      const promises = selectedIds.map(id => {
        const book = bookItems.find(item => 
          (item.data._id === id || item.data.isbn === id)
        )?.data;
        if (book) {
          return bookService.updateBook(book.isbn, { status: newStatus });
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      fetchLibrary();
      clearSelection();
      exitSelectionMode();
    } catch (error) {
      console.error('Failed to update books:', error);
      setError('Failed to update selected books');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, bookItems, clearSelection, exitSelectionMode]);

  const handleBulkAddToCollection = useCallback(() => {
    setBulkCollectionsOpen(true);
  }, []);

  const handleBulkDelete = useCallback(() => {
    setBulkDeleteConfirmOpen(true);
  }, []);

  const confirmBulkDelete = useCallback(async () => {
    try {
      setIsProcessing(true);
      const promises = selectedIds.map(id => {
        const book = bookItems.find(item => 
          (item.data._id === id || item.data.isbn === id)
        )?.data;
        if (book) {
          return bookService.deleteBook(book.isbn);
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      fetchLibrary();
      clearSelection();
      exitSelectionMode();
      setBulkDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Failed to delete books:', error);
      setError('Failed to delete selected books');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, bookItems, clearSelection, exitSelectionMode]);

  const handleBulkCollectionAdd = useCallback(async (collectionId) => {
    try {
      setIsProcessing(true);
      const bookIsbns = selectedIds.map(id => {
        const book = bookItems.find(item => 
          (item.data._id === id || item.data.isbn === id)
        )?.data;
        return book?.isbn;
      }).filter(Boolean);
      
      if (bookIsbns.length > 0) {
        await collectionService.addBooksToCollection(collectionId, bookIsbns);
        fetchLibrary();
        clearSelection();
        exitSelectionMode();
        setBulkCollectionsOpen(false);
      }
    } catch (error) {
      console.error('Failed to add books to collection:', error);
      setError('Failed to add selected books to collection');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, bookItems, clearSelection, exitSelectionMode]);

  const hasActiveFilters = filters.search !== '' || 
                          filters.status !== 'all' || 
                          filters.genre !== 'all' ||
                          filters.excludeGenres.length > 0 ||
                          filters.includeEditions.length > 0 ||
                          filters.excludeEditions.length > 0 ||
                          filters.includeCollections.length > 0 ||
                          filters.excludeCollections.length > 0 ||
                          filters.edition !== 'all';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sticky Toolbar */}
      <StickyToolbar
        onAddBook={handleOpenAddModal}
        onQuickAdd={() => setQuickAddModalOpen(true)}
        onCreateCollection={() => setCreateCollectionOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filters={filters}
        onFilterChange={handleFilterChange}
        genres={genres}
        bookCounts={bookCounts}
        selectionMode={selectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
        showCollectionsOnly={showCollectionsOnly}
        onToggleCollectionsOnly={handleToggleCollectionsOnly}
      />
      
      {/* Sticky Search and Stats Section */}
      <Box
        sx={{
          position: 'sticky',
          top: 48, // Below StickyToolbar (48px)
          zIndex: theme.zIndex.appBar - 2,
          bgcolor: 'background.default',
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: 1.5,
          boxShadow: theme.shadows[1],
          backdropFilter: 'blur(8px)',
          backgroundColor: alpha(theme.palette.background.default, 0.95),
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            justifyContent: 'center',
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}>
            {/* Library Stats - Compact */}
            <LibraryStats 
              totalQuantity={libraryStats.totalBooks}
              unreadCount={libraryStats.unreadBooks}
            />
            
            {/* Search Bar */}
            <SearchBar 
              onSearch={handleSearch} 
              isSearching={isSearching}
            />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 2, pb: selectionMode ? 8 : 2 }}>
        {/* Custom Shelf Bar */}
        {customShelves.length > 0 && (
          <CustomShelfBar
            shelves={customShelves}
            activeShelfId={activeShelfId}
            onApplyShelf={handleApplyShelf}
            onEditShelf={handleEditShelf}
            onDeleteShelf={handleDeleteShelf}
            onManageShelves={() => setManageShelvesModalOpen(true)}
          />
        )}

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <Box sx={{ mb: 2 }}>
            <ActiveFilterChips
              filters={filters}
              collections={allBooksForGenres.collections}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearFilters}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setEditingShelf(null);
                setCreateShelfModalOpen(true);
              }}
              sx={{ mt: 1 }}
            >
              💾 Save as Shelf
            </Button>
          </Box>
        )}

        {/* Results summary */}
        {!loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2,
          }}>
            <Typography variant="body2" color="text.secondary">
              {(() => {
                // Add indicator when showing collections only
                if (showCollectionsOnly) {
                  const collectionCount = filteredItems.length;
                  if (collectionCount === 0) return 'No collections found';
                  const itemRange = `${Math.min((page - 1) * itemsPerPage + 1, collectionCount)}-${Math.min(page * itemsPerPage, collectionCount)} of ${collectionCount}`;
                  return `Showing ${itemRange} collections`;
                }
                
                // Normal display logic
                const bookCount = filteredItems.filter(item => item.type === 'book')
                  .reduce((sum, item) => sum + (item.data.quantity || 1), 0);
                const collectionCount = filteredItems.filter(item => item.type === 'collection').length;
                
                if (filteredItems.length === 0) return 'No items found';
                
                const itemRange = `${Math.min((page - 1) * itemsPerPage + 1, filteredItems.length)}-${Math.min(page * itemsPerPage, filteredItems.length)} of ${filteredItems.length}`;
                const bookText = bookCount > 0 ? `${bookCount} book${bookCount !== 1 ? 's' : ''}` : '';
                const collectionText = collectionCount > 0 ? `${collectionCount} collection${collectionCount !== 1 ? 's' : ''}` : '';
                
                const countText = [bookText, collectionText].filter(Boolean).join(' and ');
                return `Showing ${itemRange} items (${countText})`;
              })()}
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
            <CircularProgress size={60} thickness={4} />
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
                borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, white 100%)`,
              }}
            >
              <Typography 
                variant="h5" 
                color="text.secondary" 
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                {showCollectionsOnly 
                  ? 'No collections found' 
                  : (hasActiveFilters ? 'No items match your filters' : 'Your library is empty')
                }
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {showCollectionsOnly 
                  ? 'Create your first collection to organize your books'
                  : (hasActiveFilters 
                    ? 'Try adjusting your filters or search terms'
                    : 'Start by adding some books to your collection'
                  )
                }
              </Typography>
              {!hasActiveFilters && (
                <Box sx={{ mt: 3 }}>
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      fontSize: 80,
                      opacity: 0.3,
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
          <Box>
            {viewMode === 'grid' ? (
              <Grid container spacing={2}>
                {paginatedItems.map((item, index) => (
                  <Grow
                    in
                    key={item.data._id || item.data.isbn}
                    timeout={300 + index * 50}
                    style={{ transformOrigin: '0 0 0' }}
                  >
                    <Grid item xs={4} sm={3} md={2} lg={1.2} xl={1.2}>
                      {item.type === 'collection' ? (
                        <CollectionCard
                          collection={item.data}
                          expanded={expandedCollections.has(item.data._id)}
                          onToggleExpand={handleCollectionToggle}
                          onClick={() => navigate(`/collections/${item.data._id}`)}
                          viewMode="grid"
                          compact={true}
                        />
                      ) : (
                        <BookCard 
                          book={item.data} 
                          onClick={handleBookClick}
                          onQuickEdit={() => handleQuickEdit(item.data)}
                          onAddToCollection={() => handleAddToCollection(item.data)}
                          selectionMode={selectionMode}
                          isSelected={isSelected(item.data._id || item.data.isbn)}
                          onToggleSelection={toggleSelection}
                        />
                      )}
                    </Grid>
                  </Grow>
                ))}
              </Grid>
            ) : (
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
                  } else {
                    return null;
                  }
                })}
                <BookList 
                  books={paginatedItems.filter(item => item.type === 'book').map(item => item.data)} 
                  onBookClick={handleBookClick}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                  onToggleSelection={toggleSelection}
                />
              </Box>
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
        )}
      </Container>

      {/* Bulk Action Bar */}
      <BulkActionBar
        visible={selectionMode && selectedCount > 0}
        selectedCount={selectedCount}
        totalCount={bookItems.length}
        onClose={exitSelectionMode}
        onSelectAll={() => selectAll()}
        onClearSelection={clearSelection}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkAddToCollection={handleBulkAddToCollection}
        onBulkDelete={handleBulkDelete}
        isProcessing={isProcessing}
      />

      {/* Bulk Collections Dialog */}
      <Dialog
        open={bulkCollectionsOpen}
        onClose={() => setBulkCollectionsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add {selectedCount} Books to Collection</DialogTitle>
        <DialogContent>
          <List>
            {allBooksForGenres.collections?.map((collection) => (
              <ListItem
                key={collection._id}
                button
                onClick={() => handleBulkCollectionAdd(collection._id)}
              >
                <ListItemText
                  primary={collection.name}
                  secondary={`${collection.books?.length || 0} books`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkCollectionsOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <Dialog
        open={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete {selectedCount} Books?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedCount} selected {selectedCount === 1 ? 'book' : 'books'}? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteConfirmOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmBulkDelete} 
            color="error" 
            variant="contained"
            disabled={isProcessing}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Other Modals */}
      <QuickAddBooks
        open={quickAddModalOpen}
        onClose={() => setQuickAddModalOpen(false)}
        onBooksAdded={handleBooksAdded}
      />

      <AddBookModal
        open={manualAddModalOpen}
        onClose={() => setManualAddModalOpen(false)}
        onBookAdded={handleBooksAdded}
      />

      <BookDetailsModal
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedBook(null);
          setOpenInEditMode(false);
        }}
        book={selectedBook}
        onBookUpdated={handleBookUpdated}
        onBookDeleted={handleBookDeleted}
        onManageCollections={() => {
          setManageCollectionsOpen(true);
        }}
        openInEditMode={openInEditMode}
      />

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
      
      <CreateCollectionModal
        open={createCollectionOpen}
        onClose={() => setCreateCollectionOpen(false)}
        onCollectionCreated={(collection) => {
          setCreateCollectionOpen(false);
          fetchLibrary();
          navigate(`/collections/${collection._id}`);
        }}
      />
      
      {/* Custom Shelf Modals */}
      <CreateShelfModal
        open={createShelfModalOpen}
        onClose={() => {
          setCreateShelfModalOpen(false);
          setEditingShelf(null);
        }}
        onSave={editingShelf ? handleUpdateShelf : handleSaveAsShelf}
        filters={filters}
        collections={allBooksForGenres.collections}
        editMode={!!editingShelf}
        initialName={editingShelf?.name || ''}
        initialFilters={editingShelf?.filters || null}
      />
      
      <ManageShelvesModal
        open={manageShelvesModalOpen}
        onClose={() => setManageShelvesModalOpen(false)}
        shelves={customShelves}
        onEdit={handleEditShelf}
        onDelete={handleDeleteShelf}
        onReorder={handleReorderShelves}
      />
    </Box>
  );
};

export default Library;
