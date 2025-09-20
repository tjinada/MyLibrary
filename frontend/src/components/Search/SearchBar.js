import React, { useState, useCallback, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { debounce } from 'lodash';

const SearchBar = ({ 
  onSearch, 
  placeholder = "Search books, authors, ISBN...",
  isSearching = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search function for instant search
  const debouncedSearch = useCallback(
    debounce((term) => {
      onSearch(term);
    }, 200), // Reduced to 200ms for more responsive feel with 500+ books
    [onSearch]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <Box 
      sx={{ 
        width: '100%', 
        maxWidth: 600,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isFocused ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {isSearching ? (
                <CircularProgress size={20} />
              ) : (
                <SearchIcon 
                  sx={{ 
                    color: isFocused ? 'primary.main' : 'action.active',
                    transition: 'color 0.2s',
                  }} 
                />
              )}
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton
                aria-label="clear search"
                onClick={handleClear}
                edge="end"
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'error.main',
                    bgcolor: alpha('#ef4444', 0.1),
                  },
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'background.paper',
            borderRadius: 3,
            transition: 'all 0.2s',
            boxShadow: isFocused ? '0 0 0 3px ' + alpha('#6366F1', 0.1) : '0 1px 3px rgba(0,0,0,0.1)',
            '& fieldset': {
              borderColor: isFocused ? 'primary.main' : 'divider',
              borderWidth: isFocused ? 2 : 1.5,
              transition: 'all 0.2s',
            },
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
              borderWidth: 2,
            },
          },
          '& .MuiInputBase-input': {
            fontSize: '0.95rem',
            fontWeight: 500,
            '&::placeholder': {
              opacity: 0.6,
            },
          },
        }}
      />
    </Box>
  );
};

export default SearchBar;
