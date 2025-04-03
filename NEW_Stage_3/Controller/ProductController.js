import { writePool } from "../Config/db.js";

const addProduct = async (req, res) => {
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
};

export { addProduct };
