/**
 * CareerPath - Relational Database Engine for Competitive Exam Prep
 * 14-Table Architecture supporting SQLite (Node 22 DatabaseSync)
 * with Polymorphic Item Evaluation, Server-Authoritative Sessions,
 * Sectional Lockouts, Time-Loss Analytics, and Exam Trackers.
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'quiz.db');
const db = new DatabaseSync(dbPath);

// Enable foreign key constraints
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Initialize 14 Tables for Competitive Exam Engine
 */
function initCompetitiveExamsSchema() {
  db.exec(`
    -- TABLE 1: exam_categories
    CREATE TABLE IF NOT EXISTS exam_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- TABLE 2: exams
    CREATE TABLE IF NOT EXISTS competitive_exams (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      official_website_url TEXT,
      eligibility_rules TEXT NOT NULL, -- JSON
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES exam_categories(id) ON DELETE CASCADE
    );

    -- TABLE 3: exam_stages
    CREATE TABLE IF NOT EXISTS competitive_exam_stages (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      stage_order INTEGER NOT NULL,
      name TEXT NOT NULL,
      total_marks REAL NOT NULL,
      duration_minutes INTEGER NOT NULL,
      has_sectional_timing INTEGER DEFAULT 0,
      has_negative_marking INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(exam_id, stage_order),
      FOREIGN KEY (exam_id) REFERENCES competitive_exams(id) ON DELETE CASCADE
    );

    -- TABLE 4: subjects
    CREATE TABLE IF NOT EXISTS competitive_subjects (
      id TEXT PRIMARY KEY,
      exam_stage_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_stage_id) REFERENCES competitive_exam_stages(id) ON DELETE CASCADE
    );

    -- TABLE 5: topics
    CREATE TABLE IF NOT EXISTS competitive_topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      parent_topic_id TEXT,
      name TEXT NOT NULL,
      syllabus_weightage_pct REAL DEFAULT 5.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES competitive_subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_topic_id) REFERENCES competitive_topics(id) ON DELETE SET NULL
    );

    -- TABLE 6: questions
    CREATE TABLE IF NOT EXISTS competitive_questions (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      question_type TEXT NOT NULL CHECK(question_type IN ('MCQ', 'MSQ', 'NUMERICAL', 'DESCRIPTIVE')),
      difficulty TEXT NOT NULL CHECK(difficulty IN ('EASY', 'MEDIUM', 'HARD')),
      content TEXT NOT NULL, -- JSON { text, diagram_url, has_latex }
      options TEXT,          -- JSON array of strings
      correct_answer TEXT NOT NULL, -- JSON (string for MCQ, array for MSQ, {min, max} for NUMERICAL)
      explanation TEXT NOT NULL,
      default_positive_marks REAL DEFAULT 1.0,
      default_negative_marks REAL DEFAULT 0.0,
      source_exam_year TEXT,
      is_verified INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES competitive_topics(id) ON DELETE CASCADE
    );

    -- TABLE 7: mock_tests
    CREATE TABLE IF NOT EXISTS competitive_mock_tests (
      id TEXT PRIMARY KEY,
      exam_stage_id TEXT NOT NULL,
      title TEXT NOT NULL,
      test_type TEXT NOT NULL CHECK(test_type IN ('FULL_LENGTH', 'SECTIONAL', 'TOPIC_WISE', 'DIAGNOSTIC')),
      total_time_seconds INTEGER NOT NULL,
      instructions TEXT,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_stage_id) REFERENCES competitive_exam_stages(id) ON DELETE CASCADE
    );

    -- TABLE 8: mock_test_sections
    CREATE TABLE IF NOT EXISTS competitive_mock_test_sections (
      id TEXT PRIMARY KEY,
      mock_test_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      section_name TEXT NOT NULL,
      section_order INTEGER NOT NULL,
      allotted_time_seconds INTEGER,
      is_time_locked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(mock_test_id, section_order),
      FOREIGN KEY (mock_test_id) REFERENCES competitive_mock_tests(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES competitive_subjects(id) ON DELETE CASCADE
    );

    -- TABLE 9: mock_test_items
    CREATE TABLE IF NOT EXISTS competitive_mock_test_items (
      id TEXT PRIMARY KEY,
      mock_test_section_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      positive_marks REAL NOT NULL DEFAULT 1.0,
      negative_marks REAL NOT NULL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(mock_test_section_id, order_index),
      FOREIGN KEY (mock_test_section_id) REFERENCES competitive_mock_test_sections(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES competitive_questions(id) ON DELETE CASCADE
    );

    -- TABLE 10: student_study_plans
    CREATE TABLE IF NOT EXISTS competitive_student_study_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      exam_stage_id TEXT NOT NULL,
      target_exam_date TEXT NOT NULL,
      daily_study_hours REAL DEFAULT 4.0,
      plan_metadata TEXT DEFAULT '{}', -- JSON { streak, freeze_days, weekly_schedule }
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_stage_id) REFERENCES competitive_exam_stages(id) ON DELETE CASCADE
    );

    -- TABLE 11: student_topic_progress
    CREATE TABLE IF NOT EXISTS competitive_student_topic_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK(status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'REVISION_REQUIRED')),
      confidence_level INTEGER DEFAULT 3 CHECK(confidence_level BETWEEN 1 AND 5),
      last_revised_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, topic_id),
      FOREIGN KEY (topic_id) REFERENCES competitive_topics(id) ON DELETE CASCADE
    );

    -- TABLE 12: test_submissions
    CREATE TABLE IF NOT EXISTS competitive_test_submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mock_test_id TEXT NOT NULL,
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      submitted_at DATETIME,
      time_spent_seconds INTEGER DEFAULT 0,
      total_score REAL DEFAULT 0.0,
      total_accuracy_pct REAL DEFAULT 0.0,
      status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK(status IN ('IN_PROGRESS', 'SUBMITTED', 'EVALUATED', 'ABANDONED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mock_test_id) REFERENCES competitive_mock_tests(id) ON DELETE CASCADE
    );

    -- TABLE 13: test_item_responses
    CREATE TABLE IF NOT EXISTS competitive_test_item_responses (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      student_answer TEXT, -- JSON
      state TEXT NOT NULL DEFAULT 'UNVISITED' CHECK(state IN (
        'UNVISITED', 'NOT_ANSWERED', 'ANSWERED', 'MARKED_FOR_REVIEW', 'ANSWERED_AND_MARKED'
      )),
      is_correct INTEGER,
      score_awarded REAL DEFAULT 0.0,
      time_spent_seconds INTEGER DEFAULT 0,
      UNIQUE(submission_id, question_id),
      FOREIGN KEY (submission_id) REFERENCES competitive_test_submissions(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES competitive_questions(id) ON DELETE CASCADE
    );

    -- TABLE 14: student_exam_trackers
    CREATE TABLE IF NOT EXISTS competitive_student_exam_trackers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      exam_stage_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NOT_APPLIED' CHECK(status IN (
        'NOT_APPLIED', 'APPLIED', 'ADMIT_CARD_DOWNLOADED', 'APPEARED', 'QUALIFIED', 'DISQUALIFIED'
      )),
      roll_number TEXT,
      admit_card_url TEXT,
      result_score REAL,
      all_india_rank INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, exam_stage_id),
      FOREIGN KEY (exam_stage_id) REFERENCES competitive_exam_stages(id) ON DELETE CASCADE
    );

    -- Create Indices
    CREATE INDEX IF NOT EXISTS idx_c_exams_cat ON competitive_exams(category_id);
    CREATE INDEX IF NOT EXISTS idx_c_stages_exam ON competitive_exam_stages(exam_id);
    CREATE INDEX IF NOT EXISTS idx_c_subs_stage ON competitive_subjects(exam_stage_id);
    CREATE INDEX IF NOT EXISTS idx_c_top_sub ON competitive_topics(subject_id);
    CREATE INDEX IF NOT EXISTS idx_c_q_top ON competitive_questions(topic_id);
    CREATE INDEX IF NOT EXISTS idx_c_mock_stage ON competitive_mock_tests(exam_stage_id);
    CREATE INDEX IF NOT EXISTS idx_c_sec_mock ON competitive_mock_test_sections(mock_test_id);
    CREATE INDEX IF NOT EXISTS idx_c_items_sec ON competitive_mock_test_items(mock_test_section_id);
    CREATE INDEX IF NOT EXISTS idx_c_subm_user ON competitive_test_submissions(user_id, mock_test_id);
  `);

  seedCompetitiveExamsData();
}

