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
        background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.secondary.main}10 100%)`,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        p: 1,
        maxWidth: 280,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: 2 }}>
        {/* Total Books (with quantities) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            }}
          >
            <BookIcon sx={{ color: 'white', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main, lineHeight: 1.2 }}>
              {totalQuantity.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
              Total Books
            </Typography>
          </Box>
        </Box>

        {/* Unread Books */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.info.light} 0%, ${theme.palette.info.main} 100%)`,
            }}
          >
            <UnreadIcon sx={{ color: 'white', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.info.main, lineHeight: 1.2 }}>
              {unreadCount.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
              Unread
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default LibraryStats;
