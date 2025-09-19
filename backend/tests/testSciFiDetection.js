/**
 * Test for the specific case of "To Sleep in a Sea of Stars"
 * This should be categorized as SciFi, not Fantasy
 */

const multiGenreCategoryService = require('../services/multiGenreCategoryService');

console.log('=== Test: "To Sleep in a Sea of Stars" ===\n');

// Test with the exact API response you showed
const apiGenres = [
  'Fiction',
  'nyt:combined-print-and-e-book-fiction=2020-10-04',
  'New York Times bestseller',
  'Fiction, science fiction, action & adventure'
];

const result = multiGenreCategoryService.categorizeBook(
  apiGenres,
  'To Sleep in a Sea of Stars Sneak Peek',
  'Epic space opera about first contact',  // Adding a description to help
  ['Christopher Paolini']
);

console.log('\n=== Results ===');
console.log('Category Type:', result.categoryType);
console.log('Genres:', result.genres);
console.log('\nExpected: SciFi / Dystopian (because API clearly says "science fiction")');
console.log('Actual:', result.genres.includes('SciFi / Dystopian') ? '✅ Correct!' : '❌ Wrong!');

if (result.genreReasons) {
  console.log('\n=== Reasoning ===');
  Object.entries(result.genreReasons).forEach(([genre, reasons]) => {
    console.log(`${genre}:`);
    reasons.forEach(reason => console.log(`  - ${reason}`));
  });
}

// Test another clear sci-fi book
console.log('\n\n=== Test: Clear SciFi Book ===\n');

const scifiResult = multiGenreCategoryService.categorizeBook(
  ['Science Fiction', 'Space Opera'],
  'The Martian',
  'An astronaut is stranded on Mars and must survive',
  ['Andy Weir']
);

console.log('Genres:', scifiResult.genres);
console.log('Expected: Should include "SciFi / Dystopian"');
console.log('Result:', scifiResult.genres.includes('SciFi / Dystopian') ? '✅ Correct!' : '❌ Wrong!');

// Test that fantasy doesn't trigger on space books
console.log('\n\n=== Test: Space book should not be Fantasy ===\n');

const spaceResult = multiGenreCategoryService.categorizeBook(
  ['Fiction', 'Adventure'],
  'Star Wars',
  'A space adventure in a galaxy far far away',
  ['George Lucas']
);

console.log('Genres:', spaceResult.genres);
console.log('Should NOT include Fantasy (even though Star Wars has "magical" Force)');
console.log('Fantasy included?:', spaceResult.genres.includes('Fantasy') ? '❌ Wrong!' : '✅ Correct!');
console.log('SciFi included?:', spaceResult.genres.includes('SciFi / Dystopian') ? '✅ Correct!' : '❌ Wrong!');
