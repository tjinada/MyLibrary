/**
 * Shared constants between frontend and backend
 * Keep these in sync with backend/services/multiGenreCategoryService.js
 */

export const ALLOWED_GENRES = [
  'Fiction',
  'Nonfiction',
  'Historical Fiction',
  'Fantasy',
  'Science Fiction',
  'Dystopian',
  'Mystery / Thriller',
  'Contemporary Fiction',
  'Romance',
  'Cookbooks',
  'Young Adult',
  'Poetry',
  "Children's Fiction",
  'Biography / Memoir',
  'Anime'
];

export const BOOK_EDITIONS = {
  STANDARD: 'standard',
  SPECIAL: 'special',
  DELUXE: 'deluxe'
};

export const EDITION_LABELS = {
  [BOOK_EDITIONS.STANDARD]: 'Standard Edition',
  [BOOK_EDITIONS.SPECIAL]: 'Special Edition',
  [BOOK_EDITIONS.DELUXE]: 'Deluxe Edition'
};
