import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runInterviewToHireMigration() {
  const sqlPath = path.resolve(__dirname, '../../schema_interview_to_hire.sql');
  console.log('🔄 Executing Interview-to-Hire PostgreSQL migration from:', sqlPath);

  if (!fs.existsSync(sqlPath)) {
    console.error('❌ SQL file not found at:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL. Applying 12-table schema...');
    await client.query(sql);
    console.log('🎉 Successfully executed Interview-to-Hire schema and seed data!');
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runInterviewToHireMigration();
