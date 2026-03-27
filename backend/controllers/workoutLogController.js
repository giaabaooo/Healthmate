const WorkoutLog = require("../models/WorkoutLog");
const Workout = require("../models/Workout");

// 🔴 HÀM KIỂM TRA NGÀY QUÁ KHỨ
const checkIsPastDate = (dateStr) => {
    if (!dateStr) return false; // Nếu không có date (mặc định lấy hiện tại thì pass)
    const target = new Date(dateStr);
    const tzOffset = target.getTimezoneOffset() * 60000;
    const targetStr = new Date(target.getTime() - tzOffset).toISOString().split('T')[0];

    const today = new Date();
    const todayOffset = today.getTimezoneOffset() * 60000;
    const todayStr = new Date(today.getTime() - todayOffset).toISOString().split('T')[0];
    
    return targetStr < todayStr;
};

// CREATE WORKOUT LOG
const createWorkoutLog = async (req, res) => {
  try {
    const { workout_id, duration_minutes, calories_burned, notes, start_time, date } = req.body;

    // 🔴 CHẶN TẬP LUYỆN CHO NGÀY QUÁ KHỨ
    if (checkIsPastDate(date)) {
        return res.status(400).json({ message: "Không thể lưu kết quả tập luyện cho ngày trong quá khứ." });
    }

    const missing = [];
    if (workout_id == null) missing.push("workout_id");
    if (duration_minutes == null) missing.push("duration_minutes");
    if (calories_burned == null) missing.push("calories_burned");

    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }

    const workoutExists = await Workout.findById(workout_id);
    if (!workoutExists) return res.status(404).json({ message: "Workout not found" });

    const log = await WorkoutLog.create({
      user_id: req.user.id,
      workout_id,
      duration_minutes,
      calories_burned,
      notes,
      start_time,
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET MY WORKOUT LOGS
const getMyWorkoutLogs = async (req, res) => {
  try {
    const logs = await WorkoutLog.find({ user_id: req.user.id }).populate("workout_id", "title cover_image category_id level calories_burned duration description exercises");
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createWorkoutLog, getMyWorkoutLogs };