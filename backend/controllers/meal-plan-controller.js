const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const MealPlan = require('../models/MealPlan');
const Food = require('../models/Food');
const User = require('../models/User'); // Cần User để lấy thông tin thể trạng

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const recalculateTotalCalories = (items) => {
  return items.reduce((total, item) => total + (item.calories || 0), 0);
};

const parseDate = (dateStr) => {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date;
};

const resolveUserId = (req) => {
  const targetId = req.body?.target_user_id || req.query?.target_user_id;
  if (req.user.role === 'admin' && targetId) {
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      const err = new Error('target_user_id không hợp lệ');
      err.status = 400;
      throw err;
    }
    return new mongoose.Types.ObjectId(targetId);
  }
  return new mongoose.Types.ObjectId(req.user.id);
};

// --- CÁC API CƠ BẢN GIỮ NGUYÊN LỖI ---
const getMealPlanByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = resolveUserId(req);
    const targetDate = parseDate(date);
    const mealPlan = await MealPlan.findOne({ user_id: userId, date: targetDate });

    if (!mealPlan) return res.json({ user_id: userId, date: targetDate, total_calories: 0, items: [] });
    res.json(mealPlan);
  } catch (error) { res.status(error.status || 500).json({ message: error.message || 'Lỗi server' }); }
};

const addFoodToMealPlan = async (req, res) => {
  try {
    const { date } = req.params;
    const { food_id, quantity, slot } = req.body; // Lấy thêm slot
    const userId = resolveUserId(req);

    if (!food_id || !quantity || quantity <= 0) return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });

    const food = await Food.findById(food_id);
    if (!food) return res.status(404).json({ message: 'Không tìm thấy món ăn' });

    const itemCalories = Math.round((food.calories * quantity) / 100);
    const targetDate = parseDate(date);

    let mealPlan = await MealPlan.findOne({ user_id: userId, date: targetDate });
    if (!mealPlan) mealPlan = new MealPlan({ user_id: userId, date: targetDate, items: [] });

    // Đẩy vào mảng items kèm thông tin slot
    mealPlan.items.push({ 
      food_id: food._id, 
      name: food.name, 
      quantity, 
      calories: itemCalories,
      slot: slot || 'snack'
    });
    
    mealPlan.total_calories = recalculateTotalCalories(mealPlan.items);
    await mealPlan.save();
    
    res.status(201).json({ message: 'Thêm món ăn thành công', mealPlan });
  } catch (error) { res.status(error.status || 500).json({ message: error.message || 'Lỗi server' }); }
};

const removeFoodFromMealPlan = async (req, res) => {
  try {
    const { date, itemId } = req.params;
    const userId = resolveUserId(req);
    const targetDate = parseDate(date);
    const mealPlan = await MealPlan.findOne({ user_id: userId, date: targetDate });

    if (!mealPlan) return res.status(404).json({ message: 'Không tìm thấy thực đơn' });

    const itemIndex = mealPlan.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) return res.status(404).json({ message: 'Không tìm thấy món ăn trong thực đơn' });

    mealPlan.items.splice(itemIndex, 1);
    mealPlan.total_calories = recalculateTotalCalories(mealPlan.items);
    await mealPlan.save();
    
    res.json({ message: 'Xóa thành công', mealPlan });
  } catch (error) { res.status(error.status || 500).json({ message: error.message || 'Lỗi server' }); }
};

const updateFoodQuantity = async (req, res) => {
  try {
    const { date, itemId } = req.params;
    const { quantity } = req.body;
    const userId = resolveUserId(req);

    if (!quantity || quantity <= 0) return res.status(400).json({ message: 'Số lượng không hợp lệ' });

    const targetDate = parseDate(date);
    const mealPlan = await MealPlan.findOne({ user_id: userId, date: targetDate });
    if (!mealPlan) return res.status(404).json({ message: 'Không tìm thấy thực đơn' });

    const item = mealPlan.items.find(item => item._id.toString() === itemId);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy món ăn' });

    const food = await Food.findById(item.food_id);
    if (!food) return res.status(404).json({ message: 'Không tìm thấy Food gốc' });

    item.quantity = quantity;
    item.calories = Math.round((food.calories * quantity) / 100);
    mealPlan.total_calories = recalculateTotalCalories(mealPlan.items);

    await mealPlan.save();
    res.json({ message: 'Cập nhật thành công', mealPlan });
  } catch (error) { res.status(error.status || 500).json({ message: error.message || 'Lỗi server' }); }
};


