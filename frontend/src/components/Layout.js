import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Header from './Layout/Header';

const Layout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Toolbar /> {/* Spacer for fixed AppBar */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
