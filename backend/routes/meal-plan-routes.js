const express = require('express');
const router = express.Router();
const {
  getMealPlanByDate,
  addFoodToMealPlan,
  removeFoodFromMealPlan,
  updateFoodQuantity,
  calculateAIGoal,       // Bổ sung import hàm này
  getAIRecommendations
} = require('../controllers/meal-plan-controller');
const { protect } = require('../middleware/authMiddleware');

// Tất cả routes cần auth (req.user)
router.get('/:date', protect, getMealPlanByDate);
router.post('/:date/items', protect, addFoodToMealPlan);
router.delete('/:date/items/:itemId', protect, removeFoodFromMealPlan);
router.put('/:date/items/:itemId', protect, updateFoodQuantity);
router.get('/ai/goal', protect, calculateAIGoal);
router.get('/ai/recommend', protect, getAIRecommendations);

module.exports = router;
