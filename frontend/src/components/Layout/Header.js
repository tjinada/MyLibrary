import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AccountCircle,
  LibraryBooks,
  CollectionsBookmark,
  Home,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
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

  return (
    <AppBar position="fixed" elevation={1}>
      <Toolbar>
        <LibraryBooks sx={{ mr: 1 }} />
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 500,
            cursor: 'pointer',
            mr: 3
          }}
          onClick={() => navigate('/')}
        >
          {isMobile ? 'My Library' : 'My Personal Library'}
        </Typography>
        
        {/* Navigation Links */}
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          <Button 
            color="inherit" 
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Library
          </Button>
          <Button 
            color="inherit" 
            startIcon={<CollectionsBookmark />}
            onClick={() => navigate('/collections')}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Collections
          </Button>
          {/* Mobile Navigation Icons */}
          <IconButton
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ display: { xs: 'flex', sm: 'none' } }}
          >
            <Home />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => navigate('/collections')}
            sx={{ display: { xs: 'flex', sm: 'none' } }}
          >
            <CollectionsBookmark />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
