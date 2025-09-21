import { useState, useCallback, useMemo } from 'react';

const useFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    genre: 'all',
    edition: 'all',
    sort: 'title',
    ...initialFilters,
  });

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const removeFilter = useCallback((key) => {
    setFilters(prev => ({
      ...prev,
      [key]: key === 'search' ? '' : 'all',
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      genre: 'all',
      edition: 'all',
      sort: 'title',
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    return [
      filters.search !== '',
      filters.status !== 'all',
      filters.genre !== 'all',
      filters.edition !== 'all',
    ].filter(Boolean).length;
  }, [filters]);

  const hasActiveFilters = useMemo(() => {
    return activeFilterCount > 0;
  }, [activeFilterCount]);

  const getActiveFilters = useMemo(() => {
    const active = [];
    
    if (filters.search) {
      active.push({
        key: 'search',
        label: `Search: "${filters.search}"`,
        value: filters.search,
      });
    }
    
    if (filters.status !== 'all') {
      active.push({
        key: 'status',
        label: `Status: ${filters.status.charAt(0).toUpperCase() + filters.status.slice(1).replace('-', ' ')}`,
        value: filters.status,
      });
    }
    
    if (filters.genre !== 'all') {
      active.push({
        key: 'genre',
        label: `Genre: ${filters.genre}`,
        value: filters.genre,
      });
    }
    
    if (filters.edition !== 'all') {
      active.push({
        key: 'edition',
        label: `Edition: ${filters.edition.charAt(0).toUpperCase() + filters.edition.slice(1)}`,
        value: filters.edition,
      });
    }
    
    return active;
  }, [filters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    removeFilter,
    clearFilters,
    activeFilterCount,
    hasActiveFilters,
    getActiveFilters,
  };
};

export default useFilters;
