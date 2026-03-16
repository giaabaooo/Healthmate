const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
    },
    lastLogin: {
      type: Date,
    },
    // Nhúng trực tiếp Profile vào User để tối ưu truy vấn
    profile: {
      full_name: { type: String, required: true },
      gender: { type: String, enum: ["male", "female", "other"] },
      birth_date: { type: Date },
      height_cm: { type: Number },
      weight_kg: { type: Number },
      goal: { type: String, enum: ["muscle_gain", "fat_loss", "maintain"] },
      phone_number: { type: String },
      address: { type: String },
      picture: { type: String },
    },
    daily_routine: [
  {
    date: { type: String, required: true },

    exercises: [
      {
        workout_id: { type: mongoose.Schema.Types.ObjectId, ref: "Workout" },
        name: String,
        startTime: String,
        endTime: String,
        duration: Number,
        calories: Number,
        image: String,
      },
    ],
  },
],
  },
  {
    timestamps: true, // Tự động tạo created_at và updated_at
  },
);

module.exports = mongoose.model("User", userSchema);
