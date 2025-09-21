/**
 * Test script to verify Children's Fiction categorization
 * Run: node backend/test/testChildrensGenre.js
 */

const multiGenreCategoryService = require('../services/multiGenreCategoryService');

// Test cases
const testCases = [
  {
    name: "Harry Potter (should NOT be children's)",
    apiGenres: ['Fiction', 'Fantasy', 'Young Adult'],
    title: 'Harry Potter and the Sorcerer\'s Stone',
    description: 'A young wizard goes to magic school',
    expectedChildren: false
  },
  {
    name: "Actual Children's Book",
    apiGenres: ['Fiction', 'Children\'s'],
    title: 'The Very Hungry Caterpillar',
    description: 'A caterpillar eats lots of food',
    expectedChildren: true
  },
  {
    name: "YA Book (should NOT be children's)",
    apiGenres: ['Young Adult', 'Fiction', 'Romance'],
    title: 'The Fault in Our Stars',
    description: 'Teen love story',
    expectedChildren: false
  },
  {
    name: "Adult Fantasy (should NOT be children's)",
    apiGenres: ['Fiction', 'Fantasy', 'Epic Fantasy'],
    title: 'The Lord of the Rings',
    description: 'Epic fantasy adventure with hobbits and wizards',
    expectedChildren: false
  },
  {
    name: "Picture Book",
    apiGenres: ['Juvenile Fiction', 'Picture Book'],
    title: 'Where the Wild Things Are',
    description: 'Max travels to an island of monsters',
    expectedChildren: true
  },
  {
    name: "Middle Grade",
    apiGenres: ['Children', 'Adventure'],
    title: 'Percy Jackson',
    description: 'A boy discovers he is a demigod',
    expectedChildren: true
  },
  {
    name: "Adult book with child character (should NOT be children's)",
    apiGenres: ['Fiction', 'Historical Fiction'],
    title: 'The Book Thief',
    description: 'Story about a girl in Nazi Germany',
    expectedChildren: false
  },
  {
    name: "Teen/YA Romance",
    apiGenres: ['Teen', 'Romance', 'Fiction'],
    title: 'Teen Romance Novel',
    description: 'High school romance',
    expectedChildren: false
  }
];

console.log('Testing Children\'s Fiction Categorization\n');
console.log('=' .repeat(50));

let passed = 0;
let failed = 0;

testCases.forEach(test => {
  console.log(`\nTesting: ${test.name}`);
  console.log(`API Genres: ${test.apiGenres.join(', ')}`);
  
  const result = multiGenreCategoryService.categorizeBook(
    test.apiGenres,
    test.title,
    test.description
  );
  
  const hasChildrensGenre = result.genres.includes("Children's Fiction");
  const testPassed = hasChildrensGenre === test.expectedChildren;
  
  console.log(`Result genres: ${result.genres.join(', ')}`);
  console.log(`Has Children's Fiction: ${hasChildrensGenre}`);
  console.log(`Expected Children's: ${test.expectedChildren}`);
  console.log(`TEST ${testPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (testPassed) {
    passed++;
  } else {
    failed++;
    if (result.genreReasons["Children's Fiction"]) {
      console.log('Reasons for Children\'s Fiction:');
      result.genreReasons["Children's Fiction"].forEach(reason => {
        console.log(`  - ${reason}`);
      });
    }
  }
});

console.log('\n' + '=' .repeat(50));
console.log(`\nTest Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
