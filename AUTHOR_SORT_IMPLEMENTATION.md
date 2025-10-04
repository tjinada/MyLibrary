# Author Last Name Sort Implementation

## Overview
Added functionality to sort library books by author's last name (alphabetically A-Z and Z-A).

## Changes Made

### 1. Backend Model Update
**File:** `backend/models/Book.js`

- Added virtual field `authorLastName` that extracts the last name from the first author
- Logic: Splits author name by whitespace and takes the last part as surname
- Handles edge cases: empty authors array, single-name authors
- Returns lowercase for consistent sorting

### 2. Backend Route Update  
**File:** `backend/routes/books.js`

- Modified GET `/api/books` endpoint to handle `authors` and `-authors` sort parameters
- Implementation:
  - Detects author sort request
  - Fetches all matching books from database
  - Sorts in-memory using the virtual `authorLastName` field
  - Applies pagination to sorted results
  - Returns paginated books with correct metadata

### 3. Frontend Update
**File:** `frontend/src/components/Layout/StickyToolbar.js`

- Added Author (A-Z) and Author (Z-A) options to the sort dropdown
- Sort values: `'authors'` and `'-authors'`
- UI displays up/down arrow icons for sort direction
- Options appear after "Oldest First" in the dropdown menu

## How It Works

1. User selects "Author (A-Z)" or "Author (Z-A)" from sort dropdown
2. Frontend sends request with `sort=authors` or `sort=-authors` parameter
3. Backend detects author sort request
4. Extracts last name from first author using virtual field
5. Sorts books alphabetically by last name
6. Returns paginated, sorted results to frontend

## Technical Details

### Virtual Field Logic
```javascript
BookSchema.virtual('authorLastName').get(function() {
  if (!this.authors || this.authors.length === 0) return '';
  
  const firstAuthor = this.authors[0];
  const nameParts = firstAuthor.trim().split(/\s+/);
  
  return nameParts[nameParts.length - 1].toLowerCase();
});
```

### Sort Behavior
- **Author (A-Z):** Sorts by last name alphabetically (Adams before Zimmerman)
- **Author (Z-A):** Sorts by last name reverse alphabetically (Zimmerman before Adams)
- **Multiple Authors:** Uses only the first author's last name for sorting
- **No Authors:** Books with no authors sort to the beginning

## Edge Cases Handled

1. **Empty authors array:** Returns empty string, sorts to beginning
2. **Single-name authors:** (e.g., "Madonna") Uses full name as last name
3. **Multiple word names:** Takes last word as surname (e.g., "Vincent van Gogh" → "gogh")
4. **Case sensitivity:** All comparisons use lowercase for consistency
5. **Special characters:** `localeCompare()` handles international characters properly

## Design Principles Applied

✅ **KISS (Keep It Simple, Stupid):** Virtual field approach - no database changes  
✅ **YAGNI (You Aren't Gonna Need It):** No unnecessary features like prefix handling  
✅ **SOLID:** Single responsibility - sorting logic in one place

## Performance Notes

- For small to medium libraries (<1000 books): In-memory sorting is fast and efficient
- No database migration required
- Existing author index still used for filtering
- If performance becomes an issue with large datasets, consider pre-computed field approach

## Testing the Feature

1. Navigate to Library page
2. Click the "Sort By" dropdown
3. Select "Author (A-Z)" or "Author (Z-A)"
4. Books should sort alphabetically by author's last name
5. Pagination should work correctly with sorted results

## Files Modified

- `backend/models/Book.js` - Added virtual field
- `backend/routes/books.js` - Added author sort handling logic
- `frontend/src/components/Layout/StickyToolbar.js` - Added author sort options to dropdown
