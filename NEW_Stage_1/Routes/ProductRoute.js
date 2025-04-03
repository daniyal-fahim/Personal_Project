const express = require("express");
const router = express.Router();
const productController = require('../Controller/ProductController.js');

// Add a new product
router.post("/products", productController.addProduct);

// Get all products
router.get("/inventory", productController.getInventory);

module.exports = router;
