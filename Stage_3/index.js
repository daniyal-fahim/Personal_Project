
import express from "express";
import pkg from 'pg';
const { Pool } = pkg;
import bodyParser from "body-parser";
import rateLimit from "express-rate-limit";
import basicAuth from "express-basic-auth";
import amqp from "amqplib";
import Redis from "ioredis";


const app = express();
const PORT = 5000;
app.use(bodyParser.json());

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
  password: "password",
  port: 5050,
});
const readPool = new Pool({
  user: "postgres",
  host: "replica-db", // Read replica database
  database: "Stock_Management",
  password: "password",
  port: 5050,
});

// Redis Cache
const redis = new Redis();

// RabbitMQ for Async Processing
let channel;
async function setupRabbitMQ() {
  const connection = await amqp.connect("amqp://localhost");
  channel = await connection.createChannel();
  await channel.assertQueue("stock_updates");
}
setupRabbitMQ();

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

// Async Stock Update Processor
async function processStockUpdates() {
  if (!channel) return;
  channel.consume("stock_updates", async (msg) => {
    const { store_id, product_id, quantity, action, reason } = JSON.parse(msg.content.toString());
    await writePool.query(
      "UPDATE store_inventory SET quantity = quantity + $1 WHERE store_id = $2 AND product_id = $3",
      [quantity, store_id, product_id]
    );
    await writePool.query(
      "INSERT INTO stock_movements (store_id, product_id, change, action) VALUES ($1, $2, $3, $4)",
      [store_id, product_id, quantity, action]
    );
    await writePool.query(
      "INSERT INTO audit_logs (store_id, product_id, change, action, reason) VALUES ($1, $2, $3, $4, $5)",
      [store_id, product_id, quantity, action, reason]
    );
    redis.del(`inventory:${store_id}`); // Invalidate cache
    channel.ack(msg);
  });
}
processStockUpdates();

// Add stock (async processing)
app.post("/stock-in", async (req, res) => {
  const { store_id, product_id, quantity, reason } = req.body;
  channel.sendToQueue("stock_updates", Buffer.from(JSON.stringify({ store_id, product_id, quantity, action: "stock_in", reason })));
  res.json({ message: "Stock update queued successfully" });
});

// Get inventory (with caching)
app.get("/inventory/:store_id", async (req, res) => {
  const { store_id } = req.params;
  const cachedData = await redis.get(`inventory:${store_id}`);
  if (cachedData) return res.json(JSON.parse(cachedData));
  
  const result = await readPool.query(
    "SELECT p.name, si.quantity FROM store_inventory si JOIN products p ON si.product_id = p.id WHERE si.store_id = $1",
    [store_id]
  );
  await redis.setex(`inventory:${store_id}`, 300, JSON.stringify(result.rows));
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
