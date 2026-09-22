const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Deal = require("../models/Deal");
const Order = require("../models/Order");
const Invoice = require("../models/Invoice");
const Activity = require("../models/Activity");
const Task = require("../models/Task");

// GET /api/dashboard/stats
router.get("/stats", async (req, res) => {
  try {
    const [
      totalCustomers,
      deals,
      orders,
      invoices,
      recentActivities,
      pendingTasks,
    ] = await Promise.all([
      Customer.countDocuments(),
      Deal.find().sort({ createdAt: -1 }),
      Order.find().sort({ createdAt: -1 }).limit(5),
      Invoice.find(),
      Activity.find().sort({ createdAt: -1 }).limit(5),
      Task.countDocuments({ status: { $ne: "Completed" } }),
    ]);

    // Calculate revenue from paid orders and paid invoices
    const paidOrdersRevenue = orders
      .filter((o) => o.paymentStatus === "Paid")
      .reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);

    const paidInvoicesRevenue = invoices
      .filter((i) => i.status === "Paid")
      .reduce((acc, i) => acc + (Number(i.totalAmount) || 0), 0);

    const totalRevenue = Math.max(paidOrdersRevenue, paidInvoicesRevenue);

    // Deals pipeline calculation
    const pipelineValue = deals
      .filter((d) => d.stage !== "Closed Lost")
      .reduce((acc, d) => acc + (Number(d.value) || 0), 0);

    const wonDealsCount = deals.filter((d) => d.stage === "Closed Won").length;

    // Active orders count
    const activeOrdersCount = orders.filter(
      (o) => o.status === "Pending" || o.status === "Processing"
    ).length;

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalCustomers,
        pipelineValue,
        activeDealsCount: deals.filter((d) => d.stage !== "Closed Lost" && d.stage !== "Closed Won").length,
        wonDealsCount,
        activeOrdersCount,
        pendingTasksCount: pendingTasks,
      },
      recentOrders: orders,
      recentDeals: deals.slice(0, 5),
      recentActivities,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Failed to aggregate dashboard data", error: error.message });
  }
});

module.exports = router;
