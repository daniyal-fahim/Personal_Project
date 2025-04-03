import pool from "../config/postgres_config.js";
// Stock in product
export const stockIn = async (req, res) => {
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
};

// Sell product
export const sellProduct = async (req, res) => {
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
};

//app.get("/stock-movements/:store_id", 
    
export const getInventorybystore=  async (req, res) => {
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
  }