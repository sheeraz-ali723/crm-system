const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const { logActivity } = require("../utils/activityLogger");

function formatCurrencyHelper(val) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(val || 0);
}

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { customerId, customerName, customerEmail, items, paymentMethod, notes } = req.body;
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: "Customer name is required" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order must contain at least one item" });
    }

    let calculatedTotal = 0;
    const parsedItems = [];

    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      calculatedTotal += price * qty;
      parsedItems.push({
        product: item.productId || item.product || null,
        name: item.name || "Item",
        quantity: qty,
        price: price,
        subtotal: price * qty,
      });

      if (item.productId) {
        const prod = await Product.findById(item.productId);
        if (prod && prod.stock >= qty) {
          prod.stock -= qty;
          await prod.save();
        }
      }
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const order = new Order({
      orderNumber,
      customer: customerId || null,
      customerName: customerName.trim(),
      customerEmail: customerEmail ? customerEmail.trim() : "",
      items: parsedItems,
      totalAmount: calculatedTotal,
      status: "Pending",
      paymentStatus: "Unpaid",
      paymentMethod: paymentMethod || "Cash",
      notes: notes || "",
    });

    const savedOrder = await order.save();

    await logActivity({
      type: "Order",
      title: `New Order: ${savedOrder.orderNumber}`,
      description: `Order placed for ${formatCurrencyHelper(savedOrder.totalAmount)} by${savedOrder.customerName}.`,
      customer: savedOrder.customer,
      customerName: savedOrder.customerName,
    });

    res.status(201).json({ success: true, message: "Order placed successfully", order: savedOrder });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ success: false, message: "Failed to place order", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    await logActivity({
      type: "Order",
      title: `Order Updated: ${updatedOrder.orderNumber}`,
      description: `Status changed to ${updatedOrder.status} \vert{} Payment:${updatedOrder.paymentStatus}.`,
      customer: updatedOrder.customer,
      customerName: updatedOrder.customerName,
    });
    res.status(200).json({ success: true, message: "Order updated successfully", order: updatedOrder });
  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({ success: false, message: "Failed to update order", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ success: false, message: "Failed to delete order", error: error.message });
  }
});

module.exports = router;
