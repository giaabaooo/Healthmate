const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const MealPlan = require('../models/MealPlan');
const Food = require('../models/Food');
const User = require('../models/User');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const recalculateTotalCalories = (items) => {
  return items.reduce((total, item) => total + (item.calories || 0), 0);
};

// 🔴 HÀM KIỂM TRA NGÀY QUÁ KHỨ
const checkIsPastDate = (dateStr) => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const todayStr = new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
    return dateStr < todayStr;
};

const resolveUserId = (req) => {
  const targetId = req.body?.target_user_id || req.query?.target_user_id;
  if (req.user.role === 'admin' && targetId) {
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      const err = new Error('target_user_id không hợp lệ');
      err.status = 400; throw err;
    }
    return new mongoose.Types.ObjectId(targetId);
  }
  return new mongoose.Types.ObjectId(req.user.id);
};

const getMealPlanByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = resolveUserId(req);
    let mealPlan = await MealPlan.findOne({ user_id: userId, date });
    if (!mealPlan) mealPlan = { user_id: userId, date, items: [], total_calories: 0 };
    res.json(mealPlan);
  } catch (error) {
    res.status(error.status || 500).json({ message: "Lỗi khi lấy thực đơn", error: error.message });
  }
};

const addFoodToMealPlan = async (req, res) => {
  try {
    const { date, food_id, quantity, slot } = req.body;
    
    // 🔴 CHẶN TÁC ĐỘNG VÀO QUÁ KHỨ
    if (checkIsPastDate(date)) return res.status(400).json({ message: "Không thể thêm món ăn vào ngày trong quá khứ." });

    const userId = resolveUserId(req);
    const food = await Food.findById(food_id);
    if (!food) return res.status(404).json({ message: "Không tìm thấy món ăn" });

    let mealPlan = await MealPlan.findOne({ user_id: userId, date });
    if (!mealPlan) mealPlan = new MealPlan({ user_id: userId, date, items: [] });

    const calories = Math.round((food.calories * quantity) / 100);
    mealPlan.items.push({ food_id, name: food.name, quantity, calories, slot });
    mealPlan.total_calories = recalculateTotalCalories(mealPlan.items);

    await mealPlan.save();
    res.json(mealPlan);
  } catch (error) {
    res.status(error.status || 500).json({ message: "Lỗi khi thêm món ăn", error: error.message });
  }
};

const removeFoodFromMealPlan = async (req, res) => {
  try {
    const { date, item_id } = req.body;

    // 🔴 CHẶN TÁC ĐỘNG VÀO QUÁ KHỨ
    if (checkIsPastDate(date)) return res.status(400).json({ message: "Không thể xóa món ăn trong quá khứ." });

    const userId = resolveUserId(req);
    let mealPlan = await MealPlan.findOne({ user_id: userId, date });
    if (!mealPlan) return res.status(404).json({ message: "Không tìm thấy thực đơn" });

    mealPlan.items = mealPlan.items.filter(item => item._id.toString() !== item_id);
    mealPlan.total_calories = recalculateTotalCalories(mealPlan.items);
    await mealPlan.save();
    res.json(mealPlan);
  } catch (error) {
    res.status(error.status || 500).json({ message: "Lỗi khi xóa món ăn", error: error.message });
  }
};

const checkIsPro = (user) => {
    if (!user || !user.subscription) return false;
    return user.subscription.plan === 'pro' && new Date(user.subscription.endDate) > new Date();
};

const generateAIPlan = async (req, res) => {
    try {
        const { date } = req.body;
        
        // 🔴 CHẶN TÁC ĐỘNG VÀO QUÁ KHỨ
        if (checkIsPastDate(date)) return res.status(400).json({ message: "Không thể nhờ AI thiết kế cho quá khứ." });

        const user = await User.findById(req.user.id);
        if (!checkIsPro(user)) return res.status(403).json({ message: "Tính năng này chỉ dành cho gói Pro. Vui lòng nâng cấp." });

        const foods = await Food.find().limit(50);
        if (foods.length === 0) return res.status(400).json({ message: "Thư viện món ăn rỗng." });

        const prompt = `
        Tạo thực đơn 1 ngày (khoảng 2000 kcal). Chọn món ăn TỪ DANH SÁCH SAU (bắt buộc dùng _id và tên chính xác):
        ${JSON.stringify(foods.map(f => ({_id: f._id, name: f.name, cal: f.calories})))}
        Trả về ĐÚNG định dạng JSON array: [{"_id":"...","name":"...","calories":...,"category":"...","quantity":100}].
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const resultAI = await model.generateContent(prompt);
        let text = resultAI.response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const suggestions = JSON.parse(text);
        res.json({ message: "AI đã tạo xong", suggestions });
    } catch (error) {
        res.status(500).json({ message: "Lỗi tạo AI menu", error: error.message }); 
    }
};

const analyzeCaloriesLimit = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!checkIsPro(user)) return res.json({ feedback: "" }); 

        const { totalCalories, targetCalories, goalType, currentWeight } = req.body;
        const diff = totalCalories - targetCalories;
        if (diff < 0) return res.json({ feedback: "" }); 

        const prompt = `Bạn là HLV cá nhân. Hôm nay học viên đã nạp ${totalCalories} kcal, VƯỢT ${targetCalories} kcal (Dư ${diff} kcal). Khuyên 1 câu ngắn gọn tiếng Việt.`;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const resultAI = await model.generateContent(prompt);
        res.json({ feedback: resultAI.response.text() });
    } catch (error) { res.status(500).json({ message: "Lỗi AI", error: error.message }); }
};

module.exports = {
  getMealPlanByDate, addFoodToMealPlan, removeFoodFromMealPlan, generateAIPlan, analyzeCaloriesLimit
};