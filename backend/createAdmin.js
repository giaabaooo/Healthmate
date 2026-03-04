require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); 

const createAdmin = async () => {
  try {
   
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Đã kết nối MongoDB...');

    
    const email = 'admin@gmail.com';
    const password = 'admin123';

    
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('Tài khoản Admin này đã tồn tại!');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    await User.create({
      email: email,
      password_hash: hashedPassword,
      role: 'admin',
      profile: {
        full_name: 'Healthmate (Admin)',
        gender: 'male'
      }
    });

    console.log(`Đã tạo thành công tài khoản Admin: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi tạo admin:', error);
    process.exit(1);
  }
};

createAdmin();