import { Pool } from 'pg';

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

export { writePool, readPool };
