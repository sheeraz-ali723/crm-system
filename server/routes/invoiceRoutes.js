const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const Order = require("../models/Order");

// GET /api/invoices - Fetch all invoices
router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("order", "orderNumber")
      .populate("customer", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    console.error("Fetch invoices error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch invoices", error: error.message });
  }
});

// GET /api/invoices/:id - Fetch single invoice
router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("order")
      .populate("customer");

    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching invoice", error: error.message });
  }
});

// POST /api/invoices - Create custom or order-derived invoice
router.post("/", async (req, res) => {
  try {
    const {
      orderId,
      customerId,
      customerName,
      customerEmail,
      items,
      taxRate = 0,
      discount = 0,
      dueDate,
      notes,
      status = "Sent",
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: "Customer name is required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "At least one invoice item is required" });
    }

    let subtotal = 0;
    const parsedItems = items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const total = qty * unitPrice;
      subtotal += total;
      return {
        description: item.description || "Service/Product Item",
        quantity: qty,
        unitPrice,
        total,
      };
    });

    const taxAmount = (subtotal * (Number(taxRate) || 0)) / 100;
    const finalTotal = Math.max(0, subtotal + taxAmount - (Number(discount) || 0));

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const invoice = new Invoice({
      invoiceNumber,
      order: orderId || null,
      customer: customerId || null,
      customerName: customerName.trim(),
      customerEmail: customerEmail ? customerEmail.trim() : "",
      items: parsedItems,
      subtotal,
      taxRate: Number(taxRate) || 0,
      taxAmount,
      discount: Number(discount) || 0,
      totalAmount: finalTotal,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status,
      notes: notes || "",
    });

    const savedInvoice = await invoice.save();

    // If linked to an order and marked Paid, update the order payment status as well
    if (orderId && status === "Paid") {
      await Order.findByIdAndUpdate(orderId, { paymentStatus: "Paid" });
    }

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice: savedInvoice,
    });
  } catch (error) {
    console.error("Create invoice error:", error);
    res.status(500).json({ success: false, message: "Failed to create invoice", error: error.message });
  }
});

// PUT /api/invoices/:id - Update invoice status / payment
router.put("/:id", async (req, res) => {
  try {
    const { status, notes, dueDate } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    if (status !== undefined) invoice.status = status;
    if (notes !== undefined) invoice.notes = notes;
    if (dueDate !== undefined) invoice.dueDate = new Date(dueDate);

    const updated = await invoice.save();

    // Sync order if invoice transitions to Paid
    if (updated.order && status === "Paid") {
      await Order.findByIdAndUpdate(updated.order, { paymentStatus: "Paid" });
    }

    res.status(200).json({ success: true, message: "Invoice updated", invoice: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update invoice", error: error.message });
  }
});

// DELETE /api/invoices/:id - Delete invoice
router.delete("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    res.status(200).json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete invoice", error: error.message });
  }
});

module.exports = router;
