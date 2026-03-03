const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  googleLogin 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin); // Thêm API Google Login

router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);

module.exports = router;