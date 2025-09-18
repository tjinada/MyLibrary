# My Library - Personal Book Management System

A full-stack web application for managing your personal book collection with barcode scanning, book lookup, and library organization features.

## Features

- 📚 **Book Management**: Add, edit, and delete books from your library
- 📷 **Barcode Scanning**: Scan ISBN barcodes using your device camera
- 🔍 **Book Search**: Search by title, author, or ISBN
- 📊 **Status Tracking**: Track reading status (To Read, Reading, Read, Loaned)
- 🏷️ **Tags & Genres**: Organize with custom tags and genres
- 🖼️ **Cover Selection**: Choose from multiple cover image sources
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Google Books API key (optional but recommended)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/MyLibrary.git
cd MyLibrary
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Edit `.env` and add your configuration:
```env
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
GOOGLE_BOOKS_API_KEY=your_google_books_api_key
```

4. Build and run with Docker:
```bash
docker-compose up --build
```

### Access the Application

- **Frontend**: http://localhost:8050
- **Backend API**: http://localhost:5010
- **MongoDB**: localhost:27017

### Default Login
- Username: `admin` (or what you set in .env)
- Password: `your_admin_password` (what you set in .env)

## Development Setup

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Technology Stack

### Frontend
- React 18
- Material-UI (MUI)
- React Router
- Axios
- ZXing (barcode scanning)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Google Books API
- Open Library API

### DevOps
- Docker & Docker Compose
- Nginx (production)
- Multi-stage builds

## API Endpoints

- `POST /api/auth/login` - User login
- `GET /api/books` - Get all books
- `POST /api/books` - Add new book
- `PUT /api/books/:isbn` - Update book
- `DELETE /api/books/:isbn` - Delete book
- `POST /api/scanner/lookup` - Lookup book by ISBN
- `GET /api/search` - Search books
- `GET /api/stats` - Get library statistics

## Book Status Options

- **To Read** - Books you plan to read
- **Reading** - Currently reading
- **Read** - Completed books
- **Loaned** - Books lent to others

## Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Remove everything including volumes
docker-compose down -v
```

## Troubleshooting

### Port Conflicts
The application uses the following ports:
- `8050` - Frontend (nginx)
- `5010` - Backend API
- `27017` - MongoDB

Change these in `docker-compose.yml` if needed.

### Missing Dependencies
```bash
# Regenerate package-lock.json files
cd backend && npm install
cd ../frontend && npm install
```

### Database Issues
```bash
# Reset database (warning: deletes all data)
docker-compose down -v
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - feel free to use this for your personal library!

## Support

For issues or questions, please open an issue on GitHub.
