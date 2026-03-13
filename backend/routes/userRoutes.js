const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  getUsers,
  googleLogin // <--- 1. Import hàm googleLogin ở đây
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin); // <--- 2. Khai báo cửa cho nó ở đây

router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);

// Lấy danh sách customers (admin only)
router.get('/', protect, adminOnly, getUsers);

module.exports = router;