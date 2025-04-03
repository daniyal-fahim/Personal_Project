import pool from "../config/postgres_config.js";
// Get inventory by store_id
export const getInventory = async (req, res) => {
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
};
