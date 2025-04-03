import pkg from "pg";
const { Pool } = pkg;
// import dotenv from 'dotenv';

// dotenv.config();

const POSTGRES_URL="postgres://neondb_owner:4rxCtSpBT8HI@ep-rough-night-a1sdqfsj-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

const pool = new Pool({
  //connectionString: process.env.POSTGRES_URL,
  connectionString: POSTGRES_URL,

});

export default pool;