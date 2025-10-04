# Exclude Genres Filter Implementation

## Overview
Added functionality to exclude books with specific genres from search results, enabling better shelf organization (e.g., show Mystery/Thriller books but exclude Young Adult).

## Use Cases

### Example 1: Young Adult Shelf
**Goal:** Show ALL Young Adult books
- **Include:** Young Adult
- **Exclude:** (none)
- **Result:** All books with Young Adult genre

### Example 2: Adult Mystery Shelf  
**Goal:** Show Mystery/Thriller books without Young Adult
- **Include:** Mystery/Thriller
- **Exclude:** Young Adult, Children's Fiction
- **Result:** Mystery/Thriller books that are NOT Young Adult or Children's

### Example 3: Adult Fantasy Shelf
**Goal:** Show Fantasy books without YA or Children's
- **Include:** Fantasy
- **Exclude:** Young Adult, Children's Fiction
- **Result:** Adult Fantasy books only

## Changes Made

### 1. Backend Updates
**File:** `backend/routes/books.js`

- Added `excludeGenres` query parameter support to GET `/books` endpoint
- Logic uses MongoDB `$nin` operator to exclude books with specified genres
- Combines with existing `genre` filter using both `$in` and `$nin` when needed
- Works with pagination and sorting

**Filter Logic:**
```javascript
if (excludeGenres) {
  const excludeList = Array.isArray(excludeGenres) ? excludeGenres : [excludeGenres];
  query.genres = { $nin: excludeList };
  
  // If both include and exclude genres specified, combine them
  if (genre) {
    query.genres = {
      $in: Array.isArray(genre) ? genre : [genre],
      $nin: excludeList
    };
  }
}
```

### 2. Frontend State Updates
**File:** `frontend/src/pages/Library.js`

- Added `excludeGenres: []` to filter state
- Updated `fetchLibrary()` to pass `excludeGenres` to API
- Added client-side exclusion filtering logic
- Updated all filter-related functions to handle `excludeGenres`
- Updated `hasActiveFilters` check to include `excludeGenres`
- Updated `handleRemoveFilter` to handle `excludeGenres` separately

### 3. FilterDrawer UI Updates
**File:** `frontend/src/components/Filters/FilterDrawer.js`

**New Features:**
- Split genre section into two parts:
  - **Include Genres** (green checkboxes) - books MUST have these
  - **Exclude Genres** (red checkboxes) - books must NOT have these
- Checkboxes are disabled when genre is in opposite list (can't include AND exclude same genre)
- Color coding:
  - Include section: Green theme (`success.main`)
  - Exclude section: Red theme (`error.main`)
- Each section has its own "Clear" button
- Badge shows count of selected genres in each section

### 4. ActiveFilterChips Updates
**File:** `frontend/src/components/Filters/ActiveFilterChips.js`

- Shows included genres as green chips: "Include: Mystery/Thriller"
- Shows excluded genres as red chips: "Exclude: Young Adult"
- Each chip can be individually removed
- Visual distinction makes it clear which filters are active

### 5. StickyToolbar Updates
**File:** `frontend/src/components/Layout/StickyToolbar.js`

- Updated `activeFilterCount` to include `excludeGenres`
- Filter badge now shows correct count including exclusions

## How It Works

### User Flow
1. User opens Filters drawer
2. In **Include Genres** section, selects desired genre(s) (e.g., Mystery/Thriller)
3. In **Exclude Genres** section, selects genres to exclude (e.g., Young Adult)
4. Filter drawer closes and books are filtered
5. Active filter chips show both included and excluded genres
6. Genre counts update to reflect available books

### Filter Logic
```
For each book:
  1. Check if book has ANY included genres → YES (if specified)
  2. Check if book has ANY excluded genres → NO
  3. If both pass → Show book
  4. Otherwise → Hide book
```

### Edge Cases Handled
1. **No genres included, some excluded:** Shows all books EXCEPT those with excluded genres
2. **Some included, some excluded:** Books must have included AND not have excluded
3. **Same genre in both:** Checkbox disabled (cannot include and exclude same genre)
4. **Empty exclude list:** Functions as normal genre filter
5. **Clear filters:** Resets both include and exclude lists

## UI Design

### FilterDrawer Layout
```
┌──────────────────────────────────────┐
│ 📚 Filters                      [X] │
├──────────────────────────────────────┤
│                                      │
│ Status                               │
│ ○ All  ○ To Read  ○ Reading  ...    │
│                                      │
│ ───────────────────────────────────  │
│                                      │
│ Edition Type                         │
│ ○ All  ○ Signed  ○ Deluxe           │
│                                      │
│ ───────────────────────────────────  │
│                                      │
│ ✓ Include Genres (2)      [Clear]   │ ← GREEN
│ ☑ Mystery/Thriller (45)              │
│ ☑ Fantasy (23)                       │
│ ☐ Science Fiction (18)               │
│                                      │
│ ───────────────────────────────────  │
│                                      │
│ ✗ Exclude Genres (1)      [Clear]   │ ← RED
│ ☑ Young Adult (67)                   │
│ ☐ Children's Fiction (12)            │
│                                      │
│ [Clear All Filters]                  │
└──────────────────────────────────────┘
```

### Active Filter Chips
```
Active filters:
[Include: Mystery/Thriller] (green)  [Exclude: Young Adult] (red)  [Clear all]
```

## Technical Implementation

### Backend Query Example
```javascript
// Request: /books?genre=Mystery/Thriller&excludeGenres=Young%20Adult

// MongoDB Query Generated:
{
  genres: {
    $in: ['Mystery/Thriller'],      // Must have this
    $nin: ['Young Adult']           // Must NOT have this
  }
}
```

### Client-Side Filtering
```javascript
// Applied AFTER backend filtering for additional UI filtering
booksToDisplay.filter(book => {
  const bookGenres = new Set(book.genres);
  
  // Must NOT have any excluded genres
  return !excludeGenres.some(excluded => bookGenres.has(excluded));
});
```

## Files Modified

- `backend/routes/books.js` - Added excludeGenres parameter handling
- `frontend/src/pages/Library.js` - Added excludeGenres state and logic
- `frontend/src/components/Filters/FilterDrawer.js` - Added Exclude Genres UI section
- `frontend/src/components/Filters/ActiveFilterChips.js` - Added red chips for excluded genres
- `frontend/src/components/Layout/StickyToolbar.js` - Updated filter count

## Testing

1. **Test Case 1:** Exclude only
   - Don't select any include genres
   - Exclude "Young Adult"
   - Verify all books EXCEPT Young Adult are shown

2. **Test Case 2:** Include + Exclude
   - Include "Mystery/Thriller"
   - Exclude "Young Adult"
   - Verify only adult Mystery/Thriller books shown

3. **Test Case 3:** Multiple excludes
   - Include "Fantasy"
   - Exclude "Young Adult" AND "Children's Fiction"
   - Verify only adult Fantasy books shown

4. **Test Case 4:** Cannot select both
   - Include "Mystery/Thriller"
   - Try to exclude "Mystery/Thriller"
   - Verify checkbox is disabled

5. **Test Case 5:** Clear filters
   - Set some includes and excludes
   - Click "Clear All Filters"
   - Verify all filters reset

## Future Enhancements (Phase 2)

- **Shelf Presets:** Quick buttons for common filter combinations
  - "Young Adult Shelf" button → Auto-set include: Young Adult
  - "Adult Mystery" button → Auto-set include: Mystery, exclude: YA
  - etc.

- **Save Custom Presets:** Allow users to save their own filter combinations

- **AND/OR Logic Toggle:** Option to change include logic from ANY to ALL
