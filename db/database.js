/**
 * Database Module for Online Quiz Application
 * Persistent relational SQLite storage utilizing Node 22 native DatabaseSync
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'quiz.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Initialize database schema
 */
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      grade TEXT NOT NULL DEFAULT 'Grade 12',
      role TEXT NOT NULL DEFAULT 'student',
      password_hash TEXT NOT NULL,
      security_q1 TEXT,
      security_a1_hash TEXT,
      security_q2 TEXT,
      security_a2_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      topic_tag TEXT NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_option INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'intermediate'
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      time_taken_seconds INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 10,
      weak_areas TEXT NOT NULL,
      answers TEXT NOT NULL,
      recommendations TEXT DEFAULT '[]',
      violations INTEGER DEFAULT 0,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
    CREATE INDEX IF NOT EXISTS idx_attempts_user ON quiz_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_subject ON quiz_attempts(subject);
  `);

  // Auto-migrate schema for existing databases if columns are missing
  const userCols = db.prepare("PRAGMA table_info(users)").all();
  const userColNames = new Set(userCols.map(c => c.name));
  if (!userColNames.has('role')) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student';");
  }
  if (!userColNames.has('security_q1')) {
    db.exec("ALTER TABLE users ADD COLUMN security_q1 TEXT;");
  }
  if (!userColNames.has('security_a1_hash')) {
    db.exec("ALTER TABLE users ADD COLUMN security_a1_hash TEXT;");
  }
  if (!userColNames.has('security_q2')) {
    db.exec("ALTER TABLE users ADD COLUMN security_q2 TEXT;");
  }
  if (!userColNames.has('security_a2_hash')) {
    db.exec("ALTER TABLE users ADD COLUMN security_a2_hash TEXT;");
  }

  // Attempts migration for violations & proctoring integrity
  const attemptCols = db.prepare("PRAGMA table_info(quiz_attempts)").all();
  const attemptColNames = new Set(attemptCols.map(c => c.name));
  if (!attemptColNames.has('violations')) {
    db.exec("ALTER TABLE quiz_attempts ADD COLUMN violations INTEGER DEFAULT 0;");
  }
  if (!attemptColNames.has('tab_switch_count')) {
    db.exec("ALTER TABLE quiz_attempts ADD COLUMN tab_switch_count INTEGER DEFAULT 0;");
  }
  if (!attemptColNames.has('fullscreen_exit_count')) {
    db.exec("ALTER TABLE quiz_attempts ADD COLUMN fullscreen_exit_count INTEGER DEFAULT 0;");
  }
  if (!attemptColNames.has('forced_auto_submit')) {
    db.exec("ALTER TABLE quiz_attempts ADD COLUMN forced_auto_submit INTEGER DEFAULT 0;");
  }
  if (!attemptColNames.has('status')) {
    db.exec("ALTER TABLE quiz_attempts ADD COLUMN status TEXT DEFAULT 'COMPLETED_NORMALLY';");
  }
  if (!attemptColNames.has('integrity_report')) {
    db.exec("ALTER TABLE quiz_attempts ADD COLUMN integrity_report TEXT DEFAULT '{}';");
  }

  // Bookmarks and Practice Progress tables for campus placement portal
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      question_id TEXT NOT NULL,
      topic_slug TEXT,
      topic_name TEXT,
      section_name TEXT,
      question_text TEXT,
      explanation TEXT,
      options TEXT,
      correct_option INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, question_id)
    );

    CREATE TABLE IF NOT EXISTS practice_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      topic_slug TEXT NOT NULL,
      completed_count INTEGER DEFAULT 0,
      last_attempted DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, topic_slug)
    );

    -- Company Placement Mock Test Arena Tables
    CREATE TABLE IF NOT EXISTS company_questions (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      exam_year INTEGER,
      section_name TEXT NOT NULL,
      topic_tag TEXT NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_option INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      difficulty TEXT DEFAULT 'Medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS company_mock_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      company_name TEXT NOT NULL,
      mock_number INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL,
      score INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submitted_at DATETIME,
      sectional_scores TEXT DEFAULT '[]',
      qualification_status TEXT DEFAULT 'IN_PROGRESS',
      integrity_report TEXT DEFAULT '{}',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_question_history (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      question_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      company_name TEXT NOT NULL,
      selected_option INTEGER,
      is_correct INTEGER,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, question_id, session_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES company_questions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_cq_company ON company_questions(company_name);
    CREATE INDEX IF NOT EXISTS idx_cq_section ON company_questions(company_name, section_name);
    CREATE INDEX IF NOT EXISTS idx_user_history ON student_question_history(user_id, question_id);
    CREATE INDEX IF NOT EXISTS idx_user_company_history ON student_question_history(user_id, company_name);
    CREATE INDEX IF NOT EXISTS idx_cms_user_company ON company_mock_sessions(user_id, company_name);

    -- Real-Time AI Placement Interview Sessions Table
    CREATE TABLE IF NOT EXISTS ai_interview_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      company_name TEXT NOT NULL,
      round_type TEXT NOT NULL,
      total_questions INTEGER DEFAULT 6,
      conversation_log TEXT NOT NULL,
      evaluation_report TEXT,
      status TEXT DEFAULT 'IN_PROGRESS',
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_ai_int_user ON ai_interview_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_int_company ON ai_interview_sessions(company_name);
  `);
}

/**
 * Seed initial questions and demo student accounts
 */
