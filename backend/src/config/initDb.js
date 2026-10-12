import { pool } from './db.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initPostgresDb() {
  try {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS quiz AUTHORIZATION quiz_admin;`);
    await pool.query(`SET search_path TO quiz, public;`);

    // 1. Create users table with role column in quiz schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz.users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        grade VARCHAR(50) DEFAULT 'Grade 12',
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'student',
        security_q1 TEXT,
        security_a1_hash TEXT,
        security_q2 TEXT,
        security_a2_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure role column exists if table existed previously in quiz schema
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema='quiz' AND table_name='users' AND column_name='role'
        ) THEN
          ALTER TABLE quiz.users ADD COLUMN role VARCHAR(20) DEFAULT 'student';
        END IF;
      END $$;
    `);

    // 2. Question category type enum
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_category_type') THEN
          CREATE TYPE question_category_type AS ENUM (
            'Aptitude', 
            'Verbal', 
            'Reasoning', 
            'Programming', 
            'Interview', 
            'PlacementPaper'
          );
        END IF;
      END $$;
    `);

    // 3. Placement tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz.questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category question_category_type NOT NULL,
        sub_category VARCHAR(100) NOT NULL,
        topic_tag VARCHAR(100) NOT NULL,
        question_text TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_option INT NOT NULL,
        explanation TEXT NOT NULL,
        is_daily_question BOOLEAN DEFAULT FALSE,
        daily_date DATE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quiz.placement_papers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name VARCHAR(150) NOT NULL,
        paper_title VARCHAR(255) NOT NULL,
        duration_minutes INT DEFAULT 60,
        total_marks INT DEFAULT 100,
        pass_marks INT DEFAULT 50,
        instructions TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quiz.placement_paper_questions (
        paper_id UUID REFERENCES quiz.placement_papers(id) ON DELETE CASCADE,
        question_id UUID REFERENCES quiz.questions(id) ON DELETE CASCADE,
        question_order INT NOT NULL,
        PRIMARY KEY (paper_id, question_id)
      );

      CREATE TABLE IF NOT EXISTS quiz.quiz_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INT REFERENCES quiz.users(id) ON DELETE CASCADE,
        test_type VARCHAR(50) NOT NULL,
        reference_id UUID NULL,
        category VARCHAR(100),
        score INT NOT NULL,
        total_questions INT NOT NULL,
        time_taken_seconds INT NOT NULL,
        weak_areas JSONB DEFAULT '[]'::jsonb,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create quiz_attempts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz.quiz_attempts (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES quiz.users(id) ON DELETE CASCADE,
        subject VARCHAR(50) NOT NULL,
        score INT NOT NULL,
        total_questions INT NOT NULL,
        time_taken_seconds INT NOT NULL,
        duration_minutes INT DEFAULT 10,
        weak_areas TEXT NOT NULL,
        answers JSONB NOT NULL,
        recommendations JSONB DEFAULT '[]',
        violations INT DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Seed default admin / teacher accounts
    const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', ['teacher@school.com']);
    if (adminCheck.rows.length === 0) {
      const hashedPass = await bcrypt.hash('teacher123', 10);
      await pool.query(`
        INSERT INTO users (full_name, email, grade, password_hash, role, security_q1, security_a1_hash, security_q2, security_a2_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        'Dr. Sarah Mitchell',
        'teacher@school.com',
        'Faculty / Admin',
        hashedPass,
        'admin',
        'What was the name of your first pet?',
        await bcrypt.hash('fluffy', 10),
        'What city were you born in?',
        await bcrypt.hash('boston', 10)
      ]);
      console.log('✅ Seeded admin account: teacher@school.com (role: admin, pass: teacher123)');
    } else {
      // Ensure admin role is set
      await pool.query("UPDATE users SET role = 'admin' WHERE email = $1", ['teacher@school.com']);
    }

    // Also seed admin@quiz.com
    const admin2Check = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@quiz.com']);
    if (admin2Check.rows.length === 0) {
      const hashedPass = await bcrypt.hash('admin123', 10);
      await pool.query(`
        INSERT INTO users (full_name, email, grade, password_hash, role, security_q1, security_a1_hash, security_q2, security_a2_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        'Admin Portal Master',
        'admin@quiz.com',
        'System Admin',
        hashedPass,
        'admin',
        'What was the name of your first pet?',
        await bcrypt.hash('spot', 10),
        'What city were you born in?',
        await bcrypt.hash('chicago', 10)
      ]);
      console.log('✅ Seeded admin account: admin@quiz.com (role: admin, pass: admin123)');
    } else {
      await pool.query("UPDATE users SET role = 'admin' WHERE email = $1", ['admin@quiz.com']);
    }

    // 5. Seed questions if table is empty
    const qCount = await pool.query('SELECT COUNT(*) FROM questions');
    if (parseInt(qCount.rows[0].count, 10) === 0) {
      const questionsFile = path.resolve(__dirname, '../../../js/questions.js');
      if (fs.existsSync(questionsFile)) {
        const fileContent = fs.readFileSync(questionsFile, 'utf8');
        // Extract quizData using a safe evaluation
        const match = fileContent.match(/const quizData\s*=\s*({[\s\S]*?});\s*(?:if\s*\(typeof module)/);
        if (match && match[1]) {
          try {
            const parsedData = Function('"use strict";return (' + match[1] + ')')();
            for (const [subjectKey, subjectObj] of Object.entries(parsedData)) {
              for (const q of subjectObj.questions) {
                await pool.query(`
                  INSERT INTO questions (subject, topic_tag, question_text, options, correct_option, explanation, difficulty)
                  VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
                `, [
                  subjectKey.toLowerCase(),
                  q.concept || 'General',
                  q.question,
                  JSON.stringify(q.options),
                  q.correctIndex,
                  q.explanation,
                  'intermediate'
                ]);
              }
            }
            console.log('✅ Initial questions loaded into PostgreSQL successfully.');
          } catch (e) {
            console.warn('Could not parse questions.js for pg seed:', e.message);
          }
        }
      }
    }

    console.log('✅ PostgreSQL Schema and Admin Roles verified successfully.');
  } catch (err) {
    console.error('❌ Error initializing PostgreSQL tables:', err);
  }
}
