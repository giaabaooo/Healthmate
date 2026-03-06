const express = require('express');
const router = express.Router();
const {
  getMealPlanByDate,
  addFoodToMealPlan,
  removeFoodFromMealPlan,
  updateFoodQuantity
} = require('../controllers/meal-plan-controller');
const { protect } = require('../middleware/authMiddleware');

// Tất cả routes cần auth (req.user)
router.get('/:date', protect, getMealPlanByDate);
router.post('/:date/items', protect, addFoodToMealPlan);
router.delete('/:date/items/:itemId', protect, removeFoodFromMealPlan);
router.put('/:date/items/:itemId', protect, updateFoodQuantity);

module.exports = router;
