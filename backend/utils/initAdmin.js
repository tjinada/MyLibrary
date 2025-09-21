const Admin = require('../models/Admin');

async function initAdmin() {
  try {
    const envUsername = process.env.ADMIN_USERNAME || 'admin';
    const envPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Check if ANY admin exists
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      // No admin exists, create new one
      const admin = new Admin({
        username: envUsername,
        password: envPassword
      });

      await admin.save();
      console.log('Default admin user created');
      console.log(`Username: ${admin.username}`);
      console.log('Password: [from environment variable]');
    } else {
      // Admin exists, check if we need to update username or password
      // First, try to find admin with current env username
      let existingAdmin = await Admin.findOne({ username: envUsername.toLowerCase() });
      
      if (!existingAdmin) {
        // Username in .env has changed, find any existing admin and update it
        existingAdmin = await Admin.findOne(); // Get the first (should be only) admin
        
        if (existingAdmin) {
          console.log(`Updating admin username from '${existingAdmin.username}' to '${envUsername}'`);
          existingAdmin.username = envUsername;
          existingAdmin.password = envPassword; // Also update password when username changes
          await existingAdmin.save();
          console.log('Admin username and password updated from environment variables');
        }
      } else {
        // Username matches, just check password
        const isPasswordSame = await existingAdmin.comparePassword(envPassword);
        
        if (!isPasswordSame) {
          existingAdmin.password = envPassword;
          await existingAdmin.save();
          console.log(`Admin password updated from environment variable for user: ${envUsername}`);
        } else {
          console.log(`Admin user '${envUsername}' already exists with current credentials`);
        }
      }
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
}

module.exports = initAdmin;
