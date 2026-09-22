const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// GET /api/products - Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch products", error: error.message });
  }
});

// GET /api/products/:id - Single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching product", error: error.message });
  }
});

// POST /api/products - Create product
router.post("/", async (req, res) => {
  try {
    const { name, sku, category, price, costPrice, stock, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Product name is required" });
    }

    const product = new Product({
      name: name.trim(),
      sku: sku ? sku.trim() : "",
      category: category || "General",
      price: Number(price) || 0,
      costPrice: Number(costPrice) || 0,
      stock: Number(stock) || 0,
      description: description ? description.trim() : "",
    });

    const savedProduct = await product.save();
    res.status(201).json({ success: true, message: "Product created successfully", product: savedProduct });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(400).json({ success: false, message: "Failed to create product", error: error.message });
  }
});

// PUT /api/products/:id - Update product
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const updates = req.body;
    if (updates.name !== undefined) product.name = updates.name.trim();
    if (updates.sku !== undefined) product.sku = updates.sku.trim();
    if (updates.category !== undefined) product.category = updates.category;
    if (updates.price !== undefined) product.price = Number(updates.price) || 0;
    if (updates.costPrice !== undefined) product.costPrice = Number(updates.costPrice) || 0;
    if (updates.stock !== undefined) product.stock = Number(updates.stock) || 0;
    if (updates.description !== undefined) product.description = updates.description.trim();

    const updatedProduct = await product.save();
    res.status(200).json({ success: true, message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to update product", error: error.message });
  }
});

// DELETE /api/products/:id - Delete product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete product", error: error.message });
  }
});

module.exports = router;