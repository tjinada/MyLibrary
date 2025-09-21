/**
 * Utility script to check current admin credentials status
 * Run this script with: node backend/utils/checkAdmin.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function checkAdminStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB\n');
    console.log('=== Admin Credentials Status ===\n');

    // Check .env settings
    console.log('Environment Variables (.env file):');
    console.log(`  ADMIN_USERNAME: ${process.env.ADMIN_USERNAME || '(not set - will use default)'}`);
    console.log(`  ADMIN_PASSWORD: ${process.env.ADMIN_PASSWORD ? '(set)' : '(not set - will use default)'}`);
    console.log('');

    // Check database
    const admins = await Admin.find().select('username createdAt lastLogin');
    
    if (admins.length === 0) {
      console.log('Database Status:');
      console.log('  No admin users found in database');
      console.log('  An admin will be created on next server start');
    } else {
      console.log('Database Status:');
      admins.forEach(admin => {
        console.log(`  Username: ${admin.username}`);
        console.log(`  Created: ${admin.createdAt}`);
        console.log(`  Last Login: ${admin.lastLogin || 'Never'}`);
      });
    }

    // Check if sync is needed
    if (admins.length > 0 && process.env.ADMIN_USERNAME) {
      const envUsername = process.env.ADMIN_USERNAME;
      const existingAdmin = await Admin.findOne({ username: envUsername.toLowerCase() });
      
      if (!existingAdmin) {
        console.log('\n⚠️  Warning: Username in .env does not match database!');
        console.log(`    Database has: ${admins[0].username}`);
        console.log(`    .env has: ${envUsername}`);
        console.log('    Run "node backend/utils/updateAdminPassword.js" to sync');
      } else if (process.env.ADMIN_PASSWORD) {
        const isPasswordSame = await existingAdmin.comparePassword(process.env.ADMIN_PASSWORD);
        if (!isPasswordSame) {
          console.log('\n⚠️  Warning: Password in .env might be different from database');
          console.log('    Run "node backend/utils/updateAdminPassword.js" to sync');
        } else {
          console.log('\n✓ Credentials in .env match database');
        }
      }
    }

    console.log('\n=== End Status Check ===');
    process.exit(0);
  } catch (error) {
    console.error('Error checking admin status:', error);
    process.exit(1);
  }
}

// Run the check
checkAdminStatus();
