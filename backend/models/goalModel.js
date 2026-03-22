const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    goal_type: { type: String, enum: ["muscle_gain", "fat_loss", "endurance", "maintain"] },
    duration_weeks: { type: Number },
    start_date: Date,
    end_date: Date,
    commitment_days_per_week: { type: Number },
    motivation: String,
    status: { type: String, enum: ["active", "paused", "completed", "archived"], default: "active" },
    target_weight: { type: Number },
    target_health_metric: { type: String },
    fitness_level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    phases: [{ title: String, desc: String, startWeek: Number, endWeek: Number }],
    
    // --- THÊM MỚI: Lịch sử Check-in hàng tuần ---
    weekly_log: [
      {
        week: { type: Number, required: true },
        weight: { type: Number, required: true },
        feeling: { type: String, enum: ["great", "normal", "exhausted"], default: "normal" },
        date: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goal", goalSchema);