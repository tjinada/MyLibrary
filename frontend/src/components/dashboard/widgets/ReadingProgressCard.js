import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  LinearProgress, 
  Grid,
  Chip,
  useTheme,
  alpha,
  Skeleton
} from '@mui/material';
import {
  LocalLibrary as ReadIcon,
  MenuBook as ReadingIcon,
  BookmarkBorder as ToReadIcon,
  CheckCircle as CompletedIcon,
} from '@mui/icons-material';

const ReadingProgressCard = ({ stats, loading }) => {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} sm={4} key={i}>
                <Skeleton variant="rectangular" height={80} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const totalBooks = stats?.heroStats?.totalBooks || 0;
  const booksRead = stats?.heroStats?.booksRead || 0;
  const booksReading = stats?.heroStats?.booksReading || 0;
  const booksToRead = totalBooks - booksRead - booksReading;
  const readingProgress = totalBooks > 0 ? (booksRead / totalBooks) * 100 : 0;
  const pagesRead = stats?.heroStats?.totalPagesRead || 0;
  const pagesCurrentlyReading = stats?.heroStats?.pagesCurrentlyReading || 0;
  const totalPagesInLibrary = stats?.heroStats?.totalPagesInLibrary || 0;
  const pagesProgress = totalPagesInLibrary > 0 ? (pagesRead / totalPagesInLibrary) * 100 : 0;

  const progressItems = [
    {
      icon: CompletedIcon,
      label: 'Books Read',
      value: booksRead,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
    },
    {
      icon: ReadingIcon,
      label: 'Currently Reading',
      value: booksReading,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1),
    },
    {
      icon: ToReadIcon,
      label: 'To Read',
      value: booksToRead,
      color: theme.palette.info.main,
      bgColor: alpha(theme.palette.info.main, 0.1),
    },
  ];

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Reading Progress
          </Typography>
          <Chip 
            label={`${Math.round(readingProgress)}% Complete`}
            color="primary"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Progress Items */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {progressItems.map((item, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: item.bgColor,
                  border: `1px solid ${alpha(item.color, 0.2)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <item.icon sx={{ color: item.color, mr: 1, fontSize: 20 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {item.label}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: item.color }}>
                  {item.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Progress Bars */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Books Progress
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {booksRead} / {totalBooks}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={readingProgress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              }
            }}
          />
        </Box>

        {totalPagesInLibrary > 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Pages Progress
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {pagesRead.toLocaleString()} / {totalPagesInLibrary.toLocaleString()}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={pagesProgress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                }
              }}
            />
            {pagesCurrentlyReading > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                + {pagesCurrentlyReading.toLocaleString()} pages currently being read
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ReadingProgressCard;
