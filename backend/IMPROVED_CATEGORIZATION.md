# Improved Book Categorization System

## Overview
The improved categorization system ensures that every book in the library is properly categorized with a specific genre, eliminating the generic "General Fiction" category and maintaining a clear separation between Fiction and Nonfiction books.

## Key Features

### 1. Single Primary Category
- Each book gets exactly ONE primary category
- No book can be both Fiction and Nonfiction
- Specific, meaningful categories instead of generic ones

### 2. No "General Fiction"
- "General Fiction" has been eliminated
- Books previously categorized as "General Fiction" are now assigned to:
  - **Literary Fiction**: For serious, character-driven literary works
  - **Contemporary Fiction**: For modern, mainstream fiction
  - Or a more specific genre based on content analysis

### 3. Fiction/Nonfiction Separation
Every book is clearly marked as either Fiction or Nonfiction through the `categoryType` field.

## Categories

### Fiction Categories
- **Science Fiction & Fantasy** - Includes sci-fi, fantasy, paranormal, magical realism
- **Mystery / Thriller / Crime** - Detective stories, thrillers, crime fiction
- **Romance** - Love stories, romantic fiction
- **Historical Fiction** - Fiction set in historical periods
- **Horror** - Scary stories, gothic fiction
- **Young Adult (YA) Fiction** - Teen and young adult fiction
- **Children's Fiction** - Books for children
- **Literary Fiction** - Serious literary works, prize-winning fiction
- **Contemporary Fiction** - Modern, mainstream fiction

### Nonfiction Categories
- **Biography / Memoir** - Life stories, autobiographies
- **History** - Historical accounts, events
- **Science & Nature** - Popular science, nature writing
- **Politics & Current Affairs** - Political commentary, current events
- **Self-Help / Personal Development** - Self-improvement, motivation
- **Religion / Spirituality** - Religious and spiritual texts
- **Health & Fitness** - Health, wellness, exercise
- **Business & Economics** - Business, finance, economics
- **Travel** - Travel guides and writing
- **Cooking / Food / Drink** - Cookbooks, food writing
- **Art / Photography / Design** - Visual arts, design
- **Education / Reference** - Textbooks, reference materials
- **Technology / Computers** - Tech, programming, IT
- **True Crime** - Real criminal cases
- **Philosophy** - Philosophical works
- **Psychology** - Psychological studies
- **Parenting & Family** - Parenting guides, family life

## How It Works

### Categorization Algorithm
1. **Weighted Keyword Matching**: Each category has associated keywords with weight scores
2. **Priority System**: More specific genres (like "Science Fiction & Fantasy") have higher priority than general ones
3. **Exclusion Words**: Prevents miscategorization (e.g., "true crime" won't match fiction crime)
4. **Intelligent Fallback**: When no clear match, uses context clues to determine the best category

### Database Fields
```javascript
{
  genres: ['Contemporary Fiction'],        // Array with single category
  primaryCategory: 'Contemporary Fiction', // The main category
  categoryType: 'Fiction'                 // Either 'Fiction' or 'Nonfiction'
}
```

## Migration

### For Existing Books
Run the migration script to update all existing books:
```bash
node backend/utils/migrateCategories.js
```

This will:
- Replace all "General Fiction" with specific categories
- Ensure every book has a `primaryCategory` and `categoryType`
- Maintain a single, specific genre per book

### For New Books
The system automatically categorizes new books when they're added, using:
- Google Books categories
- Open Library subjects
- Book title and description
- Intelligent analysis to determine the most appropriate category

## API Usage

### Getting Books by Category Type
```javascript
// Get all fiction books
GET /api/books?categoryType=Fiction

// Get all nonfiction books
GET /api/books?categoryType=Nonfiction
```

### Getting Books by Specific Genre
```javascript
// Get all mystery books
GET /api/books?primaryCategory=Mystery / Thriller / Crime
```

## Testing

Test the categorization system:
```bash
node backend/tests/testImprovedCategories.js
```

This will verify:
- Correct categorization of various book types
- "General Fiction" is never returned
- Fiction/Nonfiction separation is maintained

## Benefits

1. **Better Organization**: Books are organized into meaningful, specific categories
2. **Clear Separation**: No ambiguity between fiction and nonfiction
3. **Improved Browsing**: Users can easily find books by specific genres
4. **Consistent Data**: Every book has a clear, single category
5. **No Generic Categories**: Eliminates unhelpful "General Fiction" categorization

## Configuration

The categorization system can be configured through environment variables:
- `USE_BISAC_MAPPING=false` - Uses the improved categorization system
- `USE_BISAC_MAPPING=true` - Falls back to BISAC with improved categorization for unmapped books

## Troubleshooting

### Book categorized incorrectly?
1. Check the book's subjects/genres in the database
2. The system prioritizes more specific categories
3. You can manually update the `primaryCategory` field if needed

### Missing categories?
The system uses a comprehensive list of categories, but if you need additional ones, you can modify `improvedCategoryService.js` to add new categories and their associated keywords.
