import React from 'react';
import { Box, Typography, Paper, Skeleton, useTheme, alpha } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts';

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
          {payload[0].payload.period}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {payload[0].value} books
        </Typography>
      </Paper>
    );
  }
  return null;
};

const YearHeatmap = ({ data, loading }) => {
  const theme = useTheme();
  
  // Generate color based on count using theme colors
  const getColor = (count, maxCount) => {
    const intensity = count / maxCount;
    // Use theme primary color with varying opacity
    return alpha(theme.palette.primary.main, 0.2 + (intensity * 0.8));
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Skeleton variant="rectangular" width="100%" height={250} />
      </Paper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">No publication year data available</Typography>
      </Paper>
    );
  }

  // Filter out unknown and sort by year
  const chartData = data
    .filter(d => d.period !== 'Unknown')
    .sort((a, b) => (a.startYear || 0) - (b.startYear || 0));

  const maxCount = Math.max(...chartData.map(d => d.count));

  return (
    <Paper
      sx={{
        p: 3,
        bgcolor: 'background.paper',
        transition: 'box-shadow 0.3s',
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
        Publication Year Distribution
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Books grouped by 5-year periods
      </Typography>
      
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke={theme.palette.divider} />
          <XAxis 
            dataKey="period" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            radius={[4, 4, 0, 0]}
            animationDuration={1000}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getColor(entry.count, maxCount)}
                style={{
                  filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.1))',
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
          Fewer books
        </Typography>
        <Box sx={{ 
          width: 120, 
          height: 10, 
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${theme.palette.primary.main} 100%)`,
          borderRadius: 5,
        }} />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          More books
        </Typography>
      </Box>
    </Paper>
  );
};

export default YearHeatmap;
