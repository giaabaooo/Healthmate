const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Workout = require("../models/Workout");

/*
========================================
CREATE WORKOUT
========================================
*/
router.post("/", async (req, res) => {
  try {
    const workout = new Workout({
      ...req.body,
      cover_image: req.body.cover_image || "",
    });

    await workout.save();
    res.status(201).json(workout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
========================================
GET ALL WORKOUTS (FILTER)
========================================
*/
router.get("/", async (req, res) => {
  try {
    const { category, level, search } = req.query;

    const filter = {};

    // chỉ filter nếu field đó tồn tại trong schema
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category_id = category;
    }

    if (level) {
      filter.level = level;
    }

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const workouts = await Workout.find(filter).sort({ createdAt: -1 }); // ❌ bỏ populate

    res.json(workouts);
  } catch (err) {
    console.error("GET WORKOUTS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/*
========================================
GET WORKOUT BY ID
========================================
*/
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const workout = await Workout.findById(req.params.id); // ❌ bỏ populate

    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    res.json(workout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
========================================
UPDATE WORKOUT
========================================
*/
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const workout = await Workout.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        cover_image: req.body.cover_image,
      },
      { new: true },
    );

    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    res.json(workout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
========================================
DELETE WORKOUT
========================================
*/
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const workout = await Workout.findByIdAndDelete(req.params.id);

    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
