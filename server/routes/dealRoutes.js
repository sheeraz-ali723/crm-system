const express = require("express");
const router = express.Router();
const Deal = require("../models/Deal");
const Customer = require("../models/Customer");

// ==========================================
// GET ALL DEALS
// GET /api/deals
// ==========================================
router.get("/", async (req, res) => {
  try {
    const deals = await Deal.find()
      .populate("customerRef", "name email phone company")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(deals);
  } catch (error) {
    console.error("Get deals error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deals",
      error: error.message,
    });
  }
});

// ==========================================
// GET SINGLE DEAL
// GET /api/deals/:id
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate("customerRef", "name email phone company")
      .populate("createdBy", "name email");

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    res.status(200).json(deal);
  } catch (error) {
    console.error("Get deal error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deal",
      error: error.message,
    });
  }
});

// ==========================================
// CREATE DEAL
// POST /api/deals
// ==========================================
router.post("/", async (req, res) => {
  try {
    const {
      title,
      customer,
      customerId,
      customerRef,
      email,
      value,
      stage,
      priority,
      expectedCloseDate,
      notes,
      createdBy,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Deal title is required",
      });
    }

    // Auto-resolve customer reference if ID provided or match by email
    let linkedCustomerId = customerId || customerRef || null;
    let customerName = customer ? customer.trim() : "";
    let customerEmail = email ? email.trim().toLowerCase() : "";

    if (linkedCustomerId) {
      const existingCustomer = await Customer.findById(linkedCustomerId);
      if (existingCustomer) {
        if (!customerName) customerName = existingCustomer.name;
        if (!customerEmail) customerEmail = existingCustomer.email;
      }
    } else if (customerEmail) {
      const existingCustomer = await Customer.findOne({ email: customerEmail });
      if (existingCustomer) {
        linkedCustomerId = existingCustomer._id;
        if (!customerName) customerName = existingCustomer.name;
      }
    }

    const deal = new Deal({
      title: title.trim(),
      customer: customerName,
      customerRef: linkedCustomerId,
      email: customerEmail,
      value: Number(value) || 0,
      stage: stage || "New",
      priority: priority || "Medium",
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
      notes: notes ? notes.trim() : "",
      createdBy: createdBy || null,
    });

    const savedDeal = await deal.save();

    res.status(201).json({
      success: true,
      message: "Deal created successfully",
      deal: savedDeal,
    });
  } catch (error) {
    console.error("Create deal error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create deal",
      error: error.message,
    });
  }
});

// ==========================================
// UPDATE DEAL
// PUT /api/deals/:id
// ==========================================
router.put("/:id", async (req, res) => {
  try {
    const {
      title,
      customer,
      customerId,
      customerRef,
      email,
      value,
      stage,
      priority,
      expectedCloseDate,
      notes,
    } = req.body;

    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    if (title !== undefined) deal.title = title.trim();
    if (customer !== undefined) deal.customer = customer.trim();
    if (customerId !== undefined || customerRef !== undefined) {
      deal.customerRef = customerId || customerRef || null;
    }
    if (email !== undefined) deal.email = email.trim().toLowerCase();
    if (value !== undefined) deal.value = Number(value) || 0;
    if (stage !== undefined) deal.stage = stage;
    if (priority !== undefined) deal.priority = priority;
    if (expectedCloseDate !== undefined) {
      deal.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
    }
    if (notes !== undefined) deal.notes = notes.trim();

    const updatedDeal = await deal.save();

    res.status(200).json({
      success: true,
      message: "Deal updated successfully",
      deal: updatedDeal,
    });
  } catch (error) {
    console.error("Update deal error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update deal",
      error: error.message,
    });
  }
});

// ==========================================
// DELETE DEAL
// DELETE /api/deals/:id
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    await Deal.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Deal deleted successfully",
    });
  } catch (error) {
    console.error("Delete deal error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete deal",
      error: error.message,
    });
  }
});

module.exports = router;