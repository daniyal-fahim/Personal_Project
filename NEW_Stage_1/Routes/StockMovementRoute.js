const express = require("express");
const router = express.Router();
const stockMovementController = require('../Controller/StockMovementController.js');

// Stock in product
router.post("/stock-in", stockMovementController.stockIn);

// Sell product
router.post("/sell", stockMovementController.sellProduct);

// Manually remove stock
router.post("/remove", stockMovementController.removeStock);

// Get stock movements
router.get("/stock-movement", stockMovementController.getStockMovements);

module.exports = router;
