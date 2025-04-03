const productModel = require('../Models/ProductModel.js');
const stockMovementModel = require('../Models/StockMovementModel.js');

// Add a new product
const addProduct = (req, res) => {
  const { name, quantity } = req.body;
  if (!name) return res.status(400).json({ error: "Product name is required" });
  
  productModel.addProduct(name, quantity, (err, lastID) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: lastID, name, quantity: quantity || 0 });
  });
};

// Get all products
const getInventory = (req, res) => {
  productModel.getAllProducts((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

module.exports = { addProduct, getInventory };
