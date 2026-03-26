const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthmate', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');

const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@healthmate.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('admin123', salt);

    // Create admin user
    const admin = new User({
      email: 'admin@healthmate.com',
      password_hash,
      role: 'admin',
      status: 'active',
      profile: {
        full_name: 'System Administrator',
        phone_number: '+849012345678',
        address: 'Hanoi, Vietnam',
        picture: 'https://www.svgrepo.com/show/5125/avatar.svg'
      }
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@healthmate.com');
    console.log('Password: admin123');

    // Generate JWT token for testing
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('🎫 JWT Token:', token);
    console.log('\n🔗 Use this token to test admin APIs:');
    console.log('curl -H "Authorization: Bearer ' + token + '" https://healthmate.onrender.com/api/admin/dashboard');

    process.exit(0);
  } catch (error) {
    console.error(' Error creating admin:', error);
    process.exit(1);
  }
};

// Chạy hàm tạo admin
createAdmin();
