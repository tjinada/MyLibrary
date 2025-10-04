const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://library.tjbookrequests.org',
  credentials: true
}));
// Increase body size limit for image uploads (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const scannerRoutes = require('./routes/scanner');
const searchRoutes = require('./routes/search');
const statsRoutes = require('./routes/stats');
const diagnosticRoutes = require('./routes/diagnostic');
const collectionsRoutes = require('./routes/collections');
const libraryRoutes = require('./routes/library');
const dashboardStatsRoutes = require('./routes/dashboard/stats');
const customShelvesRoutes = require('./routes/customShelves');

// Debug middleware for all /api/books requests
app.use('/api/books*', (req, res, next) => {
  console.log('\n=== SERVER.JS - /api/books* REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  console.log('Path:', req.path);
  console.log('=====================================\n');
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/diagnostic', diagnosticRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/dashboard/stats', dashboardStatsRoutes);
app.use('/api/custom-shelves', customShelvesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  
  // Initialize admin user if it doesn't exist
  const initAdmin = require('./utils/initAdmin');
  initAdmin();
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5010;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
