import React from 'react';
import { Grid, Card, CardContent, Typography, Box, LinearProgress, Chip, Skeleton, useTheme, alpha } from '@mui/material';
import {
  Person as PersonIcon,
  Business as PublisherIcon,
  CalendarMonth as CalendarIcon,
  AutoAwesome as SparkleIcon,
  MenuBook as BookIcon,
  HistoryEdu as VintageIcon,
} from '@mui/icons-material';

const InsightCard = ({ icon: Icon, title, children, loading, bgColor }) => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        height: '100%',
        bgcolor: bgColor || 'background.paper',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Icon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {title}
          </Typography>
        </Box>
        {loading ? (
          <Skeleton variant="rectangular" height={60} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

const DiversityMeter = ({ score, label, totalGenres }) => {
  const theme = useTheme();
  
  const getColor = (score) => {
    if (score < 25) return theme.palette.error.main;
    if (score < 50) return theme.palette.warning.main;
    if (score < 75) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: getColor(score) }}>
          {score}/100
        </Typography>
        <Chip 
          label={label} 
          size="small" 
          sx={{ 
            bgcolor: getColor(score),
            color: 'white',
            fontWeight: 600,
          }} 
        />
      </Box>
      <LinearProgress
        variant="determinate"
        value={score}
        sx={{
          height: 10,
          borderRadius: 5,
          backgroundColor: alpha(theme.palette.action.disabled, 0.1),
          '& .MuiLinearProgress-bar': {
            borderRadius: 5,
            backgroundColor: getColor(score),
          },
        }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        You read across {totalGenres} different genres
      </Typography>
    </Box>
  );
};

const FunInsightsGrid = ({ insights, loading }) => {
  const theme = useTheme();
  
  if (!insights && !loading) return null;

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Most Collected Author */}
      <Grid item xs={12} md={6}>
        <InsightCard
          icon={PersonIcon}
          title="Most Collected Author"
          loading={loading}
          bgColor={alpha(theme.palette.secondary.main, 0.04)}
        >
          {insights?.mostCollectedAuthor ? (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {insights.mostCollectedAuthor.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {insights.mostCollectedAuthor.count} books in your library
              </Typography>
              {insights?.topAuthors?.slice(1, 4).map((author, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {author.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {author.count} books
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary">No author data available</Typography>
          )}
        </InsightCard>
      </Grid>

      {/* Favorite Publisher */}
      <Grid item xs={12} md={6}>
        <InsightCard
          icon={PublisherIcon}
          title="Top Publishers"
          loading={loading}
          bgColor={alpha(theme.palette.success.main, 0.04)}
        >
          {insights?.topPublishers?.length > 0 ? (
            <Box>
              {insights.topPublishers.map((publisher, index) => (
                <Box key={index} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography 
                      variant={index === 0 ? 'h6' : 'body1'} 
                      sx={{ fontWeight: index === 0 ? 'bold' : 'normal', color: 'text.primary' }}
                    >
                      {publisher.name}
                    </Typography>
                    <Chip 
                      label={`${publisher.count} books`} 
                      size="small"
                      color={index === 0 ? 'primary' : 'default'}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary">No publisher data available</Typography>
          )}
        </InsightCard>
      </Grid>

      {/* Decade Focus */}
      <Grid item xs={12} md={6}>
        <InsightCard
          icon={CalendarIcon}
          title="Publication Era Focus"
          loading={loading}
          bgColor={alpha(theme.palette.info.main, 0.04)}
        >
          {insights?.decadeFocus ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'secondary.main', mr: 1 }}>
                  {insights.decadeFocus.period}
                </Typography>
                <SparkleIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
              </Box>
              <Typography variant="body1" color="text.secondary">
                {insights.decadeFocus.count} books ({insights.decadeFocus.percentage}% of collection)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Your collection favors books from this era
              </Typography>
            </Box>
          ) : (
            <Typography color="text.secondary">No publication data available</Typography>
          )}
        </InsightCard>
      </Grid>

      {/* Collection Treasures - Oldest & Newest */}
      <Grid item xs={12} md={6}>
        <InsightCard
          icon={VintageIcon}
          title="Collection Treasures"
          loading={loading}
          bgColor={alpha(theme.palette.warning.main, 0.04)}
        >
          {insights?.oldestBook || insights?.newestBook ? (
            <Box>
              {insights?.oldestBook && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Oldest Book
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    {insights.oldestBook.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {insights.oldestBook.authors?.[0]} • Published {insights.oldestBook.year}
                  </Typography>
                </Box>
              )}
              {insights?.newestBook && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Newest Published
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    {insights.newestBook.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {insights.newestBook.authors?.[0]} • Published {insights.newestBook.year}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Typography color="text.secondary">No publication data available</Typography>
          )}
        </InsightCard>
      </Grid>
    </Grid>
  );
};

export default FunInsightsGrid;
