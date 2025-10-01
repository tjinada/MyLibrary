import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Alert,
  Button,
  Container,
  Paper,
} from '@mui/material';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import dashboardService from '../services/dashboardService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load dashboard statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenreClick = (genre) => {
    navigate(`/library?genre=${encodeURIComponent(genre)}`);
  };

  const handleCategoryClick = (category) => {
    navigate(`/library?category=${encodeURIComponent(category)}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Page Header */}
      <Container maxWidth="xl" sx={{ mb: 2 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Library Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your reading progress and explore your collection insights
          </Typography>
        </Paper>
      </Container>

      {/* Error Alert */}
      {error && (
        <Container maxWidth="xl" sx={{ mb: 3 }}>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={fetchDashboardStats}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Container>
      )}

      {/* Dashboard Content */}
      <DashboardLayout
        stats={stats}
        loading={loading}
        onGenreClick={handleGenreClick}
        onCategoryClick={handleCategoryClick}
      />

      {/* Footer Stats */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body2">
            {stats?.heroStats?.totalBooks || 0} books • {stats?.heroStats?.booksRead || 0} read • {stats?.heroStats?.totalPagesRead?.toLocaleString() || 0} pages completed
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;
