import { writePool, readPool } from "../Config/db.js";
import { redisClient } from "../Config/redis.js";
import { sendToQueue } from "../Services/rabbitMQ.js";

const stockIn = async (req, res) => {
  const { store_id, product_id, quantity, reason } = req.body;

  // Save the update request to RabbitMQ for processing
  const stockUpdateMessage = JSON.stringify({ store_id, product_id, quantity, reason });
  sendToQueue(stockUpdateMessage);

  // Acknowledge the request immediately to avoid blocking the client
  res.json({ message: "Stock update queued successfully" });
};

const processStockUpdate = async (msg) => {
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
};

const getInventory = async (req, res) => {
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
};

export { stockIn, processStockUpdate, getInventory };
