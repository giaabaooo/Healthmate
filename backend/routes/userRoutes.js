const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  getUsers,
  googleLogin,
  getDailyRoutine,
  updateDailyRoutine,
} = require("../controllers/userController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// Auth
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);

// User profile 
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);

// Daily routine
router.get("/me/daily-routine", protect, getDailyRoutine);
router.put("/me/daily-routine", protect, updateDailyRoutine);

// Admin
router.get("/", protect, adminOnly, getUsers);

module.exports = router;