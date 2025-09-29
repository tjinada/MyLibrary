import React from 'react';
import { Box, Typography, Paper, Skeleton } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Modern gradient colors for genres
const COLORS = [
  '#667eea',
  '#764ba2',
  '#f093fb',
  '#f5576c',
  '#4facfe',
  '#00f2fe',
  '#43e97b',
  '#38f9d7',
  '#fa709a',
  '#fee140',
  '#30cfd0',
  '#330867',
];

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
  // Prepare data for the chart
  const chartData = data?.slice(0, 10) || []; // Top 10 genres

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
        background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(245,245,255,1) 100%)',
        transition: 'box-shadow 0.3s',
        '&:hover': {
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        },
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Genre Distribution
      </Typography>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name.length > 15 ? entry.name.substring(0, 15) + '...' : entry.name}`}
            outerRadius={100}
            innerRadius={60}
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
                  filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => (
              <span style={{ fontSize: '12px' }}>
                {value} ({entry.payload.count})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default GenreDonutChart;
