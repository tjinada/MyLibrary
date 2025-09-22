import React from 'react';
import { Chip, Box } from '@mui/material';
import { statusColors } from '../../theme/theme';
import { 
  Star as SpecialIcon,
  Diamond as DeluxeIcon 
} from '@mui/icons-material';

const BookStatusChip = ({ status, size = 'small', showLabel = true }) => {
  const getStatusLabel = (status) => {
    switch (status) {
      case 'to-read':
        return 'To Read';
      case 'reading':
        return 'Reading';
      case 'read':
        return 'Read';
      case 'loaned':
        return 'Loaned';
      case 'available':
        return 'To Read';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'to-read':
      case 'available':
        return '📚';
      case 'reading':
        return '📖';
      case 'read':
        return '✓';
      case 'loaned':
        return '🔄';
      default:
        return '';
    }
  };

  return (
    <Chip
      label={showLabel ? getStatusLabel(status) : getStatusIcon(status)}
      size={size}
      sx={{
        backgroundColor: statusColors[status] || statusColors['to-read'],
        color: 'white',
        fontWeight: 600,
        fontSize: size === 'small' ? '0.65rem' : '0.75rem',
        height: size === 'small' ? 20 : 24,
        '& .MuiChip-label': {
          px: showLabel ? 1 : 0.5,
        },
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
    />
  );
};

export const BookEditionBadge = ({ edition, size = 'small' }) => {
  if (!edition || edition === 'standard') return null;

  const getEditionConfig = () => {
    switch (edition) {
      case 'signed':
        return {
          label: 'Signed',
          icon: <SpecialIcon sx={{ fontSize: 14 }} />,
          gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        };
      case 'deluxe':
        return {
          label: 'Deluxe',
          icon: <DeluxeIcon sx={{ fontSize: 14 }} />,
          gradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
        };
      default:
        return null;
    }
  };

  const config = getEditionConfig();
  if (!config) return null;

  return (
    <Chip
      label={config.label}
      icon={config.icon}
      size={size}
      sx={{
        background: config.gradient,
        color: 'white',
        fontWeight: 600,
        fontSize: size === 'small' ? '0.65rem' : '0.75rem',
        height: size === 'small' ? 20 : 24,
        '& .MuiChip-icon': {
          color: 'white',
        },
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
    />
  );
};

export default BookStatusChip;
