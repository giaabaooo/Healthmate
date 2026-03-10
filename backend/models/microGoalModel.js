const mongoose = require("mongoose");

const microGoalSchema = new mongoose.Schema(
  {
    goal_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      required: true,
    },

    label: {
      type: String,
      required: true,
    },

    done: {
      type: Boolean,
      default: false,
    },

    week: {
      type: Number,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("MicroGoal", microGoalSchema);
