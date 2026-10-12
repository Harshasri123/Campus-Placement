import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Automatically set search_path to support both quiz and public schemas
pool.on('connect', (client) => {
  client.query('SET search_path TO quiz, public;');
});


// Verify connection
pool.connect()
  .then((client) => {
    console.log('✅ Connected to PostgreSQL database (quiz_app_db) successfully!');
    client.release();
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err.message);
  });
