const express = require("express");
const router = express.Router();

const {
  getMicroGoals,
  createMicroGoal,
  toggleMicroGoal,
  deleteMicroGoal,
} = require("../controllers/microGoalController");

const { protect } = require("../middleware/authMiddleware");

// lấy micro goals của goal
router.get("/:goalId", protect, getMicroGoals);

// tạo micro goal
router.post("/", protect, createMicroGoal);

// toggle done
router.patch("/:id/toggle", protect, toggleMicroGoal);

// delete
router.delete("/:id", protect, deleteMicroGoal);

module.exports = router;
