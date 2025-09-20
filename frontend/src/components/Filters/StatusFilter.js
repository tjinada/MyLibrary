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
    { value: 'to-read', label: 'To Read', color: 'info' },
    { value: 'reading', label: 'Reading', color: 'primary' },
    { value: 'read', label: 'Read', color: 'success' },
    { value: 'loaned', label: 'Loaned', color: 'warning' },
  ];

  // Get count only for 'All Books'
  const getCount = (status) => {
    if (status === 'all') return bookCounts.all;
    return null; // Don't show count for individual statuses
  };

  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>Status</InputLabel>
      <Select
        value={value}
        label="Status"
        onChange={(e) => onChange(e.target.value)}
      >
        {statuses.map((status) => {
          const count = getCount(status.value);
          return (
            <MenuItem key={status.value} value={status.value}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {status.label}
                {count !== null && (
                  <Chip 
                    label={count} 
                    size="small" 
                    color={status.color}
                  />
                )}
              </div>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

export default StatusFilter;
