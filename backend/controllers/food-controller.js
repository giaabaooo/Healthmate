const path = require('path');
const fs = require('fs');
const Food = require('../models/Food');
const User = require('../models/User');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const newFood = new Food({
      name,
      category,
      calories,
      protein,
      carbs,
      fat,
      image: req.file ? `/uploads/foods/${req.file.filename}` : null,
    });

    await newFood.save();
    res.status(201).json({ message: 'Thêm món ăn thành công', food: newFood });
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

    let imageUpdate = existing.image;

    if (req.file) {
      if (existing.image) {
        const oldPath = path.join(__dirname, '../public', existing.image);
        fs.unlink(oldPath, () => {});
      }
      imageUpdate = `/uploads/foods/${req.file.filename}`;
    } else if (removeImage === 'true') {
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
    if (food.image) {
      const imgPath = path.join(__dirname, '../public', food.image);
      fs.unlink(imgPath, () => {});
    }
    res.json({ message: 'Xóa món ăn thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// ==========================================
// AI RECOMMENDATION THỰC ĐƠN CÁ NHÂN HÓA
// ==========================================
const getRecommendedFoods = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy User" });

    const height = user.profile?.height_cm || 170;
    const weight = user.profile?.weight_kg || 65;
    const goal = user.profile?.goal || "maintain";

    const allFoods = await Food.find();
    if (allFoods.length === 0) return res.json([]);

    const prompt = `
Bạn là chuyên gia dinh dưỡng. Người dùng cao ${height}cm, nặng ${weight}kg, mục tiêu: ${goal}.
Dưới đây là danh sách ID và Tên món ăn trong hệ thống của chúng tôi:
${allFoods.map(f => `- ID: ${f._id} | Tên: ${f.name} | Calo: ${f.calories} kcal | Protein: ${f.protein}g`).join('\n')}

Hãy chọn ra đúng 4 món ăn phù hợp nhất với thể trạng và mục tiêu của họ.
⚠️ QUY TẮC: Chỉ trả về một mảng JSON chứa các ID, tuyệt đối không bọc trong markdown, không có text giải thích.
Ví dụ: ["id1", "id2", "id3", "id4"]
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const resultAI = await model.generateContent(prompt);
    const text = resultAI.response.text();
    const cleanJson = text.replace(/```json|```/g, "").trim();
    
    let recommendedIds = [];
    try {
        recommendedIds = JSON.parse(cleanJson);
    } catch (e) {
        recommendedIds = [];
    }

    const recommendedFoods = await Food.find({ _id: { $in: recommendedIds } });
    res.json(recommendedFoods);
  } catch (error) {
    console.error("Lỗi AI Recommend Foods:", error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  getAllFoods, getFoodById, createFood, updateFood, deleteFood, getRecommendedFoods
};