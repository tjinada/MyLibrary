import React, { useState } from 'react';
import {
  Box,
  Button,
  Popover,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Badge,
  useTheme,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { statusColors } from '../../theme/theme';

const FilterPopover = ({ 
  filters, 
  onFilterChange, 
  genres, 
  bookCounts,
  activeFilterCount 
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handleFilterUpdate = (filterType, value) => {
    onFilterChange({ ...filters, [filterType]: value });
  };

  return (
    <>
      <Badge badgeContent={activeFilterCount} color="primary">
        <Button
          variant={activeFilterCount > 0 ? 'contained' : 'outlined'}
          startIcon={<FilterIcon />}
          onClick={handleOpen}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          Filters
        </Button>
      </Badge>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 500,
            borderRadius: 2,
            mt: 1,
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filters
            </Typography>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Status Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
              Reading Status
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.status}
                onChange={(e) => handleFilterUpdate('status', e.target.value)}
                sx={{ borderRadius: 1.5 }}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ flexGrow: 1 }}>All Books</Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {bookCounts.all}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="to-read">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: statusColors['to-read'],
                        mr: 1
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>To Read</Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {bookCounts['to-read']}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="reading">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: statusColors['reading'],
                        mr: 1
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>Reading</Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {bookCounts.reading}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="read">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: statusColors['read'],
                        mr: 1
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>Read</Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {bookCounts.read}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="loaned">
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: statusColors['loaned'],
                        mr: 1
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>Loaned</Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {bookCounts.loaned}
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Genre Filter */}
          {genres && genres.length > 0 && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                  Genre
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={filters.genre}
                    onChange={(e) => handleFilterUpdate('genre', e.target.value)}
                    sx={{ borderRadius: 1.5 }}
                  >
                    <MenuItem value="all">All Genres</MenuItem>
                    {genres.map((genre) => (
                      <MenuItem key={genre.name} value={genre.name}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Box sx={{ flexGrow: 1 }}>{genre.name}</Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {genre.count}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Divider sx={{ my: 2 }} />
            </>
          )}

          {/* Sort Options */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
              Sort By
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.sort}
                onChange={(e) => handleFilterUpdate('sort', e.target.value)}
                sx={{ borderRadius: 1.5 }}
              >
                <MenuItem value="title">Title (A-Z)</MenuItem>
                <MenuItem value="-title">Title (Z-A)</MenuItem>
                <MenuItem value="-addedDate">Recently Added</MenuItem>
                <MenuItem value="addedDate">Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Clear Filters Button */}
          {activeFilterCount > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={() => {
                  onFilterChange({
                    search: '',
                    status: 'all',
                    genre: 'all',
                    sort: 'title',
                  });
                  handleClose();
                }}
                sx={{ textTransform: 'none' }}
              >
                Clear All Filters
              </Button>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default FilterPopover;
