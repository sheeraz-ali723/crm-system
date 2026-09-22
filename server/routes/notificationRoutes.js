const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const Product = require("../models/Product");
const Order = require("../models/Order");

// GET /api/notifications - Get all notifications (and generate system alerts dynamically)
router.get("/", async (req, res) => {
  try {
    // 1. Scan for low stock items and ensure alerts exist
    const lowStockItems = await Product.find({ stock: { $lte: 5 } });
    for (const item of lowStockItems) {
      const existing = await Notification.findOne({
        category: "Stock",
        message: { $regex: item.name, $options: "i" },
      });

      if (!existing) {
        await Notification.create({
          title: "Low Inventory Warning",
          message: `Product '${item.name}' has only ${item.stock} unit(s) remaining.`,
          type: item.stock === 0 ? "danger" : "warning",
          category: "Stock",
          link: "/products",
        });
      }
    }

    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications", error: error.message });
  }
});

// POST /api/notifications - Create custom notification
router.post("/", async (req, res) => {
  try {
    const { title, message, type, category, link } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }

    const notif = new Notification({
      title: title.trim(),
      message: message.trim(),
      type: type || "info",
      category: category || "System",
      link: link || "",
    });

    const saved = await notif.save();
    res.status(201).json({ success: true, notification: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to create notification", error: error.message });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put("/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { $set: { read: true } });
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update notifications", error: error.message });
  }
});

// PUT /api/notifications/:id/read - Mark single as read
router.put("/:id/read", async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { read: true } },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });
    res.status(200).json({ success: true, notification: notif });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update notification", error: error.message });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete("/:id", async (req, res) => {
  try {
    const notif = await Notification.findByIdAndDelete(req.params.id);
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete notification", error: error.message });
  }
});

module.exports = router;