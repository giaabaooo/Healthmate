const WorkoutLog = require("../models/WorkoutLog");
const Workout = require("../models/Workout");

// CREATE WORKOUT LOG
const createWorkoutLog = async (req, res) => {
  try {
    const { workout_id, duration_minutes, calories_burned, notes } = req.body;

    if (!workout_id || !duration_minutes || !calories_burned) {
      return res.status(400).json({
        message: "Missing required fields",
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
      user_id: req.user.id,
    })
      .populate("workout_id")
      .sort({ date: -1 });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createWorkoutLog,
  getMyWorkoutLogs,
};
