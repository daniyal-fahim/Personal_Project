const productModel = require('../Models/ProductModel.js');
const stockMovementModel = require('../Models/StockMovementModel.js');

// Stock in product
const stockIn = (req, res) => {
  const { product_id, quantity } = req.body;
  productModel.updateProductQuantity(product_id, quantity, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    stockMovementModel.addStockMovement(product_id, quantity, 'stock_in', (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Stock added successfully" });
    });
  });
};

// Sell product
const sellProduct = (req, res) => {
  const { product_id, quantity } = req.body;
  productModel.updateProductQuantity(product_id, -quantity, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    stockMovementModel.addStockMovement(product_id, -quantity, 'sale', (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Product sold successfully" });
    });
  });
};

// Remove product stock manually
const removeStock = (req, res) => {
  const { product_id, quantity } = req.body;
  productModel.updateProductQuantity(product_id, -quantity, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    stockMovementModel.addStockMovement(product_id, -quantity, 'manual_removal', (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Stock removed manually" });
    });
  });
};

// Get stock movement logs
const getStockMovements = (req, res) => {
  stockMovementModel.getAllStockMovements((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

module.exports = { stockIn, sellProduct, removeStock, getStockMovements };
