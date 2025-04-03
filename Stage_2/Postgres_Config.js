import pkg from "pg";
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();
// Use a relational DB (e.g., PostgreSQL)
const POSTGRES="postgres://neondb_owner:4rxCtSpBT8HI@ep-rough-night-a1sdqfsj-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

//Postgres Database present on NEON deployed database

const pool = new Pool({
  // connectionString: process.env.POSTGRES_URL,
  connectionString: POSTGRES,

});

export default pool;