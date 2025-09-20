import React from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Zoom,
} from '@mui/material';
import {
  MenuBook as ToReadIcon,
  AutoStories as ReadingIcon,
  CheckCircle as ReadIcon,
  SwapHoriz as LoanedIcon,
} from '@mui/icons-material';
import { statusColors } from '../../theme/theme';

const StatusPills = ({ status, onChange, disabled = false }) => {
  const statusOptions = [
    { value: 'to-read', label: 'To Read', icon: <ToReadIcon fontSize="small" /> },
    { value: 'reading', label: 'Reading', icon: <ReadingIcon fontSize="small" /> },
    { value: 'read', label: 'Read', icon: <ReadIcon fontSize="small" /> },
    { value: 'loaned', label: 'Loaned', icon: <LoanedIcon fontSize="small" /> },
  ];

  const handleChange = (event, newStatus) => {
    if (newStatus !== null) {
      onChange(newStatus);
    }
  };

  return (
    <Box>
      <Typography variant="overline" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
        Reading Status
      </Typography>
      <ToggleButtonGroup
        value={status || 'to-read'}
        exclusive
        onChange={handleChange}
        aria-label="reading status"
        disabled={disabled}
        sx={{
          '& .MuiToggleButton-root': {
            px: 2,
            py: 0.75,
            borderRadius: 3,
            border: 'none',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
            bgcolor: 'grey.100',
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'grey.200',
            },
            '&.Mui-selected': {
              color: 'white',
              '&:hover': {
                filter: 'brightness(0.9)',
              },
            },
            '&:first-of-type': {
              ml: 0,
            },
            '&:not(:first-of-type)': {
              ml: 1,
            },
          },
          '& .MuiToggleButton-root.Mui-selected': {
            '&[value="to-read"]': {
              bgcolor: statusColors['to-read'],
              '&:hover': {
                bgcolor: statusColors['to-read'],
              },
            },
            '&[value="reading"]': {
              bgcolor: statusColors['reading'],
              '&:hover': {
                bgcolor: statusColors['reading'],
              },
            },
            '&[value="read"]': {
              bgcolor: statusColors['read'],
              '&:hover': {
                bgcolor: statusColors['read'],
              },
            },
            '&[value="loaned"]': {
              bgcolor: statusColors['loaned'],
              '&:hover': {
                bgcolor: statusColors['loaned'],
              },
            },
          },
        }}
      >
        {statusOptions.map((option) => (
          <ToggleButton value={option.value} key={option.value}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Zoom in={status === option.value}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {option.icon}
                </Box>
              </Zoom>
              {option.label}
            </Box>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default StatusPills;
