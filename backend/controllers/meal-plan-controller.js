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
const checkIsPro = (user) => {
    if (!user || !user.subscription || user.subscription.plan !== 'pro') return false;
    const endDate = new Date(user.subscription.endDate);
    return endDate >= new Date();
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
    
    // YÊU CẦU GÓI PRO
    if (!checkIsPro(user)) {
        return res.status(403).json({ message: "Vui lòng nâng cấp Pro để sử dụng Đầu bếp AI." });
    }

    const height = user.profile?.height_cm || 170;
    const weight = user.profile?.weight_kg || 65;
    const goal = user.profile?.goal || "Duy trì sức khỏe";

    const prompt = `
Bạn là chuyên gia Dinh Dưỡng. Khách hàng: Cao ${height}cm, Nặng ${weight}kg, Mục tiêu: ${goal}.
Hãy gợi ý thực đơn 1 ngày gồm 4 bữa (breakfast, lunch, dinner, snack). 

⚠️ QUY TẮC BẮT BUỘC: 
- KHÔNG gợi ý nguyên liệu rời rạc. PHẢI gợi ý MÓN ĂN HOÀN CHỈNH (Ví dụ: "Cơm tấm sườn bì", "Salad ức gà sốt mè").
- Tự tính toán TỔNG CALO cho toàn bộ món ăn đó dựa trên khẩu phần bạn đề xuất.
- Trả về JSON thuần túy (không có markdown).
Định dạng JSON chuẩn:
{
  "breakfast": [ { "food_id": "AI_CUSTOM", "name": "Bún bò Huế", "quantity": 1, "calories": 450, "reason": "Giàu protein" } ],
  "lunch": [ { "food_id": "AI_CUSTOM", "name": "Cơm gạo lứt cá hồi", "quantity": 1, "calories": 520, "reason": "Omega-3" } ],
  "dinner": [ { "food_id": "AI_CUSTOM", "name": "Salad ức gà", "quantity": 1, "calories": 300, "reason": "Nhẹ bụng" } ],
  "snack": [ { "food_id": "AI_CUSTOM", "name": "Sữa chua Hy Lạp", "quantity": 1, "calories": 150, "reason": "Lợi khuẩn" } ]
}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const resultAI = await model.generateContent(prompt);
    const text = resultAI.response.text();
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    
    const formatMeals = (meals) => meals.map(m => ({ ...m, _id: Math.random().toString(36).substr(2, 9) }));
    res.json({
        breakfast: formatMeals(parsed.breakfast || []),
        lunch: formatMeals(parsed.lunch || []),
        dinner: formatMeals(parsed.dinner || []),
        snack: formatMeals(parsed.snack || []),
    });
  } catch (error) { res.status(500).json({ message: "Lỗi tạo menu", error: error.message }); }
};

// 2. AI CẢNH BÁO TỰ ĐỘNG
const analyzeCaloriesLimit = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        // YÊU CẦU GÓI PRO - Nếu Free thì tự động câm lặng (không cảnh báo)
        if (!checkIsPro(user)) {
            return res.json({ feedback: "" }); 
        }

        const { totalCalories, targetCalories, goalType, currentWeight } = req.body;
        const diff = totalCalories - targetCalories;
        
        if (diff < 0) return res.json({ feedback: "" }); 

        const prompt = `
        Bạn là HLV cá nhân. Học viên đang có mục tiêu: ${goalType}. Cân nặng hiện tại: ${currentWeight}kg.
        Hôm nay họ đã nạp ${totalCalories} kcal, VƯỢT MỨC calo mục tiêu là ${targetCalories} kcal (Đang dư ${diff} kcal).
        Hãy đưa ra MỘT lời khuyên ngắn gọn (2 câu) bằng Tiếng Việt để hướng dẫn họ xử lý (vd: dừng ăn hôm nay, đi bộ thêm 30p, hoặc cân đối lại vào ngày mai). Trả lời text thuần túy không dùng markdown.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const resultAI = await model.generateContent(prompt);
        res.json({ feedback: resultAI.response.text() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
  getMealPlanByDate,
  addFoodToMealPlan,
  removeFoodFromMealPlan,
  updateFoodQuantity,
  calculateAIGoal,
  getAIRecommendations,
  analyzeCaloriesLimit
};