function seedInitialData() {
  // Check if questions already exist
  const qCountStmt = db.prepare('SELECT COUNT(*) as count FROM questions');
  const qCount = qCountStmt.get().count;

  if (qCount === 0) {
    console.log('[DB] Seeding questions into database...');
    // Load questions from js/questions.js
    const questionsFile = path.join(__dirname, '..', 'js', 'questions.js');
    if (fs.existsSync(questionsFile)) {
      const { quizData } = require(questionsFile);
      const insertQ = db.prepare(`
        INSERT INTO questions (subject, topic_tag, question_text, options, correct_option, explanation, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const [subjectKey, subjectObj] of Object.entries(quizData)) {
        for (const q of subjectObj.questions) {
          insertQ.run(
            subjectKey.toLowerCase(),
            q.concept || 'General',
            q.question,
            JSON.stringify(q.options),
            q.correctIndex,
            q.explanation,
            'intermediate'
          );
        }
      }
      console.log('[DB] Question bank successfully populated.');
    }
  }

  // Check if users already exist
  const uCountStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const uCount = uCountStmt.get().count;

  if (uCount === 0) {
    console.log('[DB] Seeding demo student accounts...');
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('student123', salt);

    const demoQ1 = 'What was the name of your first pet?';
    const demoQ2 = 'What city were you born in?';
    const rohanA1 = bcrypt.hashSync('fluffy', salt);
    const rohanA2 = bcrypt.hashSync('hyderabad', salt);
    const priyaA1 = bcrypt.hashSync('buddy', salt);
    const priyaA2 = bcrypt.hashSync('mumbai', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (full_name, email, grade, password_hash, security_q1, security_a1_hash, security_q2, security_a2_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('Rohan Sharma', 'rohan@student.edu', 'Grade 12 / Inter 2nd Year', defaultPasswordHash, demoQ1, rohanA1, demoQ2, rohanA2);
    insertUser.run('Priya Patel', 'priya@student.edu', 'Grade 11 / Inter 1st Year', defaultPasswordHash, demoQ1, priyaA1, demoQ2, priyaA2);

    // Seed sample attempts for Rohan
    const rohan = db.prepare('SELECT id FROM users WHERE email = ?').get('rohan@student.edu');
    if (rohan) {
      const insertAttempt = db.prepare(`
        INSERT INTO quiz_attempts (user_id, subject, score, total_questions, time_taken_seconds, duration_minutes, weak_areas, answers, recommendations, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 days'))
      `);

      const sampleWeak = JSON.stringify(['Calculus: Product Rule of Differentiation', 'Trigonometry: Double Angle Identities']);
      const sampleAnswers = JSON.stringify([
        { questionId: 1, chosen: 0, correct: 1, isCorrect: false, topic: 'Calculus: Product Rule of Differentiation' },
        { questionId: 2, chosen: 2, correct: 2, isCorrect: true, topic: 'Calculus: Standard Trigonometric Limits' },
        { questionId: 3, chosen: 0, correct: 0, isCorrect: true, topic: 'Vector Algebra: Scalar (Dot) Product' }
      ]);
      const sampleRecs = JSON.stringify([
        { topic: 'Calculus: Product Rule of Differentiation', advice: 'Review product rule d/dx [u·v] = u\'v + uv\'. Solve 5 practice problems on product differentiation.' },
        { topic: 'Trigonometry: Double Angle Identities', advice: 'Memorize sin(2θ) = 2sinθcosθ and cos(2θ) = 1 - 2sin²θ. Practice factoring double-angle equations.' }
      ]);

      insertAttempt.run(
        rohan.id,
        'mathematics',
        8,
        10,
        462,
        10,
        sampleWeak,
        sampleAnswers,
        sampleRecs
      );

      // Physics attempt
      const insertPhysicsAttempt = db.prepare(`
        INSERT INTO quiz_attempts (user_id, subject, score, total_questions, time_taken_seconds, duration_minutes, weak_areas, answers, recommendations, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-1 day'))
      `);
      insertPhysicsAttempt.run(
        rohan.id,
        'physics',
        7,
        10,
        510,
        10,
        JSON.stringify(['Electromagnetism: Capacitors and Dielectrics']),
        sampleAnswers,
        JSON.stringify([{ topic: 'Electromagnetism: Capacitors', advice: 'Recall C = ε₀A/d. Note inverse relationship with plate separation distance.' }])
      );
    }
    console.log('[DB] Demo students seeded.');
  } else {
    // Backfill demo students if security questions are null from prior runs
    const demoAccounts = db.prepare("SELECT id, email, security_q1 FROM users WHERE email IN ('rohan@student.edu', 'priya@student.edu')").all();
    for (const acc of demoAccounts) {
      if (!acc.security_q1) {
        const salt = bcrypt.genSaltSync(10);
        const demoQ1 = 'What was the name of your first pet?';
        const demoQ2 = 'What city were you born in?';
        const a1 = acc.email.startsWith('rohan') ? 'fluffy' : 'buddy';
        const a2 = acc.email.startsWith('rohan') ? 'hyderabad' : 'mumbai';
        const a1Hash = bcrypt.hashSync(a1, salt);
        const a2Hash = bcrypt.hashSync(a2, salt);

        db.prepare(`
          UPDATE users
          SET security_q1 = ?, security_a1_hash = ?, security_q2 = ?, security_a2_hash = ?
          WHERE id = ?
        `).run(demoQ1, a1Hash, demoQ2, a2Hash, acc.id);
        console.log(`[DB] Backfilled demo security questions for ${acc.email}`);
      }
    }
  }

  // Ensure admin / teacher accounts exist
  const salt = bcrypt.genSaltSync(10);
  const teacherCheck = db.prepare('SELECT id, role FROM users WHERE LOWER(email) = ?').get('teacher@school.com');
  if (!teacherCheck) {
    const adminPassHash = bcrypt.hashSync('teacher123', salt);
    const a1Hash = bcrypt.hashSync('fluffy', salt);
    const a2Hash = bcrypt.hashSync('boston', salt);
    const insertAdmin = db.prepare(`
      INSERT INTO users (full_name, email, grade, role, password_hash, security_q1, security_a1_hash, security_q2, security_a2_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAdmin.run('Dr. Sarah Mitchell', 'teacher@school.com', 'Faculty / Admin', 'admin', adminPassHash, 'What was the name of your first pet?', a1Hash, 'What city were you born in?', a2Hash);
    console.log('[DB] Admin teacher@school.com seeded.');
  } else if (teacherCheck.role !== 'admin') {
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(teacherCheck.id);
  }

  const adminCheck = db.prepare('SELECT id, role FROM users WHERE LOWER(email) = ?').get('admin@quiz.com');
  if (!adminCheck) {
    const adminPassHash = bcrypt.hashSync('admin123', salt);
    const a1Hash = bcrypt.hashSync('spot', salt);
    const a2Hash = bcrypt.hashSync('chicago', salt);
    const insertAdmin = db.prepare(`
      INSERT INTO users (full_name, email, grade, role, password_hash, security_q1, security_a1_hash, security_q2, security_a2_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAdmin.run('System Administrator', 'admin@quiz.com', 'System Admin', 'admin', adminPassHash, 'What was the name of your first pet?', a1Hash, 'What city were you born in?', a2Hash);
    console.log('[DB] Admin admin@quiz.com seeded.');
  } else if (adminCheck.role !== 'admin') {
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(adminCheck.id);
  }
}

// User Helpers
function normalizeAnswer(ans) {
  return String(ans || '').trim().toLowerCase();
}

function createUser(fullName, email, grade, password, securityQ1 = null, securityA1 = null, securityQ2 = null, securityA2 = null, role = 'student') {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const a1Hash = securityA1 ? bcrypt.hashSync(normalizeAnswer(securityA1), salt) : null;
  const a2Hash = securityA2 ? bcrypt.hashSync(normalizeAnswer(securityA2), salt) : null;

  const stmt = db.prepare(`
    INSERT INTO users (full_name, email, grade, role, password_hash, security_q1, security_a1_hash, security_q2, security_a2_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    fullName.trim(),
    email.trim().toLowerCase(),
    grade || 'Grade 12',
    role || 'student',
    passwordHash,
    securityQ1 ? securityQ1.trim() : null,
    a1Hash,
    securityQ2 ? securityQ2.trim() : null,
    a2Hash
  );
  return getUserById(result.lastInsertRowid);
}

function getUserByEmail(email) {
  const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?');
  return stmt.get(email.trim().toLowerCase());
}

function getUserById(id) {
  const stmt = db.prepare('SELECT id, full_name, email, grade, role, security_q1, security_q2, created_at FROM users WHERE id = ?');
  return stmt.get(id);
}

function getUserSecurityQuestions(email) {
  const stmt = db.prepare('SELECT id, email, security_q1, security_q2 FROM users WHERE LOWER(email) = ?');
  return stmt.get(email.trim().toLowerCase());
}

function getUserSecurityData(email) {
  const stmt = db.prepare('SELECT id, email, security_q1, security_a1_hash, security_q2, security_a2_hash FROM users WHERE LOWER(email) = ?');
  return stmt.get(email.trim().toLowerCase());
}

function verifyUserSecurityAnswers(userSecurityData, answer1, answer2) {
  if (!userSecurityData || !userSecurityData.security_a1_hash || !userSecurityData.security_a2_hash) {
    return false;
  }
  const normA1 = normalizeAnswer(answer1);
  const normA2 = normalizeAnswer(answer2);
  const a1Valid = bcrypt.compareSync(normA1, userSecurityData.security_a1_hash);
  const a2Valid = bcrypt.compareSync(normA2, userSecurityData.security_a2_hash);
  return a1Valid && a2Valid;
}

function updateUserPassword(userId, newPassword) {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(newPassword, salt);
  const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
  stmt.run(passwordHash, userId);
  return true;
}

// Questions Helpers
function getQuestionsBySubject(subject, limit = 10) {
  const stmt = db.prepare(`
    SELECT id, subject, topic_tag, question_text, options, correct_option, explanation, difficulty
    FROM questions
    WHERE LOWER(subject) = ?
    ORDER BY RANDOM()
    LIMIT ?
  `);
  const rows = stmt.all(subject.toLowerCase(), limit);
  return rows.map(r => ({
    ...r,
    options: JSON.parse(r.options)
  }));
}

function getQuestionById(id) {
  const stmt = db.prepare('SELECT * FROM questions WHERE id = ?');
  const r = stmt.get(id);
  if (!r) return null;
  return {
    ...r,
    options: JSON.parse(r.options)
  };
}

// Attempts Helpers
function saveQuizAttempt(userId, subject, score, totalQuestions, timeTakenSeconds, durationMinutes, weakAreas, answers, recommendations, violations = 0) {
  const stmt = db.prepare(`
    INSERT INTO quiz_attempts (user_id, subject, score, total_questions, time_taken_seconds, duration_minutes, weak_areas, answers, recommendations, violations)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const res = stmt.run(
    userId,
    subject.toLowerCase(),
    score,
    totalQuestions,
    timeTakenSeconds,
    durationMinutes,
    JSON.stringify(weakAreas || []),
    JSON.stringify(answers || []),
    JSON.stringify(recommendations || []),
    violations || 0
  );
  return getAttemptById(res.lastInsertRowid);
}

function saveProctoredAttempt({
  userId,
  subject = 'Proctored Timed Arena',
  score,
  totalQuestions,
  timeTakenSeconds,
  durationMinutes = 60,
  weakAreas = [],
  answers = [],
  recommendations = [],
  violations = 0,
  tabSwitchCount = 0,
  fullscreenExitCount = 0,
  forcedAutoSubmit = 0,
  status = 'COMPLETED_NORMALLY',
  integrityReport = {}
}) {
  const stmt = db.prepare(`
    INSERT INTO quiz_attempts (
      user_id, subject, score, total_questions, time_taken_seconds, duration_minutes,
      weak_areas, answers, recommendations, violations,
      tab_switch_count, fullscreen_exit_count, forced_auto_submit, status, integrity_report
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const res = stmt.run(
    userId || 1,
    subject,
    score,
    totalQuestions,
    timeTakenSeconds,
    durationMinutes,
    JSON.stringify(weakAreas || []),
    JSON.stringify(answers || []),
    JSON.stringify(recommendations || []),
    violations || 0,
    tabSwitchCount || 0,
    fullscreenExitCount || 0,
    forcedAutoSubmit ? 1 : 0,
    status || 'COMPLETED_NORMALLY',
    JSON.stringify(integrityReport || {})
  );
  return getAttemptById(res.lastInsertRowid);
}

function getUserAttempts(userId) {
  const stmt = db.prepare(`
    SELECT id, user_id, subject, score, total_questions, time_taken_seconds, duration_minutes, weak_areas, recommendations, violations, submitted_at
    FROM quiz_attempts
    WHERE user_id = ?
    ORDER BY submitted_at DESC
  `);
  const rows = stmt.all(userId);
  return rows.map(r => ({
    ...r,
    weak_areas: JSON.parse(r.weak_areas || '[]'),
    recommendations: JSON.parse(r.recommendations || '[]')
  }));
}

function getAttemptById(attemptId, userId = null) {
  let stmt;
  let r;
  if (userId) {
    stmt = db.prepare('SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?');
    r = stmt.get(attemptId, userId);
  } else {
    stmt = db.prepare('SELECT * FROM quiz_attempts WHERE id = ?');
    r = stmt.get(attemptId);
  }
  if (!r) return null;
  return {
    ...r,
    weak_areas: JSON.parse(r.weak_areas || '[]'),
    answers: JSON.parse(r.answers || '[]'),
    recommendations: JSON.parse(r.recommendations || '[]')
  };
}

function addQuestion({ subject, topicTag, questionText, options, correctOption, explanation, difficulty = 'intermediate' }) {
  const stmt = db.prepare(`
    INSERT INTO questions (subject, topic_tag, question_text, options, correct_option, explanation, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const res = stmt.run(
    subject.toLowerCase().trim(),
    topicTag.trim(),
    questionText.trim(),
    JSON.stringify(options),
    parseInt(correctOption, 10),
    explanation.trim(),
    difficulty
  );
  return getQuestionById(res.lastInsertRowid);
}

function getAllQuestions() {
  const stmt = db.prepare('SELECT id, subject, topic_tag, question_text, options, correct_option, explanation, difficulty FROM questions ORDER BY subject, topic_tag ASC');
  const rows = stmt.all();
  return rows.map(r => ({
    ...r,
    options: JSON.parse(r.options)
  }));
}

function getUserAnalytics(userId) {
  const attempts = getUserAttempts(userId);
  const totalAttempts = attempts.length;

  if (totalAttempts === 0) {
    return {
      totalAttempts: 0,
      averageScorePercent: 0,
      highestScore: 0,
      totalQuestionsAnswered: 0,
      totalTimeSeconds: 0,
      subjectBreakdown: {},
      allWeakAreas: []
    };
  }

  let totalScore = 0;
  let totalQuestions = 0;
  let totalTimeSeconds = 0;
  let highestScore = 0;
  const subjectStats = {};
  const weakAreaFrequency = {};

  for (const a of attempts) {
    totalScore += a.score;
    totalQuestions += a.total_questions;
    totalTimeSeconds += a.time_taken_seconds;
    if (a.score > highestScore) highestScore = a.score;

    if (!subjectStats[a.subject]) {
      subjectStats[a.subject] = { attempts: 0, totalScore: 0, totalQuestions: 0 };
    }
    subjectStats[a.subject].attempts += 1;
    subjectStats[a.subject].totalScore += a.score;
    subjectStats[a.subject].totalQuestions += a.total_questions;

    for (const w of a.weak_areas) {
      weakAreaFrequency[w] = (weakAreaFrequency[w] || 0) + 1;
    }
  }

  const averageScorePercent = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  return {
    totalAttempts,
    averageScorePercent,
    highestScore,
    totalQuestionsAnswered: totalQuestions,
    totalTimeSeconds,
    subjectBreakdown: subjectStats,
    frequentWeakAreas: Object.entries(weakAreaFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, count }))
  };
}

// =========================================================================
// BOOKMARKS & PRACTICE PROGRESS HELPERS
// =========================================================================

function getUserBookmarks(userId) {
  try {
    const stmt = db.prepare(`
      SELECT 
        id as bookmark_id,
        question_id,
        topic_slug,
        topic_name,
        section_name,
        question_text,
        explanation,
        options,
        correct_option,
        created_at as bookmarked_at
      FROM bookmarks
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(userId);
    return rows.map(r => ({
      ...r,
      options: typeof r.options === 'string' ? JSON.parse(r.options) : (r.options || [])
    }));
  } catch (err) {
    console.error('[DB] getUserBookmarks error:', err.message);
    return [];
  }
}

function getUserBookmarksCount(userId) {
  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ?');
    const res = stmt.get(userId);
    return res ? res.count : 0;
  } catch (err) {
    return 0;
  }
}

function toggleBookmark(userId, details) {
  const { questionId, topicSlug, topicName, sectionName, questionText, explanation, options, correctOption } = details;
  const qIdStr = String(questionId);
  const check = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND question_id = ?').get(userId, qIdStr);
  if (check) {
    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(check.id);
    return { bookmarked: false };
  } else {
    db.prepare(`
      INSERT INTO bookmarks (user_id, question_id, topic_slug, topic_name, section_name, question_text, explanation, options, correct_option)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      qIdStr,
      topicSlug || 'general',
      topicName || 'General',
      sectionName || 'General',
      questionText || '',
      explanation || '',
      JSON.stringify(options || []),
      correctOption || 0
    );
    return { bookmarked: true };
  }
}

function getUserProgress(userId) {
  try {
    const stmt = db.prepare('SELECT topic_slug, completed_count FROM practice_progress WHERE user_id = ?');
    const rows = stmt.all(userId);
    const map = {};
    rows.forEach(r => { map[r.topic_slug] = r.completed_count; });
    return map;
  } catch (err) {
    console.error('[DB] getUserProgress error:', err.message);
    return {};
  }
}

function updateUserProgress(userId, topicSlug, count) {
  try {
    const stmt = db.prepare(`
      INSERT INTO practice_progress (user_id, topic_slug, completed_count, last_attempted)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, topic_slug) DO UPDATE SET
        completed_count = MAX(practice_progress.completed_count, excluded.completed_count),
        last_attempted = CURRENT_TIMESTAMP
    `);
    stmt.run(userId, topicSlug, parseInt(count, 10) || 1);
    return true;
  } catch (err) {
    console.error('[DB] updateUserProgress error:', err.message);
    return false;
  }
}

// =========================================================================
// COMPANY PLACEMENT MOCK TEST ARENA - SQLITE PERSISTENCE & ANTI-REPETITION
// =========================================================================
const { COMPANY_BLUEPRINTS, COMPANY_PYQ_POOL } = require('../data/companyQuestionsBank');

function seedCompanyQuestions() {
  try {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM company_questions');
    const count = countStmt.get().count;
    if (count === 0 && COMPANY_PYQ_POOL && COMPANY_PYQ_POOL.length > 0) {
      console.log(`[DB] Seeding ${COMPANY_PYQ_POOL.length} authentic Company PYQ questions into SQLite...`);
      const insert = db.prepare(`
        INSERT INTO company_questions (id, company_name, exam_year, section_name, topic_tag, question_text, options, correct_option, explanation, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const q of COMPANY_PYQ_POOL) {
        insert.run(
          q.id,
          q.company_name,
          q.exam_year || 2024,
          q.section_name,
          q.topic_tag,
          q.question_text,
          typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
          q.correct_option,
          q.explanation,
          q.difficulty || 'Medium'
        );
      }
      console.log('[DB] Company PYQ seeding complete.');
    }
  } catch (err) {
    console.warn('[DB] seedCompanyQuestions notice:', err.message);
  }
}

function resolveOrCreateUserId(rawUserId) {
  if (!rawUserId) return null;
  // If already an integer ID
  const num = parseInt(rawUserId, 10);
  if (!isNaN(num) && String(num) === String(rawUserId)) {
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(num);
    if (existing) return existing.id;
  }

  // String identifier check
  const guestEmail = `${rawUserId}@guest.campus.edu`;
  const byEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(guestEmail);
  if (byEmail) return byEmail.id;

  try {
    const insert = db.prepare(`
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES (?, ?, ?, 'student')
    `);
    const res = insert.run(
      'Candidate (' + rawUserId + ')',
      guestEmail,
      'guest-auth-token'
    );
    return res.lastInsertRowid;
  } catch (err) {
    const fallback = db.prepare('SELECT id FROM users WHERE email = ?').get(guestEmail);
    return fallback ? fallback.id : null;
  }
}

function getCompanyCatalogStats(rawUserId) {
  const userId = resolveOrCreateUserId(rawUserId);
  const result = [];
  for (const [companyName, blueprint] of Object.entries(COMPANY_BLUEPRINTS)) {
    // Total questions in pool for this company
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM company_questions WHERE company_name = ?');
    const total = totalStmt.get(companyName).count;

    // Questions attempted by this user for this company
    let attempted = 0;
    if (userId) {
      const attStmt = db.prepare('SELECT COUNT(DISTINCT question_id) as count FROM student_question_history WHERE user_id = ? AND company_name = ?');
      attempted = attStmt.get(userId, companyName).count;
    }

    // Previous mock sessions completed
    let completedMocks = 0;
    let bestScore = null;
    let latestSession = null;
    if (userId) {
      const mockStmt = db.prepare(`
        SELECT mock_number, score, total_questions, qualification_status, submitted_at 
        FROM company_mock_sessions 
        WHERE user_id = ? AND company_name = ? AND is_completed = 1 
        ORDER BY submitted_at DESC
      `);
      const mocks = mockStmt.all(userId, companyName);
      completedMocks = mocks.length;
      if (mocks.length > 0) {
        latestSession = mocks[0];
        const highest = mocks.reduce((max, m) => {
          const pct = (m.score / (m.total_questions || 1)) * 100;
          return pct > max ? pct : max;
        }, 0);
        bestScore = Math.round(highest);
      }
    }

    const remaining = Math.max(0, total - attempted);

    const totalQs = (blueprint.sections || []).reduce((acc, s) => acc + s.quota, 0);

    result.push({
      companyName,
      code: blueprint.code,
      fullName: blueprint.fullName,
      tagline: blueprint.tagline,
      badge: blueprint.badge,
      badgeColor: blueprint.badgeColor,
      overallCutoffPct: blueprint.overallCutoffPct,
      durationMinutes: blueprint.durationMinutes,
      sections: blueprint.sections,
      totalQuestions: totalQs,
      totalPoolQuestions: total,
      totalPyqsInDb: total,
      userAttemptedCount: attempted,
      userAttemptedPyqs: attempted,
      remainingUnattemptedCount: remaining,
      remainingUnattempted: remaining,
      completedMocksCount: completedMocks,
      completedSessionsCount: completedMocks,
      bestScorePct: bestScore,
      averageScore: bestScore !== null ? bestScore : 0,
      latestSession,
      isExhausted: total > 0 && remaining < 5
    });
  }
  return result;
}

function generateCompanyMock(rawUserId, companyName) {
  const userId = resolveOrCreateUserId(rawUserId);
  const blueprint = COMPANY_BLUEPRINTS[companyName];
  if (!blueprint) {
    throw new Error(`Unknown company: ${companyName}`);
  }

  // Get count of completed mocks
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM company_mock_sessions WHERE user_id = ? AND company_name = ? AND is_completed = 1');
  const pastCount = userId ? countStmt.get(userId, companyName).count : 0;
  const mockNumber = pastCount + 1;

  // Check total unattempted questions for this company
  let unattemptedCount = 0;
  if (userId) {
    const unattStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM company_questions 
      WHERE company_name = ? 
        AND id NOT IN (SELECT question_id FROM student_question_history WHERE user_id = ?)
    `);
    unattemptedCount = unattStmt.get(companyName, userId).count;
  } else {
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM company_questions WHERE company_name = ?');
    unattemptedCount = totalStmt.get(companyName).count;
  }

  // If candidate has completed all unique PYQs or pool is exhausted:
  if (userId && unattemptedCount < 5) {
    return {
      exhausted: true,
      companyName,
      remainingCount: unattemptedCount,
      message: `You have completed all unique previous-year questions for ${companyName}! Would you like to reset your attempt history to practice again or take a reshuffled revision test?`
    };
  }

  const selectedQuestions = [];
  const sectionAllocations = [];

  for (const sec of blueprint.sections) {
    // 1. Fetch unattempted questions for this section
    let rows = [];
    if (userId) {
      const qStmt = db.prepare(`
        SELECT id, company_name, exam_year, section_name, topic_tag, question_text, options, difficulty 
        FROM company_questions 
        WHERE company_name = ? AND section_name = ? 
          AND id NOT IN (SELECT question_id FROM student_question_history WHERE user_id = ?)
        ORDER BY RANDOM()
        LIMIT ?
      `);
      rows = qStmt.all(companyName, sec.name, userId, sec.quota);
    } else {
      const qStmt = db.prepare(`
        SELECT id, company_name, exam_year, section_name, topic_tag, question_text, options, difficulty 
        FROM company_questions 
        WHERE company_name = ? AND section_name = ? 
        ORDER BY RANDOM()
        LIMIT ?
      `);
      rows = qStmt.all(companyName, sec.name, sec.quota);
    }

    // Fallback if this section has fewer unattempted questions than its quota:
    if (rows.length < sec.quota) {
      const needed = sec.quota - rows.length;
      const existingIds = rows.map(r => r.id);
      const placeholders = existingIds.length > 0 ? `AND id NOT IN (${existingIds.map(() => '?').join(',')})` : '';
      const fallbackStmt = db.prepare(`
        SELECT id, company_name, exam_year, section_name, topic_tag, question_text, options, difficulty 
        FROM company_questions 
        WHERE company_name = ? AND section_name = ? ${placeholders}
        ORDER BY RANDOM()
        LIMIT ?
      `);
      const fallbackParams = [companyName, sec.name, ...existingIds, needed];
      const fallbackRows = fallbackStmt.all(...fallbackParams);
      rows = rows.concat(fallbackRows);
    }

    sectionAllocations.push({
      sectionName: sec.name,
      cutoffPct: sec.cutoffPct,
      durationMin: sec.durationMin,
      quota: sec.quota,
      allocated: rows.length
    });

    selectedQuestions.push(...rows);
  }

  // Create mock session record
  const sessionId = 'cms-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
  if (userId) {
    const insertSession = db.prepare(`
      INSERT INTO company_mock_sessions (id, user_id, company_name, mock_number, total_questions, duration_minutes, is_completed)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);
    insertSession.run(sessionId, userId, companyName, mockNumber, selectedQuestions.length, blueprint.durationMinutes);
  }

  // Parse options for frontend consumption (without correct answer or explanation)
  const sanitized = selectedQuestions.map((q, idx) => ({
    id: q.id,
    questionNumber: idx + 1,
    company_name: q.company_name,
    exam_year: q.exam_year,
    section_name: q.section_name,
    topic_tag: q.topic_tag,
    question_text: q.question_text,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    difficulty: q.difficulty
  }));

  return {
    exhausted: false,
    sessionId,
    companyName,
    companyCode: blueprint.code,
    mockNumber,
    totalQuestions: sanitized.length,
    durationMinutes: blueprint.durationMinutes,
    overallCutoffPct: blueprint.overallCutoffPct,
    sections: blueprint.sections,
    sectionAllocations,
    questions: sanitized
  };
}

function submitCompanyMockSession({ userId: rawUserId, sessionId, companyName, userAnswers = {}, timeTakenSeconds = 0, strikes = 0, forcedAutoSubmit = false }) {
  const userId = resolveOrCreateUserId(rawUserId);
  const blueprint = COMPANY_BLUEPRINTS[companyName] || { overallCutoffPct: 65, sections: [] };

  // Fetch all answered question details from company_questions
  const questionIds = Object.keys(userAnswers);
  let questions = [];
  if (questionIds.length > 0) {
    const placeholders = questionIds.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT id, company_name, exam_year, section_name, topic_tag, question_text, options, correct_option, explanation, difficulty 
      FROM company_questions 
      WHERE id IN (${placeholders})
    `);
    questions = stmt.all(...questionIds);
  }

  let totalScore = 0;
  const sectionStats = {};
  const topicStats = {};
  const review = [];
  const historyInserts = [];

  for (const q of questions) {
    const userChoice = userAnswers[q.id];
    const isCorrect = userChoice !== undefined && userChoice !== null && userChoice === q.correct_option;
    if (isCorrect) totalScore++;

    // Section metrics
    const sec = q.section_name || 'General';
    if (!sectionStats[sec]) {
      const blueprintSec = (blueprint.sections || []).find(s => s.name === sec);
      sectionStats[sec] = {
        sectionName: sec,
        correct: 0,
        total: 0,
        cutoffPct: blueprintSec ? blueprintSec.cutoffPct : 60
      };
    }
    sectionStats[sec].total++;
    if (isCorrect) sectionStats[sec].correct++;

    // Topic metrics
    const top = q.topic_tag || 'General';
    if (!topicStats[top]) {
      topicStats[top] = { correct: 0, total: 0 };
    }
    topicStats[top].total++;
    if (isCorrect) topicStats[top].correct++;

    const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;

    review.push({
      questionId: q.id,
      section_name: q.section_name,
      topic_tag: q.topic_tag,
      exam_year: q.exam_year,
      question_text: q.question_text,
      options: opts,
      userSelected: userChoice,
      correctOption: q.correct_option,
      isCorrect,
      explanation: q.explanation
    });

    if (userId) {
      historyInserts.push({
        id: 'sqh-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        userId,
        questionId: q.id,
        sessionId: sessionId || 'cms-default',
        companyName,
        selectedOption: userChoice !== undefined ? userChoice : -1,
        isCorrect: isCorrect ? 1 : 0
      });
    }
  }

  // Insert into student_question_history
  if (userId && historyInserts.length > 0) {
    const insertHistory = db.prepare(`
      INSERT OR REPLACE INTO student_question_history (id, user_id, question_id, session_id, company_name, selected_option, is_correct)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const h of historyInserts) {
      insertHistory.run(h.id, h.userId, h.questionId, h.sessionId, h.companyName, h.selectedOption, h.isCorrect);
    }
  }

  const totalQuestions = questions.length || 1;
  const overallPercentage = Math.round((totalScore / totalQuestions) * 100);

  // Sectional Cut-off Diagnostics
  let allSectionsPassed = true;
  const sectionalBreakdown = [];
  for (const [secName, stat] of Object.entries(sectionStats)) {
    const pct = Math.round((stat.correct / (stat.total || 1)) * 100);
    const passed = pct >= stat.cutoffPct;
    if (!passed) allSectionsPassed = false;
    sectionalBreakdown.push({
      sectionName: secName,
      correct: stat.correct,
      total: stat.total,
      percentage: pct,
      cutoffPct: stat.cutoffPct,
      passedCutoff: passed
    });
  }

  // Weak topic diagnosis
  const weakTopics = [];
  for (const [topic, stat] of Object.entries(topicStats)) {
    const pct = Math.round((stat.correct / stat.total) * 100);
    if (pct < 60) {
      weakTopics.push({
        topic,
        score: `${stat.correct}/${stat.total}`,
        percentage: pct,
        advice: `Review core formulas and practice 20+ previous year questions on ${topic}.`
      });
    }
  }

  // Qualification status verdict
  let qualificationStatus = 'NOT_QUALIFIED';
  let verdictTitle = 'Needs Improvement to Clear Cut-off';
  let verdictMessage = `Your score of ${overallPercentage}% is below the estimated ${companyName} qualification threshold of ${blueprint.overallCutoffPct}%. Strengthen your accuracy in weak sections.`;

  if (forcedAutoSubmit && strikes >= 3) {
    qualificationStatus = 'DISQUALIFIED_CHEATING';
    verdictTitle = 'Disqualified (Proctoring Violation)';
    verdictMessage = 'Candidate disqualified due to 3 or more tab-switch or window blur infractions during proctoring lockdown.';
  } else if (overallPercentage >= blueprint.overallCutoffPct && allSectionsPassed) {
    qualificationStatus = 'QUALIFIED_INTERVIEW';
    verdictTitle = '🎉 Qualified for Interview Round!';
    verdictMessage = `Congratulations! You scored ${overallPercentage}%, comfortably clearing the ${blueprint.overallCutoffPct}% overall threshold and all sectional minimums for ${companyName}.`;
  } else if (overallPercentage >= blueprint.overallCutoffPct && !allSectionsPassed) {
    qualificationStatus = 'BORDERLINE_SECTIONAL_FAIL';
    verdictTitle = 'Borderline Result: Missed Sectional Cut-off';
    verdictMessage = `You cleared the overall mark (${overallPercentage}% >= ${blueprint.overallCutoffPct}%), but missed the required sectional threshold in one or more sections. Focus on balancing all sections.`;
  }

  // Update session in DB
  if (sessionId && userId) {
    const updateStmt = db.prepare(`
      UPDATE company_mock_sessions 
      SET score = ?, total_questions = ?, is_completed = 1, submitted_at = CURRENT_TIMESTAMP, 
          sectional_scores = ?, qualification_status = ?, integrity_report = ?
      WHERE id = ? AND user_id = ?
    `);
    updateStmt.run(
      totalScore,
      totalQuestions,
      JSON.stringify(sectionalBreakdown),
      qualificationStatus,
      JSON.stringify({ strikes, forcedAutoSubmit, timeTakenSeconds }),
      sessionId,
      userId
    );
  }

  return {
    sessionId,
    companyName,
    score: totalScore,
    totalQuestions,
    percentage: overallPercentage,
    overallCutoffPct: blueprint.overallCutoffPct,
    qualificationStatus,
    verdictTitle,
    verdictMessage,
    sectionalBreakdown,
    weakTopics,
    review
  };
}

function resetUserCompanyHistory(rawUserId, companyName) {
  const userId = resolveOrCreateUserId(rawUserId);
  if (!userId || !companyName) return false;
  const stmt = db.prepare('DELETE FROM student_question_history WHERE user_id = ? AND company_name = ?');
  stmt.run(userId, companyName);
  return true;
}

function getUserCompanyMockHistory(rawUserId) {
  const userId = resolveOrCreateUserId(rawUserId);
  if (!userId) return [];
  const stmt = db.prepare(`
    SELECT id, company_name, mock_number, total_questions, duration_minutes, score, 
           is_completed, started_at, submitted_at, sectional_scores, qualification_status 
    FROM company_mock_sessions 
    WHERE user_id = ? AND is_completed = 1 
    ORDER BY submitted_at DESC
  `);
  const rows = stmt.all(userId);
  return rows.map(r => ({
    ...r,
    sectional_scores: r.sectional_scores ? JSON.parse(r.sectional_scores) : []
  }));
}

function getCompanyMockSessionDetails(sessionId, userId) {
  const stmt = db.prepare(`
    SELECT * FROM company_mock_sessions WHERE id = ? ${userId ? 'AND user_id = ?' : ''}
  `);
  const row = userId ? stmt.get(sessionId, userId) : stmt.get(sessionId);
  if (!row) return null;
  return {
    ...row,
    sectional_scores: row.sectional_scores ? JSON.parse(row.sectional_scores) : [],
    integrity_report: row.integrity_report ? JSON.parse(row.integrity_report) : {}
  };
}

/**
 * AI Placement Interview Assistant DB Operations
 */
function getCandidateWeakAreasForInterview(rawUserId, companyName) {
  const userId = resolveOrCreateUserId(rawUserId);
  const weakSet = new Set();

  if (userId) {
    try {
      // 1. Check recent quiz_attempts weak areas
      const attempts = db.prepare(`
        SELECT weak_areas, subject FROM quiz_attempts
        WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 5
      `).all(userId);

      attempts.forEach(att => {
        try {
          const parsed = JSON.parse(att.weak_areas);
          if (Array.isArray(parsed)) {
            parsed.forEach(w => {
              if (typeof w === 'string') weakSet.add(w);
              else if (w && typeof w === 'object' && w.topic) weakSet.add(w.topic);
            });
          } else if (typeof parsed === 'string') {
            weakSet.add(parsed);
          }
        } catch (_) {
          if (typeof att.weak_areas === 'string') {
            att.weak_areas.split(',').map(s => s.trim()).filter(Boolean).forEach(w => weakSet.add(w));
          }
        }
      });

      // 2. Check student_question_history failed topics
      const failedTopics = db.prepare(`
        SELECT cq.topic_tag, COUNT(*) as fail_count
        FROM student_question_history sqh
        JOIN company_questions cq ON sqh.question_id = cq.id
        WHERE sqh.user_id = ? AND sqh.is_correct = 0
        GROUP BY cq.topic_tag
        ORDER BY fail_count DESC LIMIT 5
      `).all(userId);

      failedTopics.forEach(ft => {
        if (ft.topic_tag) weakSet.add(ft.topic_tag);
      });
    } catch (err) {
      console.warn('[AI INTERVIEW] Error retrieving candidate historical weak areas:', err.message);
    }
  }

  // 3. Fallback / supplementary company focus areas if user has few attempts
  const companyDefaults = {
    'TCS NQT': ['Operating Systems & Concurrency', 'Database Normalization', 'HashMaps & Collision Handling', 'OOP Principles & Interfaces', 'Deadlock Avoidance'],
    'Infosys': ['Java Memory Management & GC', 'Clustered vs Non-Clustered Indexes', 'Dijkstra & Graph Traversal', 'SOLID Software Architecture', 'Microservices'],
    'Cognizant': ['TCP 3-Way Handshake & Networking', 'SQL Transaction Isolation Levels', 'Floyd Cycle Detection', 'CORS & Web Security', 'QuickSort Partitioning'],
    'Wipro': ['Dynamic Memory Allocation & Leaks', 'Mutex vs Counting Semaphore', 'Agile Scrum & CI/CD', 'Recursion & Stack Frames', 'SQL Window Functions (DENSE_RANK)'],
    'Accenture': ['Cloud Models (IaaS, PaaS, SaaS)', 'RESTful API Standards & Idempotence', 'JWT Authentication & Security', 'Docker Containers vs VMs', 'SQL Injection Mitigation']
  };

  const defaults = companyDefaults[companyName] || ['Data Structures & Algorithms', 'DBMS & SQL', 'Operating Systems', 'Object-Oriented Programming'];
  defaults.forEach(d => {
    if (weakSet.size < 6) weakSet.add(d);
  });

  return Array.from(weakSet);
}

function saveInterviewSession({ sessionId, userId: rawUserId, companyName, roundType, totalQuestions = 6, conversationLog = [], evaluationReport = null, status = 'IN_PROGRESS' }) {
  const userId = resolveOrCreateUserId(rawUserId);
  const logStr = typeof conversationLog === 'string' ? conversationLog : JSON.stringify(conversationLog);
  const evalStr = evaluationReport ? (typeof evaluationReport === 'string' ? evaluationReport : JSON.stringify(evaluationReport)) : null;

  const stmt = db.prepare(`
    INSERT INTO ai_interview_sessions (id, user_id, company_name, round_type, total_questions, conversation_log, evaluation_report, status, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      conversation_log = excluded.conversation_log,
      evaluation_report = excluded.evaluation_report,
      status = excluded.status,
      completed_at = CURRENT_TIMESTAMP
  `);

  stmt.run(sessionId, userId, companyName, roundType, totalQuestions, logStr, evalStr, status);

  return getInterviewSessionDetails(sessionId);
}

function getInterviewHistory(rawUserId) {
  const userId = resolveOrCreateUserId(rawUserId);
  let rows;
  if (userId) {
    rows = db.prepare(`
      SELECT * FROM ai_interview_sessions
      WHERE user_id = ?
      ORDER BY completed_at DESC
    `).all(userId);
  } else {
    rows = db.prepare(`
      SELECT * FROM ai_interview_sessions
      ORDER BY completed_at DESC LIMIT 20
    `).all();
  }

  return rows.map(r => ({
    ...r,
    conversation_log: r.conversation_log ? JSON.parse(r.conversation_log) : [],
    evaluation_report: r.evaluation_report ? JSON.parse(r.evaluation_report) : null
  }));
}

function getInterviewSessionDetails(sessionId) {
  const row = db.prepare('SELECT * FROM ai_interview_sessions WHERE id = ?').get(sessionId);
  if (!row) return null;
  return {
    ...row,
    conversation_log: row.conversation_log ? JSON.parse(row.conversation_log) : [],
    evaluation_report: row.evaluation_report ? JSON.parse(row.evaluation_report) : null
  };
}

// Initialize on module load
initSchema();
seedInitialData();
seedCompanyQuestions();

module.exports = {
  db,
  createUser,
  getUserByEmail,
  getUserById,
  getUserSecurityQuestions,
  getUserSecurityData,
  verifyUserSecurityAnswers,
  updateUserPassword,
  getQuestionsBySubject,
  getQuestionById,
  addQuestion,
  getAllQuestions,
  saveQuizAttempt,
  saveProctoredAttempt,
  getUserAttempts,
  getAttemptById,
  getUserAnalytics,
  getUserBookmarks,
  getUserBookmarksCount,
  toggleBookmark,
  getUserProgress,
  updateUserProgress,
  // Company Mock Arena Exports
  getCompanyCatalogStats,
  generateCompanyMock,
  submitCompanyMockSession,
  resetUserCompanyHistory,
  getUserCompanyMockHistory,
  getCompanyMockSessionDetails,
  // AI Interview Assistant Exports
  getCandidateWeakAreasForInterview,
  saveInterviewSession,
  getInterviewHistory,
  getInterviewSessionDetails
};


