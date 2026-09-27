const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: true,
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
      default: null,
      index: true,
    },

    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },

    customerEmail: {
      type: String,
      trim: true,
      default: "",
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message:
          "Order must contain at least one item",
      },
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "Unpaid",
        "Paid",
        "Refunded",
      ],
      default: "Unpaid",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        "Cash",
        "Card",
        "Bank Transfer",
        "Online",
      ],
      default: "Cash",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({
  createdAt: -1,
  status: 1,
});

module.exports =
  mongoose.model(
    "Order",
    orderSchema
  );