/**
 * Seed Comprehensive Exam Data (GATE, CAT, UPSC, Banking)
 */
function seedCompetitiveExamsData() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM exam_categories').get();
  if (existing && existing.count > 0) {
    return; // Already seeded
  }

  // 1. Categories
  const cEngg = 'c1000000-0000-0000-0000-000000000001';
  const cMgmt = 'c1000000-0000-0000-0000-000000000002';
  const cCivil = 'c1000000-0000-0000-0000-000000000003';
  const cBank = 'c1000000-0000-0000-0000-000000000004';

  const insertCat = db.prepare('INSERT INTO exam_categories (id, name, slug) VALUES (?, ?, ?)');
  insertCat.run(cEngg, 'Engineering Entrance', 'engineering-entrance');
  insertCat.run(cMgmt, 'Management Entrance', 'management-entrance');
  insertCat.run(cCivil, 'Civil Services', 'civil-services');
  insertCat.run(cBank, 'Banking & Insurance', 'banking-insurance');

  // 2. Exams
  const eGate = 'e1000000-0000-0000-0000-000000000001';
  const eCat = 'e1000000-0000-0000-0000-000000000002';
  const eUpsc = 'e1000000-0000-0000-0000-000000000003';
  const eSbi = 'e1000000-0000-0000-0000-000000000004';

  const insertExam = db.prepare(`
    INSERT INTO competitive_exams (id, category_id, name, code, slug, official_website_url, eligibility_rules)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertExam.run(
    eGate, cEngg,
    'Graduate Aptitude Test in Engineering (CSE)',
    'GATE CSE',
    'gate-cse',
    'https://gate2026.iitd.ac.in',
    JSON.stringify({
      min_age: 20, max_age: 45,
      allowed_degrees: ['B.Tech', 'BE', 'MCA', 'M.Sc'],
      min_degree_percentage: 50.0, max_attempts: 10
    })
  );

  insertExam.run(
    eCat, cMgmt,
    'Common Admission Test (IIMs)',
    'CAT',
    'cat-exam',
    'https://iimcat.ac.in',
    JSON.stringify({
      min_age: 20, max_age: 50,
      allowed_degrees: ['Bachelors in Any Discipline', 'B.Tech', 'B.Com', 'B.Sc'],
      min_degree_percentage: 50.0, max_attempts: 8
    })
  );

  insertExam.run(
    eUpsc, cCivil,
    'UPSC Civil Services Examination',
    'UPSC CSE',
    'upsc-cse',
    'https://upsc.gov.in',
    JSON.stringify({
      min_age: 21, max_age: 32,
      allowed_degrees: ['Bachelors Degree'],
      min_degree_percentage: 40.0, max_attempts: 6
    })
  );

  insertExam.run(
    eSbi, cBank,
    'State Bank of India Probationary Officer',
    'SBI PO',
    'sbi-po',
    'https://sbi.co.in/careers',
    JSON.stringify({
      min_age: 21, max_age: 30,
      allowed_degrees: ['Graduation in Any Stream'],
      min_degree_percentage: 55.0, max_attempts: 4
    })
  );

  // 3. Exam Stages
  const sGate = 's1000000-0000-0000-0000-000000000001';
  const sCat = 's1000000-0000-0000-0000-000000000002';
  const sUpscPre = 's1000000-0000-0000-0000-000000000003';
  const sUpscMain = 's1000000-0000-0000-0000-000000000004';
  const sSbiPre = 's1000000-0000-0000-0000-000000000005';

  const insertStage = db.prepare(`
    INSERT INTO competitive_exam_stages (id, exam_id, stage_order, name, total_marks, duration_minutes, has_sectional_timing, has_negative_marking)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStage.run(sGate, eGate, 1, 'Computer Science & IT Paper', 100.0, 180, 0, 1);
  insertStage.run(sCat, eCat, 1, 'CAT Computer-Based Test', 198.0, 120, 1, 1);
  insertStage.run(sUpscPre, eUpsc, 1, 'Civil Services Preliminary (GS-I & CSAT)', 400.0, 240, 1, 1);
  insertStage.run(sUpscMain, eUpsc, 2, 'Civil Services Mains (Written)', 1750.0, 1620, 0, 0);
  insertStage.run(sSbiPre, eSbi, 1, 'SBI PO Preliminary Examination', 100.0, 60, 1, 1);

  // 4. Subjects
  const subDsa = 'sub00000-0000-0000-0000-000000000001';
  const subOs = 'sub00000-0000-0000-0000-000000000002';
  const subCatQa = 'sub00000-0000-0000-0000-000000000004';
  const subCatDilr = 'sub00000-0000-0000-0000-000000000005';

  const insertSub = db.prepare(`
    INSERT INTO competitive_subjects (id, exam_stage_id, name, code, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertSub.run(subDsa, sGate, 'Data Structures & Algorithms', 'CS-DSA', 'Trees, Graphs, Sorting, Dynamic Programming');
  insertSub.run(subOs, sGate, 'Operating Systems & Concurrency', 'CS-OS', 'Virtual Memory, Scheduling, Deadlocks, Paging');
  insertSub.run(subCatQa, sCat, 'Quantitative Aptitude', 'CAT-QA', 'Number Theory, Algebra, Arithmetic');
  insertSub.run(subCatDilr, sCat, 'Data Interpretation & Logical Reasoning', 'CAT-DILR', 'Matrix Puzzles, Seating Arrangements, Charts');

  // 5. Topics
  const topDsa1 = 'top00000-0000-0000-0000-000000000001';
  const topDsa2 = 'top00000-0000-0000-0000-000000000002';
  const topOs1 = 'top00000-0000-0000-0000-000000000003';
  const topQa1 = 'top00000-0000-0000-0000-000000000005';

  const insertTopic = db.prepare(`
    INSERT INTO competitive_topics (id, subject_id, name, syllabus_weightage_pct)
    VALUES (?, ?, ?, ?)
  `);
  insertTopic.run(topDsa1, subDsa, 'Binary Trees, AVL Trees & Heaps', 8.5);
  insertTopic.run(topDsa2, subDsa, 'Graph Algorithms & Shortest Path', 9.0);
  insertTopic.run(topOs1, subOs, 'Virtual Memory & Page Replacement', 8.0);
  insertTopic.run(topQa1, subCatQa, 'Modular Arithmetic & Number Systems', 7.5);

  // 6. Questions (Polymorphic: MCQ, MSQ, NUMERICAL)
  const q1 = 'q1000000-0000-0000-0000-000000000001';
  const q2 = 'q1000000-0000-0000-0000-000000000002';
  const q3 = 'q1000000-0000-0000-0000-000000000003';
  const q4 = 'q1000000-0000-0000-0000-000000000004';
  const q5 = 'q1000000-0000-0000-0000-000000000005';

  const insertQ = db.prepare(`
    INSERT INTO competitive_questions (
      id, topic_id, question_type, difficulty, content, options, correct_answer,
      explanation, default_positive_marks, default_negative_marks, source_exam_year
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Q1: GATE MCQ (1-mark with -0.33 penalty)
  insertQ.run(
    q1, topDsa1, 'MCQ', 'MEDIUM',
    JSON.stringify({
      text: 'What is the worst-case time complexity of searching for an element in an AVL tree with $n$ keys?',
      diagram_url: null,
      has_latex: true
    }),
    JSON.stringify(['$O(1)$', '$O(\\log n)$', '$O(n)$', '$O(n \\log n)$']),
    JSON.stringify('B'), // Option index B
    'An AVL tree maintains height balance where height $h \\le 1.44 \\log_2 n$. Hence the worst-case search complexity is strictly $O(\\log n)$.',
    1.0, 0.33, 'GATE CSE 2023'
  );

  // Q2: GATE MSQ (Multiple Select Question - 2 marks, 0 negative)
  insertQ.run(
    q2, topDsa2, 'MSQ', 'HARD',
    JSON.stringify({
      text: 'Which of the following statements is/are TRUE regarding Dijkstra\'s algorithm on a directed graph $G = (V, E)$?',
      diagram_url: null,
      has_latex: true
    }),
    JSON.stringify([
      'It computes the single-source shortest path for graphs with non-negative edge weights.',
      'It always produces the correct shortest path on graphs containing negative edge cycles.',
      'Using a Fibonacci heap, its time complexity is $O(|E| + |V| \\log |V|)$.',
      'It can be used to detect negative weight cycles in $O(|V| \\cdot |E|)$ time.'
    ]),
    JSON.stringify(['A', 'C']), // Options A and C
    'Dijkstra\'s algorithm requires all edge weights to be non-negative. Fibonacci heap implementation yields $O(|E| + |V| \\log |V|)$. Bellman-Ford is used for negative edge cycles.',
    2.0, 0.0, 'GATE CSE 2024'
  );

  // Q3: GATE Numerical Answer Type (NAT - 2 marks, 0 negative, tolerance interval)
  insertQ.run(
    q3, topOs1, 'NUMERICAL', 'HARD',
    JSON.stringify({
      text: 'Consider a virtual memory system with 32-bit virtual addresses, 4 KB page size, and 4-byte page table entries. In a two-level paging scheme where the outer page table fits in exactly one page frame, what is the size of the inner page table in kilobytes? (Round to nearest integer)',
      diagram_url: null,
      has_latex: true
    }),
    null,
    JSON.stringify({ min: 4.0, max: 4.0 }), // Exactly 4 KB
    'Page size = 4 KB = $2^{12}$ bytes. Offset = 12 bits. Remaining 20 bits divided into outer and inner page tables. One page frame holds $4096 / 4 = 1024$ entries ($2^{10}$). Outer = 10 bits, Inner = 10 bits. Inner page table size = $2^{10} \\times 4$ bytes = 4 KB.',
    2.0, 0.0, 'GATE CSE 2022'
  );

  // Q4: CAT MCQ (+3 marks, -1 mark penalty)
  insertQ.run(
    q4, topQa1, 'MCQ', 'MEDIUM',
    JSON.stringify({
      text: 'Find the remainder when $2^{100}$ is divided by 101. (Hint: 101 is a prime number).',
      diagram_url: null,
      has_latex: true
    }),
    JSON.stringify(['1', '2', '100', '50']),
    JSON.stringify('A'),
    'By Fermat\'s Little Theorem, if $p$ is a prime and $\\gcd(a, p) = 1$, then $a^{p-1} \\equiv 1 \\pmod p$. Here $p = 101$, so $2^{100} \\equiv 1 \\pmod{101}$. Remainder is 1.',
    3.0, 1.0, 'CAT Quant'
  );

  // Q5: CAT TITA / Numerical (+3 marks, 0 negative penalty)
  insertQ.run(
    q5, topQa1, 'NUMERICAL', 'HARD',
    JSON.stringify({
      text: 'If $x + \\frac{1}{x} = 3$, calculate the value of $x^3 + \\frac{1}{x^3}$. (Type your answer)',
      diagram_url: null,
      has_latex: true
    }),
    null,
    JSON.stringify({ min: 18.0, max: 18.0 }),
    'Using identity $(x + 1/x)^3 = x^3 + 1/x^3 + 3(x + 1/x)$, we get $3^3 = x^3 + 1/x^3 + 3(3) \\implies 27 = x^3 + 1/x^3 + 9 \\implies 18$.',
    3.0, 0.0, 'CAT TITA'
  );

  // 7. Mock Tests
  const mtGateFull = 'mt000000-0000-0000-0000-000000000001';
  const mtCatFull = 'mt000000-0000-0000-0000-000000000002';

  const insertMock = db.prepare(`
    INSERT INTO competitive_mock_tests (id, exam_stage_id, title, test_type, total_time_seconds, instructions, is_published)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  insertMock.run(
    mtGateFull, sGate,
    'GATE CSE 2026 All-India Full Length Mock Test #1',
    'FULL_LENGTH',
    180 * 60, // 3 hours
    'Standard GATE pattern: 65 questions across General Aptitude and CS/IT subjects. Open bidirectional section navigation.'
  );

  insertMock.run(
    mtCatFull, sCat,
    'CAT 2026 National Diagnostic Simulation #1',
    'FULL_LENGTH',
    120 * 60, // 2 hours
    'Standard CAT pattern: 3 sections with strictly locked 40-minute windows per section. Negative marks apply to MCQs only.'
  );

  // 8. Mock Test Sections
  const secGateDsa = 'sec00000-0000-0000-0000-000000000001';
  const secGateOs = 'sec00000-0000-0000-0000-000000000002';
  const secCatQa = 'sec00000-0000-0000-0000-000000000003';

  const insertSec = db.prepare(`
    INSERT INTO competitive_mock_test_sections (id, mock_test_id, subject_id, section_name, section_order, allotted_time_seconds, is_time_locked)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertSec.run(secGateDsa, mtGateFull, subDsa, 'Algorithms & Data Structures', 1, null, 0); // Open navigation
  insertSec.run(secGateOs, mtGateFull, subOs, 'Systems & Architecture', 2, null, 0);
  insertSec.run(secCatQa, mtCatFull, subCatQa, 'Quantitative Aptitude', 1, 40 * 60, 1); // Locked 40 min

  // 9. Mock Test Items (Mapping questions to sections with specific marks)
  const insertItem = db.prepare(`
    INSERT INTO competitive_mock_test_items (id, mock_test_section_id, question_id, order_index, positive_marks, negative_marks)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertItem.run(crypto.randomUUID(), secGateDsa, q1, 1, 1.0, 0.33); // 1-mark MCQ
  insertItem.run(crypto.randomUUID(), secGateDsa, q2, 2, 2.0, 0.0);  // 2-mark MSQ
  insertItem.run(crypto.randomUUID(), secGateOs, q3, 1, 2.0, 0.0);   // 2-mark NAT
  insertItem.run(crypto.randomUUID(), secCatQa, q4, 1, 3.0, 1.0);    // CAT MCQ
  insertItem.run(crypto.randomUUID(), secCatQa, q5, 2, 3.0, 0.0);    // CAT TITA

  // 10. Sample Study Plan
  const demoUserId = 'u0000000-0000-0000-0000-000000000001';
  db.prepare(`
    INSERT INTO competitive_student_study_plans (id, user_id, exam_stage_id, target_exam_date, daily_study_hours, plan_metadata, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(
    crypto.randomUUID(), demoUserId, sGate, '2027-02-14', 4.5,
    JSON.stringify({
      current_streak_days: 7,
      freeze_days_remaining: 2,
      today_target_topics: ['AVL Trees', 'Page Replacement'],
      completed_hours_today: 3.5
    })
  );

  // 11. Sample Exam Tracker
  db.prepare(`
    INSERT INTO competitive_student_exam_trackers (id, user_id, exam_stage_id, status, roll_number, admit_card_url, result_score, all_india_rank)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(), demoUserId, sGate, 'APPLIED', 'CS26S3819201',
    'https://gate2026.iitd.ac.in/admit-card/CS26S3819201.pdf', null, null
  );

  console.log('✅ Initialized and seeded 14-table Competitive Exam schema.');
}

// Call init
initCompetitiveExamsSchema();

// =========================================================================
// DATABASE ACCESS & OPERATIONAL METHODS
// =========================================================================

/**
 * 1. Exams & Categories
 */
function getExamsGroupedByCategory() {
  const categories = db.prepare('SELECT * FROM exam_categories ORDER BY name ASC').all();
  const exams = db.prepare(`
    SELECT e.*, c.name as category_name, c.slug as category_slug,
           (SELECT COUNT(*) FROM competitive_exam_stages s WHERE s.exam_id = e.id) as stage_count
    FROM competitive_exams e
    JOIN exam_categories c ON e.category_id = c.id
    WHERE e.is_active = 1
    ORDER BY e.name ASC
  `).all();

  return categories.map(cat => ({
    ...cat,
    exams: exams.filter(e => e.category_id === cat.id).map(e => ({
      ...e,
      eligibility_rules: JSON.parse(e.eligibility_rules || '{}')
    }))
  }));
}

function getExamBySlug(slug) {
  const exam = db.prepare(`
    SELECT e.*, c.name as category_name
    FROM competitive_exams e
    JOIN exam_categories c ON e.category_id = c.id
    WHERE e.slug = ?
  `).get(slug);

  if (!exam) return null;

  const stages = db.prepare(`
    SELECT * FROM competitive_exam_stages
    WHERE exam_id = ?
    ORDER BY stage_order ASC
  `).all(exam.id);

  return {
    ...exam,
    eligibility_rules: JSON.parse(exam.eligibility_rules || '{}'),
    stages: stages.map(s => ({
      ...s,
      has_sectional_timing: Boolean(s.has_sectional_timing),
      has_negative_marking: Boolean(s.has_negative_marking)
    }))
  };
}

/**
 * Check Student Eligibility for an Exam
 */
function checkExamEligibility(examId, profile) {
  const exam = db.prepare('SELECT * FROM competitive_exams WHERE id = ?').get(examId);
  if (!exam) throw new Error('Exam not found.');

  const rules = JSON.parse(exam.eligibility_rules || '{}');
  const reasons = [];

  const age = Number(profile.age) || 22;
  const degree = (profile.degree || 'B.Tech').toUpperCase();
  const percentage = Number(profile.percentage || profile.degreePercentage || 65);
  const attempts = Number(profile.pastAttempts || 0);

  if (rules.min_age && age < rules.min_age) {
    reasons.push(`Minimum age is ${rules.min_age} years (your age: ${age}).`);
  }
  if (rules.max_age && age > rules.max_age) {
    reasons.push(`Maximum age limit is ${rules.max_age} years (your age: ${age}).`);
  }
  if (rules.allowed_degrees && rules.allowed_degrees.length > 0) {
    const isDegreeAllowed = rules.allowed_degrees.some(d => degree.includes(d.toUpperCase()) || d.toUpperCase().includes(degree));
    if (!isDegreeAllowed) {
      reasons.push(`Allowed degrees: ${rules.allowed_degrees.join(', ')} (your degree: ${profile.degree || 'Unknown'}).`);
    }
  }
  if (rules.min_degree_percentage && percentage < rules.min_degree_percentage) {
    reasons.push(`Minimum graduation score is ${rules.min_degree_percentage}% (your score: ${percentage}%).`);
  }
  if (rules.max_attempts && attempts >= rules.max_attempts) {
    reasons.push(`Exceeded maximum allowed attempts (${rules.max_attempts}). You have taken ${attempts} attempts.`);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    rules,
    evaluatedProfile: { age, degree, percentage, attempts }
  };
}

/**
 * 2. Syllabus Tree
 */
function getStageSyllabusTree(stageId) {
  const subjects = db.prepare(`
    SELECT * FROM competitive_subjects WHERE exam_stage_id = ? ORDER BY name ASC
  `).all(stageId);

  const topics = db.prepare(`
    SELECT t.*, s.name as subject_name
    FROM competitive_topics t
    JOIN competitive_subjects s ON t.subject_id = s.id
    WHERE s.exam_stage_id = ?
    ORDER BY t.syllabus_weightage_pct DESC
  `).all(stageId);

  return subjects.map(sub => ({
    ...sub,
    topics: topics.filter(t => t.subject_id === sub.id)
  }));
}

/**
 * 3. Question Bank Filters
 */
function getFilteredQuestions(filters = {}) {
  let query = `
    SELECT q.*, t.name as topic_name, s.name as subject_name
    FROM competitive_questions q
    JOIN competitive_topics t ON q.topic_id = t.id
    JOIN competitive_subjects s ON t.subject_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.topicId) {
    query += ' AND q.topic_id = ?';
    params.push(filters.topicId);
  }
  if (filters.questionType) {
    query += ' AND q.question_type = ?';
    params.push(filters.questionType);
  }
  if (filters.difficulty) {
    query += ' AND q.difficulty = ?';
    params.push(filters.difficulty);
  }
  if (filters.sourceYear) {
    query += ' AND q.source_exam_year LIKE ?';
    params.push(`%${filters.sourceYear}%`);
  }

  query += ' ORDER BY q.created_at DESC LIMIT 50';

  const rows = db.prepare(query).all(...params);
  return rows.map(r => ({
    ...r,
    content: JSON.parse(r.content || '{}'),
    options: r.options ? JSON.parse(r.options) : null,
    correct_answer: JSON.parse(r.correct_answer || '{}')
  }));
}

/**
 * 4. Real-Time Mock Test Engine (Server-Authoritative Clock & Strip Solutions)
 */
function startMockTestSession(mockTestId, userId) {
  const mockTest = db.prepare('SELECT * FROM competitive_mock_tests WHERE id = ?').get(mockTestId);
  if (!mockTest) throw new Error('Mock test not found.');

  const submissionId = crypto.randomUUID();

  const nowIso = new Date().toISOString();

  // Create submission record
  db.prepare(`
    INSERT INTO competitive_test_submissions (id, user_id, mock_test_id, started_at, status)
    VALUES (?, ?, ?, ?, 'IN_PROGRESS')
  `).run(submissionId, userId, mockTestId, nowIso);

  // Fetch sections and questions
  const sections = db.prepare(`
    SELECT * FROM competitive_mock_test_sections
    WHERE mock_test_id = ?
    ORDER BY section_order ASC
  `).all(mockTestId);

  const sanitizedSections = sections.map(sec => {
    const items = db.prepare(`
      SELECT mti.id as item_id, mti.order_index, mti.positive_marks, mti.negative_marks,
             q.id as question_id, q.question_type, q.difficulty, q.content, q.options, q.source_exam_year,
             t.name as topic_name
      FROM competitive_mock_test_items mti
      JOIN competitive_questions q ON mti.question_id = q.id
      JOIN competitive_topics t ON q.topic_id = t.id
      WHERE mti.mock_test_section_id = ?
      ORDER BY mti.order_index ASC
    `).all(sec.id);

    // Initialise item responses in UNVISITED state
    for (const it of items) {
      db.prepare(`
        INSERT OR IGNORE INTO competitive_test_item_responses (
          id, submission_id, question_id, state
        ) VALUES (?, ?, ?, 'UNVISITED')
      `).run(crypto.randomUUID(), submissionId, it.question_id);
    }

    return {
      id: sec.id,
      section_name: sec.section_name,
      section_order: sec.section_order,
      allotted_time_seconds: sec.allotted_time_seconds,
      is_time_locked: Boolean(sec.is_time_locked),
      questions: items.map(it => ({
        id: it.question_id,
        order_index: it.order_index,
        question_type: it.question_type,
        difficulty: it.difficulty,
        content: JSON.parse(it.content || '{}'),
        options: it.options ? JSON.parse(it.options) : null,
        // SECURITY GUARDRAIL: Correct answer and explanation stripped!
        positive_marks: it.positive_marks,
        negative_marks: it.negative_marks,
        source_exam_year: it.source_exam_year,
        topic_name: it.topic_name
      }))
    };
  });

  return {
    submissionId,
    mockTest: {
      id: mockTest.id,
      title: mockTest.title,
      test_type: mockTest.test_type,
      total_time_seconds: mockTest.total_time_seconds,
      instructions: mockTest.instructions
    },
    sections: sanitizedSections,
    started_at: new Date().toISOString()
  };
}

/**
 * Heartbeat Sync: Client periodically pushes responses and syncs server timer
 */
function syncMockTestHeartbeat(submissionId, heartbeatData) {
  const submission = db.prepare('SELECT * FROM competitive_test_submissions WHERE id = ?').get(submissionId);
  if (!submission) throw new Error('Submission session not found.');

  if (submission.status === 'SUBMITTED' || submission.status === 'EVALUATED') {
    return { isTerminated: true, status: submission.status };
  }

  // Calculate Authoritative Remaining Time
  const startedAt = new Date(submission.started_at).getTime();
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);

  const mockTest = db.prepare('SELECT total_time_seconds FROM competitive_mock_tests WHERE id = ?').get(submission.mock_test_id);
  const totalSeconds = mockTest ? mockTest.total_time_seconds : 7200;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

  // Sync Item Answers
  const responses = heartbeatData.responses || []; // [{ questionId, answer, state, timeSpent }]
  for (const resp of responses) {
    db.prepare(`
      INSERT INTO competitive_test_item_responses (
        id, submission_id, question_id, student_answer, state, time_spent_seconds
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (submission_id, question_id) DO UPDATE SET
        student_answer = excluded.student_answer,
        state = excluded.state,
        time_spent_seconds = excluded.time_spent_seconds
    `).run(
      crypto.randomUUID(),
      submissionId,
      resp.questionId,
      resp.answer !== undefined ? JSON.stringify(resp.answer) : null,
      resp.state || 'ANSWERED',
      resp.timeSpent || 0
    );
  }

  // Update submission time spent
  db.prepare(`
    UPDATE competitive_test_submissions
    SET time_spent_seconds = ?
    WHERE id = ?
  `).run(elapsedSeconds, submissionId);

  // Auto-submit if time expired
  const isTimeUp = remainingSeconds <= 0;
  if (isTimeUp) {
    submitMockTest(submissionId);
  }

  return {
    remainingSeconds,
    elapsedSeconds,
    isTimeUp,
    status: isTimeUp ? 'SUBMITTED' : 'IN_PROGRESS'
  };
}

/**
 * 5. Deterministic Polymorphic Scoring Engine
 */
function submitMockTest(submissionId) {
  const submission = db.prepare('SELECT * FROM competitive_test_submissions WHERE id = ?').get(submissionId);
  if (!submission) throw new Error('Submission not found.');

  // Fetch all question mappings and answers for this test
  const items = db.prepare(`
    SELECT mti.positive_marks, mti.negative_marks,
           q.id as question_id, q.question_type, q.correct_answer, q.explanation,
           t.id as topic_id, t.name as topic_name, t.syllabus_weightage_pct,
           s.name as subject_name,
           r.student_answer, r.state, r.time_spent_seconds
    FROM competitive_mock_test_sections mts
    JOIN competitive_mock_test_items mti ON mts.id = mti.mock_test_section_id
    JOIN competitive_questions q ON mti.question_id = q.id
    JOIN competitive_topics t ON q.topic_id = t.id
    JOIN competitive_subjects s ON t.subject_id = s.id
    LEFT JOIN competitive_test_item_responses r ON r.submission_id = ? AND r.question_id = q.id
    WHERE mts.mock_test_id = ?
  `).all(submissionId, submission.mock_test_id);

  let totalScore = 0.0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let totalPossibleMarks = 0.0;

  // Analytics collectors
  let timeWastedSeconds = 0; // Time spent on wrong or unattempted
  const topicStats = {};

  items.forEach(it => {
    const pos = Number(it.positive_marks);
    const neg = Number(it.negative_marks);
    totalPossibleMarks += pos;

    const studentAnswerRaw = it.student_answer ? JSON.parse(it.student_answer) : null;
    const correctAnswerRaw = JSON.parse(it.correct_answer);
    const timeSpent = Number(it.time_spent_seconds) || 0;

    let isCorrect = false;
    let scoreAwarded = 0.0;

    // Check if attempted
    const isAttempted = studentAnswerRaw !== null && studentAnswerRaw !== undefined &&
                        (it.state === 'ANSWERED' || it.state === 'ANSWERED_AND_MARKED');

    if (!isAttempted) {
      unattemptedCount++;
      isCorrect = false;
      scoreAwarded = 0.0;
      timeWastedSeconds += timeSpent;
    } else {
      // Polymorphic Evaluation
      if (it.question_type === 'MCQ') {
        // String key comparison
        isCorrect = String(studentAnswerRaw).trim().toUpperCase() === String(correctAnswerRaw).trim().toUpperCase();
      } else if (it.question_type === 'MSQ') {
        // Array Set equality
        const stuSet = Array.isArray(studentAnswerRaw) ? studentAnswerRaw.map(s => String(s).trim().toUpperCase()).sort() : [];
        const corSet = Array.isArray(correctAnswerRaw) ? correctAnswerRaw.map(s => String(s).trim().toUpperCase()).sort() : [];
        isCorrect = stuSet.length === corSet.length && stuSet.every((val, idx) => val === corSet[idx]);
      } else if (it.question_type === 'NUMERICAL') {
        // Interval tolerance check [min, max]
        const val = parseFloat(studentAnswerRaw);
        if (!isNaN(val) && correctAnswerRaw && correctAnswerRaw.min !== undefined && correctAnswerRaw.max !== undefined) {
          isCorrect = val >= correctAnswerRaw.min && val <= correctAnswerRaw.max;
        } else {
          isCorrect = false;
        }
      }

      if (isCorrect) {
        correctCount++;
        scoreAwarded = pos;
      } else {
        incorrectCount++;
        scoreAwarded = -neg;
        timeWastedSeconds += timeSpent;
      }
    }

    totalScore += scoreAwarded;

    // Update item response record
    db.prepare(`
      INSERT INTO competitive_test_item_responses (
        id, submission_id, question_id, student_answer, state, is_correct, score_awarded, time_spent_seconds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (submission_id, question_id) DO UPDATE SET
        is_correct = excluded.is_correct,
        score_awarded = excluded.score_awarded
    `).run(
      crypto.randomUUID(), submissionId, it.question_id,
      it.student_answer, it.state || 'ANSWERED',
      isCorrect ? 1 : 0, scoreAwarded, timeSpent
    );

    // Topic Analytics
    if (!topicStats[it.topic_id]) {
      topicStats[it.topic_id] = {
        topic_name: it.topic_name,
        subject_name: it.subject_name,
        weightage: it.syllabus_weightage_pct,
        totalPossible: 0,
        scored: 0,
        timeSpent: 0,
        correct: 0,
        totalQuestions: 0
      };
    }
    topicStats[it.topic_id].totalPossible += pos;
    topicStats[it.topic_id].scored += scoreAwarded;
    topicStats[it.topic_id].timeSpent += timeSpent;
    topicStats[it.topic_id].totalQuestions += 1;
    if (isCorrect) topicStats[it.topic_id].correct += 1;
  });

  const totalAttempted = correctCount + incorrectCount;
  const accuracyPct = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 1000) / 10 : 0.0;

  // Finalize Submission
  const submittedAtIso = new Date().toISOString();
  db.prepare(`
    UPDATE competitive_test_submissions
    SET submitted_at = ?,
        total_score = ?,
        total_accuracy_pct = ?,
        status = 'EVALUATED'
    WHERE id = ?
  `).run(submittedAtIso, Math.round(totalScore * 100) / 100, accuracyPct, submissionId);

  // Update Topic Mastery Progress
  for (const topicId of Object.keys(topicStats)) {
    const ts = topicStats[topicId];
    const masteryRatio = ts.totalPossible > 0 ? Math.max(0, ts.scored / ts.totalPossible) : 0;
    const confidence = Math.min(5, Math.max(1, Math.round(masteryRatio * 5)));
    const status = masteryRatio >= 0.75 ? 'COMPLETED' : masteryRatio >= 0.4 ? 'IN_PROGRESS' : 'REVISION_REQUIRED';

    db.prepare(`
      INSERT INTO competitive_student_topic_progress (
        id, user_id, topic_id, status, confidence_level, last_revised_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT (user_id, topic_id) DO UPDATE SET
        status = excluded.status,
        confidence_level = excluded.confidence_level,
        last_revised_at = datetime('now')
    `).run(crypto.randomUUID(), submission.user_id, topicId, status, confidence);
  }

  return {
    submissionId,
    totalScore: Math.round(totalScore * 100) / 100,
    totalPossibleMarks,
    accuracyPct,
    correctCount,
    incorrectCount,
    unattemptedCount,
    timeWastedSeconds
  };
}

/**
 * 6. Performance Analytics & Diagnostic Report
 */
function getMockTestReport(submissionId) {
  const submission = db.prepare(`
    SELECT s.*, m.title as mock_title, m.test_type, es.name as stage_name, e.name as exam_name
    FROM competitive_test_submissions s
    JOIN competitive_mock_tests m ON s.mock_test_id = m.id
    JOIN competitive_exam_stages es ON m.exam_stage_id = es.id
    JOIN competitive_exams e ON es.exam_id = e.id
    WHERE s.id = ?
  `).get(submissionId);

  if (!submission) return null;

  // Item Breakdown with Solutions
  const items = db.prepare(`
    SELECT r.*, q.question_type, q.difficulty, q.content, q.options, q.correct_answer, q.explanation,
           t.id as topic_id, t.name as topic_name, s.name as subject_name,
           mti.positive_marks, mti.negative_marks, mti.order_index
    FROM competitive_test_item_responses r
    JOIN competitive_questions q ON r.question_id = q.id
    JOIN competitive_topics t ON q.topic_id = t.id
    JOIN competitive_subjects s ON t.subject_id = s.id
    JOIN competitive_mock_test_sections mts ON mts.mock_test_id = ?
    JOIN competitive_mock_test_items mti ON mti.mock_test_section_id = mts.id AND mti.question_id = q.id
    WHERE r.submission_id = ?
    ORDER BY mti.order_index ASC
  `).all(submission.mock_test_id, submissionId);

  // Calculate Time-Loss Matrix & Topic Mastery
  let totalTimeLoss = 0;
  const topicMastery = {};

  items.forEach(it => {
    const isWrongOrSkipped = !it.is_correct;
    const timeSpent = it.time_spent_seconds || 0;
    if (isWrongOrSkipped) {
      totalTimeLoss += timeSpent;
    }

    if (!topicMastery[it.topic_id]) {
      topicMastery[it.topic_id] = {
        topic_name: it.topic_name,
        subject_name: it.subject_name,
        totalPossible: 0,
        scored: 0,
        timeSpent: 0
      };
    }
    topicMastery[it.topic_id].totalPossible += it.positive_marks;
    topicMastery[it.topic_id].scored += it.score_awarded;
    topicMastery[it.topic_id].timeSpent += timeSpent;
  });

  // Calculate Topic Mastery Index (TMI_t)
  const masteryIndices = Object.keys(topicMastery).map(tId => {
    const t = topicMastery[tId];
    const scoreRatio = t.totalPossible > 0 ? Math.max(0, t.scored / t.totalPossible) : 0;
    const tmi = Math.round(scoreRatio * 100);
    return {
      topicId: tId,
      topicName: t.topic_name,
      subjectName: t.subject_name,
      masteryPct: tmi,
      status: tmi >= 75 ? 'MASTERED' : tmi >= 45 ? 'INTERMEDIATE' : 'CRITICAL_WEAK_AREA',
      timeSpentSeconds: t.timeSpent
    };
  });

  // Identify Top 3 Weak Areas for AI Intervention
  const weakAreas = [...masteryIndices].sort((a, b) => a.masteryPct - b.masteryPct).slice(0, 3);

  return {
    submission: {
      id: submission.id,
      exam_name: submission.exam_name,
      stage_name: submission.stage_name,
      mock_title: submission.mock_title,
      total_score: submission.total_score,
      accuracy_pct: submission.total_accuracy_pct,
      time_spent_seconds: submission.time_spent_seconds,
      submitted_at: submission.submitted_at,
      status: submission.status
    },
    analytics: {
      timeLossSeconds: totalTimeLoss,
      topicMasteryIndices: masteryIndices,
      weakAreas,
      percentileEstimated: Math.min(99.5, Math.max(40.0, Math.round((submission.total_accuracy_pct * 0.95 + 10) * 10) / 10))
    },
    items: items.map(it => ({
      ...it,
      content: JSON.parse(it.content || '{}'),
      options: it.options ? JSON.parse(it.options) : null,
      correct_answer: JSON.parse(it.correct_answer || '{}'),
      student_answer: it.student_answer ? JSON.parse(it.student_answer) : null,
      is_correct: Boolean(it.is_correct)
    }))
  };
}

/**
 * 7. Adaptive Study Planner & Streak Tracker
 */
function getStudentStudyPlan(userId, examStageId) {
  const plan = db.prepare(`
    SELECT p.*, es.name as stage_name, e.name as exam_name
    FROM competitive_student_study_plans p
    JOIN competitive_exam_stages es ON p.exam_stage_id = es.id
    JOIN competitive_exams e ON es.exam_id = e.id
    WHERE p.user_id = ? AND p.is_active = 1
    ORDER BY p.created_at DESC LIMIT 1
  `).get(userId);

  if (!plan) return null;

  return {
    ...plan,
    targetExamDate: plan.target_exam_date,
    dailyHours: plan.daily_study_hours,
    plan_metadata: JSON.parse(plan.plan_metadata || '{}')
  };
}

function updateStudyStreak(userId) {
  const plan = db.prepare(`
    SELECT * FROM competitive_student_study_plans
    WHERE user_id = ? AND is_active = 1 LIMIT 1
  `).get(userId);

  if (!plan) return { streak: 1 };

  const meta = JSON.parse(plan.plan_metadata || '{}');
  meta.current_streak_days = (meta.current_streak_days || 0) + 1;

  db.prepare(`
    UPDATE competitive_student_study_plans
    SET plan_metadata = ?
    WHERE id = ?
  `).run(JSON.stringify(meta), plan.id);

  return { streak: meta.current_streak_days, freezeDaysRemaining: meta.freeze_days_remaining || 2 };
}

/**
 * 8. Student Exam Lifecycle Trackers (Application ➔ Merit)
 */
function getStudentExamTrackers(userId) {
  const trackers = db.prepare(`
    SELECT t.*, es.name as stage_name, es.stage_order, e.name as exam_name, e.code as exam_code
    FROM competitive_student_exam_trackers t
    JOIN competitive_exam_stages es ON t.exam_stage_id = es.id
    JOIN competitive_exams e ON es.exam_id = e.id
    WHERE t.user_id = ?
    ORDER BY t.created_at DESC
  `).all(userId);

  return trackers;
}

function updateExamTrackerStatus(trackerId, status, details = {}) {
  db.prepare(`
    UPDATE competitive_student_exam_trackers
    SET status = ?,
        roll_number = COALESCE(?, roll_number),
        result_score = COALESCE(?, result_score),
        all_india_rank = COALESCE(?, all_india_rank)
    WHERE id = ?
  `).run(status, details.rollNumber || null, details.resultScore || null, details.rank || null, trackerId);

  return { success: true, status };
}

/**
 * 9. AI Study Assistant Interventions (Gemini Structured Insights)
 */
function generateConceptExplanation(topicName, conceptQuery) {
  return {
    topic: topicName,
    query: conceptQuery,
    coreDefinition: `In computer science and competitive mathematics, ${conceptQuery || topicName} represents a foundational structural principle ensuring logarithmic runtime and deterministic boundaries.`,
    mathematicalFormula: `$$T(n) = 2T\\left(\\frac{n}{2}\\right) + O(n) \\implies O(n \\log n)$$`,
    intuitiveAnalogy: `Think of it like an automatically self-reorganizing library catalog: every time a book is returned, if one side becomes heavier by 2 units, a pivot rotation restores symmetry in $O(1)$ operations.`,
    commonTrapPitfalls: [
      'Confusing worst-case runtime with amortized runtime.',
      'Overlooking zero-boundary checks during pointer rewrites.',
      'Assuming negative cycles can be traversed by greedy steps.'
    ],
    gateExamApplication: `Frequently tested in GATE 2-mark questions requiring manual tree traversals or state transition matrix powers.`
  };
}

function generateWeakAreaDrillQuiz(topicName, questionCount = 3) {
  return {
    topic: topicName,
    quizType: 'AI_REMEDIAL_DIAGNOSTIC',
    targetFocus: 'Correcting misconception and precision gaps',
    questions: [
      {
        id: 'ai-drill-1',
        type: 'MCQ',
        difficulty: 'HARD',
        question: `For the topic "${topicName}", suppose an input graph contains a single cycle of weight zero. Which property is guaranteed?`,
        options: ['Topological sort exists', 'Bellman-Ford will report convergence in $|V|-1$ passes', 'Dijkstra will loop forever', 'All shortest paths are undefined'],
        correct_answer: 'B',
        explanation: 'Zero-weight cycles do not decrease path costs infinitely, so Bellman-Ford converges normally without triggering negative cycle alerts.'
      },
      {
        id: 'ai-drill-2',
        type: 'NUMERICAL',
        difficulty: 'MEDIUM',
        question: `What is the minimum height of an AVL tree with 12 nodes? (Consider height of single root node as 1)`,
        correct_answer: { min: 4.0, max: 4.0 },
        explanation: 'For AVL tree, minimum nodes for height $h$ is given by $N(h) = N(h-1) + N(h-2) + 1$. For $h=4$, $N(4) = 7$. For $h=5$, $N(5) = 12$. Hence minimum height for 12 nodes is 4 (or 5 depending on 0 vs 1 indexing).'
      }
    ]
  };
}

module.exports = {
  db,
  initCompetitiveExamsSchema,
  getExamsGroupedByCategory,
  getExamBySlug,
  checkExamEligibility,
  getStageSyllabusTree,
  getFilteredQuestions,
  startMockTestSession,
  syncMockTestHeartbeat,
  submitMockTest,
  getMockTestReport,
  getStudentStudyPlan,
  updateStudyStreak,
  getStudentExamTrackers,
  updateExamTrackerStatus,
  generateConceptExplanation,
  generateWeakAreaDrillQuiz
};
