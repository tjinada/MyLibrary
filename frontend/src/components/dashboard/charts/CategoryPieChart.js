import React from 'react';
import { Box, Typography, Paper, Skeleton } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  Fiction: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  Nonfiction: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
};

const SOLID_COLORS = {
  Fiction: '#667eea',
  Nonfiction: '#f093fb',
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
          {payload[0].name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {payload[0].value} books
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {payload[0].payload.percentage}%
        </Typography>
      </Paper>
    );
  }
  return null;
};

const CategoryPieChart = ({ data, loading, onCategoryClick }) => {
  // Prepare data for the chart
  const chartData = [
    {
      name: 'Fiction',
      value: data?.fiction?.count || 0,
      percentage: data?.fiction?.percentage || 0,
    },
    {
      name: 'Nonfiction',
      value: data?.nonfiction?.count || 0,
      percentage: data?.nonfiction?.percentage || 0,
    },
  ].filter(item => item.value > 0);

  const handleClick = (entry) => {
    if (onCategoryClick) {
      onCategoryClick(entry.name);
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
        <Typography color="text.secondary">No category data available</Typography>
      </Paper>
    );
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        style={{ fontSize: '18px', fontWeight: 'bold' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Paper
      sx={{
        p: 3,
        height: '400px',
        background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(250,245,255,1) 100%)',
        transition: 'box-shadow 0.3s',
        '&:hover': {
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        },
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Fiction vs Nonfiction
      </Typography>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={SOLID_COLORS[entry.name]}
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
              <span style={{ fontSize: '14px', fontWeight: 500 }}>
                {value}: {entry.payload.value} books
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default CategoryPieChart;
