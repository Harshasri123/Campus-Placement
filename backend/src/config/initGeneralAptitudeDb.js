import { pool } from './db.js';

export async function initGeneralAptitudeDb() {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing Campus Placement & Competitive Exam Portal Database Schema...');

    await client.query(`CREATE SCHEMA IF NOT EXISTS quiz AUTHORIZATION quiz_admin;`);
    await client.query(`SET search_path TO quiz, public;`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 1. Users Table
    // Check if column email_or_mobile exists; if users table has email, add/migrate email_or_mobile
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name TEXT NOT NULL,
        email_or_mobile TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        failed_reset_attempts INT DEFAULT 0,
        lockout_until TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add email_or_mobile column if table existed previously with email
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'quiz' AND table_name = 'users' AND column_name = 'email_or_mobile'
        ) THEN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'quiz' AND table_name = 'users' AND column_name = 'email'
          ) THEN
            ALTER TABLE quiz.users ADD COLUMN email_or_mobile TEXT;
            UPDATE quiz.users SET email_or_mobile = email WHERE email_or_mobile IS NULL;
            ALTER TABLE quiz.users ALTER COLUMN email_or_mobile SET NOT NULL;
            ALTER TABLE quiz.users ADD CONSTRAINT users_email_or_mobile_unique UNIQUE (email_or_mobile);
          END IF;
        END IF;
      END $$;
    `);

    // 2. User Security Questions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz.user_security_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES quiz.users(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        answer_hash TEXT NOT NULL
      );
    `);

    // 3. Topics Table (Hierarchical sections: Arithmetic Aptitude, Data Interpretation, Verbal Ability)
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz.topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_name TEXT NOT NULL,
        topic_name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        total_questions_count INT DEFAULT 100,
        icon TEXT DEFAULT '📁',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Questions Table (Mapped to topics)
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz.questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic_id UUID REFERENCES quiz.topics(id) ON DELETE CASCADE,
        question_number INT NOT NULL,
        question_text TEXT NOT NULL,
        data_asset_url TEXT NULL,
        options JSONB NOT NULL,
        correct_option INT NOT NULL,
        explanation TEXT NOT NULL,
        is_frequently_asked BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure topic_id column exists if questions table was created under old schema
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'quiz' AND table_name = 'questions' AND column_name = 'topic_id'
        ) THEN
          ALTER TABLE quiz.questions ADD COLUMN topic_id UUID REFERENCES quiz.topics(id) ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'quiz' AND table_name = 'questions' AND column_name = 'question_number'
        ) THEN
          ALTER TABLE quiz.questions ADD COLUMN question_number INT DEFAULT 1;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'quiz' AND table_name = 'questions' AND column_name = 'data_asset_url'
        ) THEN
          ALTER TABLE quiz.questions ADD COLUMN data_asset_url TEXT NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'quiz' AND table_name = 'questions' AND column_name = 'is_frequently_asked'
        ) THEN
          ALTER TABLE quiz.questions ADD COLUMN is_frequently_asked BOOLEAN DEFAULT TRUE;
        END IF;

        -- Drop NOT NULL on legacy category/sub_category/topic_tag if present
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'quiz' AND table_name = 'questions' AND column_name = 'category' AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE quiz.questions ALTER COLUMN category DROP NOT NULL;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'quiz' AND table_name = 'questions' AND column_name = 'sub_category' AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE quiz.questions ALTER COLUMN sub_category DROP NOT NULL;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'quiz' AND table_name = 'questions' AND column_name = 'topic_tag' AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE quiz.questions ALTER COLUMN topic_tag DROP NOT NULL;
        END IF;
      END $$;
    `);

    // 5. User Bookmarks Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz.user_bookmarks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES quiz.users(id) ON DELETE CASCADE,
        question_id UUID REFERENCES quiz.questions(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_bookmark UNIQUE (user_id, question_id)
      );
    `);

    // 6. Practice Progress Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz.practice_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES quiz.users(id) ON DELETE CASCADE,
        topic_id UUID REFERENCES quiz.topics(id) ON DELETE CASCADE,
        completed_questions_count INT DEFAULT 0,
        last_attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_topic_progress UNIQUE (user_id, topic_id)
      );
    `);

    // 7. Quiz Attempts Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz.quiz_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES quiz.users(id) ON DELETE CASCADE,
        topic_id UUID REFERENCES quiz.topics(id) ON DELETE SET NULL,
        test_type VARCHAR(50) NOT NULL,
        score INT NOT NULL,
        total_questions INT NOT NULL,
        time_taken_seconds INT NOT NULL,
        tab_switch_count INT DEFAULT 0,
        fullscreen_exit_count INT DEFAULT 0,
        forced_auto_submit BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'COMPLETED_NORMALLY',
        integrity_report JSONB DEFAULT '{}'::jsonb,
        weak_areas JSONB DEFAULT '[]'::jsonb,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE quiz.quiz_attempts ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES quiz.topics(id) ON DELETE SET NULL;
      ALTER TABLE quiz.quiz_attempts ADD COLUMN IF NOT EXISTS tab_switch_count INT DEFAULT 0;
      ALTER TABLE quiz.quiz_attempts ADD COLUMN IF NOT EXISTS fullscreen_exit_count INT DEFAULT 0;
      ALTER TABLE quiz.quiz_attempts ADD COLUMN IF NOT EXISTS forced_auto_submit BOOLEAN DEFAULT FALSE;
      ALTER TABLE quiz.quiz_attempts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'COMPLETED_NORMALLY';
      ALTER TABLE quiz.quiz_attempts ADD COLUMN IF NOT EXISTS integrity_report JSONB DEFAULT '{}'::jsonb;
    `);

    // 8. Performance Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_topics_slug ON quiz.topics (slug);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_topics_section ON quiz.topics (section_name);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_questions_topic ON quiz.questions (topic_id, question_number);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON quiz.user_bookmarks (user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_progress_user ON quiz.practice_progress (user_id, topic_id);`);

    console.log('✅ PostgreSQL Schema initialized successfully with all required tables.');
  } catch (err) {
    console.error('❌ Database schema initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}
