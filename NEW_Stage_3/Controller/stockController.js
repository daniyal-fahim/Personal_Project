import { writePool, readPool } from "../Config/db.js";
import { redisClient } from "../Config/redis.js";
import { sendToQueue } from "../Services/rabbitmq.js";

// Stock In Functionality
const stockIn = async (req, res) => {
  const { store_id, product_id, quantity, reason } = req.body;

  // Save the update request to RabbitMQ for processing
  const stockUpdateMessage = JSON.stringify({ store_id, product_id, quantity, reason, action: "stock_in" });
  sendToQueue(stockUpdateMessage);

  res.json({ message: "Stock update queued successfully" });
};

// Sell Functionality
const sellProduct = async (req, res) => {
  const { store_id, product_id, quantity, reason } = req.body;

  try {
    // Check if sufficient stock is available
    const stockCheck = await readPool.query(
      "SELECT quantity FROM store_inventory WHERE store_id = $1 AND product_id = $2",
      [store_id, product_id]
    );

    if (stockCheck.rows.length === 0 || stockCheck.rows[0].quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // Save the sell request to RabbitMQ for processing
    const sellMessage = JSON.stringify({ store_id, product_id, quantity: -quantity, reason, action: "sale" });
    sendToQueue(sellMessage);

    res.json({ message: "Sale queued successfully" });
  } catch (err) {
    console.error("Error processing sale:", err);
    res.status(500).send("Server Error");
  }
};

// Process stock update and sale requests from RabbitMQ
const processStockUpdate = async (msg) => {
  const { store_id, product_id, quantity, reason, action } = JSON.parse(msg.content.toString());

  try {
    // Update the inventory directly in PostgreSQL
    await writePool.query(
      `INSERT INTO store_inventory (store_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (store_id, product_id) 
       DO UPDATE SET quantity = store_inventory.quantity + EXCLUDED.quantity`,
      [store_id, product_id, quantity]
    );

    // Insert stock movement record
    await writePool.query(
      "INSERT INTO stock_movements (store_id, product_id, change, action) VALUES ($1, $2, $3, $4)",
      [store_id, product_id, quantity, action]
    );

    // Insert audit log
    await writePool.query(
      "INSERT INTO audit_logs (store_id, product_id, change, action, reason) VALUES ($1, $2, $3, $4, $5)",
      [store_id, product_id, quantity, action, reason]
    );

    // Cache the updated inventory in Redis (optional for quick access)
    await redisClient.hSet(`store:${store_id}:inventory`, product_id, quantity);

    // Acknowledge the message after processing
    channel.ack(msg);
  } catch (err) {
    console.error("Error processing stock update:", err);
  }
};

// Get Inventory with Date Constraint
const getInventoryWithDate = async (req, res) => {
  const { store_id } = req.params;
  const { start_date, end_date } = req.body;

  try {
    const result = await readPool.query(
      `SELECT p.name, si.quantity, sm.timestamp 
       FROM store_inventory si 
       JOIN products p ON si.product_id = p.id 
       JOIN stock_movements sm ON si.product_id = sm.product_id AND si.store_id = sm.store_id
       WHERE si.store_id = $1 
       AND sm.timestamp BETWEEN $2 AND $3`,
      [store_id, start_date, end_date]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    res.status(500).send("Server Error");
  }
};


const getInventory = async (req, res) => {
  const { store_id } = req.params;

  try {
    // Check if the inventory data is cached in Redis
    const data = await redisClient.hGetAll(`store:${store_id}:inventory`);
    if (data && Object.keys(data).length > 0) {
      return res.json(data);
    } else {
      // If not cached, fetch from PostgreSQL
      const result = await readPool.query(
        "SELECT p.name, si.quantity FROM store_inventory si JOIN products p ON si.product_id = p.id WHERE si.store_id = $1",
        [store_id]
      );

      // Cache the result for future requests
      result.rows.forEach((row) => {
        redisClient.hSet(`store:${store_id}:inventory`, row.product_id, row.quantity);
      });

      res.json(result.rows);
    }
  } catch (err) {
    console.error('Error accessing Redis or PostgreSQL:', err);
    res.status(500).send('Server Error');
  }
};


export { stockIn, sellProduct, processStockUpdate, getInventoryWithDate,getInventory };
