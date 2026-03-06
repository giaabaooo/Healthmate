const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // VD: 'Tinh bột', 'Đạm', 'Rau củ'
  calories: { type: Number, required: true }, // Calo trên 100g hoặc 1 khẩu phần chuẩn
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
  image: { type: String, default: null }, // Đường dẫn ảnh, VD: '/uploads/foods/abc.jpg'
  created_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' // Admin ID người tạo món này
  }
}, { timestamps: true });

module.exports = mongoose.model('Food', foodSchema);