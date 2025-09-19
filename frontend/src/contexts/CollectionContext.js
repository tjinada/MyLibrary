import React, { createContext, useState, useContext, useEffect } from 'react';
import collectionService from '../services/collectionService';

const CollectionContext = createContext();

export const useCollections = () => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error('useCollections must be used within a CollectionProvider');
  }
  return context;
};

export const CollectionProvider = ({ children }) => {
  const [collections, setCollections] = useState([]);
  const [expandedCollections, setExpandedCollections] = useState(new Set());
  const [collectionView, setCollectionView] = useState('unified');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load expanded collections from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('expandedCollections');
    if (saved) {
      try {
        setExpandedCollections(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Failed to load expanded collections:', e);
      }
    }
  }, []);

  // Fetch all collections
  const fetchCollections = async (includeBooks = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await collectionService.getCollections(includeBooks);
      setCollections(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch collections');
      console.error('Error fetching collections:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle collection expansion
  const toggleCollection = (collectionId) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      localStorage.setItem('expandedCollections', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  // Create new collection
  const createCollection = async (collectionData) => {
    try {
      const newCollection = await collectionService.createCollection(collectionData);
      setCollections(prev => [...prev, newCollection]);
      return newCollection;
    } catch (err) {
      setError(err.message || 'Failed to create collection');
      throw err;
    }
  };

  // Update collection
  const updateCollection = async (collectionId, updates) => {
    try {
      const updated = await collectionService.updateCollection(collectionId, updates);
      setCollections(prev => 
        prev.map(c => c._id === collectionId ? updated : c)
      );
      return updated;
    } catch (err) {
      setError(err.message || 'Failed to update collection');
      throw err;
    }
  };

  // Delete collection
  const deleteCollection = async (collectionId) => {
    try {
      await collectionService.deleteCollection(collectionId);
      setCollections(prev => prev.filter(c => c._id !== collectionId));
    } catch (err) {
      setError(err.message || 'Failed to delete collection');
      throw err;
    }
  };

  // Add book to collection
  const addBookToCollection = async (collectionId, bookId) => {
    try {
      const updated = await collectionService.addBookToCollection(collectionId, bookId);
      setCollections(prev => 
        prev.map(c => c._id === collectionId ? updated : c)
      );
      return updated;
    } catch (err) {
      setError(err.message || 'Failed to add book to collection');
      throw err;
    }
  };

  // Remove book from collection
  const removeBookFromCollection = async (collectionId, bookId) => {
    try {
      const updated = await collectionService.removeBookFromCollection(collectionId, bookId);
      setCollections(prev => 
        prev.map(c => c._id === collectionId ? updated : c)
      );
      return updated;
    } catch (err) {
      setError(err.message || 'Failed to remove book from collection');
      throw err;
    }
  };

  // Bulk add books to collection
  const bulkAddBooks = async (collectionId, bookIds) => {
    try {
      const updated = await collectionService.bulkAddBooks(collectionId, bookIds);
      setCollections(prev => 
        prev.map(c => c._id === collectionId ? updated : c)
      );
      return updated;
    } catch (err) {
      setError(err.message || 'Failed to add books to collection');
      throw err;
    }
  };

  // Reorder books in series
  const reorderBooks = async (collectionId, bookOrder) => {
    try {
      const updated = await collectionService.reorderBooks(collectionId, bookOrder);
      setCollections(prev => 
        prev.map(c => c._id === collectionId ? updated : c)
      );
      return updated;
    } catch (err) {
      setError(err.message || 'Failed to reorder books');
      throw err;
    }
  };

  const value = {
    collections,
    expandedCollections,
    collectionView,
    loading,
    error,
    fetchCollections,
    toggleCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    addBookToCollection,
    removeBookFromCollection,
    bulkAddBooks,
    reorderBooks,
    setCollectionView
  };

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
};
