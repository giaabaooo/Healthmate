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
    const microGoal = await MicroGoal.findById(req.params.id);
    if (!microGoal) return res.status(404).json({ message: "MicroGoal not found" });

    // 1. Nếu frontend gửi 'label' lên -> Cập nhật label
    if (req.body.label !== undefined) {
      microGoal.label = req.body.label;
    }

    // 2. Nếu frontend gửi 'done' lên -> Cập nhật trạng thái done
    if (req.body.done !== undefined) {
      microGoal.done = req.body.done;
    } 

    await microGoal.save();
    res.json(microGoal);
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
