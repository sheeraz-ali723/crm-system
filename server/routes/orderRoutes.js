const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const Product = require("../models/Product");
const { logActivity } = require("../utils/activityLogger");

function formatCurrencyHelper(value) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

/* =========================================================
   GET ALL ORDERS
   GET /api/orders
========================================================= */
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name email")
      .populate("items.product", "name price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Fetch orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

/* =========================================================
   GET SINGLE ORDER
   GET /api/orders/:id
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email")
      .populate("items.product", "name price");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Fetch single order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
});

/* =========================================================
   CREATE ORDER
   POST /api/orders
========================================================= */
router.post("/", async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      items,
      paymentMethod,
      notes,
    } = req.body;

    /* -----------------------------------------
       VALIDATE CUSTOMER
    ----------------------------------------- */
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    /* -----------------------------------------
       VALIDATE ITEMS
    ----------------------------------------- */
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    let calculatedTotal = 0;
    const parsedItems = [];

    /* -----------------------------------------
       VALIDATE PRODUCTS
    ----------------------------------------- */
    for (const item of items) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          message: "Every order item must have a product",
        });
      }

      const quantity = Number(item.quantity) || 1;

      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Product quantity must be at least 1",
        });
      }

      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      /* -----------------------------------------
         CHECK STOCK
      ----------------------------------------- */
      if (Number(product.stock) < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available stock: ${product.stock}`,
        });
      }

      const price = Number(product.price) || Number(item.price) || 0;

      const subtotal = price * quantity;

      calculatedTotal += subtotal;

      parsedItems.push({
        product: product._id,
        name: product.name,
        quantity,
        price,
        subtotal,
      });
    }

    /* -----------------------------------------
       REDUCE STOCK
       Only after all products are validated
    ----------------------------------------- */
    for (const item of parsedItems) {
      const product = await Product.findById(item.product);

      if (product) {
        product.stock -= item.quantity;
        await product.save();
      }
    }

    /* -----------------------------------------
       CREATE ORDER NUMBER
    ----------------------------------------- */
    const orderNumber = `ORD-${Date.now()
      .toString()
      .slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    /* -----------------------------------------
       CREATE ORDER
    ----------------------------------------- */
    const order = new Order({
      orderNumber,

      customer: customerId || null,

      customerName: customerName.trim(),

      customerEmail: customerEmail
        ? customerEmail.trim()
        : "",

      items: parsedItems,

      totalAmount: calculatedTotal,

      status: "Pending",

      paymentStatus: "Unpaid",

      paymentMethod: paymentMethod || "Cash",

      notes: notes || "",
    });

    /* -----------------------------------------
       SAVE ORDER
    ----------------------------------------- */
    const savedOrder = await order.save();

    /* -----------------------------------------
       ACTIVITY LOG
    ----------------------------------------- */
    try {
      await logActivity({
        type: "Order",
        title: `New Order: ${savedOrder.orderNumber}`,
        description: `Order placed for ${formatCurrencyHelper(
          savedOrder.totalAmount
        )} by ${savedOrder.customerName}.`,
        customer: savedOrder.customer,
        customerName: savedOrder.customerName,
      });
    } catch (activityError) {
      console.error(
        "Activity log error:",
        activityError.message
      );
    }

    /* -----------------------------------------
       RESPONSE
    ----------------------------------------- */
    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message,
    });
  }
});

/* =========================================================
   UPDATE ORDER
   PUT /api/orders/:id
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    try {
      await logActivity({
        type: "Order",
        title: `Order Updated: ${updatedOrder.orderNumber}`,
        description: `Status changed to ${updatedOrder.status}. Payment: ${updatedOrder.paymentStatus}.`,
        customer: updatedOrder.customer,
        customerName: updatedOrder.customerName,
      });
    } catch (activityError) {
      console.error(
        "Activity log error:",
        activityError.message
      );
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: error.message,
    });
  }
});

/* =========================================================
   DELETE ORDER
   DELETE /api/orders/:id
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(
      req.params.id
    );

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
});

module.exports = router;