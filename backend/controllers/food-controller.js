const path = require('path');
const fs = require('fs');
const Food = require('../models/Food');

const getAllFoods = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const foods = await Food.find(filter).sort({ name: 1 });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn' });
    }
    res.json(food);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const createFood = async (req, res) => {
  try {
    const { name, category, calories, protein, carbs, fat } = req.body;

    if (!name || !category || calories == null || protein == null || carbs == null || fat == null) {
      // Xóa file upload nếu validation thất bại
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin món ăn' });
    }

    const food = await Food.create({
      name,
      category,
      calories,
      protein,
      carbs,
      fat,
      image: req.file ? `/uploads/foods/${req.file.filename}` : null,
      created_by: req.user?._id
    });

    res.status(201).json({ message: 'Tạo món ăn thành công', food });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const updateFood = async (req, res) => {
  try {
    const { name, category, calories, protein, carbs, fat, removeImage } = req.body;

    const existing = await Food.findById(req.params.id);
    if (!existing) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'Không tìm thấy món ăn' });
    }

    // Xác định image mới
    let imageUpdate = existing.image;
    if (req.file) {
      // Upload ảnh mới → xóa ảnh cũ
      if (existing.image) {
        const oldPath = path.join(__dirname, '../public', existing.image);
        fs.unlink(oldPath, () => {});
      }
      imageUpdate = `/uploads/foods/${req.file.filename}`;
    } else if (removeImage === 'true') {
      // Xóa ảnh, không thay thế
      if (existing.image) {
        const oldPath = path.join(__dirname, '../public', existing.image);
        fs.unlink(oldPath, () => {});
      }
      imageUpdate = null;
    }

    const food = await Food.findByIdAndUpdate(
      req.params.id,
      { name, category, calories, protein, carbs, fat, image: imageUpdate },
      { new: true, runValidators: true }
    );

    res.json({ message: 'Cập nhật món ăn thành công', food });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const deleteFood = async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn' });
    }
    // Xóa file ảnh nếu có
    if (food.image) {
      const imgPath = path.join(__dirname, '../public', food.image);
      fs.unlink(imgPath, () => {});
    }
    res.json({ message: 'Xóa món ăn thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  getAllFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood
};
