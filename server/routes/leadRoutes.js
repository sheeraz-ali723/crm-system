const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");
const Customer = require("../models/Customer");
const User = require("../models/User");

// =====================================================
// GET ALL LEADS
// GET /api/leads
// =====================================================
router.get("/", async (req, res) => {
  try {
    const leads = await Lead.find()
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(leads);
  } catch (error) {
    console.error("Get leads error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
      error: error.message,
    });
  }
});

// =====================================================
// GET SINGLE LEAD
// GET /api/leads/:id
// =====================================================
router.get("/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate("assignedTo", "name email");

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.status(200).json(lead);
  } catch (error) {
    console.error("Get lead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lead",
      error: error.message,
    });
  }
});

// =====================================================
// CREATE LEAD
// POST /api/leads
// =====================================================
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      source,
      status,
      priority,
      value,
      notes,
      assignedTo,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const lead = new Lead({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : "",
      company: company ? company.trim() : "",
      source: source || "Website",
      status: status || "New",
      priority: priority || "Medium",
      value: Number(value) || 0,
      notes: notes ? notes.trim() : "",
      assignedTo: assignedTo || null,
    });

    const savedLead = await lead.save();

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      lead: savedLead,
    });
  } catch (error) {
    console.error("Create lead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create lead",
      error: error.message,
    });
  }
});

// =====================================================
// CONVERT LEAD TO CUSTOMER (AUTOMATION)
// POST /api/leads/:id/convert
// =====================================================
router.post("/:id/convert", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    const normalizedEmail = lead.email.toLowerCase().trim();
    let customer = await Customer.findOne({ email: normalizedEmail });

    if (!customer) {
      // Find a default user to set as creator
      const defaultUser = (await User.findOne({ role: "admin" })) || (await User.findOne());

      const customerData = {
        name: lead.name,
        email: normalizedEmail,
        phone: lead.phone || "",
        company: lead.company || "",
        notes: `Converted from Lead (Source: ${lead.source || "Direct"}). ${lead.notes || ""}`.trim(),
        status: "Active",
      };
      if (defaultUser && defaultUser._id) {
        customerData.createdBy = defaultUser._id;
      }
      customer = await Customer.create(customerData);
    }

    lead.status = "Converted";
    await lead.save();

    res.status(200).json({
      success: true,
      message: "Lead successfully converted to Customer",
      customer,
      lead,
    });
  } catch (error) {
    console.error("Lead conversion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to convert lead",
      error: error.message,
    });
  }
});

// =====================================================
// UPDATE LEAD
// PUT /api/leads/:id
// =====================================================
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      source,
      status,
      priority,
      value,
      notes,
      assignedTo,
    } = req.body;

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    if (name !== undefined) lead.name = name.trim();
    if (email !== undefined) lead.email = email.trim().toLowerCase();
    if (phone !== undefined) lead.phone = phone.trim();
    if (company !== undefined) lead.company = company.trim();
    if (source !== undefined) lead.source = source;
    if (status !== undefined) lead.status = status;
    if (priority !== undefined) lead.priority = priority;
    if (value !== undefined) lead.value = Number(value) || 0;
    if (notes !== undefined) lead.notes = notes.trim();
    if (assignedTo !== undefined) lead.assignedTo = assignedTo || null;

    const updatedLead = await lead.save();

    res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Update lead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update lead",
      error: error.message,
    });
  }
});

// =====================================================
// DELETE LEAD
// DELETE /api/leads/:id
// =====================================================
router.delete("/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    await Lead.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Delete lead error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete lead",
      error: error.message,
    });
  }
});

module.exports = router;