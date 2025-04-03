const db = require('../DB/database.js');

// Add a new product
const addProduct = (name, quantity, callback) => {
  db.run("INSERT INTO products (name, quantity) VALUES (?, ?)", [name, quantity || 0], function (err) {
    callback(err, this.lastID);
  });
};

// Get all products
const getAllProducts = (callback) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    callback(err, rows);
  });
};

// Update product quantity
const updateProductQuantity = (productId, quantity, callback) => {
  db.run("UPDATE products SET quantity = quantity + ? WHERE id = ?", [quantity, productId], callback);
};

module.exports = { addProduct, getAllProducts, updateProductQuantity };
