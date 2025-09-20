import { useState, useCallback, useRef, useEffect } from 'react';

const useVirtualization = (items, itemsPerPage, containerRef) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: itemsPerPage });
  const scrollTimeoutRef = useRef(null);
  
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    // Debounce scroll handling
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      const scrollHeight = container.scrollHeight;
      
      // Calculate which items should be visible based on scroll position
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
      const centerIndex = Math.floor(items.length * scrollPercentage);
      
      // Add buffer for smooth scrolling
      const buffer = Math.floor(itemsPerPage / 2);
      const start = Math.max(0, centerIndex - buffer);
      const end = Math.min(items.length, centerIndex + itemsPerPage + buffer);
      
      setVisibleRange({ start, end });
    }, 50);
  }, [items.length, itemsPerPage]);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);
  
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  
  // Calculate spacers for maintaining scroll position
  const spacerTop = visibleRange.start * 200; // Approximate item height
  const spacerBottom = (items.length - visibleRange.end) * 200;
  
  return {
    visibleItems,
    spacerTop,
    spacerBottom,
    totalItems: items.length,
  };
};

export default useVirtualization;
