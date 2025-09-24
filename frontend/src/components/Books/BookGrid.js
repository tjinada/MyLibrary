import React, { memo } from 'react';
import { Grid } from '@mui/material';
import BookCard from './BookCard';

const BookGrid = ({ books, onBookClick, onQuickEdit, onAddToCollection, showRemoveButton, onRemoveBook }) => {
  return (
    <Grid container spacing={2}>
      {books.map((book) => (
        <Grid item key={book._id || book.isbn} xs={4} sm={3} md={2} lg={1.2} xl={1.2}>
          <MemoizedBookCard 
            book={book} 
            onClick={onBookClick}
            onQuickEdit={() => onQuickEdit && onQuickEdit(book)}
            onAddToCollection={() => onAddToCollection && onAddToCollection(book)}
            showRemoveButton={showRemoveButton}
            onRemove={onRemoveBook ? () => onRemoveBook(book._id) : undefined}
          />
        </Grid>
      ))}
    </Grid>
  );
};

// Memoize BookCard to prevent unnecessary re-renders
const MemoizedBookCard = memo(BookCard, (prevProps, nextProps) => {
  // Only re-render if the book data or handlers change
  return (
    prevProps.book._id === nextProps.book._id &&
    prevProps.book.coverImage === nextProps.book.coverImage &&
    prevProps.book.title === nextProps.book.title &&
    prevProps.book.status === nextProps.book.status &&
    prevProps.book.rating === nextProps.book.rating &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.onQuickEdit === nextProps.onQuickEdit &&
    prevProps.onAddToCollection === nextProps.onAddToCollection &&
    prevProps.showRemoveButton === nextProps.showRemoveButton &&
    prevProps.onRemove === nextProps.onRemove
  );
});

export default BookGrid;
