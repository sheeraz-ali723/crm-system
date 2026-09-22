const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Invoice = require("../models/Invoice");
const Deal = require("../models/Deal");
const Task = require("../models/Task");

// Helper currency formatter
const formatPKR = (num) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(num || 0);

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Query message is required." });
    }

    const query = message.toLowerCase().trim();

    // 1. Fetch live snapshot across all collections
    const [customers, products, orders, invoices, deals, tasks] = await Promise.all([
      Customer.find(),
      Product.find(),
      Order.find().sort({ createdAt: -1 }),
      Invoice.find().sort({ createdAt: -1 }),
      Deal.find().sort({ createdAt: -1 }),
      Task.find().sort({ dueDate: 1 }),
    ]);

    // Financial calculations
    const paidOrders = orders.filter((o) => o.paymentStatus === "Paid");
    const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const unpaidInvoices = invoices.filter((i) => i.status !== "Paid" && i.status !== "Cancelled");
    const overdueInvoices = invoices.filter((i) => i.status === "Overdue");
    const lowStockProducts = products.filter((p) => Number(p.stock) <= 5);

    // Deals pipeline
    const activeDeals = deals.filter((d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost");
    const wonDeals = deals.filter((d) => d.stage === "Closed Won");
    const pipelineValue = activeDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

    // Top selling products calculation
    const salesMap = {};
    orders.forEach((o) => {
      if (o.status !== "Cancelled" && Array.isArray(o.items)) {
        o.items.forEach((it) => {
          const k = it.name || "Item";
          if (!salesMap[k]) salesMap[k] = { name: k, count: 0, revenue: 0 };
          salesMap[k].count += Number(it.quantity) || 0;
          salesMap[k].revenue += Number(it.subtotal) || 0;
        });
      }
    });
    const topProducts = Object.values(salesMap).sort((a, b) => b.revenue - a.revenue);

    // Top customers calculation
    const customerSpendMap = {};
    orders.forEach((o) => {
      if (o.customerName) {
        if (!customerSpendMap[o.customerName]) {
          customerSpendMap[o.customerName] = { name: o.customerName, ordersCount: 0, total: 0 };
        }
        customerSpendMap[o.customerName].ordersCount++;
        customerSpendMap[o.customerName].total += Number(o.totalAmount) || 0;
      }
    });
    const topCustomers = Object.values(customerSpendMap).sort((a, b) => b.total - a.total);

    // Pending tasks
    const pendingTasks = tasks.filter((t) => t.status !== "Completed");

    // Analytical Decision Engine
    let reply = "";

    // 1. REVENUE & FINANCIALS
    if (
      query.includes("revenue") ||
      query.includes("sales") ||
      query.includes("performing") ||
      query.includes("earnings")
    ) {
      reply =
        `**Business Performance Overview:**\n\n` +
        `• **Total Realized Revenue:** ${formatPKR(totalPaidRevenue)} across ${paidOrders.length} paid orders.\n` +
        `• **Total Order Volume:** ${orders.length} orders recorded in the system.\n` +
        `• **Active Sales Pipeline:** ${formatPKR(pipelineValue)} in ${activeDeals.length} ongoing deals.\n` +
        `• **Closed Won Deals:** ${wonDeals.length} deals successfully closed.`;
    }
    // 2. PRODUCT PRICES / COSTS (Cheap vs Expensive)
    else if (
      (query.includes("cost") || query.includes("price") || query.includes("cheap") || query.includes("expensive")) &&
      !query.includes("stock")
    ) {
      if (products.length === 0) {
        reply = "There are currently no products in the catalog.";
      } else {
        const sortedByPriceAsc = [...products].sort((a, b) => Number(a.price) - Number(b.price));

        if (query.includes("high") || query.includes("expensive") || query.includes("costly")) {
          const highPriced = [...sortedByPriceAsc].reverse().slice(0, 5);
          const list = highPriced
            .map((p, i) => `${i + 1}. **${p.name}** - ${formatPKR(p.price)} (Stock: ${p.stock})`)
            .join("\n");
          reply = `**Highest Priced Products:**\n\n${list}`;
        } else {
          // Low cost / cheapest
          const lowPriced = sortedByPriceAsc.slice(0, 5);
          const list = lowPriced
            .map((p, i) => `${i + 1}. **${p.name}** - ${formatPKR(p.price)} (Stock: ${p.stock})`)
            .join("\n");
          reply = `**Lowest Cost / Most Affordable Products:**\n\n${list}`;
        }
      }
    }
    // 3. INVENTORY & STOCK
    else if (
      query.includes("stock") ||
      query.includes("inventory") ||
      query.includes("shortage") ||
      query.includes("product")
    ) {
      if (query.includes("low") || query.includes("shortage") || query.includes("out")) {
        if (lowStockProducts.length === 0) {
          reply = `Good news! All products are currently well-stocked above threshold limits (stock > 5).`;
        } else {
          const list = lowStockProducts
            .map((p) => `• **${p.name}**: ${p.stock} units remaining (Price: ${formatPKR(p.price)})`)
            .join("\n");
          reply = `⚠️ **Low Stock Alert (${lowStockProducts.length} items):**\n\n${list}\n\nRecommended: Replenish stock before booking new orders.`;
        }
      } else {
        const topList = topProducts
          .slice(0, 3)
          .map((p, idx) => `${idx + 1}. **${p.name}** - ${p.count} units sold (${formatPKR(p.revenue)})`)
          .join("\n");
        reply =
          `**Product & Inventory Summary:**\n\n` +
          `• Total catalog items: **${products.length} products**.\n` +
          `• Items low on stock: **${lowStockProducts.length}**.\n\n` +
          (topList ? `**Top Selling Products:**\n${topList}` : `No completed product sales recorded yet.`);
      }
    }
    // 4. CUSTOMERS
    else if (query.includes("customer") || query.includes("valuable") || query.includes("client")) {
      const topList = topCustomers
        .slice(0, 4)
        .map((c, i) => `${i + 1}. **${c.name}** - ${formatPKR(c.total)} across ${c.ordersCount} order(s)`)
        .join("\n");
      reply =
        `**Customer Base Insights:**\n\n` +
        `• Total registered accounts: **${customers.length} customers**.\n\n` +
        (topList ? `**Top Spending Customers:**\n${topList}` : `No customer purchase histories recorded yet.`);
    }
    // 5. INVOICES & BILLING
    else if (query.includes("invoice") || query.includes("unpaid") || query.includes("due") || query.includes("overdue")) {
      reply =
        `**Billing & Invoice Status:**\n\n` +
        `• **Total Invoices:** ${invoices.length}\n` +
        `• **Pending / Unpaid Invoices:** ${unpaidInvoices.length}\n` +
        `• **Overdue Invoices:** ${overdueInvoices.length}\n\n` +
        (overdueInvoices.length > 0
          ? `Urgent: You have **${overdueInvoices.length} overdue invoices** requiring follow-up.`
          : `All invoices are up to date!`);
    }
    // 6. TASKS & DEADLINES
    else if (query.includes("task") || query.includes("todo") || query.includes("deadline")) {
      if (pendingTasks.length === 0) {
        reply = `All tasks are completed! No open assignments or pending deadlines.`;
      } else {
        const taskList = pendingTasks
          .slice(0, 5)
          .map(
            (t) =>
              `• **${t.title}** (Priority: ${t.priority}, Due: ${new Date(t.dueDate).toLocaleDateString()}, Assignee: ${t.assignedTo})`
          )
          .join("\n");
        reply = `**Open Tasks (${pendingTasks.length} pending):**\n\n${taskList}`;
      }
    }
    // DEFAULT OVERVIEW
    else {
      reply =
        `I analyzed your live CRM data. Here is a high-level summary:\n\n` +
        `• **Revenue:** ${formatPKR(totalPaidRevenue)} across ${orders.length} total orders\n` +
        `• **Customers:** ${customers.length} registered contacts\n` +
        `• **Inventory:** ${products.length} products (${lowStockProducts.length} low in stock)\n` +
        `• **Pipeline:** ${activeDeals.length} active deals worth ${formatPKR(pipelineValue)}\n` +
        `• **Pending Tasks:** ${pendingTasks.length} tasks needing attention.\n\n` +
        `You can ask me questions like: *"Which products have the lowest cost?"*, *"Which products are low on stock?"*, or *"Who are my top customers?"*`;
    }

    res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    res.status(500).json({
      success: false,
      message: "AI assistant failed to process your question",
      error: error.message,
    });
  }
});

module.exports = router;