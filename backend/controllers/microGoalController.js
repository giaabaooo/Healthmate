const MicroGoal = require("../models/microGoalModel");

exports.getMicroGoals = async (req, res) => {
  try {
    const goals = await MicroGoal.find({
      goal_id: req.params.goalId,
    });

    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createMicroGoal = async (req, res) => {
  try {
    const goal = new MicroGoal(req.body);

    const saved = await goal.save();

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleMicroGoal = async (req, res) => {
  try {
    const goal = await MicroGoal.findById(req.params.id);

    goal.done = !goal.done;

    await goal.save();

    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMicroGoal = async (req, res) => {
  try {
    await MicroGoal.findByIdAndDelete(req.params.id);

    res.json({ message: "deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
