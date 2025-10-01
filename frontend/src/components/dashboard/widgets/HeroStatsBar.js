import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Skeleton, useTheme } from '@mui/material';
import { 
  MenuBook as BookIcon,
  Description as PagesIcon,
  People as AuthorsIcon,
  Category as GenresIcon 
} from '@mui/icons-material';

const StatCard = ({ icon: Icon, label, value, color, loading }) => {
  const theme = useTheme();
  
  return (
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
};

const HeroStatsBar = ({ stats, loading }) => {
  const theme = useTheme();
  
  const statCards = [
    {
      icon: BookIcon,
      label: 'Total Books',
      value: stats?.heroStats?.totalBooks,
      color: theme.palette.primary.main,
    },
    {
      icon: PagesIcon,
      label: 'Total Pages',
      value: stats?.heroStats?.totalPages,
      color: theme.palette.secondary.main,
    },
    {
      icon: AuthorsIcon,
      label: 'Unique Authors',
      value: stats?.heroStats?.uniqueAuthors,
      color: theme.palette.info.main,
    },
    {
      icon: GenresIcon,
      label: 'Unique Genres',
      value: stats?.heroStats?.uniqueGenres,
      color: theme.palette.success.main,
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <StatCard {...stat} loading={loading} />
        </Grid>
      ))}
    </Grid>
  );
};

export default HeroStatsBar;
