import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';

const GenreFilter = ({ value, onChange, genres = [] }) => {
  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>Genre</InputLabel>
      <Select
        value={value}
        label="Genre"
        onChange={(e) => onChange(e.target.value)}
      >
        <MenuItem value="all">All Genres</MenuItem>
        {genres.map((genre) => (
          <MenuItem key={genre.name} value={genre.name}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {genre.name}
              <Chip label={genre.count} size="small" />
            </div>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default GenreFilter;
