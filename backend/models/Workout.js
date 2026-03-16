const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    title: {
      // used in db screenshot
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    category_id: {
      // reference to category collection
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkoutCategory",
      required: true,
    },
    level: {
      // beginner/intermediate/advanced
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    calories_burned: {
      // static estimate
      type: Number,
      default: 0,
    },
    met: {
      type: Number,
      default: 5,
    },
    exercises: [
      // array of embedded exercise objects
      {
        title: String,
        video_url: String,
        duration_sec: Number,
        order: Number,
      },
    ],
    created_by: {
      // who created the workout
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cover_image: {
      type: String,
      default: "",
    },
    // legacy fields that may still exist, keep them optional
    name: String,
    duration: Number,
    calories: Number,
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Workout", workoutSchema);
