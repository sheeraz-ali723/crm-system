const express = require("express");
const router = express.Router();
const Activity = require("../models/Activity");

// GET /api/activities - Fetch all activities
router.get("/", async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 });
    res.status(200).json(activities);
  } catch (error) {
    console.error("Fetch activities error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch activities", error: error.message });
  }
});

// POST /api/activities - Create an activity
router.post("/", async (req, res) => {
  try {
    const { type, title, description, performedBy, customer, customerName, date } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Activity title is required" });
    }

    const activity = new Activity({
      type: type || "Note",
      title: title.trim(),
      description: description ? description.trim() : "",
      performedBy: performedBy ? performedBy.trim() : "Sheeraz Ali",
      customer: customer || null,
      customerName: customerName ? customerName.trim() : "",
      date: date ? new Date(date) : new Date(),
    });

    const savedActivity = await activity.save();
    res.status(201).json({ success: true, message: "Activity logged", activity: savedActivity });
  } catch (error) {
    console.error("Create activity error:", error);
    res.status(400).json({ success: false, message: "Failed to create activity", error: error.message });
  }
});

// DELETE /api/activities/:id - Delete an activity
router.delete("/:id", async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: "Activity not found" });
    res.status(200).json({ success: true, message: "Activity deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete activity", error: error.message });
  }
});

module.exports = router;