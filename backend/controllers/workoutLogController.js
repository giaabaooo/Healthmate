const WorkoutLog = require("../models/WorkoutLog");
const Workout = require("../models/Workout");

// CREATE WORKOUT LOG
const createWorkoutLog = async (req, res) => {
  try {
    const {
      workout_id,
      duration_minutes,
      calories_burned,
      notes,
      start_time,
      date,
    } = req.body;

    // Log incoming body for easier debugging
    console.debug("createWorkoutLog payload:", req.body);

    // Accept 0 values (e.g. 0 calories burned) but reject missing values
    const missing = [];
    if (workout_id == null) missing.push("workout_id");
    if (duration_minutes == null) missing.push("duration_minutes");
    if (calories_burned == null) missing.push("calories_burned");

    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    const workoutExists = await Workout.findById(workout_id);

    if (!workoutExists) {
      return res.status(404).json({
        message: "Workout not found",
      });
    }

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
    const logs = await WorkoutLog.find({
      user_id: req.user.id, // FIX
    })
      .populate("workout_id")
      .sort({ createdAt: -1 }); // FIX

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createWorkoutLog,
  getMyWorkoutLogs,
};
