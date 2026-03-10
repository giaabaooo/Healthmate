const WorkoutLog = require("../models/WorkoutLog");

// 1️⃣ Lấy progress hôm nay
exports.getTodayProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const logs = await WorkoutLog.find({
      user_id: userId,
      date: { $gte: startOfDay },
    }).populate("workout_id");

    const totalCalories = logs.reduce(
      (sum, log) => sum + log.calories_burned,
      0,
    );

    const totalDuration = logs.reduce(
      (sum, log) => sum + log.duration_minutes,
      0,
    );

    res.json({
      totalWorkouts: logs.length,
      totalCalories,
      totalDuration,
      logs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2️⃣ Tính streak
exports.getStreak = async (req, res) => {
  try {
    const userId = req.user.id;

    const logs = await WorkoutLog.find({ user_id: userId }).sort({
      date: -1,
    });

    if (logs.length === 0) {
      return res.json({ streak: 0 });
    }

    // 🔥 Lấy danh sách ngày duy nhất
    const uniqueDates = [
      ...new Set(
        logs.map((log) => {
          const d = new Date(log.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        }),
      ),
    ].sort((a, b) => b - a);

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let date of uniqueDates) {
      if (date === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({ streak });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// 3️⃣ Weekly overview
exports.getWeeklyOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const logs = await WorkoutLog.find({
      user_id: userId,
      date: { $gte: weekAgo, $lte: today },
    });

    const totalCalories = logs.reduce(
      (sum, log) => sum + log.calories_burned,
      0,
    );

    const totalDuration = logs.reduce(
      (sum, log) => sum + log.duration_minutes,
      0,
    );

    res.json({
      totalWorkouts: logs.length,
      totalCalories,
      totalDuration,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
