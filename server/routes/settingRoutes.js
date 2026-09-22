const express = require("express");
const router = express.Router();
const Setting = require("../models/Setting");

// GET /api/settings - Fetch current settings (auto-creates default singleton if empty)
router.get("/", async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.status(200).json(settings);
  } catch (error) {
    console.error("Fetch settings error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch settings", error: error.message });
  }
});

// PUT /api/settings - Update application settings
router.put("/", async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      currency,
      timezone,
      defaultTaxRate,
      invoiceNotes,
      lowStockThreshold,
      emailNotifications,
      orderAlerts,
      stockAlerts,
    } = req.body;

    if (firstName !== undefined) settings.firstName = firstName.trim();
    if (lastName !== undefined) settings.lastName = lastName.trim();
    if (email !== undefined) settings.email = email.trim();
    if (phone !== undefined) settings.phone = phone.trim();
    if (company !== undefined) settings.company = company.trim();
    if (currency !== undefined) settings.currency = currency.trim();
    if (timezone !== undefined) settings.timezone = timezone.trim();
    if (defaultTaxRate !== undefined) settings.defaultTaxRate = Number(defaultTaxRate) || 0;
    if (invoiceNotes !== undefined) settings.invoiceNotes = invoiceNotes.trim();
    if (lowStockThreshold !== undefined) settings.lowStockThreshold = Number(lowStockThreshold) || 5;
    if (emailNotifications !== undefined) settings.emailNotifications = Boolean(emailNotifications);
    if (orderAlerts !== undefined) settings.orderAlerts = Boolean(orderAlerts);
    if (stockAlerts !== undefined) settings.stockAlerts = Boolean(stockAlerts);

    const updated = await settings.save();
    res.status(200).json({ success: true, message: "Settings saved successfully", settings: updated });
  } catch (error) {
    console.error("Save settings error:", error);
    res.status(400).json({ success: false, message: "Failed to update settings", error: error.message });
  }
});

module.exports = router;
