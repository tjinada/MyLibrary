import { useState, useCallback, useMemo } from 'react';

const useSelection = (items = []) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const toggleSelection = useCallback((id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = items.map(item => 
      item.data?._id || item.data?.isbn || item._id || item.isbn
    ).filter(Boolean);
    setSelectedIds(new Set(allIds));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const enterSelectionMode = useCallback(() => {
    setSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    clearSelection();
  }, [clearSelection]);

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);
  
  const selectedItems = useMemo(() => {
    return items.filter(item => {
      const id = item.data?._id || item.data?.isbn || item._id || item.isbn;
      return selectedIds.has(id);
    });
  }, [items, selectedIds]);

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount,
    selectedItems,
    selectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    enterSelectionMode,
    exitSelectionMode,
  };
};

export default useSelection;
