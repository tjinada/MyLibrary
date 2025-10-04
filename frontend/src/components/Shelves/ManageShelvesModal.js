import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Typography
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

  const handleDelete = (shelfId) => {
    if (window.confirm('Are you sure you want to delete this shelf?')) {
      onDelete(shelfId);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Custom Shelves</DialogTitle>
      <DialogContent>
        {localShelves.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No shelves created yet
            </Typography>
          </Box>
        ) : (
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
                            borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
                            borderRadius: 1,
                            mb: 1,
                            transition: 'all 0.2s'
                          }}
                        >
                          <Box 
                            {...provided.dragHandleProps} 
                            sx={{ 
                              mr: 2, 
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'grab',
                              '&:active': {
                                cursor: 'grabbing'
                              }
                            }}
                          >
                            <DragHandleIcon color="action" />
                          </Box>
                          <ListItemText 
                            primary={shelf.name}
                            primaryTypographyProps={{
                              fontWeight: 500
                            }}
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => onEdit(shelf)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(shelf._id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
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
        )}
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Drag shelves to reorder them
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default ManageShelvesModal;
