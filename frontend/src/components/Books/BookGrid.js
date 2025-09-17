import React from 'react';
import { Grid } from '@mui/material';
import BookCard from './BookCard';

const BookGrid = ({ books, onBookClick }) => {
  return (
    <Grid container spacing={3}>
      {books.map((book) => (
        <Grid item key={book._id || book.isbn} xs={6} sm={4} md={3} lg={2}>
          <BookCard book={book} onClick={onBookClick} />
        </Grid>
      ))}
    </Grid>
  );
};

export default BookGrid;
