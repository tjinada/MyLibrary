import React from 'react';
import { Grid, Card, CardContent, Typography, Box, LinearProgress, Chip, Skeleton } from '@mui/material';
import {
  Diversity3 as DiversityIcon,
  Person as PersonIcon,
  Business as PublisherIcon,
  CalendarMonth as CalendarIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';

const InsightCard = ({ icon: Icon, title, children, loading, gradient }) => (
  <Card
    sx={{
      height: '100%',
      background: gradient || 'white',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      },
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Icon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
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

const DiversityMeter = ({ score, label, totalGenres }) => {
  const getColor = (score) => {
    if (score < 25) return '#f5576c';
    if (score < 50) return '#fa709a';
    if (score < 75) return '#4facfe';
    return '#43e97b';
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
            background: `linear-gradient(135deg, ${getColor(score)} 0%, ${getColor(score)}88 100%)`,
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
          backgroundColor: 'rgba(0,0,0,0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 5,
            background: `linear-gradient(90deg, ${getColor(score)} 0%, ${getColor(score)}88 100%)`,
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
  if (!insights && !loading) return null;

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Diversity Score */}
      <Grid item xs={12} md={6}>
        <InsightCard
          icon={DiversityIcon}
          title="Genre Diversity Score"
          loading={loading}
          gradient="linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(245,250,255,1) 100%)"
        >
          {insights?.diversityScore && (
            <DiversityMeter
              score={insights.diversityScore.score}
              label={insights.diversityScore.label}
              totalGenres={insights.diversityScore.totalGenres}
            />
          )}
        </InsightCard>
      </Grid>

      {/* Most Collected Author */}
      <Grid item xs={12} md={6}>
        <InsightCard
          icon={PersonIcon}
          title="Most Collected Author"
          loading={loading}
          gradient="linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,245,250,1) 100%)"
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
          gradient="linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(250,255,245,1) 100%)"
        >
          {insights?.topPublishers?.length > 0 ? (
            <Box>
              {insights.topPublishers.map((publisher, index) => (
                <Box key={index} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography 
                      variant={index === 0 ? 'h6' : 'body1'} 
                      sx={{ fontWeight: index === 0 ? 'bold' : 'normal' }}
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
          gradient="linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(245,245,255,1) 100%)"
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
    </Grid>
  );
};

export default FunInsightsGrid;
