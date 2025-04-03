import pool from "../config/postgres_config.js";
// Add a new product
export const addProduct = async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query("INSERT INTO products (name) VALUES ($1) RETURNING *", [name]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
