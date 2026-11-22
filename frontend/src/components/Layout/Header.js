import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Button,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  AutoStories as LogoIcon,
  Description as CsvIcon,
  CollectionsBookmark as CollectionsIcon,
  MenuBook as BooksIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import bookService from '../../services/bookService';
import collectionService from '../../services/collectionService';
import exportService from '../../services/exportService';
import { gradients } from '../../theme/theme';

const NAV_LINKS = [
  { to: '/library', label: 'Library' },
  { to: '/collections', label: 'Collections' },
  { to: '/dashboard', label: 'Stats' },
];

const EXPORT_OPTIONS = [
  { type: 'all', label: 'Export all', hint: 'Books & collections', icon: <CsvIcon fontSize="small" /> },
  { type: 'books', label: 'Export books', hint: 'All books as CSV', icon: <BooksIcon fontSize="small" /> },
  { type: 'collections', label: 'Export collections', hint: 'All collections as CSV', icon: <CollectionsIcon fontSize="small" /> },
];

const Header = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  const handleExport = async (type) => {
    setExporting(true);
    handleClose();

    try {
      const [booksResponse, collections] = await Promise.all([
        bookService.getBooks({ page: 1, limit: 10000 }), // Get all books
        collectionService.getCollections(true), // Collections with book details
      ]);

      exportService.exportLibrary(
        { books: booksResponse.books || [], collections: collections || [] },
        type
      );
      setExportSuccess(true);
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(true);
    } finally {
      setExporting(false);
    }
  };

  const initial = (user?.email || user?.username || 'M').charAt(0).toUpperCase();

  return (
    <AppBar position="fixed">
      <Toolbar sx={{ gap: 2 }}>
        {/* Logo + title */}
        <Box
          onClick={() => navigate('/library')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', flexGrow: { xs: 1, md: 0 }, minWidth: 0 }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: '12px',
              background: gradients.brand,
              boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogoIcon sx={{ fontSize: 20, color: 'common.white' }} />
          </Box>
          <Typography variant="h6" component="div" noWrap sx={{ fontWeight: 700 }}>
            Mekala's Library
          </Typography>
        </Box>

        {/* Desktop navigation (mobile uses BottomNav) */}
        <Box component="nav" aria-label="Primary" sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexGrow: 1 }}>
          {NAV_LINKS.map((link) => {
            const active = location.pathname.startsWith(link.to);
            return (
              <Button
                key={link.to}
                color="inherit"
                onClick={() => navigate(link.to)}
                aria-current={active ? 'page' : undefined}
                sx={{
                  px: 2,
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  color: active ? 'text.primary' : 'text.secondary',
                  bgcolor: active ? 'rgba(31, 41, 55, 0.8)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(31, 41, 55, 0.5)', color: 'text.primary' },
                }}
              >
                {link.label}
              </Button>
            );
          })}
        </Box>

        {/* Account menu: export + logout */}
        <IconButton
          aria-label="Account and export"
          aria-controls="account-menu"
          aria-haspopup="true"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={{ p: '3px', border: '1px solid', borderColor: 'grey.700', bgcolor: 'rgba(31, 41, 55, 0.6)' }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: gradients.action,
              color: 'common.white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {exporting ? <CircularProgress size={18} color="inherit" /> : initial}
          </Box>
        </IconButton>

        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { mt: 1, minWidth: 230 } } }}
        >
          {user?.email && (
            <MenuItem disabled sx={{ opacity: '1 !important' }}>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            </MenuItem>
          )}
          {user?.email && <Divider />}
          {EXPORT_OPTIONS.map((option) => (
            <MenuItem key={option.type} onClick={() => handleExport(option.type)} disabled={exporting}>
              <ListItemIcon>{option.icon}</ListItemIcon>
              <ListItemText primary={option.label} secondary={option.hint} />
            </MenuItem>
          ))}
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.light' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: 'error.light' }} />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </MenuItem>
        </Menu>
      </Toolbar>

      <Snackbar
        open={exportSuccess || exportError}
        autoHideDuration={3000}
        onClose={() => {
          setExportSuccess(false);
          setExportError(false);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 88, md: 24 } }}
      >
        <Alert severity={exportError ? 'error' : 'success'} sx={{ width: '100%' }}>
          {exportError ? 'Failed to export library data. Please try again.' : 'Library data exported successfully!'}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};

export default Header;
