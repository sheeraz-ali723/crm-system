const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Deal = require("../models/Deal");
const Customer = require("../models/Customer");
const Product = require("../models/Product");

// GET /api/analytics - Deep business intelligence aggregates
router.get("/", async (req, res) => {
  try {
    const [orders, deals, customers, products] = await Promise.all([
      Order.find(),
      Deal.find(),
      Customer.find(),
      Product.find(),
    ]);

    // 1. Order Status Breakdown
    const orderStatusCounts = {
      Delivered: 0,
      Shipped: 0,
      Processing: 0,
      Pending: 0,
      Cancelled: 0,
    };
    orders.forEach((o) => {
      if (orderStatusCounts[o.status] !== undefined) {
        orderStatusCounts[o.status]++;
      }
    });

    // 2. Payment Status Distribution
    const paymentStatusCounts = {
      Paid: 0,
      Unpaid: 0,
      Refunded: 0,
    };
    orders.forEach((o) => {
      const ps = o.paymentStatus || "Unpaid";
      if (paymentStatusCounts[ps] !== undefined) {
        paymentStatusCounts[ps]++;
      }
    });

    // 3. Deal Pipeline Stages & Win Rate
    const stageCounts = {};
    let wonValue = 0;
    let lostValue = 0;
    let totalPipelineValue = 0;

    deals.forEach((d) => {
      stageCounts[d.stage] = (stageCounts[d.stage] || 0) + 1;
      const val = Number(d.value) || 0;
      totalPipelineValue += val;
      if (d.stage === "Closed Won") wonValue += val;
      if (d.stage === "Closed Lost") lostValue += val;
    });

    const closedDealsTotal = (stageCounts["Closed Won"] || 0) + (stageCounts["Closed Lost"] || 0);
    const winRate =
      closedDealsTotal > 0
        ? Math.round(((stageCounts["Closed Won"] || 0) / closedDealsTotal) * 100)
        : 0;

    // 4. Product Sales Performance Aggregation
    const productSalesMap = {};
    orders.forEach((o) => {
      if (o.status !== "Cancelled" && Array.isArray(o.items)) {
        o.items.forEach((item) => {
          const key = item.name || "Item";
          if (!productSalesMap[key]) {
            productSalesMap[key] = { name: key, unitsSold: 0, revenue: 0 };
          }
          productSalesMap[key].unitsSold += Number(item.quantity) || 0;
          productSalesMap[key].revenue += Number(item.subtotal) || 0;
        });
      }
    });

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 5. Monthly Revenue Tracking (Last 6 Months)
    const monthlyRevenueMap = {};
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString("default", { month: "short" });
      months.push(key);
      monthlyRevenueMap[key] = 0;
    }

    orders.forEach((o) => {
      if (o.paymentStatus === "Paid") {
        const orderDate = new Date(o.createdAt);
        const monthKey = orderDate.toLocaleString("default", { month: "short" });
        if (monthlyRevenueMap[monthKey] !== undefined) {
          monthlyRevenueMap[monthKey] += Number(o.totalAmount) || 0;
        }
      }
    });

    const monthlyRevenueData = months.map((m) => ({
      month: m,
      revenue: monthlyRevenueMap[m] || 0,
    }));

    // 6. Summary Totals
    const totalRevenue = orders
      .filter((o) => o.paymentStatus === "Paid")
      .reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);

    const averageOrderValue =
      orders.length > 0 ? Math.round(totalRevenue / (orders.length || 1)) : 0;

    res.status(200).json({
      success: true,
      summary: {
        totalRevenue,
        averageOrderValue,
        winRate,
        totalCustomers: customers.length,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalDeals: deals.length,
      },
      orderStatusCounts,
      paymentStatusCounts,
      stageCounts,
      topSellingProducts,
      monthlyRevenueData,
    });
  } catch (error) {
    console.error("Analytics aggregation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate analytics",
      error: error.message,
    });
  }
});

module.exports = router;