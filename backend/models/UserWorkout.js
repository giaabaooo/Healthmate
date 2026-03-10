const mongoose = require("mongoose");

const userWorkoutSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    workout_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout",
      required: true,
    },

    planned_duration: {
      type: Number, // phút user muốn tập
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["planned", "in_progress", "completed"],
      default: "planned",
    },

    last_started_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("UserWorkout", userWorkoutSchema);
