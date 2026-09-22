const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// GET /api/tasks - Get all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate({
        path: "relatedCustomer",
        select: "name email phone company",
      })
      .sort({ dueDate: 1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Fetch tasks error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tasks", error: error.message });
  }
});

// POST /api/tasks - Create new task
router.post("/", async (req, res) => {
  try {
    const { title, description, dueDate, priority, status, assignedTo, relatedCustomer } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Task title is required" });
    }
    if (!dueDate) {
      return res.status(400).json({ success: false, message: "Due date is required" });
    }

    const task = new Task({
      title: title.trim(),
      description: description ? description.trim() : "",
      dueDate: new Date(dueDate),
      priority: priority || "Medium",
      status: status || "Pending",
      assignedTo: assignedTo ? assignedTo.trim() : "Sheeraz Ali",
      relatedCustomer: relatedCustomer && relatedCustomer !== "" ? relatedCustomer : null,
    });

    const savedTask = await task.save();
    res.status(201).json({ success: true, message: "Task created successfully", task: savedTask });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(400).json({ success: false, message: "Failed to create task", error: error.message });
  }
});

// PUT /api/tasks/:id - Update task
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    const updates = req.body;
    if (updates.title !== undefined) task.title = updates.title.trim();
    if (updates.description !== undefined) task.description = updates.description.trim();
    if (updates.dueDate !== undefined) task.dueDate = new Date(updates.dueDate);
    if (updates.priority !== undefined) task.priority = updates.priority;
    if (updates.status !== undefined) task.status = updates.status;
    if (updates.assignedTo !== undefined) task.assignedTo = updates.assignedTo.trim();
    if (updates.relatedCustomer !== undefined) {
      task.relatedCustomer = updates.relatedCustomer && updates.relatedCustomer !== "" ? updates.relatedCustomer : null;
    }

    const updatedTask = await task.save();
    res.status(200).json({ success: true, message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to update task", error: error.message });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete task", error: error.message });
  }
});

module.exports = router;