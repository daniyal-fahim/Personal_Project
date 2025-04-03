//STAGE # 2


import express from "express";
import pool from "./Postgres_Config.js";
// import pkg from 'pg';
//  const { Pool } = pkg;
import bodyParser from "body-parser";
import rateLimit from "express-rate-limit";
import basicAuth from "express-basic-auth";
const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

// Basic Authentication Middleware
//Basic Auth 
app.use(
  basicAuth({
    users: { admin: "password" },
    challenge: true,
  })
);

// Rate Limiting
//Request Throttling
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// PostgreSQL Database Connection


// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "Stock_Management",
//   password: "FAST",
//   port: 5050,
// });

// Initialize Database Tablesa
(
  async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS store_inventory (
      id SERIAL PRIMARY KEY,
      store_id INTEGER REFERENCES stores(id),
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER DEFAULT 0,
      UNIQUE (store_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS stock_movements (
      id SERIAL PRIMARY KEY,
      store_id INTEGER REFERENCES stores(id),
      product_id INTEGER REFERENCES products(id),
      change INTEGER,
      action TEXT CHECK(action IN ('stock_in', 'sale', 'manual_removal')),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `
);
})();

// Add a store
app.post("/stores", async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query("INSERT INTO stores (name) VALUES ($1) RETURNING *", [name]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new product
app.post("/products", async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query("INSERT INTO products (name) VALUES ($1) RETURNING *", [name]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stock in product
app.post("/stock-in", async (req, res) => {
  const { store_id, product_id, quantity } = req.body;
  try {
    await pool.query(
      "INSERT INTO store_inventory (store_id, product_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (store_id, product_id) DO UPDATE SET quantity = store_inventory.quantity + EXCLUDED.quantity",
      [store_id, product_id, quantity]
    );
    await pool.query(
      "INSERT INTO stock_movements (store_id, product_id, change, action) VALUES ($1, $2, $3, 'stock_in')",
      [store_id, product_id, quantity]
    );
    res.json({ message: "Stock added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sell product
app.post("/sell", async (req, res) => {
  const { store_id, product_id, quantity } = req.body;
  try {
    const { rows } = await pool.query("SELECT quantity FROM store_inventory WHERE store_id = $1 AND product_id = $2", [store_id, product_id]);
    if (!rows.length || rows[0].quantity < quantity) return res.status(400).json({ error: "Insufficient stock" });
    await pool.query("UPDATE store_inventory SET quantity = quantity - $1 WHERE store_id = $2 AND product_id = $3", [quantity, store_id, product_id]);
    await pool.query("INSERT INTO stock_movements (store_id, product_id, change, action) VALUES ($1, $2, $3, 'sale')", [store_id, product_id, -quantity]);
    res.json({ message: "Product sold successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Enable filtering/reporting by store, date range

// Get inventory by store_id
app.get("/inventory/:store_id", async (req, res) => {
  const { store_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT p.name, si.quantity FROM store_inventory si JOIN products p ON si.product_id = p.id WHERE si.store_id = $1",
      [store_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stock movements by store and date range
app.get("/stock-movements/:store_id", async (req, res) => {
  const { store_id } = req.params;
  const { start_date, end_date } = req.query;
  try {
    const result = await pool.query(
      "SELECT * FROM stock_movements WHERE store_id = $1 AND timestamp BETWEEN $2 AND $3",
      [store_id, start_date, end_date]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
