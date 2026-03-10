const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const workoutLogController = require("../controllers/workoutLogController");

// Tạo log
router.post("/", protect, workoutLogController.createWorkoutLog);

// Lấy log của user
router.get("/my", protect, workoutLogController.getMyWorkoutLogs);

module.exports = router;
