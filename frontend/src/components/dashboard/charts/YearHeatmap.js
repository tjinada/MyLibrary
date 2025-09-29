import React from 'react';
import { Box, Typography, Paper, Skeleton, Tooltip } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts';

// Generate color based on count
const getColor = (count, maxCount) => {
  const intensity = count / maxCount;
  // Gradient from light blue to deep purple
  const r = Math.round(102 + (118 - 102) * (1 - intensity));
  const g = Math.round(126 + (75 - 126) * (1 - intensity));
  const b = Math.round(234 + (162 - 234) * (1 - intensity));
  return `rgb(${r}, ${g}, ${b})`;
};

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
        background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(245,245,255,1) 100%)',
        transition: 'box-shadow 0.3s',
        '&:hover': {
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        },
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Publication Year Distribution
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Books grouped by 5-year periods
      </Typography>
      
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey="period" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
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
                  filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))',
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
          background: 'linear-gradient(90deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)',
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
