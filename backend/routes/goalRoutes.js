const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Import Controllers
const {
  getUserGoal,
  createGoal,
  updateGoal,
  deleteGoal,
} = require("../controllers/goalController");

const {
  getMicroGoals,
  createMicroGoal,
  toggleMicroGoal,
  deleteMicroGoal,
} = require("../controllers/microGoalController");


router.post("/micro", protect, createMicroGoal);
router.get("/micro/:goalId", protect, getMicroGoals);
router.put("/micro/:id", protect, toggleMicroGoal);
router.delete("/micro/:id", protect, deleteMicroGoal);



router.get("/my-goal", protect, getUserGoal); 
router.get("/", protect, getUserGoal); 

router.post("/", protect, createGoal);
router.put("/:id", protect, updateGoal);
router.delete("/:id", protect, deleteGoal);

module.exports = router;