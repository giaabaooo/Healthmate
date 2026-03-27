const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Import chính xác các hàm từ Controller
const {
  getMealPlanByDate,
  addFoodToMealPlan,
  updateMealItem,
  removeFoodFromMealPlan,
  generateAIPlan,
  analyzeCaloriesLimit
} = require('../controllers/meal-plan-controller');

// ==========================================
// 1. CÁC ROUTE TÍNH NĂNG AI
// ==========================================
router.post('/ai/recommend', protect, generateAIPlan);
router.post('/ai/analyze-calories', protect, analyzeCaloriesLimit);

// ==========================================
// 2. CÁC ROUTE XỬ LÝ DỮ LIỆU (Dùng Body)
// (Frontend của bạn có một số nút gọi qua /add và /remove)
// ==========================================
router.post('/add', protect, addFoodToMealPlan);
router.put('/update', protect, updateMealItem);
router.delete('/remove', protect, removeFoodFromMealPlan);

// ==========================================
// 3. CÁC ROUTE RESTful API (Dùng Params /:date)
// LƯU Ý: Các route có biến động (/:date) PHẢI ĐẶT Ở CUỐI CÙNG 
// để không nuốt nhầm các route ở trên.
// ==========================================
router.get('/:date', protect, getMealPlanByDate);
router.post('/:date/items', protect, addFoodToMealPlan);
router.put('/:date/items/:id', protect, updateMealItem);
router.delete('/:date/items/:id', protect, removeFoodFromMealPlan);

module.exports = router;