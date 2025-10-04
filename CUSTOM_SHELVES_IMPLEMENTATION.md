# Custom Shelf Views - Complete Implementation Guide

## Overview
Allow users to save filter combinations as custom "shelves" for quick access to organized book views (e.g., "Adult Mystery Shelf", "Unread Signed Books").

## Feature Requirements

### Core Features
- ✅ Create custom shelves from active filters
- ✅ Apply saved shelf (one-click filter restoration)
- ✅ Edit shelf (rename, modify filters)
- ✅ Delete shelf
- ✅ Reorder shelves
- ✅ **No default shelves** - users create their own
- ✅ **No shelf limit** - unlimited shelves
- ✅ **No persistence** - fresh state on reload (fetched from DB)
- ✅ **No icons** - text-only shelf names
- ✅ Hybrid UI approach (desktop bar + mobile dropdown)

### Filter Types Supported
1. **Genre Filters**
   - Include genres (must have at least one)
   - Exclude genres (must not have any)

2. **Status Filter**
   - All, To Read, Reading, Read, Loaned

3. **Edition Filters** (NEW)
   - Include editions (must have specific editions)
   - Exclude editions (must not have these editions)

4. **Collection Filters** (NEW)
   - Include collections (must be in specific collections)
   - Exclude collections (must NOT be in these collections)
   - **Logic:** If book is in ANY excluded collection → hide book

5. **Sort Order**
   - Save current sort with shelf

### Business Rules

#### Shelf Name Validation
- **Must be unique** per user
- Required field (cannot be empty)
- Recommended max length: 50 characters
- Trim whitespace
- Case-sensitive uniqueness check

#### Shelf Management UI
- **Access:** Click on active shelf button to see management options
- **Options:**
  - Edit (modify filters and name)
  - Delete (with confirmation)
  - Maybe: Quick actions on hover/right-click

#### Shelf Bar Position (User-Friendly & Non-Cluttering)
**Recommended Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Toolbar: [Collections] [Filters] [Sort]            │
├─────────────────────────────────────────────────────┤
│ Search & Stats Section                              │
├─────────────────────────────────────────────────────┤
│ My Shelves: [Adult Mystery] [YA Fantasy] [+New]    │ ← Collapsible/Expandable
├─────────────────────────────────────────────────────┤
│ Active Filters: [Include: X] [Exclude: Y]          │
│                 [💾 Save as Shelf]                  │
├─────────────────────────────────────────────────────┤
│ Results: Showing 1-50 of 71 items                   │
├─────────────────────────────────────────────────────┤
│ Books Grid...                                       │
└─────────────────────────────────────────────────────┘
```

**Considerations:**
- Shelf bar only appears when user has created at least one shelf
- Can be collapsed to save space (show/hide toggle)
- Horizontal scroll for many shelves
- Mobile: Dropdown instead of bar

#### Save as Shelf Button
- **Appears:** Whenever any filter is active (status !== 'all' OR genre filters OR exclude filters OR edition filters OR collection filters)
- **Position:** Next to or integrated with Active Filter Chips
- **Behavior:** Opens Create Shelf Modal

#### Collection Filtering Logic
- **Exclude Collections:** If book is in ANY of the excluded collections → hide book
- **Include Collections:** If book is in ANY of the included collections → show book
- **Both:** Book must be in included collections AND not in excluded collections

---

## Data Model

### CustomShelf Schema

**File:** `backend/models/CustomShelf.js`

```javascript
const mongoose = require('mongoose');

const CustomShelfSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  filters: {
    // Genre filters
    genre: {
      type: [String],
      default: []
    },
    excludeGenres: {
      type: [String],
      default: []
    },
    
    // Status filter
    status: {
      type: String,
      enum: ['all', 'to-read', 'reading', 'read', 'loaned'],
      default: 'all'
    },
    
    // Edition filters (NEW)
    includeEditions: {
      type: [String],
      enum: ['standard', 'signed', 'deluxe'],
      default: []
    },
    excludeEditions: {
      type: [String],
      enum: ['standard', 'signed', 'deluxe'],
      default: []
    },
    
    // Collection filters (NEW)
    includeCollections: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Collection',
      default: []
    },
    excludeCollections: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Collection',
      default: []
    },
    
    // Sort order
    sort: {
      type: String,
      default: 'title'
    }
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique shelf names per user
CustomShelfSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('CustomShelf', CustomShelfSchema);
```

---

## Backend Implementation

### API Routes

**File:** `backend/routes/customShelves.js`

#### Endpoints:

**1. GET /api/custom-shelves**
- Get all shelves for current user
- Sorted by sortOrder
- Response:
```json
{
  "shelves": [
    {
      "_id": "shelf_123",
      "name": "Adult Mystery",
      "filters": { ... },
      "sortOrder": 1
    }
  ]
}
```

**2. POST /api/custom-shelves**
- Create new shelf
- Body:
```json
{
  "name": "Adult Mystery Shelf",
  "filters": {
    "genre": ["Mystery / Thriller"],
    "excludeGenres": ["Young Adult"],
    "status": "all",
    "includeEditions": [],
    "excludeEditions": [],
    "includeCollections": [],
    "excludeCollections": [],
    "sort": "authors"
  }
}
```
- **Validation:**
  - Check name is unique for user
  - Trim whitespace
  - Max length 50 chars
- Response: Created shelf object

**3. PUT /api/custom-shelves/:id**
- Update existing shelf
- Body: Same as POST
- **Validation:**
  - Check new name doesn't conflict with other shelves
  - User owns this shelf
- Response: Updated shelf object

**4. DELETE /api/custom-shelves/:id**
- Delete shelf
- **Validation:**
  - User owns this shelf
- Response: Success message

**5. PUT /api/custom-shelves/reorder**
- Reorder shelves
- Body:
```json
{
  "shelfIds": ["id1", "id2", "id3"]
}
```
- Updates sortOrder for all shelves
- Response: Updated shelves

---

### Update Books API

**File:** `backend/routes/books.js`

Add new query parameters to GET `/books`:
- `includeEditions` (array)
- `excludeEditions` (array)
- `includeCollections` (array)
- `excludeCollections` (array)

**Filter Logic:**

```javascript
// Edition filters
if (includeEditions && includeEditions.length > 0) {
  query.edition = { $in: includeEditions };
}

if (excludeEditions && excludeEditions.length > 0) {
  if (query.edition) {
    query.edition.$nin = excludeEditions;
  } else {
    query.edition = { $nin: excludeEditions };
  }
}

// Collection filters
if (excludeCollections && excludeCollections.length > 0) {
  // Book must NOT be in any excluded collection
  query.collections = { 
    $nin: excludeCollections.map(id => mongoose.Types.ObjectId(id)) 
  };
}

if (includeCollections && includeCollections.length > 0) {
  // Book must be in at least one included collection
  if (query.collections) {
    query.collections.$in = includeCollections.map(id => mongoose.Types.ObjectId(id));
  } else {
    query.collections = { 
      $in: includeCollections.map(id => mongoose.Types.ObjectId(id)) 
    };
  }
}
```

---

## Frontend Implementation

### State Management

**File:** `frontend/src/pages/Library.js`

#### New State:

```javascript
// Custom shelves
const [customShelves, setCustomShelves] = useState([]);
const [activeShelfId, setActiveShelfId] = useState(null);
const [createShelfModalOpen, setCreateShelfModalOpen] = useState(false);
const [editingShelf, setEditingShelf] = useState(null);
const [manageShelvesModalOpen, setManageShelvesModalOpen] = useState(false);

// Updated filters state
const [filters, setFilters] = useState({
  search: '',
  status: 'all',
  genre: 'all',
  excludeGenres: [],
  includeEditions: [],        // NEW
  excludeEditions: [],        // NEW
  includeCollections: [],     // NEW
  excludeCollections: [],     // NEW
  sort: 'title',
});
```

#### New useEffect:

```javascript
// Fetch custom shelves on mount
useEffect(() => {
  fetchCustomShelves();
}, []);

const fetchCustomShelves = async () => {
  try {
    const data = await customShelfService.getShelves();
    setCustomShelves(data.shelves);
  } catch (error) {
    console.error('Failed to fetch shelves:', error);
  }
};
```

#### Update fetchLibrary dependency:

```javascript
useEffect(() => {
  fetchLibrary();
}, [
  filters.status, 
  filters.genre, 
  filters.excludeGenres, 
  filters.includeEditions,     // NEW
  filters.excludeEditions,     // NEW
  filters.includeCollections,  // NEW
  filters.excludeCollections,  // NEW
  filters.edition, 
  filters.sort, 
  showCollectionsOnly
]);
```

#### New Handlers:

```javascript
const handleApplyShelf = (shelf) => {
  setFilters(shelf.filters);
  setActiveShelfId(shelf._id);
};

