import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Skeleton } from '@mui/material';
import { 
  MenuBook as BookIcon,
  Description as PagesIcon,
  People as AuthorsIcon,
  Category as GenresIcon 
} from '@mui/icons-material';

const StatCard = ({ icon: Icon, label, value, color, gradient, loading }) => (
  <Card
    sx={{
      background: gradient,
      color: 'white',
      height: '100%',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
      },
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Icon sx={{ fontSize: 28, mr: 1, opacity: 0.9 }} />
        <Typography variant="body2" sx={{ opacity: 0.95, fontWeight: 500 }}>
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

const HeroStatsBar = ({ stats, loading }) => {
  const statCards = [
    {
      icon: BookIcon,
      label: 'Total Books',
      value: stats?.heroStats?.totalBooks,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      icon: PagesIcon,
      label: 'Total Pages',
      value: stats?.heroStats?.totalPages,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      icon: AuthorsIcon,
      label: 'Unique Authors',
      value: stats?.heroStats?.uniqueAuthors,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      icon: GenresIcon,
      label: 'Unique Genres',
      value: stats?.heroStats?.uniqueGenres,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
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
