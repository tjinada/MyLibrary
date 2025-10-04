const express = require('express');
const router = express.Router();
const CustomShelf = require('../models/CustomShelf');
const auth = require('../middleware/auth');

// Get all shelves for current user
router.get('/', auth, async (req, res) => {
  try {
    const shelves = await CustomShelf.find({ userId: req.user.id })
      .sort({ sortOrder: 1, createdAt: 1 });
    
    res.json({ shelves });
  } catch (error) {
    console.error('Error fetching shelves:', error);
    res.status(500).json({ message: 'Failed to fetch shelves' });
  }
});

// Create new shelf
router.post('/', auth, async (req, res) => {
  try {
    const { name, filters } = req.body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Shelf name is required' });
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length > 50) {
      return res.status(400).json({ message: 'Shelf name must be 50 characters or less' });
    }
    
    // Check for duplicate name
    const existing = await CustomShelf.findOne({ 
      userId: req.user.id, 
      name: trimmedName 
    });
    
    if (existing) {
      return res.status(409).json({ message: 'A shelf with this name already exists' });
    }
    
    // Get the highest sortOrder
    const maxShelf = await CustomShelf.findOne({ userId: req.user.id })
      .sort({ sortOrder: -1 })
      .select('sortOrder');
    
    const newSortOrder = maxShelf ? maxShelf.sortOrder + 1 : 0;
    
    // Create shelf
    const shelf = new CustomShelf({
      userId: req.user.id,
      name: trimmedName,
      filters: filters || {},
      sortOrder: newSortOrder
    });
    
    await shelf.save();
    
    res.status(201).json(shelf);
  } catch (error) {
    console.error('Error creating shelf:', error);
    
    // Handle mongoose duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A shelf with this name already exists' });
    }
    
    res.status(500).json({ message: 'Failed to create shelf' });
  }
});

// Update shelf
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, filters } = req.body;
    
    // Find shelf and verify ownership
    const shelf = await CustomShelf.findOne({ 
      _id: req.params.id,
      userId: req.user.id 
    });
    
    if (!shelf) {
      return res.status(404).json({ message: 'Shelf not found' });
    }
    
    // Validate name if provided
    if (name !== undefined) {
      const trimmedName = name.trim();
      
      if (!trimmedName) {
        return res.status(400).json({ message: 'Shelf name cannot be empty' });
      }
      
      if (trimmedName.length > 50) {
        return res.status(400).json({ message: 'Shelf name must be 50 characters or less' });
      }
      
      // Check for duplicate name (excluding current shelf)
      const existing = await CustomShelf.findOne({
        userId: req.user.id,
        name: trimmedName,
        _id: { $ne: req.params.id }
      });
      
      if (existing) {
        return res.status(409).json({ message: 'A shelf with this name already exists' });
      }
      
      shelf.name = trimmedName;
    }
    
    // Update filters if provided
    if (filters) {
      shelf.filters = filters;
    }
    
    shelf.updatedAt = Date.now();
    await shelf.save();
    
    res.json(shelf);
  } catch (error) {
    console.error('Error updating shelf:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A shelf with this name already exists' });
    }
    
    res.status(500).json({ message: 'Failed to update shelf' });
  }
});

// Delete shelf
router.delete('/:id', auth, async (req, res) => {
  try {
    const shelf = await CustomShelf.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!shelf) {
      return res.status(404).json({ message: 'Shelf not found' });
    }
    
    res.json({ message: 'Shelf deleted successfully' });
  } catch (error) {
    console.error('Error deleting shelf:', error);
    res.status(500).json({ message: 'Failed to delete shelf' });
  }
});

// Reorder shelves
router.put('/reorder', auth, async (req, res) => {
  try {
    const { shelfIds } = req.body;
    
    if (!Array.isArray(shelfIds)) {
      return res.status(400).json({ message: 'shelfIds must be an array' });
    }
    
    // Update sortOrder for each shelf
    const updatePromises = shelfIds.map((shelfId, index) => 
      CustomShelf.updateOne(
        { _id: shelfId, userId: req.user.id },
        { sortOrder: index, updatedAt: Date.now() }
      )
    );
    
    await Promise.all(updatePromises);
    
    // Return updated shelves
    const shelves = await CustomShelf.find({ userId: req.user.id })
      .sort({ sortOrder: 1, createdAt: 1 });
    
    res.json({ shelves });
  } catch (error) {
    console.error('Error reordering shelves:', error);
    res.status(500).json({ message: 'Failed to reorder shelves' });
  }
});

module.exports = router;
