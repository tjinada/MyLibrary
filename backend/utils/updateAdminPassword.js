/**
 * Utility script to update admin username and password from .env
 * Run this script with: node backend/utils/updateAdminPassword.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function updateAdminCredentials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const envUsername = process.env.ADMIN_USERNAME;
    const envPassword = process.env.ADMIN_PASSWORD;

    if (!envUsername || !envPassword) {
      console.error('Error: ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env file');
      console.error('Current values:');
      console.error(`  ADMIN_USERNAME: ${envUsername || '(not set)'}`);
      console.error(`  ADMIN_PASSWORD: ${envPassword ? '(set)' : '(not set)'}`);
      process.exit(1);
    }

    // Check if ANY admin exists
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      // No admin exists, create new one
      console.log('No admin user found. Creating new admin...');
      const newAdmin = new Admin({
        username: envUsername,
        password: envPassword
      });
      await newAdmin.save();
      console.log(`Admin user created successfully!`);
      console.log(`Username: ${envUsername}`);
      console.log(`Password has been set from .env file`);
    } else {
      // Admin exists, check if we need to update
      let existingAdmin = await Admin.findOne({ username: envUsername.toLowerCase() });
      
      if (!existingAdmin) {
        // Username has changed, find the existing admin and update it
        existingAdmin = await Admin.findOne(); // Get the first (should be only) admin
        
        if (existingAdmin) {
          const oldUsername = existingAdmin.username;
          existingAdmin.username = envUsername;
          existingAdmin.password = envPassword;
          await existingAdmin.save();
          console.log(`Admin credentials updated successfully!`);
          console.log(`Username changed from: ${oldUsername} to: ${envUsername}`);
          console.log(`Password has been updated from .env file`);
        }
      } else {
        // Username matches, update password
        existingAdmin.password = envPassword;
        await existingAdmin.save();
        console.log(`Password updated successfully for admin user: ${envUsername}`);
        console.log('New password has been set from .env file');
      }
    }

    // Verify the update worked
    console.log('\nVerifying credentials...');
    const admin = await Admin.findOne({ username: envUsername.toLowerCase() });
    if (admin) {
      const passwordValid = await admin.comparePassword(envPassword);
      if (passwordValid) {
        console.log('✓ Credentials verified successfully!');
        console.log(`You can now login with username: ${envUsername}`);
      } else {
        console.log('✗ Password verification failed!');
      }
    } else {
      console.log('✗ Admin user not found!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin credentials:', error);
    process.exit(1);
  }
}

// Run the update
updateAdminCredentials();
