const express = require('express');
const router = express.Router();
const {
  getAllFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
  getRecommendedFoods
} = require('../controllers/food-controller');
const upload = require('../middleware/food-upload');
const { protect, adminOnly } = require('../middleware/authMiddleware');
router.get('/recommend', protect, getRecommendedFoods);
// Public routes
router.get('/', getAllFoods);
router.get('/:id', getFoodById);

// Admin routes: yêu cầu đăng nhập và quyền admin
router.post('/', protect, adminOnly, upload.single('image'), createFood);
router.put('/:id', protect, adminOnly, upload.single('image'), updateFood);
router.delete('/:id', protect, adminOnly, deleteFood);
 // Thêm dòng này

module.exports = router;
