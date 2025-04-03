import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Use the connection string from environment variables or hardcoded URL
const POSTGRES = process.env.POSTGRES_URL ;

// Create a new pool with the connection string
const pool = new Pool({
  connectionString: POSTGRES,
});

// Initialize database tables
async function initializeDatabase() {
  try {
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
    `);
    console.log("Database tables created or already exist.");
  } catch (error) {
    console.error("Error initializing the database", error);
  }
}

initializeDatabase();

// Export the pool instance
export default pool;
