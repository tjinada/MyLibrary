import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  SortByAlpha,
  DateRange,
  Star,
  Person,
} from '@mui/icons-material';

const SortControl = ({ value, onChange }) => {
  const sortOptions = [
    { value: '-addedDate', label: 'Recently Added', icon: <DateRange /> },
    { value: 'addedDate', label: 'Oldest First', icon: <DateRange /> },
    { value: 'title', label: 'Title (A-Z)', icon: <SortByAlpha /> },
    { value: '-title', label: 'Title (Z-A)', icon: <SortByAlpha /> },
    { value: 'authors', label: 'Author (A-Z)', icon: <Person /> },
    { value: '-authors', label: 'Author (Z-A)', icon: <Person /> },
    { value: '-rating', label: 'Rating (High to Low)', icon: <Star /> },
    { value: 'rating', label: 'Rating (Low to High)', icon: <Star /> },
  ];

  return (
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <InputLabel>Sort By</InputLabel>
      <Select
        value={value}
        label="Sort By"
        onChange={(e) => onChange(e.target.value)}
      >
        {sortOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {React.cloneElement(option.icon, { fontSize: 'small' })}
              {option.label}
            </div>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SortControl;
