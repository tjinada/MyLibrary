import React from 'react';
import { Grid } from '@mui/material';
import BookCard from './BookCard';

const BookGrid = ({ books }) => {
  return (
    <Grid container spacing={2}>
      {books.map((book) => (
        <Grid item key={book._id || book.isbn} xs={6} sm={4} md={3} lg={2}>
          <BookCard book={book} />
        </Grid>
      ))}
    </Grid>
  );
};

export default BookGrid;
