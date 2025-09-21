import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import {
  MenuBook as BookIcon,
  AutoStories as UnreadIcon,
} from '@mui/icons-material';

const LibraryStats = ({ totalQuantity, unreadCount }) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        p: 2,
        mb: 3,
        maxWidth: 400,
        mx: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        {/* Total Books (with quantities) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            }}
          >
            <BookIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              {totalQuantity.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Books
            </Typography>
          </Box>
        </Box>

        {/* Unread Books */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.info.light} 0%, ${theme.palette.info.main} 100%)`,
            }}
          >
            <UnreadIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
              {unreadCount.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Unread Books
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default LibraryStats;
