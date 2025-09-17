import React, { useState, useCallback, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { debounce } from 'lodash';

const SearchBar = ({ onSearch, placeholder = "Search by title, author, or ISBN..." }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term) => {
      onSearch(term);
    }, 300),
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
    <Box sx={{ width: '100%', maxWidth: 600 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton
                aria-label="clear search"
                onClick={handleClear}
                edge="end"
                size="small"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 1,
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'divider',
            },
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
          },
        }}
      />
    </Box>
  );
};

export default SearchBar;
