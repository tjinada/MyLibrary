# My Library - Home Library Management System

A clean, mobile-optimized web application for managing your personal book collection. Built with React, Express, MongoDB, and Google Books API.

## Features

- 📷 **Barcode Scanning**: Scan ISBN barcodes using your device's camera
- 📚 **Google Books Integration**: Automatically fetch book metadata including covers, genres, and descriptions
- 📱 **Mobile Optimized**: Clean, responsive design that works great on phones and tablets
- 🔍 **Search & Filter**: Search your library by title, author, genre, or ISBN
- 📊 **Statistics Dashboard**: View your reading statistics and library insights
- 🏷️ **Book Management**: Track reading status, location, ratings, and personal notes
- 🔐 **Simple Admin Auth**: Secure admin login to manage your library

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Docker)
- Google Books API Key

## Setup Instructions

### 1. Clone and Install

```bash
cd E:\Repositories\MyLibrary
npm install:all
```

This will install dependencies for both backend and frontend.

### 2. Configure Environment Variables

Edit the `.env` file in the root directory:

```env
# MongoDB (adjust if using local MongoDB)
MONGO_URI=mongodb://localhost:27017/home-library
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=password123

# Authentication (change these!)
JWT_SECRET=your-secret-jwt-key-change-this
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Google Books API (required)
GOOGLE_BOOKS_API_KEY=your-google-books-api-key

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. Get Google Books API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Books API" from the API Library
4. Create credentials (API Key)
5. Add the key to your `.env` file

### 4. Start Development Servers

**Option 1: Run both frontend and backend together**
```bash
npm run dev
```

**Option 2: Run separately**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

Default admin credentials:
- Username: `admin`
- Password: `admin123`

⚠️ **Important**: Change these credentials in the `.env` file before deploying!

## Docker Deployment

### Build and Run with Docker Compose

```bash
docker-compose up --build
```

This will:
- Start MongoDB container
- Build and run the backend
- Build and run the frontend with nginx

Access the application at http://localhost

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify JWT token

### Books
- `GET /api/books` - Get all books (with pagination)
- `GET /api/books/:isbn` - Get single book
- `POST /api/books` - Add new book
- `PUT /api/books/:isbn` - Update book
- `DELETE /api/books/:isbn` - Delete book

### Scanner
- `POST /api/scanner/lookup` - Lookup book by ISBN

### Search
- `GET /api/search` - Search library
- `GET /api/search/google` - Search Google Books

### Statistics
- `GET /api/stats` - Get library statistics

## Project Structure

```
MyLibrary/
├── backend/
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── middleware/     # Auth middleware
│   └── server.js       # Express server
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   └── contexts/   # React contexts
│   └── public/
├── docker-compose.yml
└── .env
```

## Mobile Usage Tips

1. **Adding Books**: 
   - Grant camera permissions when prompted
   - Hold phone steady when scanning barcodes
   - Manual ISBN entry available as fallback

2. **Navigation**: 
   - Use the hamburger menu for navigation
   - Swipe gestures supported on book grid

3. **Performance**:
   - Images are optimized for mobile
   - Pagination keeps page loads fast

## Troubleshooting

### Camera not working?
- Ensure HTTPS or localhost (camera requires secure context)
- Check browser permissions for camera access
- Try manual ISBN entry as fallback

### Books not found?
- Verify Google Books API key is correct
- Check if ISBN is valid (10 or 13 digits)
- Some older books may not be in Google Books

### MongoDB connection issues?
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify credentials if authentication is enabled

## Tech Stack

- **Frontend**: React 18, Material-UI v5, @zxing/library
- **Backend**: Express.js, MongoDB, Mongoose
- **APIs**: Google Books API
- **Deployment**: Docker, nginx

## Design Principles

- **KISS**: Simple, focused features
- **YAGNI**: Core functionality only, no over-engineering  
- **SOLID**: Clean separation of concerns
- **Mobile First**: Optimized for phones and tablets

## Future Enhancements (v2)

- Calibre integration for additional metadata
- Book lending tracking with due dates
- Reading progress and goals
- Export library to CSV/PDF
- Multiple user support

## License

MIT

## Support

For issues or questions, please check the troubleshooting section or create an issue in the repository.
