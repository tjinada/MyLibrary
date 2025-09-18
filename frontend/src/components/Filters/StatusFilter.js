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

  // Map old status values to new ones for count display
  const getCount = (status) => {
    if (status === 'all') return bookCounts.all;
    if (status === 'to-read') return bookCounts['to-read'] || bookCounts.available || 0;
    return bookCounts[status] || 0;
  };

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
              {bookCounts && (
                <Chip 
                  label={getCount(status.value)} 
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
