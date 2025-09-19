/**
 * Test script for the multi-genre categorization service
 * Run with: node backend/tests/testMultiGenre.js
 */

const multiGenreCategoryService = require('../services/multiGenreCategoryService');

// Test cases with expected results
const testBooks = [
  {
    name: 'The Pillars of the Earth',
    apiGenres: ['Historical Fiction', 'Medieval', 'Thriller'],
    title: 'The Pillars of the Earth',
    description: 'Set in 12th-century England, the story of building a cathedral',
    expectedType: 'Fiction',
    expectedGenres: ['Historical Fiction', 'Mystery / Thriller']
  },
  {
    name: 'Ready Player One',
    apiGenres: ['Science Fiction', 'Young Adult', 'Dystopian'],
    title: 'Ready Player One',
    description: 'In a dystopian future, teenagers compete in a virtual reality game',
    expectedType: 'Fiction',
    expectedGenres: ['SciFi / Dystopian', 'Young Adult']
  },
  {
    name: 'Pride and Prejudice',
    apiGenres: ['Romance', 'Classic Literature', 'Fiction'],
    title: 'Pride and Prejudice',
    description: 'A romantic novel about Elizabeth Bennet and Mr. Darcy',
    expectedType: 'Fiction',
    expectedGenres: ['Romance', 'Contemporary Fiction']
  },
  {
    name: 'Harry Potter',
    apiGenres: ['Fantasy', 'Young Adult', 'Magic', 'Adventure'],
    title: 'Harry Potter and the Sorcerers Stone',
    description: 'A young wizard discovers his magical heritage at Hogwarts',
    expectedType: 'Fiction',
    expectedGenres: ['Fantasy', 'Young Adult']
  },
  {
    name: 'The Girl with the Dragon Tattoo',
    apiGenres: ['Mystery', 'Thriller', 'Crime', 'Suspense'],
    title: 'The Girl with the Dragon Tattoo',
    description: 'A journalist investigates a decades-old disappearance',
    expectedType: 'Fiction',
    expectedGenres: ['Mystery / Thriller']
  },
  {
    name: 'Salt, Fat, Acid, Heat',
    apiGenres: ['Cookbook', 'Cooking', 'Food & Wine', 'Non-fiction'],
    title: 'Salt, Fat, Acid, Heat',
    description: 'Master the elements of good cooking',
    expectedType: 'Nonfiction',
    expectedGenres: ['Cookbooks']
  },
  {
    name: 'Educated',
    apiGenres: ['Memoir', 'Biography', 'Non-fiction'],
    title: 'Educated: A Memoir',
    description: "Tara Westover's journey from survivalist family to Cambridge",
    expectedType: 'Nonfiction',
    expectedGenres: ['Biography / Memoir']
  },
  {
    name: 'Where the Crawdads Sing',
    apiGenres: ['Fiction', 'Mystery', 'Romance', 'Southern Fiction'],
    title: 'Where the Crawdads Sing',
    description: 'A murder mystery and coming-of-age story set in the marshes',
    expectedType: 'Fiction',
    expectedGenres: ['Mystery / Thriller', 'Romance', 'Contemporary Fiction']
  },
  {
    name: 'The Very Hungry Caterpillar',
    apiGenres: ["Children's Books", 'Picture Book'],
    title: 'The Very Hungry Caterpillar',
    description: "A children's picture book about a caterpillar eating",
    expectedType: 'Fiction',
    expectedGenres: ["Children's Fiction"]
  },
  {
    name: 'The Shining',
    apiGenres: ['Horror', 'Thriller', 'Supernatural'],
    title: 'The Shining',
    description: 'A family stays in an isolated hotel with a violent past',
    expectedType: 'Fiction',
    expectedGenres: ['Mystery / Thriller'] // Horror is included in Mystery/Thriller
  },
  {
    name: 'Milk and Honey',
    apiGenres: ['Poetry', 'Feminism'],
    title: 'Milk and Honey',
    description: 'A collection of poetry about love, loss, trauma, and healing',
    expectedType: 'Fiction', // Poetry can be either, will depend on content
    expectedGenres: ['Poetry']
  }
];

console.log('=== Multi-Genre Categorization Test ===\n');

let passed = 0;
let failed = 0;

for (const test of testBooks) {
  console.log(`\nTesting: "${test.name}"`);
  console.log(`API Genres: ${test.apiGenres.join(', ')}`);
  
  const result = multiGenreCategoryService.categorizeBook(
    test.apiGenres,
    test.title,
    test.description,
    ['Test Author']
  );
  
  console.log(`Result Type: ${result.categoryType}`);
  console.log(`Result Genres: ${result.genres.join(', ')}`);
  
  // Check category type
  const typeMatch = result.categoryType === test.expectedType;
  
  // Check genres (all expected genres should be present)
  const genresMatch = test.expectedGenres.every(genre => 
    result.genres.includes(genre)
  );
  
  if (typeMatch && genresMatch) {
    console.log('✅ PASSED');
    passed++;
  } else {
    console.log('❌ FAILED');
    if (!typeMatch) {
      console.log(`  Expected type: ${test.expectedType}, Got: ${result.categoryType}`);
    }
    if (!genresMatch) {
      console.log(`  Expected genres: ${test.expectedGenres.join(', ')}`);
      console.log(`  Missing: ${test.expectedGenres.filter(g => !result.genres.includes(g)).join(', ')}`);
    }
    failed++;
  }
  
  // Show reasoning
  if (result.genreReasons) {
    console.log('Reasoning:');
    Object.entries(result.genreReasons).forEach(([genre, reasons]) => {
      console.log(`  ${genre}:`);
      reasons.slice(0, 3).forEach(reason => console.log(`    - ${reason}`));
      if (reasons.length > 3) {
        console.log(`    ... and ${reasons.length - 3} more reasons`);
      }
    });
  }
}

console.log('\n' + '='.repeat(50));
console.log(`\nTest Results: ${passed} passed, ${failed} failed out of ${testBooks.length} tests`);

// Test edge cases
console.log('\n=== Edge Case Tests ===\n');

// Test with no genres
console.log('Test: No genres provided');
const noGenres = multiGenreCategoryService.categorizeBook([], 'Unknown Book', 'A book');
console.log(`Result: ${noGenres.categoryType} - ${noGenres.genres.join(', ')}`);

// Test with conflicting genres
console.log('\nTest: Conflicting genres (Cookbook + Fiction)');
const conflicting = multiGenreCategoryService.categorizeBook(
  ['Cookbook', 'Fiction', 'Mystery'],
  'The Mystery Cookbook',
  'A fictional story about cooking'
);
console.log(`Result: ${conflicting.categoryType} - ${conflicting.genres.join(', ')}`);

console.log('\n=== Test Complete ===');
