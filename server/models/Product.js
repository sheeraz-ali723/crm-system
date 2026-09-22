const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
      index: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      default: 0,
    },
    costPrice: {
      type: Number,
      min: [0, "Cost cannot be negative"],
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "In Stock",
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Auto-update status based on inventory levels before save
productSchema.pre("save", function () {
  if (this.stock <= 0) {
    this.status = "Out of Stock";
  } else if (this.stock <= 5) {
    this.status = "Low Stock";
  } else {
    this.status = "In Stock";
  }
});

productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);