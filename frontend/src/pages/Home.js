import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  LibraryBooks as BooksIcon,
  TrendingUp as TrendingIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import bookService from '../services/bookService';

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await bookService.getStats();
      setStats(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load statistics');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/add')}
            >
              Add Book
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<BooksIcon />}
              onClick={() => navigate('/library')}
            >
              View Library
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Books
              </Typography>
              <Typography variant="h4">
                {stats?.totalBooks || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Available
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats?.statusCounts?.available || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Reading
              </Typography>
              <Typography variant="h4" color="primary.main">
                {stats?.statusCounts?.reading || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Wishlist
              </Typography>
              <Typography variant="h4" color="text.secondary">
                {stats?.statusCounts?.wishlist || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Genres */}
      {stats?.topGenres?.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CategoryIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Top Genres</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {stats.topGenres.map((genre) => (
              <Chip
                key={genre.name}
                label={`${genre.name} (${genre.count})`}
                onClick={() => navigate(`/library?genre=${genre.name}`)}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Recently Added Books */}
      {stats?.recentlyAdded?.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrendingIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Recently Added</Typography>
          </Box>
          <Grid container spacing={2}>
            {stats.recentlyAdded.map((book) => (
              <Grid item xs={12} key={book._id}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => navigate(`/book/${book.isbn}`)}
                >
                  {book.coverImage && (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      style={{
                        width: 40,
                        height: 60,
                        objectFit: 'cover',
                        marginRight: 16,
                        borderRadius: 4,
                      }}
                    />
                  )}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2">{book.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {book.authors?.join(', ')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default Home;
