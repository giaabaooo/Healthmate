const express = require("express");
const router = express.Router();
console.log("workoutLogRouter routes loaded");

const { protect } = require("../middleware/authMiddleware");
const workoutLogController = require("../controllers/workoutLogController");

// Tạo log
router.post("/", protect, workoutLogController.createWorkoutLog);

// Lấy log của user
router.get("/my", protect, workoutLogController.getMyWorkoutLogs);

module.exports = router;
