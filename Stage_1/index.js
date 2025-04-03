//STAGE # 1 

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

app.use(bodyParser.json());                           //Handle json data
app.use(bodyParser.urlencoded({ extended: true }));  // Handle form-urlencoded 


// Initialize SQLite Database
const db = new sqlite3.Database("inventory.db", (err) => {
  if (err) {
    console.error("Error opening database", err);
  } else {
    db.run(

      `CREATE TABLE IF NOT EXISTS products (
        
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        
        name TEXT NOT NULL,
        
        quantity INTEGER DEFAULT 0

      )`

    );
    db.run(

      `CREATE TABLE IF NOT EXISTS stock_movements (

        id INTEGER PRIMARY KEY AUTOINCREMENT,
      
        product_id INTEGER,
      
        change INTEGER,
      
        action TEXT CHECK(action IN ('stock_in', 'sale', 'manual_removal')),
      
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      
        FOREIGN KEY(product_id) REFERENCES products(id)

      )`

    );
  }
});


// Add a new product
app.post("/products", (req, res) => {
  if (!req.body || !req.body.name) {
    return res.status(400).json({ error: "Product name is required" });
  }
  const { name, quantity } = req.body;
  db.run(
    "INSERT INTO products (name, quantity) VALUES (?, ?)",
    [name, quantity || 0],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, quantity: quantity || 0 });
    }
  );
});


// Stock in product
app.post("/stock-in", (req, res) => {
  const { product_id, quantity } = req.body;
  db.run("UPDATE products SET quantity = quantity + ? WHERE id = ?", [quantity, product_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.run(
      "INSERT INTO stock_movements (product_id, change, action) VALUES (?, ?, 'stock_in')",
      [product_id, quantity]
    );
    res.json({ message: "Stock added successfully" });
  });
});


// Sell product
app.post("/sell", (req, res) => {
  const { product_id, quantity } = req.body;
  db.get("SELECT quantity FROM products WHERE id = ?", [product_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row || row.quantity < quantity) return res.status(400).json({ error: "Insufficient stock" });
    db.run("UPDATE products SET quantity = quantity - ? WHERE id = ?", [quantity, product_id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      db.run(
        "INSERT INTO stock_movements (product_id, change, action) VALUES (?, ?, 'sale')",
        [product_id, -quantity]
      );
      res.json({ message: "Product sold successfully" });
    });
  });
});


// Manually remove stock
app.post("/remove", (req, res) => {
  const { product_id, quantity } = req.body;
  db.run("UPDATE products SET quantity = quantity - ? WHERE id = ?", [quantity, product_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.run(
      "INSERT INTO stock_movements (product_id, change, action) VALUES (?, ?, 'manual_removal')",
      [product_id, -quantity]
    );
    res.json({ message: "Stock removed manually" });
  });
});


// Get product inventory
app.get("/inventory", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get Stock Movement logs
app.get("/stock-movement", (req, res) => {
  db.all("SELECT * FROM stock_movements", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});



// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
