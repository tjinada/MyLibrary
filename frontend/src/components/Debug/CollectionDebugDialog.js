import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  BugReport as BugIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Build as FixIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const CollectionDebugDialog = ({ open, onClose, collectionId }) => {
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [error, setError] = useState(null);
  const [fixResult, setFixResult] = useState(null);

  React.useEffect(() => {
    if (open && collectionId) {
      validateCollection();
    }
  }, [open, collectionId]);

  const validateCollection = async () => {
    setLoading(true);
    setError(null);
    setFixResult(null);
    
    try {
      const response = await axios.get(`${API_URL}/collections/${collectionId}/validate`);
      setValidation(response.data);
    } catch (err) {
      console.error('Error validating collection:', err);
      setError('Failed to validate collection');
    } finally {
      setLoading(false);
    }
  };

  const fixCollection = async () => {
    setFixing(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/collections/${collectionId}/fix`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setFixResult(response.data.message);
      
      // Re-validate after fixing
      await validateCollection();
    } catch (err) {
      console.error('Error fixing collection:', err);
      setError(err.response?.data?.message || 'Failed to fix collection');
    } finally {
      setFixing(false);
    }
  };

  const getStatusIcon = () => {
    if (!validation) return null;
    
    if (validation.isValid) {
      return <CheckIcon color="success" sx={{ fontSize: 48 }} />;
    } else {
      return <ErrorIcon color="error" sx={{ fontSize: 48 }} />;
    }
  };

  const getStatusColor = () => {
    if (!validation) return 'default';
    return validation.isValid ? 'success' : 'error';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <BugIcon />
            <Typography variant="h6">Collection Debug Info</Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={validateCollection} disabled={loading || fixing}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : validation ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {fixResult && (
              <Alert severity="success" onClose={() => setFixResult(null)}>
                {fixResult}
              </Alert>
            )}
            
            {/* Status Overview */}
            <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
              {getStatusIcon()}
              <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                Collection is {validation.isValid ? 'Valid' : 'Invalid'}
              </Typography>
              <Chip
                label={validation.isValid ? 'All checks passed' : `${validation.issues.length} issues found`}
                color={getStatusColor()}
                variant="outlined"
              />
            </Paper>
            
            {/* Collection Details */}
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Collection Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Collection ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {validation.id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Collection Name
                  </Typography>
                  <Typography variant="body2">
                    {validation.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Stored Book Count
                  </Typography>
                  <Typography variant="body2">
                    {validation.bookCount}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Actual Book Count
                  </Typography>
                  <Typography variant="body2">
                    {validation.actualBookCount}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Cover Book ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {validation.coverBookId || 'Not set'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
            
            {/* Book IDs */}
            {validation.bookIds && validation.bookIds.length > 0 && (
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Book IDs ({validation.bookIds.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {validation.bookIds.map((bookId, index) => (
                    <Chip
                      key={bookId}
                      label={`#${index + 1}`}
                      size="small"
                      variant="outlined"
                      title={bookId}
                    />
                  ))}
                </Box>
              </Paper>
            )}
            
            {/* Issues */}
            {validation.issues && validation.issues.length > 0 && (
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'error.50' }}>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Issues Found
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {validation.issues.map((issue, index) => (
                    <Typography
                      component="li"
                      key={index}
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {issue}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        ) : null}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
        {validation && !validation.isValid && (
          <Button
            onClick={fixCollection}
            variant="contained"
            color="warning"
            startIcon={fixing ? <CircularProgress size={20} /> : <FixIcon />}
            disabled={fixing}
          >
            {fixing ? 'Fixing...' : 'Fix Issues'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CollectionDebugDialog;
