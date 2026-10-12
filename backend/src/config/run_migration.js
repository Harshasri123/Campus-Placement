import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigration() {
  console.log('🚀 Running Campus Placement Database Migration...');
  const client = await pool.connect();
  try {
    // Set search_path
    await client.query(`SET search_path TO public, quiz;`);

    // 1. Run Schema Migration
    const migrationSqlPath = path.join(__dirname, 'migration_placement.sql');
    const migrationSql = fs.readFileSync(migrationSqlPath, 'utf8');
    await client.query(migrationSql);
    console.log('✅ Schema tables (questions, placement_papers, placement_paper_questions, quiz_attempts) successfully migrated.');

    // 2. Run Starter Questions Seed
    const seedSqlPath = path.join(__dirname, 'seed_starter_questions.sql');
    const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
    await client.query(seedSql);
    console.log('✅ Starter questions and company placement papers seeded.');

    // 3. Link questions to sample TCS NQT paper
    const paperRes = await client.query(`SELECT id FROM placement_papers WHERE company_name = 'TCS NQT' LIMIT 1;`);
    if (paperRes.rows.length > 0) {
      const paperId = paperRes.rows[0].id;
      const questionsRes = await client.query(`SELECT id FROM questions LIMIT 7;`);
      for (let i = 0; i < questionsRes.rows.length; i++) {
        await client.query(`
          INSERT INTO placement_paper_questions (paper_id, question_id, question_order)
          VALUES ($1, $2, $3)
          ON CONFLICT (paper_id, question_id) DO NOTHING;
        `, [paperId, questionsRes.rows[i].id, i + 1]);
      }
      console.log('✅ Sample questions mapped to TCS NQT Placement Paper.');
    }

    console.log('🎉 Database migration & initialization complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Execute directly if run via CLI: node backend/src/config/run_migration.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
