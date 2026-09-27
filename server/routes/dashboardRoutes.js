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
      allOrders,
      recentOrders,
      invoices,
      recentActivities,
      pendingTasks,
    ] = await Promise.all([
      Customer.countDocuments(),

      Deal.find().sort({ createdAt: -1 }),

      // Get ALL orders for dashboard calculations
      Order.find().sort({ createdAt: -1 }),

      // Only latest 5 orders for Recent Orders section
      Order.find().sort({ createdAt: -1 }).limit(5),

      Invoice.find(),

      Activity.find().sort({ createdAt: -1 }).limit(5),

      Task.countDocuments({
        status: { $ne: "Completed" },
      }),
    ]);

    // =========================================================
    // REVENUE
    // =========================================================
    // Count all non-cancelled orders as confirmed order revenue.
    // This includes Pending, Processing, Shipped and Delivered.
    const orderRevenue = allOrders
      .filter((order) => order.status !== "Cancelled")
      .reduce(
        (total, order) => total + (Number(order.totalAmount) || 0),
        0
      );

    // Paid invoices
    const paidInvoicesRevenue = invoices
      .filter((invoice) => invoice.status === "Paid")
      .reduce(
        (total, invoice) => total + (Number(invoice.totalAmount) || 0),
        0
      );

    // Dashboard revenue
    const totalRevenue = orderRevenue + paidInvoicesRevenue;

    // =========================================================
    // DEAL PIPELINE
    // =========================================================
    const pipelineValue = deals
      .filter((deal) => deal.stage !== "Closed Lost")
      .reduce(
        (total, deal) => total + (Number(deal.value) || 0),
        0
      );

    const wonDealsCount = deals.filter(
      (deal) => deal.stage === "Closed Won"
    ).length;

    const activeDealsCount = deals.filter(
      (deal) =>
        deal.stage !== "Closed Lost" &&
        deal.stage !== "Closed Won"
    ).length;

    // =========================================================
    // ACTIVE ORDERS
    // =========================================================
    // Pending + Processing + Shipped
    const activeOrdersCount = allOrders.filter(
      (order) =>
        order.status === "Pending" ||
        order.status === "Processing" ||
        order.status === "Shipped"
    ).length;

    // =========================================================
    // RESPONSE
    // =========================================================
    res.status(200).json({
      success: true,

      stats: {
        totalRevenue,
        totalCustomers,
        pipelineValue,
        activeDealsCount,
        wonDealsCount,
        activeOrdersCount,
        pendingTasksCount: pendingTasks,
      },

      recentOrders,

      recentDeals: deals.slice(0, 5),

      recentActivities,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to aggregate dashboard data",
      error: error.message,
    });
  }
});

module.exports = router;