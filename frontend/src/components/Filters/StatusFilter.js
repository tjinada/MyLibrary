import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';

const StatusFilter = ({ value, onChange, bookCounts = {} }) => {
  const statuses = [
    { value: 'all', label: 'All Books', color: 'default' },
    { value: 'available', label: 'Available', color: 'success' },
    { value: 'reading', label: 'Reading', color: 'primary' },
    { value: 'loaned', label: 'Loaned', color: 'warning' },
    { value: 'wishlist', label: 'Wishlist', color: 'default' },
  ];

  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>Status</InputLabel>
      <Select
        value={value}
        label="Status"
        onChange={(e) => onChange(e.target.value)}
      >
        {statuses.map((status) => (
          <MenuItem key={status.value} value={status.value}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {status.label}
              {bookCounts[status.value] !== undefined && (
                <Chip 
                  label={bookCounts[status.value]} 
                  size="small" 
                  color={status.color}
                />
              )}
            </div>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default StatusFilter;
