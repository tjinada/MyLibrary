import React from 'react';
import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  AutoStories as LibraryIcon,
  CollectionsBookmark as CollectionsIcon,
  QrCodeScanner as ScanIcon,
  BarChart as StatsIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { gradients } from '../../theme/theme';

const NAV_ITEMS = [
  { value: 'library', label: 'Library', icon: <LibraryIcon />, path: '/library' },
  { value: 'collections', label: 'Collections', icon: <CollectionsIcon />, path: '/collections' },
  { value: 'add', label: 'Add' },
  { value: 'stats', label: 'Stats', icon: <StatsIcon />, path: '/dashboard' },
];

const AddIcon = () => (
  <Box
    sx={{
      width: 44,
      height: 28,
      borderRadius: '10px',
      background: gradients.action,
      color: 'common.white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mb: 0.25,
    }}
  >
    <ScanIcon sx={{ fontSize: 18 }} />
  </Box>
);

// Mobile-only primary navigation, fixed to the bottom of the screen.
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const current = NAV_ITEMS.find((item) => item.path && location.pathname.startsWith(item.path));

  const handleChange = (_event, value) => {
    if (value === 'add') {
      // Library owns the quick-add modal; a fresh state value re-opens it on every tap.
      navigate('/library', { state: { quickAdd: Date.now() } });
      return;
    }
    const target = NAV_ITEMS.find((item) => item.value === value);
    if (target) navigate(target.path);
  };

  return (
    <Paper
      component="nav"
      aria-label="Primary"
      square
      elevation={0}
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        bgcolor: 'grey.900',
        border: 0,
        borderTop: '1px solid',
        borderColor: 'grey.800',
        pb: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <BottomNavigation showLabels value={current ? current.value : false} onChange={handleChange}>
        {NAV_ITEMS.map((item) => (
          <BottomNavigationAction
            key={item.value}
            value={item.value}
            label={item.label}
            icon={item.value === 'add' ? <AddIcon /> : item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
