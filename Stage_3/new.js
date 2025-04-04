//stage number 3

import express from "express";
import pkg from 'pg';
import bodyParser from "body-parser";
import rateLimit from "express-rate-limit";
import basicAuth from "express-basic-auth";
import redis from "redis";
import amqp from "amqplib";

const { Pool } = pkg;
const app = express();
const PORT = 5000;

// Redis Client Setup
const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379,
});
redisClient.on('error', (err) => console.log('Redis Client Error:', err));

// RabbitMQ Setup
let channel;
const initRabbitMQ = async () => {
  const connection = await amqp.connect('amqp://localhost');
  channel = await connection.createChannel();
  await channel.assertQueue('stock_updates', { durable: true });
};
initRabbitMQ();

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic Authentication Middleware
app.use(
  basicAuth({
    users: { admin: "password" },
    challenge: true,
  })
);

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Increased rate limit for scalability
});
app.use(limiter);

// PostgreSQL Connection Setup
const writePool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Stock_Management",
  password: "FAST",
  port: 5432,
});

const readPool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Stock_Management",
  password: "FAST",
  port: 5432,
});

// Initialize Database Tables (As before)
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

// Asynchronous Stock Update (via RabbitMQ)
app.post("/stock-in", async (req, res) => {
  const { store_id, product_id, quantity, reason } = req.body;

  // Save the update request to RabbitMQ for processing
  const stockUpdateMessage = JSON.stringify({ store_id, product_id, quantity, reason });
  channel.sendToQueue('stock_updates', Buffer.from(stockUpdateMessage), { persistent: true });

  // Acknowledge the request immediately to avoid blocking the client
  res.json({ message: "Stock update queued successfully" });
});

// Process Stock Update asynchronously (via RabbitMQ Consumer)
channel.consume('stock_updates', async (msg) => {
  const { store_id, product_id, quantity, reason } = JSON.parse(msg.content.toString());

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

  // Cache the updated inventory in Redis (optional for quick access)
  await redisClient.hset(`store:${store_id}:inventory`, product_id, quantity);

  // Acknowledge the message after processing
  channel.ack(msg);
});

// Get Inventory (with Redis Caching)
app.get("/inventory/:store_id", async (req, res) => {
  const { store_id } = req.params;
  // Check if the inventory data is cached in Redis
  redisClient.hgetall(`store:${store_id}:inventory`, async (err, data) => {
    if (data) {
      return res.json(data);
    } else {
      // If not cached, fetch from PostgreSQL
      const result = await readPool.query(
        "SELECT p.name, si.quantity FROM store_inventory si JOIN products p ON si.product_id = p.id WHERE si.store_id = $1",
        [store_id]
      );
      // Cache the result for future requests
      result.rows.forEach((row) => {
        redisClient.hset(`store:${store_id}:inventory`, row.product_id, row.quantity);
      });
      res.json(result.rows);
    }
  });
});

// Get Stock Movements
app.get("/stock-movements/:store_id", async (req, res) => {
  const { store_id } = req.params;
  const { start_date, end_date } = req.query;
  const result = await readPool.query(
    "SELECT * FROM stock_movements WHERE store_id = $1 AND timestamp BETWEEN $2 AND $3",
    [store_id, start_date, end_date]
  );
  res.json(result.rows);
});

// Get Audit Logs
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
