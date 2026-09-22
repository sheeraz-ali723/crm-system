const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    // Profile Details
    firstName: {
      type: String,
      trim: true,
      default: "Sheeraz",
    },
    lastName: {
      type: String,
      trim: true,
      default: "Ali",
    },
    email: {
      type: String,
      trim: true,
      default: "sh72342723@gmail.com",
    },
    phone: {
      type: String,
      trim: true,
      default: "03457154529",
    },
    // Organization / Company Preferences
    company: {
      type: String,
      trim: true,
      default: "Nexora Business",
    },
    currency: {
      type: String,
      trim: true,
      default: "PKR",
    },
    timezone: {
      type: String,
      trim: true,
      default: "Asia/Karachi",
    },
    // Operational & Billing Defaults
    defaultTaxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    invoiceNotes: {
      type: String,
      trim: true,
      default: "Thank you for your business!",
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    // Notification Switches
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    orderAlerts: {
      type: Boolean,
      default: true,
    },
    stockAlerts: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Setting", settingSchema);