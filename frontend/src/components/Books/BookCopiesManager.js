// Book Copy Management Component
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Collapse,
  Alert,
  Tooltip,
  useTheme,
  Grid,
  Rating,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoAwesome as SpecialIcon,
  Diamond as DiamondIcon,
  ContentCopy as CopyIcon,
  Inventory as InventoryIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';

const BookCopiesManager = ({ open, onClose, book, onUpdate }) => {
  const theme = useTheme();
  const [copies, setCopies] = useState([]);
  const [editingCopy, setEditingCopy] = useState(null);
  const [expandedCopy, setExpandedCopy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize copies from book data
  useEffect(() => {
    if (book) {
      if (book.copies && book.copies.length > 0) {
        // Book already has individual copies tracked
        setCopies(book.copies);
      } else {
        // Convert quantity to individual copies
        const quantity = book.quantity || 1;
        const initialCopies = [];
        for (let i = 0; i < quantity; i++) {
          initialCopies.push({
            id: `copy_${i + 1}_${Date.now()}`,
            copyNumber: i + 1,
            edition: book.edition || 'standard',
            status: book.status || 'to-read',
            condition: 'good',
            purchaseDate: '',
            purchasePrice: '',
            purchaseLocation: '',
            notes: '',
            rating: i === 0 ? (book.rating || 0) : 0, // First copy gets the book's rating
            loanedTo: '',
            loanedDate: '',
          });
        }
        setCopies(initialCopies);
      }
    }
  }, [book]);

  const handleEditCopy = (copy) => {
    setEditingCopy({ ...copy });
    setExpandedCopy(copy.id);
  };

  const handleSaveEdit = () => {
    setCopies(copies.map(c => 
      c.id === editingCopy.id ? editingCopy : c
    ));
    setEditingCopy(null);
  };

  const handleCancelEdit = () => {
    setEditingCopy(null);
  };

  const handleDeleteCopy = (copyId) => {
    if (copies.length === 1) {
      setError("Cannot delete the last copy. Delete the book instead.");
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this copy?')) {
      setCopies(copies.filter(c => c.id !== copyId));
    }
  };

  const handleAddCopy = () => {
    const newCopy = {
      id: `copy_${copies.length + 1}_${Date.now()}`,
      copyNumber: copies.length + 1,
      edition: 'standard',
      status: 'to-read',
      condition: 'good',
      purchaseDate: '',
      purchasePrice: '',
      purchaseLocation: '',
      notes: '',
      rating: 0,
      loanedTo: '',
      loanedDate: '',
    };
    setCopies([...copies, newCopy]);
    setEditingCopy(newCopy);
    setExpandedCopy(newCopy.id);
  };

  const handleSaveAll = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Update the book with the copies array
      const updatedBook = {
        ...book,
        copies: copies,
        quantity: copies.length, // Update quantity based on copies
        // If all copies have the same edition/status, update the main record
        edition: copies.every(c => c.edition === copies[0].edition) ? copies[0].edition : 'mixed',
        status: copies.every(c => c.status === copies[0].status) ? copies[0].status : 'mixed',
      };
      
      await onUpdate(updatedBook);
      onClose();
    } catch (err) {
      setError('Failed to update book copies');
    } finally {
      setLoading(false);
    }
  };

  const getEditionIcon = (edition) => {
    switch(edition) {
      case 'signed':
        return <SpecialIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />;
      case 'deluxe':
        return <DiamondIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'to-read': 'default',
      'reading': 'primary',
      'read': 'success',
      'loaned': 'warning'
    };
    return colors[status] || 'default';
  };

  const getConditionColor = (condition) => {
    const colors = {
      'new': 'success',
      'excellent': 'success',
      'good': 'primary',
      'fair': 'warning',
      'poor': 'error'
    };
    return colors[condition] || 'default';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InventoryIcon color="primary" />
            <Typography variant="h6">
              Manage Individual Copies
            </Typography>
            <Chip 
              label={`${copies.length} ${copies.length === 1 ? 'copy' : 'copies'}`}
              color="primary"
              size="small"
            />
          </Box>
          <IconButton onClick={onClose} size="small">
            <CancelIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {book?.title} by {book?.authors?.join(', ')}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCopy}
            size="small"
          >
            Add Another Copy
          </Button>
        </Box>

        {copies.map((copy, index) => {
          const isEditing = editingCopy?.id === copy.id;
          const isExpanded = expandedCopy === copy.id || isEditing;
          const displayCopy = isEditing ? editingCopy : copy;

          return (
            <Card key={copy.id} sx={{ mb: 2 }}>
              <CardContent>
                {/* Copy Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CopyIcon color="action" />
                    <Typography variant="h6">
                      Copy #{copy.copyNumber}
                    </Typography>
                    {getEditionIcon(displayCopy.edition)}
                    <Chip 
                      label={displayCopy.edition} 
                      size="small"
                      color={displayCopy.edition === 'standard' ? 'default' : 'secondary'}
                    />
                    <Chip 
                      label={displayCopy.status.replace('-', ' ')} 
                      size="small"
                      color={getStatusColor(displayCopy.status)}
                    />
                    {displayCopy.condition && (
                      <Chip 
                        label={displayCopy.condition} 
                        size="small"
                        variant="outlined"
                        color={getConditionColor(displayCopy.condition)}
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!isEditing ? (
                      <>
                        <IconButton onClick={() => handleEditCopy(copy)} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => setExpandedCopy(isExpanded ? null : copy.id)} size="small">
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        {copies.length > 1 && (
                          <IconButton onClick={() => handleDeleteCopy(copy.id)} size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </>
                    ) : (
                      <>
                        <IconButton onClick={handleSaveEdit} size="small" color="primary">
                          <SaveIcon />
                        </IconButton>
                        <IconButton onClick={handleCancelEdit} size="small">
                          <CancelIcon />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Box>

                {/* Expanded/Edit Content */}
                <Collapse in={isExpanded} timeout="auto">
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      {/* Edition and Status */}
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Edition</InputLabel>
                          <Select
                            value={displayCopy.edition}
                            label="Edition"
                            onChange={(e) => isEditing && setEditingCopy({
                              ...editingCopy,
                              edition: e.target.value
                            })}
                            disabled={!isEditing}
                          >
                            <MenuItem value="standard">Standard</MenuItem>
                            <MenuItem value="signed">Signed</MenuItem>
                            <MenuItem value="deluxe">Deluxe</MenuItem>
                            <MenuItem value="first">First Edition</MenuItem>
                            <MenuItem value="limited">Limited Edition</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={displayCopy.status}
                            label="Status"
                            onChange={(e) => isEditing && setEditingCopy({
                              ...editingCopy,
                              status: e.target.value
                            })}
                            disabled={!isEditing}
                          >
                            <MenuItem value="to-read">To Read</MenuItem>
                            <MenuItem value="reading">Reading</MenuItem>
                            <MenuItem value="read">Read</MenuItem>
                            <MenuItem value="loaned">Loaned</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Condition</InputLabel>
                          <Select
                            value={displayCopy.condition || 'good'}
                            label="Condition"
                            onChange={(e) => isEditing && setEditingCopy({
                              ...editingCopy,
                              condition: e.target.value
                            })}
                            disabled={!isEditing}
                          >
                            <MenuItem value="new">New</MenuItem>
                            <MenuItem value="excellent">Excellent</MenuItem>
                            <MenuItem value="good">Good</MenuItem>
                            <MenuItem value="fair">Fair</MenuItem>
                            <MenuItem value="poor">Poor</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Rating
                          </Typography>
                          <Rating
                            value={displayCopy.rating || 0}
                            onChange={(e, newValue) => isEditing && setEditingCopy({
                              ...editingCopy,
                              rating: newValue
                            })}
                            disabled={!isEditing}
                            size="small"
                          />
                        </Box>
                      </Grid>

                      {/* Purchase Information */}
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Purchase Date"
                          type="date"
                          value={displayCopy.purchaseDate || ''}
                          onChange={(e) => isEditing && setEditingCopy({
                            ...editingCopy,
                            purchaseDate: e.target.value
                          })}
                          disabled={!isEditing}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Purchase Price"
                          value={displayCopy.purchasePrice || ''}
                          onChange={(e) => isEditing && setEditingCopy({
                            ...editingCopy,
                            purchasePrice: e.target.value
                          })}
                          disabled={!isEditing}
                          placeholder="$0.00"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Purchase Location"
                          value={displayCopy.purchaseLocation || ''}
                          onChange={(e) => isEditing && setEditingCopy({
                            ...editingCopy,
                            purchaseLocation: e.target.value
                          })}
                          disabled={!isEditing}
                          placeholder="Store name or location"
                        />
                      </Grid>

                      {/* Loan Information */}
                      {displayCopy.status === 'loaned' && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Loaned To"
                              value={displayCopy.loanedTo || ''}
                              onChange={(e) => isEditing && setEditingCopy({
                                ...editingCopy,
                                loanedTo: e.target.value
                              })}
                              disabled={!isEditing}
                              placeholder="Person's name"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Loaned Date"
                              type="date"
                              value={displayCopy.loanedDate || ''}
                              onChange={(e) => isEditing && setEditingCopy({
                                ...editingCopy,
                                loanedDate: e.target.value
                              })}
                              disabled={!isEditing}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                        </>
                      )}

                      {/* Notes */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Notes for this copy"
                          multiline
                          rows={2}
                          value={displayCopy.notes || ''}
                          onChange={(e) => isEditing && setEditingCopy({
                            ...editingCopy,
                            notes: e.target.value
                          })}
                          disabled={!isEditing}
                          placeholder="Any special notes about this copy..."
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          );
        })}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveAll}
          disabled={loading || editingCopy !== null}
          startIcon={<SaveIcon />}
        >
          Save All Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookCopiesManager;