const handleClearShelf = () => {
  setActiveShelfId(null);
  handleClearFilters();
};

const handleSaveAsShelf = async (name) => {
  try {
    const newShelf = await customShelfService.createShelf({
      name: name.trim(),
      filters: { ...filters }
    });
    setCustomShelves([...customShelves, newShelf]);
    setActiveShelfId(newShelf._id);
    setCreateShelfModalOpen(false);
  } catch (error) {
    if (error.response?.status === 409) {
      // Name already exists
      alert('A shelf with this name already exists. Please choose a different name.');
    } else {
      console.error('Failed to create shelf:', error);
    }
  }
};

const handleEditShelf = async (shelfId, name, filters) => {
  try {
    const updated = await customShelfService.updateShelf(shelfId, { name, filters });
    setCustomShelves(shelves => 
      shelves.map(s => s._id === shelfId ? updated : s)
    );
    setEditingShelf(null);
  } catch (error) {
    if (error.response?.status === 409) {
      alert('A shelf with this name already exists. Please choose a different name.');
    } else {
      console.error('Failed to update shelf:', error);
    }
  }
};

const handleDeleteShelf = async (shelfId) => {
  if (!window.confirm('Are you sure you want to delete this shelf?')) {
    return;
  }
  
  try {
    await customShelfService.deleteShelf(shelfId);
    setCustomShelves(shelves => shelves.filter(s => s._id !== shelfId));
    if (activeShelfId === shelfId) {
      setActiveShelfId(null);
    }
  } catch (error) {
    console.error('Failed to delete shelf:', error);
  }
};

const handleReorderShelves = async (reorderedShelves) => {
  try {
    const shelfIds = reorderedShelves.map(s => s._id);
    await customShelfService.reorderShelves(shelfIds);
    setCustomShelves(reorderedShelves);
  } catch (error) {
    console.error('Failed to reorder shelves:', error);
  }
};
```

#### Update fetchLibrary Logic:

```javascript
const fetchLibrary = async () => {
  try {
    setLoading(true);
    
    const allBooksData = await bookService.getBooks({
      page: 1,
      limit: 1000,
      status: filters.status !== 'all' ? filters.status : undefined,
      excludeGenres: filters.excludeGenres.length > 0 ? filters.excludeGenres : undefined,
      includeEditions: filters.includeEditions.length > 0 ? filters.includeEditions : undefined,
      excludeEditions: filters.excludeEditions.length > 0 ? filters.excludeEditions : undefined,
      includeCollections: filters.includeCollections.length > 0 ? filters.includeCollections : undefined,
      excludeCollections: filters.excludeCollections.length > 0 ? filters.excludeCollections : undefined,
    });
    
    // ... rest of fetchLibrary
    
    let booksToDisplay = allBooksData.books;
    
    // Apply exclude genres filter
    if (filters.excludeGenres.length > 0) {
      booksToDisplay = booksToDisplay.filter(book => {
        const bookGenres = new Set();
        if (book.primaryCategory) bookGenres.add(book.primaryCategory);
        if (book.genres && Array.isArray(book.genres)) {
          book.genres.forEach(genre => bookGenres.add(genre));
        }
        return !filters.excludeGenres.some(excludedGenre => bookGenres.has(excludedGenre));
      });
    }
    
    // Apply include genres filter
    if (filters.genre !== 'all') {
      // ... existing code
    }
    
    // Apply exclude editions filter
    if (filters.excludeEditions.length > 0) {
      booksToDisplay = booksToDisplay.filter(book => 
        !filters.excludeEditions.includes(book.edition)
      );
    }
    
    // Apply include editions filter
    if (filters.includeEditions.length > 0) {
      booksToDisplay = booksToDisplay.filter(book =>
        filters.includeEditions.includes(book.edition)
      );
    }
    
    // Apply exclude collections filter
    if (filters.excludeCollections.length > 0) {
      booksToDisplay = booksToDisplay.filter(book => {
        const bookCollections = book.collections || [];
        // If book is in ANY excluded collection, hide it
        return !filters.excludeCollections.some(excludedId =>
          bookCollections.some(bookColId => 
            (typeof bookColId === 'object' ? bookColId._id : bookColId) === excludedId
          )
        );
      });
    }
    
    // Apply include collections filter
    if (filters.includeCollections.length > 0) {
      booksToDisplay = booksToDisplay.filter(book => {
        const bookCollections = book.collections || [];
        // Book must be in at least one included collection
        return filters.includeCollections.some(includedId =>
          bookCollections.some(bookColId =>
            (typeof bookColId === 'object' ? bookColId._id : bookColId) === includedId
          )
        );
      });
    }
    
    // ... rest of filtering logic
  }
};
```

---

### New Components

#### 1. CustomShelfBar.js

**File:** `frontend/src/components/Shelves/CustomShelfBar.js`

Desktop view - horizontal scrollable bar with shelf buttons.

```jsx
import React from 'react';
import { Box, Button, Chip, IconButton, Menu, MenuItem } from '@mui/material';
import { Add as AddIcon, MoreVert as MoreIcon } from '@mui/icons-material';

