const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const options = {
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      retryWrites: true,
      w: 'majority',
      bufferCommands: false
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Lỗi kết nối MongoDB: ${error.message}`);
    console.error('Kiểm tra:');
    console.error('1. Kết nối internet');
    console.error('2. IP whitelist trong MongoDB Atlas');
    console.error('3. Connection string đúng chưa');
    process.exit(1);
  }
};

module.exports = connectDB;