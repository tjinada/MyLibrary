import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import {
  MenuBook as BookIcon,
  CollectionsBookmark as CollectionIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';

const LibraryStats = ({ bookCount, collectionCount, totalQuantity }) => {
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
        maxWidth: 600,
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

        {/* Unique Titles */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
            }}
          >
            <InventoryIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
              {bookCount.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Unique Titles
            </Typography>
          </Box>
        </Box>

        {/* Collections */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
            }}
          >
            <CollectionIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
              {collectionCount.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Collections
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default LibraryStats;
