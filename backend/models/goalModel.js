const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    goal_type: {
      type: String,
      enum: ["muscle_gain", "fat_loss", "endurance", "maintain"],
    },

    duration_weeks: {
      type: Number,
    },

    start_date: Date,

    end_date: Date,

    commitment_days_per_week: {
      type: Number,
    },

    motivation: String,

    status: {
      type: String,
      enum: ["active", "paused", "completed"],
      default: "active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Goal", goalSchema);
