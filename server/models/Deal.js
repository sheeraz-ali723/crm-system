const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    customer: {
      type: String,
      trim: true,
      default: "",
    },
    customerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    value: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    stage: {
      type: String,
      enum: [
        "New",
        "Qualified",
        "Proposal",
        "Negotiation",
        "Won",
        "Lost",
      ],
      default: "New",
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    expectedCloseDate: {
      type: Date,
      default: null,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Corrected from "Admin"
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Performance index for pipeline stages & revenue forecasting
dealSchema.index({ stage: 1, value: -1 });
dealSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Deal", dealSchema);