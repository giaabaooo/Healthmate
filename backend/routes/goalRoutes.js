const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  getUserGoal, createGoal, updateGoal, deleteGoal, generateAIRoadmap, checkinWeekly,analyzeProgress // <--- THÊM checkinWeekly VÀO IMPORT
} = require("../controllers/goalController");

const {
  getMicroGoals, createMicroGoal, toggleMicroGoal, deleteMicroGoal,
} = require("../controllers/microGoalController");

// MICRO GOAL ROUTES
router.post("/micro", protect, createMicroGoal);
router.get("/micro/:goalId", protect, getMicroGoals);
router.put("/micro/:id", protect, toggleMicroGoal);
router.delete("/micro/:id", protect, deleteMicroGoal);

// AI ROADMAP & CHECK-IN
router.post("/generate-roadmap", protect, generateAIRoadmap);
router.post("/checkin/:id", protect, checkinWeekly); // <--- THÊM ROUTE MỚI NÀY VÀO TRƯỚC /:id

// PRIMARY GOAL ROUTES
router.get("/my-goal", protect, getUserGoal); 
router.get("/", protect, getUserGoal); 
router.post("/", protect, createGoal);
router.put("/:id", protect, updateGoal);
router.delete("/:id", protect, deleteGoal);
router.post("/analyze-progress", protect, analyzeProgress);

module.exports = router;