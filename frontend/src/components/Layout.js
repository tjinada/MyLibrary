import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Header from './Layout/Header';
import BottomNav from './Layout/BottomNav';
import { dimensions } from '../theme/theme';

const orb = {
  position: 'absolute',
  borderRadius: '50%',
  filter: 'blur(72px)',
  opacity: 0.12,
};

// Soft colour glows behind the content. zIndex -1 keeps them under everything
// without turning <main> into a stacking context (fixed bars rely on that).
const AmbientBackground = () => (
  <Box aria-hidden sx={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
    <Box sx={{ ...orb, top: -160, right: '25%', width: 384, height: 384, bgcolor: 'primary.main' }} />
    <Box sx={{ ...orb, top: '33%', left: -192, width: 288, height: 288, bgcolor: '#A855F7' }} />
    <Box sx={{ ...orb, bottom: 0, right: 0, width: 320, height: 320, bgcolor: 'secondary.main' }} />
  </Box>
);

const Layout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <AmbientBackground />
      <Header />
      <Toolbar /> {/* Spacer for fixed AppBar */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // Room for the mobile bottom nav
          pb: { xs: `calc(${dimensions.bottomNavHeight}px + env(safe-area-inset-bottom, 0px))`, md: 0 },
        }}
      >
        <Outlet />
      </Box>
      <BottomNav />
    </Box>
  );
};

export default Layout;
