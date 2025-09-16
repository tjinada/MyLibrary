const Admin = require('../models/Admin');

async function initAdmin() {
  try {
    // Check if admin already exists
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      // Create default admin from environment variables
      const admin = new Admin({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      });

      await admin.save();
      console.log('Default admin user created');
      console.log(`Username: ${admin.username}`);
      console.log('Password: [from environment variable]');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
}

module.exports = initAdmin;
