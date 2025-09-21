import React, { memo } from 'react';
import { Grid } from '@mui/material';
import BookCard from './BookCard';

const BookGrid = ({ books, onBookClick, showRemoveButton, onRemoveBook }) => {
  return (
    <Grid container spacing={1.5}> {/* Reduced spacing from 3 to 1.5 */}
      {books.map((book) => (
        <Grid 
          item 
          key={book._id || book.isbn} 
          xs={4}   // 3 cards per row on mobile (was 2)
          sm={3}   // 4 cards per row on small screens (was 3)
          md={2.4} // 5 cards per row on medium screens (was 4)
          lg={2}   // 6 cards per row on large screens (was 6)
          xl={1.5} // 8 cards per row on extra large screens
        >
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
