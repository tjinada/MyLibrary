import React, { memo } from 'react';
import { Grid } from '@mui/material';
import BookCard from './BookCard';

const BookGrid = ({ books, onBookClick, showRemoveButton, onRemoveBook }) => {
  return (
    <Grid container spacing={3}>
      {books.map((book) => (
        <Grid item key={book._id || book.isbn} xs={6} sm={4} md={3} lg={2}>
          <MemoizedBookCard 
            book={book} 
            onClick={onBookClick}
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
  // Only re-render if the book data or click handler changes
  return (
    prevProps.book._id === nextProps.book._id &&
    prevProps.book.coverImage === nextProps.book.coverImage &&
    prevProps.book.title === nextProps.book.title &&
    prevProps.book.status === nextProps.book.status &&
    prevProps.book.rating === nextProps.book.rating &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.showRemoveButton === nextProps.showRemoveButton &&
    prevProps.onRemove === nextProps.onRemove
  );
});

export default BookGrid;