const CustomShelfBar = ({ 
  shelves, 
  activeShelfId, 
  onApplyShelf, 
  onEditShelf,
  onDeleteShelf,
  onCreateShelf 
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedShelf, setSelectedShelf] = React.useState(null);

  const handleMenuOpen = (event, shelf) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedShelf(shelf);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedShelf(null);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 1, 
      alignItems: 'center',
      overflowX: 'auto',
      pb: 1,
      '&::-webkit-scrollbar': { 
        height: 6 
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 3
      }
    }}>
      <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>
        My Shelves:
      </Typography>
      
      {shelves.map(shelf => (
        <Box key={shelf._id} sx={{ position: 'relative', display: 'flex' }}>
          <Button
            variant={activeShelfId === shelf._id ? 'contained' : 'outlined'}
            onClick={() => onApplyShelf(shelf)}
            sx={{ 
              minWidth: 'auto',
              whiteSpace: 'nowrap',
              textTransform: 'none',
              pr: 4
            }}
          >
            {shelf.name}
          </Button>
          
          {activeShelfId === shelf._id && (
            <IconButton
              size="small"
              onClick={(e) => handleMenuOpen(e, shelf)}
              sx={{ 
                position: 'absolute',
                right: 2,
                top: '50%',
                transform: 'translateY(-50%)',
                padding: 0.5
              }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ))}
      
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={onCreateShelf}
        sx={{ 
          minWidth: 'auto',
          textTransform: 'none'
        }}
      >
        New Shelf
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          onEditShelf(selectedShelf);
          handleMenuClose();
        }}>
          Edit Shelf
        </MenuItem>
        <MenuItem onClick={() => {
          onDeleteShelf(selectedShelf._id);
          handleMenuClose();
        }}>
          Delete Shelf
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CustomShelfBar;
```

#### 2. CreateShelfModal.js

**File:** `frontend/src/components/Shelves/CreateShelfModal.js`

Modal for creating or editing a shelf.

```jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip
} from '@mui/material';

