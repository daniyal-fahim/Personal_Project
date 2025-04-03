const db = require('../DB/database.js');

// Add a new stock movement
const addStockMovement = (productId, quantity, action, callback) => {
  db.run(
    "INSERT INTO stock_movements (product_id, change, action) VALUES (?, ?, ?)",
    [productId, quantity, action],
    callback
  );
};

// Get all stock movements
const getAllStockMovements = (callback) => {
  db.all("SELECT * FROM stock_movements", [], (err, rows) => {
    callback(err, rows);
  });
};

module.exports = { addStockMovement, getAllStockMovements };
