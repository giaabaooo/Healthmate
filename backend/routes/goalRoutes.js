const express = require("express");
const router = express.Router();

const {
  getUserGoal,
  createGoal,
  updateGoal,
  deleteGoal,
} = require("../controllers/goalController");

const { protect } = require("../middleware/authMiddleware");

// User routes (cần login)

router.get("/my-goal", protect, getUserGoal);

router.post("/", protect, createGoal);

router.put("/:id", protect, updateGoal);

router.delete("/:id", protect, deleteGoal);

module.exports = router;
