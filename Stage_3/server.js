import express from "express";
import pkg from 'pg';
const { Pool } = pkg;
import bodyParser from "body-parser";
import rateLimit from "express-rate-limit";
import basicAuth from "express-basic-auth";

const app = express();
const PORT = 5000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic Authentication Middleware
app.use(
  basicAuth({
    users: { admin: "password" },
    challenge: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Increased rate limit for scalability
});
app.use(limiter);

// PostgreSQL Read/Write Separation
const writePool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Stock_Management",
  password: "FAST",
  port: 5432,
});
const readPool = new Pool({
  user: "postgres",
  host: "localhost", // Same PostgreSQL instance for reading
  database: "Stock_Management",
  password: "FAST",
  port: 5432,
});

// Initialize Database Tables
(async () => {
  await writePool.query(`
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
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      store_id INTEGER REFERENCES stores(id),
      product_id INTEGER REFERENCES products(id),
      change INTEGER,
      action TEXT CHECK(action IN ('stock_in', 'sale', 'manual_removal')),
      reason TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
})();

// Add Store
app.post("/add-store", async (req, res) => {
  const { name } = req.body;
  try {
    const result = await writePool.query(
      "INSERT INTO stores (name) VALUES ($1) RETURNING id",
      [name]
    );
    res.status(201).json({ message: "Store added successfully", store_id: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add store" });
  }
});

// Add Product
app.post("/add-product", async (req, res) => {
  const { name } = req.body;
  try {
    const result = await writePool.query(
      "INSERT INTO products (name) VALUES ($1) RETURNING id",
      [name]
    );
    res.status(201).json({ message: "Product added successfully", product_id: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add product" });
  }
});

// Add stock (direct update without async queue)
app.post("/stock-in", async (req, res) => {
  const { store_id, product_id, quantity, reason } = req.body;

  // Update the inventory directly in PostgreSQL
  await writePool.query(
    "UPDATE store_inventory SET quantity = quantity + $1 WHERE store_id = $2 AND product_id = $3",
    [quantity, store_id, product_id]
  );
  
  // Insert stock movement record
  await writePool.query(
    "INSERT INTO stock_movements (store_id, product_id, change, action) VALUES ($1, $2, $3, $4)",
    [store_id, product_id, quantity, "stock_in"]
  );
  
  // Insert audit log
  await writePool.query(
    "INSERT INTO audit_logs (store_id, product_id, change, action, reason) VALUES ($1, $2, $3, $4, $5)",
    [store_id, product_id, quantity, "stock_in", reason]
  );
  
  res.json({ message: "Stock updated successfully" });
});

// Get inventory (without caching)
app.get("/inventory/:store_id", async (req, res) => {
  const { store_id } = req.params;
  const result = await readPool.query(
    "SELECT p.name, si.quantity FROM store_inventory si JOIN products p ON si.product_id = p.id WHERE si.store_id = $1",
    [store_id]
  );
  res.json(result.rows);
});

// Get stock movements with date range filter
app.get("/stock-movements/:store_id", async (req, res) => {
  const { store_id } = req.params;
  const { start_date, end_date } = req.query;
  const result = await readPool.query(
    "SELECT * FROM stock_movements WHERE store_id = $1 AND timestamp BETWEEN $2 AND $3",
    [store_id, start_date, end_date]
  );
  res.json(result.rows);
});

// Get audit logs
app.get("/audit-logs/:store_id", async (req, res) => {
  const { store_id } = req.params;
  const result = await readPool.query(
    "SELECT * FROM audit_logs WHERE store_id = $1 ORDER BY timestamp DESC",
    [store_id]
  );
  res.json(result.rows);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});