const CreateShelfModal = ({ 
  open, 
  onClose, 
  onSave, 
  filters,
  editMode = false,
  initialName = '',
  initialFilters = null
}) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (open) {
      setName(initialName);
      setError('');
    }
  }, [open, initialName]);

  const handleSave = () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Shelf name is required');
      return;
    }
    
    if (trimmedName.length > 50) {
      setError('Shelf name must be 50 characters or less');
      return;
    }
    
    onSave(trimmedName, editMode ? initialFilters : filters);
  };

  const getFilterSummary = () => {
    const currentFilters = editMode ? initialFilters : filters;
    const summary = [];
    
    // Genre filters
    if (currentFilters.genre !== 'all' && currentFilters.genre.length > 0) {
      const genres = Array.isArray(currentFilters.genre) 
        ? currentFilters.genre 
        : [currentFilters.genre];
      summary.push(`Include: ${genres.join(', ')}`);
    }
    
    if (currentFilters.excludeGenres?.length > 0) {
      summary.push(`Exclude: ${currentFilters.excludeGenres.join(', ')}`);
    }
    
    // Status
    if (currentFilters.status !== 'all') {
      summary.push(`Status: ${currentFilters.status}`);
    }
    
    // Editions
    if (currentFilters.includeEditions?.length > 0) {
      summary.push(`Include Editions: ${currentFilters.includeEditions.join(', ')}`);
    }
    
    if (currentFilters.excludeEditions?.length > 0) {
      summary.push(`Exclude Editions: ${currentFilters.excludeEditions.join(', ')}`);
    }
    
    // Collections
    if (currentFilters.includeCollections?.length > 0) {
      summary.push(`Include Collections: ${currentFilters.includeCollections.length} selected`);
    }
    
    if (currentFilters.excludeCollections?.length > 0) {
      summary.push(`Exclude Collections: ${currentFilters.excludeCollections.length} selected`);
    }
    
    // Sort
    summary.push(`Sort: ${currentFilters.sort}`);
    
    return summary;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editMode ? 'Edit Shelf' : 'Create Custom Shelf'}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Shelf Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          error={!!error}
          helperText={error || 'Give your shelf a descriptive name'}
          required
          autoFocus
          sx={{ mt: 2, mb: 3 }}
          inputProps={{ maxLength: 50 }}
        />
        
        <Typography variant="subtitle2" gutterBottom>
          Filters to Save:
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {getFilterSummary().map((line, index) => (
            <Typography key={index} variant="body2" color="text.secondary">
              • {line}
            </Typography>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!name.trim()}
        >
          {editMode ? 'Update' : 'Create'} Shelf
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateShelfModal;
```

#### 3. ManageShelvesModal.js

**File:** `frontend/src/components/Shelves/ManageShelvesModal.js`

Modal for managing all shelves with drag-drop reordering.

```jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box
} from '@mui/material';
import {
  DragHandle as DragHandleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const ManageShelvesModal = ({ 
  open, 
  onClose, 
  shelves,
  onEdit,
  onDelete,
  onReorder
}) => {
  const [localShelves, setLocalShelves] = useState(shelves);

  useEffect(() => {
    setLocalShelves(shelves);
  }, [shelves]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(localShelves);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setLocalShelves(items);
    onReorder(items);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Custom Shelves</DialogTitle>
      <DialogContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="shelves">
            {(provided) => (
              <List {...provided.droppableProps} ref={provided.innerRef}>
                {localShelves.map((shelf, index) => (
                  <Draggable 
                    key={shelf._id} 
                    draggableId={shelf._id} 
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          bgcolor: snapshot.isDragging ? 'action.hover' : 'transparent',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <Box {...provided.dragHandleProps} sx={{ mr: 2 }}>
                          <DragHandleIcon />
                        </Box>
                        <ListItemText primary={shelf.name} />
                        <IconButton 
                          size="small" 
                          onClick={() => onEdit(shelf)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => onDelete(shelf._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>
      </DialogContent>
    </Dialog>
  );
};

export default ManageShelvesModal;
```

#### 4. Update FilterDrawer.js

Add four new sections (similar to genres):

1. **Include Editions** (Green, after Exclude Genres)
2. **Exclude Editions** (Red)
3. **Include Collections** (Green)
4. **Exclude Collections** (Red)

Pattern:
- Checkboxes for each option
- Show counts
- Clear button
- Color-coded (green/red)
- Disabled if in opposite list

#### 5. Create customShelfService.js

**File:** `frontend/src/services/customShelfService.js`

```javascript
import api from './api';

const customShelfService = {
  async getShelves() {
    const response = await api.get('/custom-shelves');
    return response.data;
  },

  async createShelf(shelfData) {
    const response = await api.post('/custom-shelves', shelfData);
    return response.data;
  },

  async updateShelf(shelfId, shelfData) {
    const response = await api.put(`/custom-shelves/${shelfId}`, shelfData);
    return response.data;
  },

  async deleteShelf(shelfId) {
    const response = await api.delete(`/custom-shelves/${shelfId}`);
    return response.data;
  },

  async reorderShelves(shelfIds) {
    const response = await api.put('/custom-shelves/reorder', { shelfIds });
    return response.data;
  }
};

export default customShelfService;
```

---

## UI Layout (Final Recommendation)

### Desktop Layout:
```
┌────────────────────────────────────────────────────────────┐
│ Toolbar: [Collections] [Filters] [Sort: Author A-Z ▼]     │
├────────────────────────────────────────────────────────────┤
│ [468 Total Books] [98 Unread] [Search books, authors...]  │
├────────────────────────────────────────────────────────────┤
│ My Shelves: [Adult Mystery] [YA Fantasy] [+New Shelf]     │ ← Only if shelves exist
├────────────────────────────────────────────────────────────┤
│ Active filters: [Include: Mystery/Thriller] [Exclude: YA] │ ← Only if filters active
│                 [💾 Save as Shelf]                         │
├────────────────────────────────────────────────────────────┤
│ Showing 1-50 of 71 items (71 books)                       │
├────────────────────────────────────────────────────────────┤
│ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐                                      │
│ │ │ │ │ │ │ │ │ │ │  Books Grid                         │
│ └─┘ └─┘ └─┘ └─┘ └─┘                                      │
└────────────────────────────────────────────────────────────┘
```

### Mobile Layout:
```
┌──────────────────────────────┐
│ [☰] [Filters] [Sort ▼]      │
├──────────────────────────────┤
│ [Search...]                  │
├──────────────────────────────┤
│ [📚 My Shelves ▼]           │ ← Dropdown
├──────────────────────────────┤
│ Active: [Mystery] [x]        │
│         [💾 Save]            │
├──────────────────────────────┤
│ ┌──┐ ┌──┐                   │
│ │  │ │  │  Books            │
└──────────────────────────────┘
```

---

## Implementation Order

### Phase 1: Backend Foundation
1. Create CustomShelf model
2. Create custom-shelves routes
3. Update books.js to handle new filters
4. Test API endpoints

### Phase 2: Frontend Core
1. Add new filter state (editions, collections)
2. Update FilterDrawer with new sections
3. Update fetchLibrary with new filter logic
4. Test filtering works

### Phase 3: Shelf Management
1. Create CustomShelfBar component
2. Create CreateShelfModal component
3. Create customShelfService
4. Add shelf state and handlers to Library.js
5. Integrate UI components
6. Test create/apply/delete shelf

### Phase 4: Advanced Features
1. Create ManageShelvesModal with drag-drop
2. Add edit shelf functionality
3. Add reorder shelves functionality
4. Polish UI and UX

---

## Files to Create

### Backend (3 files)
- `backend/models/CustomShelf.js`
- `backend/routes/customShelves.js`
- Update `backend/routes/books.js`

### Frontend (5 new files)
- `frontend/src/components/Shelves/CustomShelfBar.js`
- `frontend/src/components/Shelves/CreateShelfModal.js`
- `frontend/src/components/Shelves/ManageShelvesModal.js`
- `frontend/src/services/customShelfService.js`
- Update `frontend/src/pages/Library.js`
- Update `frontend/src/components/Filters/FilterDrawer.js`
- Update `frontend/src/components/Filters/ActiveFilterChips.js`

---

## Testing Checklist

### Backend Testing
- [ ] Create shelf with unique name
- [ ] Try to create shelf with duplicate name (should fail)
- [ ] Update shelf name to existing name (should fail)
- [ ] Update shelf name to unique name (should succeed)
- [ ] Delete shelf
- [ ] Reorder shelves
- [ ] Filter books by includeEditions
- [ ] Filter books by excludeEditions
- [ ] Filter books by includeCollections
- [ ] Filter books by excludeCollections

### Frontend Testing
- [ ] Create shelf from active filters
- [ ] Apply shelf (filters apply correctly)
- [ ] Edit shelf name
- [ ] Edit shelf filters
- [ ] Delete shelf with confirmation
- [ ] Reorder shelves via drag-drop
- [ ] Active shelf button highlights
- [ ] "Save as Shelf" appears only with active filters
- [ ] Edition filters work (include/exclude)
- [ ] Collection filters work (include/exclude)
- [ ] Mobile: Shelf dropdown works
- [ ] Mobile: All functionality accessible

---

## Error Handling

### Duplicate Shelf Name
```javascript
// Backend response
{
  status: 409,
  message: 'A shelf with this name already exists'
}

// Frontend handling
catch (error) {
  if (error.response?.status === 409) {
    alert('A shelf with this name already exists. Please choose a different name.');
  }
}
```

### Invalid Filters
- Validate that edition values are valid enum values
- Validate that collection IDs exist
- Validate that genre names are valid

---

## Future Enhancements (Post-MVP)

- [ ] Share shelves with other users
- [ ] Export/Import shelf configurations (JSON)
- [ ] Shelf usage analytics (most used, last used)
- [ ] Default shelf (auto-load on app start)
- [ ] Shelf templates/presets
- [ ] Shelf descriptions
- [ ] Keyboard shortcuts for shelf switching
- [ ] Search shelves by name

---

## Notes

- Shelves are user-specific (userId index)
- No limit on number of shelves
- No default/preset shelves
- No persistence of active shelf (fresh state on reload)
- Shelf names are unique per user (case-sensitive)
- Collection filtering: If book is in ANY excluded collection → hide
- Edition filtering: Can both include AND exclude (exclude takes precedence)
