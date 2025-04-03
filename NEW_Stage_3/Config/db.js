import pkg from 'pg';
const { Pool } = pkg;

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

// Function to ensure tables exist
(async () => {
  try {
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
    console.log('Tables created or ensured if they already exist');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
})();

export { writePool, readPool };
