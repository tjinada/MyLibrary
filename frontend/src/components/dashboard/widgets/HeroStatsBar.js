import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Skeleton, useTheme, Tooltip } from '@mui/material';
import { 
  MenuBook as BookIcon,
  AutoStories as PagesReadIcon,
  People as AuthorsIcon
} from '@mui/icons-material';

const StatCard = ({ icon: Icon, label, value, color, loading, tooltip }) => {
  const theme = useTheme();
  
  const cardContent = (
    <Card
      sx={{
        backgroundColor: color,
        color: theme.palette.getContrastText(color),
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Icon sx={{ fontSize: 28, mr: 1, opacity: 0.9 }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
        </Box>
        {loading ? (
          <Skeleton 
            variant="text" 
            width="60%" 
            height={42} 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} 
          />
        ) : (
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {value?.toLocaleString() || '0'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return tooltip ? (
    <Tooltip title={tooltip} arrow placement="top">
      {cardContent}
    </Tooltip>
  ) : cardContent;
};

const HeroStatsBar = ({ stats, loading }) => {
  const theme = useTheme();
  
  // Calculate additional metrics for tooltips
  const readingProgress = stats?.heroStats?.booksRead && stats?.heroStats?.totalBooks 
    ? Math.round((stats.heroStats.booksRead / stats.heroStats.totalBooks) * 100)
    : 0;
  
  const pagesReadTooltip = stats?.heroStats?.booksRead 
    ? `From ${stats.heroStats.booksRead} books read${stats?.heroStats?.pagesCurrentlyReading ? ` • ${stats.heroStats.pagesCurrentlyReading.toLocaleString()} pages currently reading` : ''}`
    : null;
  
  const booksTooltip = `${stats?.heroStats?.booksRead || 0} read • ${stats?.heroStats?.booksReading || 0} reading • ${readingProgress}% complete`;
  
  const statCards = [
    {
      icon: BookIcon,
      label: 'Total Books',
      value: stats?.heroStats?.totalBooks,
      color: theme.palette.primary.main,
      tooltip: booksTooltip,
    },
    {
      icon: PagesReadIcon,
      label: 'Pages Read',
      value: stats?.heroStats?.totalPagesRead,
      color: theme.palette.secondary.main,
      tooltip: pagesReadTooltip,
    },
    {
      icon: AuthorsIcon,
      label: 'Unique Authors',
      value: stats?.heroStats?.uniqueAuthors,
      color: theme.palette.info.main,
      tooltip: null,
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <StatCard {...stat} loading={loading} />
        </Grid>
      ))}
    </Grid>
  );
};

export default HeroStatsBar;
