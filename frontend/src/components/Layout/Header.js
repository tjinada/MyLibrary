import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  useTheme,
  useMediaQuery,
  Button,
  CircularProgress,
  Tooltip,
  ListItemIcon,
  ListItemText,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  AccountCircle,
  LibraryBooks,
  Dashboard as DashboardIcon,
  Download as DownloadIcon,
  Description as CsvIcon,
  CollectionsBookmark as CollectionsIcon,
  MenuBook as BooksIcon,
  Assessment as StatsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import bookService from '../../services/bookService';
import collectionService from '../../services/collectionService';
import exportService from '../../services/exportService';

const Header = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [exportMenuAnchor, setExportMenuAnchor] = React.useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const handleExportMenu = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExport = async (type = 'all') => {
    setExporting(true);
    handleExportClose();
    
    try {
      // Fetch all books and collections
      const [booksResponse, collections] = await Promise.all([
        bookService.getBooks({ page: 1, limit: 10000 }), // Get all books
        collectionService.getCollections(true) // Get collections with book details
      ]);
      
      const data = {
        books: booksResponse.books || [],
        collections: collections || []
      };
      
      // Generate and download CSV
      exportService.exportLibrary(data, type);
      
      // Show success notification
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
      
      // If exporting all, also generate a statistics summary
      if (type === 'all') {
        const stats = exportService.generateStatistics(data);
        console.log('Library Statistics:', stats);
        // Could show stats in a dialog or notification
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export library data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppBar position="fixed" elevation={1}>
      <Toolbar>
        <LibraryBooks sx={{ mr: 1 }} />
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 500,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          {isMobile ? "Mekala's Library" : "Mekala's Personal Library"}
        </Typography>
        
        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
          <Button
            color="inherit"
            startIcon={<LibraryBooks />}
            onClick={() => navigate('/library')}
            sx={{
              textTransform: 'none',
              bgcolor: location.pathname === '/library' ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
              },
              minWidth: isMobile ? 'auto' : '100px',
            }}
          >
            {!isMobile && 'Library'}
          </Button>
          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{
              textTransform: 'none',
              bgcolor: location.pathname === '/dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
              },
              minWidth: isMobile ? 'auto' : '110px',
            }}
          >
            {!isMobile && 'Dashboard'}
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Export Button */}
          {!isMobile && (
            <Tooltip title="Export library data">
              <Button
                color="inherit"
                startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                onClick={handleExportMenu}
                disabled={exporting}
                sx={{ 
                  textTransform: 'none',
                  minWidth: 'auto',
                }}
              >
                {!isMobile && 'Export'}
              </Button>
            </Tooltip>
          )}
          
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={handleExportMenu}
              disabled={exporting}
            >
              {exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            </IconButton>
          )}
          
          {/* User info and menu */}
          <Typography 
            variant="body2" 
            sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}
          >
            {user?.email}
          </Typography>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          
          {/* Export Menu */}
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={handleExportClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleExport('all')}>
              <ListItemIcon>
                <CsvIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Export All" 
                secondary="Books & Collections"
              />
            </MenuItem>
            <MenuItem onClick={() => handleExport('books')}>
              <ListItemIcon>
                <BooksIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Export Books" 
                secondary="All books as CSV"
              />
            </MenuItem>
            <MenuItem onClick={() => handleExport('collections')}>
              <ListItemIcon>
                <CollectionsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Export Collections" 
                secondary="All collections as CSV"
              />
            </MenuItem>
          </Menu>
          
          {/* User Menu */}
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            {isMobile && user?.email && (
              <MenuItem disabled>
                <Typography variant="body2">{user.email}</Typography>
              </MenuItem>
            )}
            {isMobile && (
              <>
                <MenuItem onClick={() => handleExport('all')}>
                  <ListItemIcon>
                    <DownloadIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Export Library" />
                </MenuItem>
                <Divider />
              </>
            )}
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
      
      {/* Success Snackbar */}
      <Snackbar
        open={exportSuccess}
        autoHideDuration={3000}
        onClose={() => setExportSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setExportSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Library data exported successfully!
        </Alert>
      </Snackbar>
    </AppBar>
  );
};

export default Header;
