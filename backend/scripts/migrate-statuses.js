// Migration script to update book statuses
// Run this once to migrate existing data

const mongoose = require('mongoose');
const Book = require('../models/Book');
require('dotenv').config({ path: '../.env' });

const migrateStatuses = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Update 'available' to 'to-read'
    const availableResult = await Book.updateMany(
      { status: 'available' },
      { $set: { status: 'to-read' } }
    );
    
    console.log(`Updated ${availableResult.modifiedCount} books from 'available' to 'to-read'`);
    
    // Update 'wishlist' to 'to-read'
    const wishlistResult = await Book.updateMany(
      { status: 'wishlist' },
      { $set: { status: 'to-read' } }
    );
    
    console.log(`Updated ${wishlistResult.modifiedCount} books from 'wishlist' to 'to-read'`);
    
    // Get count of books by status
    const statusCounts = await Book.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\nCurrent book counts by status:');
    statusCounts.forEach(status => {
      console.log(`  ${status._id}: ${status.count} books`);
    });
    
    console.log('\nMigration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
migrateStatuses();
