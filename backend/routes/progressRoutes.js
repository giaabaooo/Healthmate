const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const progressController = require("../controllers/progressController");

router.get("/today", protect, progressController.getTodayProgress);
router.get("/streak", protect, progressController.getStreak);
router.get("/weekly", protect, progressController.getWeeklyOverview);

module.exports = router;
