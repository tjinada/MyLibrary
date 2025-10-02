import React from 'react';
import { Box, Typography, Paper, Skeleton, useTheme, alpha } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload[0]) {
    return (
      <Paper
        sx={{
          p: 1.5,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {payload[0].name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Books: {payload[0].value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {payload[0].payload.percentage}% of collection
        </Typography>
      </Paper>
    );
  }
  return null;
};

const GenreDonutChart = ({ data, loading, onGenreClick }) => {
  const theme = useTheme();
  
  // Use theme colors for the chart
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.primary.light,
    theme.palette.secondary.light,
    theme.palette.info.light,
    theme.palette.success.light,
    theme.palette.warning.light,
    theme.palette.error.light,
  ];

  // Filter out Fiction and Nonfiction from display, then take top 10 specific genres
  const filteredData = data?.filter(
    genre => genre.name !== 'Fiction' && genre.name !== 'Nonfiction'
  ) || [];
  const chartData = filteredData.slice(0, 10);

  const handleClick = (entry) => {
    if (onGenreClick) {
      onGenreClick(entry.name);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Skeleton variant="circular" width={300} height={300} />
      </Paper>
    );
  }

  if (!chartData.length) {
    return (
      <Paper sx={{ p: 3, height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">No genre data available</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        height: '400px',
        bgcolor: 'background.paper',
        transition: 'box-shadow 0.3s',
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Genre Distribution
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Showing specific genres (Fiction/Nonfiction excluded)
        </Typography>
      </Box>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            labelLine={true}
            label={(entry) => {
              // Show label only if percentage is >= 5%
              if (entry.percentage < 5) return '';
              return entry.name.length > 15 ? entry.name.substring(0, 15) + '...' : entry.name;
            }}
            outerRadius={85}
            innerRadius={50}
            fill="#8884d8"
            dataKey="count"
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                style={{
                  filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={60}
            wrapperStyle={{
              paddingTop: '10px',
              fontSize: '10px',
              maxHeight: '60px',
              overflowY: 'auto'
            }}
            iconSize={10}
            formatter={(value) => {
              // Truncate long genre names in legend
              const maxLength = 18;
              return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default GenreDonutChart;
