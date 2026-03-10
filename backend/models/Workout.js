const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 30,
    },
    met: {
      type: Number,
      default: 5,
    },
    calories: {
      type: Number,
      default: 200,
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Workout", workoutSchema);
