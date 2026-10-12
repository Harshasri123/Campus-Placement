import { pool } from './db.js';

export async function migrateProctoring() {
  const client = await pool.connect();
  try {
    console.log('🔄 Applying proctoring & integrity migrations to quiz.quiz_attempts...');
    await client.query(`
      ALTER TABLE quiz.quiz_attempts ADD COLUMN IF NOT EXISTS tab_switch_count INT DEFAULT 0;
      ALTER TABLE quiz.quiz_attempts ADD COLUMN IF NOT EXISTS fullscreen_exit_count INT DEFAULT 0;
      ALTER TABLE quiz.quiz_attempts ADD COLUMN IF NOT EXISTS forced_auto_submit BOOLEAN DEFAULT FALSE;
      ALTER TABLE quiz.quiz_attempts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'COMPLETED_NORMALLY';
      ALTER TABLE quiz.quiz_attempts ADD COLUMN IF NOT EXISTS integrity_report JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('✅ Proctoring and integrity columns successfully verified in quiz.quiz_attempts.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Self-execute if run directly
if (process.argv[1]?.endsWith('migrateProctoring.js')) {
  migrateProctoring()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
