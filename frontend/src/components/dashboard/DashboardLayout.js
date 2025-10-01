import React from 'react';
import { Box, Container, Grid } from '@mui/material';
import HeroStatsBar from './widgets/HeroStatsBar';
import ReadingProgressCard from './widgets/ReadingProgressCard';
import GenreDonutChart from './charts/GenreDonutChart';
import CategoryPieChart from './charts/CategoryPieChart';
import FunInsightsGrid from './widgets/FunInsightsGrid';
import YearHeatmap from './charts/YearHeatmap';

const DashboardLayout = ({ stats, loading, onGenreClick, onCategoryClick }) => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        {/* Hero Stats */}
        <HeroStatsBar stats={stats} loading={loading} />

        {/* Reading Progress Card */}
        <ReadingProgressCard stats={stats} loading={loading} />

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <GenreDonutChart
              data={stats?.genreDistribution}
              loading={loading}
              onGenreClick={onGenreClick}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <CategoryPieChart
              data={stats?.categoryBreakdown}
              loading={loading}
              onCategoryClick={onCategoryClick}
            />
          </Grid>
        </Grid>

        {/* Fun Insights */}
        <FunInsightsGrid insights={stats?.funInsights} loading={loading} />

        {/* Year Heatmap */}
        <YearHeatmap data={stats?.publicationYearStats} loading={loading} />
      </Box>
    </Container>
  );
};

export default DashboardLayout;