// ==================== AI FEATURES ====================

// 1. Tính toán lượng Calo dựa trên thể trạng
const calculateAIGoal = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const height = user.profile?.height_cm || 170;
    const weight = user.profile?.weight_kg || 65;
    const goal = user.profile?.goal || "Duy trì sức khỏe";
    const bmi = (weight / ((height / 100) ** 2)).toFixed(1);

    const prompt = `
Bạn là chuyên gia dinh dưỡng.
Thông tin khách hàng: Cao ${height}cm, Nặng ${weight}kg, BMI ${bmi}, Mục tiêu: ${goal}.

Tính lượng calo mục tiêu mỗi ngày và đưa ra giải thích ngắn gọn bằng Tiếng Việt (1 câu).
⚠️ BẮT BUỘC: Chỉ trả về JSON thuần túy (không bọc trong markdown \`\`\`json).
Định dạng JSON:
{ "suggestedCalories": 2200, "reason": "Vì bạn muốn giảm mỡ, mức calo này tạo thâm hụt an toàn..." }
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const resultAI = await model.generateContent(prompt);
    const text = resultAI.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    
    const parsedData = JSON.parse(clean);
    res.json(parsedData);
  } catch (error) {
    console.error("Lỗi AI Goal:", error);
    res.status(500).json({ message: "Không thể tính toán qua AI" });
  }
};

// 2. Gợi ý món ăn từ kho DB theo mục tiêu và bữa ăn
const getAIRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const height = user.profile?.height_cm || 170;
    const weight = user.profile?.weight_kg || 65;
    const goal = user.profile?.goal || "Duy trì sức khỏe";

    // Lấy toàn bộ danh sách Food để AI chọn
    const allFoods = await Food.find();
    if (allFoods.length === 0) return res.json({});

    const foodListText = allFoods.map(f => `- ID: ${f._id} | Tên: ${f.name} | Calo: ${f.calories} kcal/100g`).join("\n");

    const prompt = `
Bạn là HLV Dinh Dưỡng. Dựa vào người dùng: Cao ${height}cm, Nặng ${weight}kg, Mục tiêu: ${goal}.
Và Kho thực phẩm sau của hệ thống:
${foodListText}

Hãy gợi ý thực đơn 1 ngày gồm 4 bữa (breakfast, lunch, dinner, snack). 
⚠️ QUY TẮC BẮT BUỘC:
- CHỈ chọn ID thực phẩm có trong danh sách trên.
- "quantity" là lượng khuyên dùng (đơn vị: gram, là số nguyên).
- "reason" giải thích ngắn (10-15 chữ) tại sao món này tốt cho họ.
- KHÔNG thêm text giải thích, CHỈ TRẢ VỀ JSON thuần túy.

Định dạng JSON:
{
  "breakfast": [ { "food_id": "ID_TỪ_DANH_SÁCH", "quantity": 150, "reason": "Lý do..." } ],
  "lunch": [ { "food_id": "...", "quantity": 200, "reason": "..." } ],
  "dinner": [...],
  "snack": [...]
}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const resultAI = await model.generateContent(prompt);
    const text = resultAI.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    
    const parsed = JSON.parse(clean);

    // Xử lý map ID do AI trả về thành dữ liệu thật hiển thị trên FE
    const mapFoods = (aiList) => {
      if (!Array.isArray(aiList)) return [];
      return aiList.map(aiItem => {
        const foodDoc = allFoods.find(f => f._id.toString() === aiItem.food_id);
        if (!foodDoc) return null;
        return {
          _id: foodDoc._id,
          name: foodDoc.name,
          quantity: aiItem.quantity,
          calories: Math.round((foodDoc.calories * aiItem.quantity) / 100),
          reason: aiItem.reason
        };
      }).filter(Boolean);
    };

    const finalRecs = {
      breakfast: mapFoods(parsed.breakfast),
      lunch: mapFoods(parsed.lunch),
      dinner: mapFoods(parsed.dinner),
      snack: mapFoods(parsed.snack)
    };

    res.json(finalRecs);
  } catch (error) {
    console.error("Lỗi AI Recommend:", error);
    res.status(500).json({ message: "Không thể lấy gợi ý AI" });
  }
};

module.exports = {
  getMealPlanByDate,
  addFoodToMealPlan,
  removeFoodFromMealPlan,
  updateFoodQuantity,
  calculateAIGoal,
  getAIRecommendations
};