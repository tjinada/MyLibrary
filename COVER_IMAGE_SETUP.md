# Cover Image Management System - Setup Guide

## Installation

### Backend Setup

1. **Install the sharp dependency** (required for image processing):
```bash
cd backend
npm install sharp
```

2. **Set up environment variables** (optional for Google Images search):
Add these to your `.env` file in the backend folder:
```
# Google Custom Search API (optional - for web image search)
GOOGLE_CUSTOM_SEARCH_API_KEY=your_api_key_here
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id_here

# Alternative search API (optional)
SERP_API_KEY=your_serp_api_key_here
```

Note: The system will work without these API keys, but web search functionality will be limited to Google Books and Open Library sources.

### Frontend Setup

No additional dependencies needed - the frontend components are already integrated.

## Features

### 1. Cover Image Upload
- **Drag & Drop**: Drag image files directly onto the upload zone
- **File Browse**: Click to browse and select images from your computer
- **Paste from Clipboard**: Copy an image and paste with Ctrl+V
- **URL Import**: Enter a direct image URL to import covers
- **Auto-crop**: Images are automatically cropped to book cover aspect ratio (2:3)

### 2. Cover Image Gallery
- View all available covers for a book:
  - API covers from Google Books
  - API covers from Open Library
  - User-uploaded custom covers
- Select any cover as the active cover
- Delete custom uploaded covers

### 3. Web Search for Covers
- Search Google Images for book covers (requires API key)
- Fallback to Google Books and Open Library search
- Customize search query for better results
- Preview and select from search results

### 4. Image Requirements
- **Supported Formats**: JPEG, PNG, WebP
- **Max File Size**: 5MB
- **Minimum Dimensions**: 200x300 pixels
- **Recommended Aspect Ratio**: 2:3 (standard book cover ratio)

## Usage

### Adding a Book with Custom Cover

1. **During Book Addition**:
   - Scan or enter ISBN
   - Book details load with default cover
   - Click "Change Cover" button below the cover image
   - Choose from:
     - Available Covers tab: Select from API sources
     - Upload tab: Upload your own image
     - Search Web tab: Search for covers online

2. **In Quick Add Mode**:
   - Same functionality available in the confirmation screen
   - Changed covers are saved with the book

### Editing Book Cover

1. Open book details
2. Click Edit button
3. Navigate to cover section
4. Browse through available covers using arrow buttons
5. Or click "Browse Covers" to open the full gallery

## Database Storage

- Covers are stored as base64 encoded strings in MongoDB
- Thumbnails are generated and stored for performance
- Custom covers are separate from API covers for easy management

## API Endpoints

### Cover Management Endpoints

```
POST   /api/books/:isbn/cover/upload     - Upload custom cover
DELETE /api/books/:isbn/cover/custom     - Delete custom cover
GET    /api/books/:isbn/covers           - Get all available covers
POST   /api/books/:isbn/cover/select     - Select a specific cover
POST   /api/books/:isbn/cover/search     - Search web for covers
```

## Troubleshooting

### Sharp Installation Issues

If you encounter issues installing sharp on Windows:
```bash
npm install --platform=win32 --arch=x64 sharp
```

For other platforms, refer to: https://sharp.pixelplumbing.com/install

### Image Upload Fails

1. Check image size (must be < 5MB)
2. Verify image format (JPEG, PNG, or WebP)
3. Ensure minimum dimensions (200x300px)

### Web Search Not Working

1. Verify Google Custom Search API credentials in `.env`
2. Check API quota limits
3. System will fallback to Google Books/Open Library if API is not configured

## Future Enhancements

- Batch cover update for multiple books
- AI-powered cover generation
- Integration with more image sources
- Cover quality scoring and recommendations
