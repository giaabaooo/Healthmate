const express = require("express");
const router = express.Router();
const UserWorkout = require("../models/UserWorkout");
const Workout = require("../models/Workout");
const WorkoutLog = require("../models/WorkoutLog");
const { protect } = require("../middleware/authMiddleware");
console.log("UserWorkout routes loaded");
// =============================
// 1️⃣ Xem tất cả workout + tính calories theo cân nặng
// =============================
router.get("/", protect, async (req, res) => {
  try {
    const { duration } = req.query;

    const weight = req.user.profile?.weight_kg || 70;

    const workouts = await Workout.find();

    const workoutsWithCalories = workouts.map((workout) => {
      const durationMinutes = parseInt(duration) || workout.duration || 30;

      const estimatedCalories = workout.met * weight * (durationMinutes / 60);

      return {
        ...workout.toObject(),
        selectedDuration: durationMinutes,
        estimatedCalories: Math.round(estimatedCalories),
      };
    });

    res.json(workoutsWithCalories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// ADD workout vào danh sách cá nhân
// =============================
router.post("/", protect, async (req, res) => {
  try {
    const { workout_id, planned_duration } = req.body;

    // 🔥 Kiểm tra đã tồn tại chưa (tránh thêm trùng)
    const existing = await UserWorkout.findOne({
      user_id: req.user._id,
      workout_id,
      status: { $ne: "completed" },
    });

    if (existing) {
      return res.status(400).json({
        message: "Workout đã tồn tại trong danh sách của bạn.",
      });
    }

    const newItem = await UserWorkout.create({
      user_id: req.user._id,
      workout_id,
      planned_duration,
    });

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================
// 3️⃣ Lấy danh sách workout cá nhân
// =============================
router.get("/my", protect, async (req, res) => {
  try {
    const myWorkouts = await UserWorkout.find({
      user_id: req.user._id,
    }).populate("workout_id");

    res.json(myWorkouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================
// 4️⃣ Start workout
// =============================
router.put("/start/:id", protect, async (req, res) => {
  try {
    const item = await UserWorkout.findOneAndUpdate(
      {
        _id: req.params.id,
        user_id: req.user._id,
      },
      {
        status: "in_progress",
        last_started_at: new Date(),
      },
      { new: true },
    );

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================
// 5️⃣ Finish workout + tạo log
// =============================
router.put("/finish/:id", protect, async (req, res) => {
  try {
    const userWorkout = await UserWorkout.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    })
      .populate("workout_id")
      .populate("user_id");

    if (!userWorkout) {
      return res.status(404).json({ message: "Không tìm thấy workout" });
    }

    const duration = userWorkout.planned_duration;
    const met = userWorkout.workout_id.met;
    const weight = userWorkout.user_id.profile.weight_kg;

    const calories = met * weight * (duration / 60);

    await WorkoutLog.create({
      user_id: req.user._id,
      workout_id: userWorkout.workout_id._id,
      duration_minutes: duration,
      calories_burned: Math.round(calories),
    });

    userWorkout.status = "completed";
    await userWorkout.save();

    res.json({
      message: "Workout completed",
      calories_burned: Math.round(calories),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// =============================
// DELETE workout khỏi danh sách
// =============================
router.delete("/:id", protect, async (req, res) => {
  try {
    const deleted = await UserWorkout.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id, // 🔥 đảm bảo đúng user
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Không tìm thấy workout để xóa.",
      });
    }

    res.json({ message: "Đã xóa workout khỏi danh sách." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
