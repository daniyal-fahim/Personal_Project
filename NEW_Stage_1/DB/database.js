const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("inventory.db", (err) => {
  if (err) {
    console.error("Error opening database", err);
  } else {
    db.run(
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quantity INTEGER DEFAULT 0
      )`
    );
    db.run(
      `CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        change INTEGER,
        action TEXT CHECK(action IN ('stock_in', 'sale', 'manual_removal')),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id)
      )`
    );
  }
});

module.exports = db;
