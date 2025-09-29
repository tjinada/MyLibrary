import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  LibraryBooks as BooksIcon,
} from '@mui/icons-material';
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
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 4,
          px: 3,
          mb: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ maxWidth: 'xl', mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DashboardIcon sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Library Dashboard
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
            Explore your reading collection with beautiful insights and statistics
          </Typography>
          
          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/add')}
              sx={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              Add Book
            </Button>
            <Button
              variant="outlined"
              startIcon={<BooksIcon />}
              onClick={() => navigate('/library')}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  background: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              View Library
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Box sx={{ maxWidth: 'xl', mx: 'auto', px: 3, mb: 3 }}>
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
        </Box>
      )}

      {/* Dashboard Content */}
      <DashboardLayout
        stats={stats}
        loading={loading}
        onGenreClick={handleGenreClick}
        onCategoryClick={handleCategoryClick}
      />

      {/* Footer */}
      <Box sx={{ py: 4, px: 3, textAlign: 'center', color: 'text.secondary' }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2">
          {stats?.heroStats?.totalBooks || 0} books • {stats?.heroStats?.uniqueAuthors || 0} authors • {stats?.heroStats?.uniqueGenres || 0} genres
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;
