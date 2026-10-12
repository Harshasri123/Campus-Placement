-- =========================================================================
-- CareerPath Competitive Exam Preparation & Workflow - PostgreSQL Relational Schema
-- Enterprise 14-Table Architecture for Multi-Stage National Exams
-- (GATE, CAT, UPSC, Banking) with Polymorphic Item Evaluation,
-- Sectional Time Lockouts, Topic Mastery Indices, and Lifecycle Tracking.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS exams_core;
SET search_path TO exams_core, public;

-- =========================================================================
-- 1. ENUM TYPES
-- =========================================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type_enum') THEN
        CREATE TYPE question_type_enum AS ENUM ('MCQ', 'MSQ', 'NUMERICAL', 'DESCRIPTIVE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_difficulty_enum') THEN
        CREATE TYPE question_difficulty_enum AS ENUM ('EASY', 'MEDIUM', 'HARD');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_type_enum') THEN
        CREATE TYPE test_type_enum AS ENUM ('FULL_LENGTH', 'SECTIONAL', 'TOPIC_WISE', 'DIAGNOSTIC');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status_enum') THEN
        CREATE TYPE submission_status_enum AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EVALUATED', 'ABANDONED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'palette_item_state_enum') THEN
        CREATE TYPE palette_item_state_enum AS ENUM (
            'UNVISITED', 'NOT_ANSWERED', 'ANSWERED', 'MARKED_FOR_REVIEW', 'ANSWERED_AND_MARKED'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'topic_progress_status_enum') THEN
        CREATE TYPE topic_progress_status_enum AS ENUM (
            'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'REVISION_REQUIRED'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_tracker_status_enum') THEN
        CREATE TYPE exam_tracker_status_enum AS ENUM (
            'NOT_APPLIED', 'APPLIED', 'ADMIT_CARD_DOWNLOADED', 'APPEARED', 'QUALIFIED', 'DISQUALIFIED'
        );
    END IF;
END $$;

-- =========================================================================
-- 2. TABLE DEFINITIONS (14 TARGETED TABLES)
-- =========================================================================

-- TABLE 1: exam_categories
CREATE TABLE IF NOT EXISTS exam_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cat_slug ON exam_categories(slug);

-- TABLE 2: exams
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES exam_categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    official_website_url TEXT,
    eligibility_rules JSONB NOT NULL DEFAULT '{
        "min_age": 21,
        "max_age": 32,
        "allowed_degrees": ["B.Tech", "BE", "MCA", "M.Sc"],
        "min_degree_percentage": 60.0,
        "max_attempts": 6
    }'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exams_category ON exams(category_id);
CREATE INDEX IF NOT EXISTS idx_exams_slug ON exams(slug);

-- TABLE 3: exam_stages
CREATE TABLE IF NOT EXISTS exam_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    stage_order INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    total_marks NUMERIC(6, 2) NOT NULL,
    duration_minutes INT NOT NULL,
    has_sectional_timing BOOLEAN DEFAULT FALSE,
    has_negative_marking BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_exam_stage_order UNIQUE(exam_id, stage_order)
);

CREATE INDEX IF NOT EXISTS idx_stages_exam ON exam_stages(exam_id, stage_order);

-- TABLE 4: subjects
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_stage_id UUID NOT NULL REFERENCES exam_stages(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subjects_stage ON subjects(exam_stage_id);

-- TABLE 5: topics
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    parent_topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    syllabus_weightage_pct NUMERIC(5, 2) DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);

-- TABLE 6: questions
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    question_type question_type_enum NOT NULL DEFAULT 'MCQ',
    difficulty question_difficulty_enum NOT NULL DEFAULT 'MEDIUM',
    content JSONB NOT NULL,
    options JSONB,
    correct_answer JSONB NOT NULL,
    explanation TEXT NOT NULL,
    default_positive_marks NUMERIC(4, 2) DEFAULT 1.0,
    default_negative_marks NUMERIC(4, 2) DEFAULT 0.0,
    source_exam_year VARCHAR(100),
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_type_diff ON questions(question_type, difficulty);

-- TABLE 7: mock_tests
CREATE TABLE IF NOT EXISTS mock_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_stage_id UUID NOT NULL REFERENCES exam_stages(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    test_type test_type_enum NOT NULL DEFAULT 'FULL_LENGTH',
    total_time_seconds INT NOT NULL,
    instructions TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mock_tests_stage ON mock_tests(exam_stage_id);

-- TABLE 8: mock_test_sections
CREATE TABLE IF NOT EXISTS mock_test_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mock_test_id UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    section_name VARCHAR(100) NOT NULL,
    section_order INT NOT NULL,
    allotted_time_seconds INT,
    is_time_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_test_section_order UNIQUE(mock_test_id, section_order)
);

CREATE INDEX IF NOT EXISTS idx_sections_mock ON mock_test_sections(mock_test_id);

-- TABLE 9: mock_test_items
CREATE TABLE IF NOT EXISTS mock_test_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mock_test_section_id UUID NOT NULL REFERENCES mock_test_sections(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    positive_marks NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
    negative_marks NUMERIC(4, 2) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_section_question UNIQUE(mock_test_section_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_items_section ON mock_test_items(mock_test_section_id, order_index);

-- TABLE 10: student_study_plans
CREATE TABLE IF NOT EXISTS student_study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    exam_stage_id UUID NOT NULL REFERENCES exam_stages(id) ON DELETE CASCADE,
    target_exam_date DATE NOT NULL,
    daily_study_hours NUMERIC(3, 1) DEFAULT 4.0,
    plan_metadata JSONB DEFAULT '{
        "current_streak_days": 1,
        "freeze_days_remaining": 2,
        "weekly_schedule": []
    }'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plans_user ON student_study_plans(user_id, is_active);

-- TABLE 11: student_topic_progress
CREATE TABLE IF NOT EXISTS student_topic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    status topic_progress_status_enum NOT NULL DEFAULT 'NOT_STARTED',
    confidence_level INT CHECK(confidence_level BETWEEN 1 AND 5) DEFAULT 3,
    last_revised_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_topic_progress UNIQUE(user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON student_topic_progress(user_id);

-- TABLE 12: test_submissions
CREATE TABLE IF NOT EXISTS test_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mock_test_id UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMPTZ,
    time_spent_seconds INT DEFAULT 0,
    total_score NUMERIC(6, 2) DEFAULT 0.00,
    total_accuracy_pct NUMERIC(5, 2) DEFAULT 0.00,
    status submission_status_enum NOT NULL DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_test ON test_submissions(user_id, mock_test_id);

-- TABLE 13: test_item_responses
CREATE TABLE IF NOT EXISTS test_item_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES test_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    student_answer JSONB,
    state palette_item_state_enum NOT NULL DEFAULT 'UNVISITED',
    is_correct BOOLEAN DEFAULT NULL,
    score_awarded NUMERIC(4, 2) DEFAULT 0.00,
    time_spent_seconds INT DEFAULT 0,
    CONSTRAINT unique_submission_question_resp UNIQUE(submission_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_responses_sub ON test_item_responses(submission_id);

-- TABLE 14: student_exam_trackers
CREATE TABLE IF NOT EXISTS student_exam_trackers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    exam_stage_id UUID NOT NULL REFERENCES exam_stages(id) ON DELETE CASCADE,
    status exam_tracker_status_enum NOT NULL DEFAULT 'NOT_APPLIED',
    roll_number VARCHAR(100),
    admit_card_url TEXT,
    result_score NUMERIC(6, 2),
    all_india_rank INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_exam_stage_tracker UNIQUE(user_id, exam_stage_id)
);

CREATE INDEX IF NOT EXISTS idx_trackers_user ON student_exam_trackers(user_id);

-- =========================================================================
-- 3. SEED DATA (AUTHENTIC NATIONAL EXAMS & PATTERNS)
-- =========================================================================

-- Insert Categories
INSERT INTO exam_categories (id, name, slug)
VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Engineering Entrance', 'engineering-entrance'),
    ('c1000000-0000-0000-0000-000000000002', 'Management Entrance', 'management-entrance'),
    ('c1000000-0000-0000-0000-000000000003', 'Civil Services', 'civil-services'),
    ('c1000000-0000-0000-0000-000000000004', 'Banking & Insurance', 'banking-insurance')
ON CONFLICT (id) DO NOTHING;

-- Insert Exams (GATE, CAT, UPSC, SBI PO)
INSERT INTO exams (id, category_id, name, code, slug, official_website_url, eligibility_rules)
VALUES
(
    'e1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'Graduate Aptitude Test in Engineering (CSE)',
    'GATE CSE',
    'gate-cse',
    'https://gate2026.iitd.ac.in',
    '{
        "min_age": 20,
        "max_age": 45,
        "allowed_degrees": ["B.Tech", "BE", "MCA", "M.Sc in CS/IT"],
        "min_degree_percentage": 50.0,
        "max_attempts": 10
    }'::jsonb
),
(
    'e1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000002',
    'Common Admission Test (IIMs)',
    'CAT',
    'cat-exam',
    'https://iimcat.ac.in',
    '{
        "min_age": 20,
        "max_age": 50,
        "allowed_degrees": ["Bachelors in Any Discipline", "B.Tech", "B.Com", "B.Sc"],
        "min_degree_percentage": 50.0,
        "max_attempts": 8
    }'::jsonb
),
(
    'e1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000003',
    'UPSC Civil Services Examination',
    'UPSC CSE',
    'upsc-cse',
    'https://upsc.gov.in',
    '{
        "min_age": 21,
        "max_age": 32,
        "allowed_degrees": ["Bachelors Degree"],
        "min_degree_percentage": 40.0,
        "max_attempts": 6
    }'::jsonb
),
(
    'e1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000004',
    'State Bank of India Probationary Officer',
    'SBI PO',
    'sbi-po',
    'https://sbi.co.in/careers',
    '{
        "min_age": 21,
        "max_age": 30,
        "allowed_degrees": ["Graduation in Any Stream"],
        "min_degree_percentage": 55.0,
        "max_attempts": 4
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Insert Exam Stages
-- GATE CSE: Single Stage, 180 min, 100 marks, Open Navigation
-- CAT: Single Stage, 120 min, 198 marks, 40-min Sectional Timing Locks
-- UPSC: Stage 1 Prelims, Stage 2 Mains
-- SBI PO: Stage 1 Prelims (20-min per section), Stage 2 Mains
INSERT INTO exam_stages (id, exam_id, stage_order, name, total_marks, duration_minutes, has_sectional_timing, has_negative_marking)
VALUES
    ('s1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 1, 'Computer Science & IT Paper', 100.0, 180, FALSE, TRUE),
    ('s1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 1, 'CAT Computer-Based Test', 198.0, 120, TRUE, TRUE),
    ('s1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000003', 1, 'Civil Services Preliminary (CSAT & GS-I)', 400.0, 240, TRUE, TRUE),
    ('s1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000003', 2, 'Civil Services Mains (Written)', 1750.0, 1620, FALSE, FALSE),
    ('s1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000004', 1, 'SBI PO Preliminary Examination', 100.0, 60, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insert Subjects
INSERT INTO subjects (id, exam_stage_id, name, code, description)
VALUES
    ('sub00000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001', 'Data Structures & Algorithms', 'CS-DSA', 'Trees, Graphs, Sorting, Dynamic Programming, Big-O Analysis'),
    ('sub00000-0000-0000-0000-000000000002', 's1000000-0000-0000-0000-000000000001', 'Computer Systems & OS', 'CS-OS', 'Virtual Memory, CPU Scheduling, Concurrency, File Systems'),
    ('sub00000-0000-0000-0000-000000000003', 's1000000-0000-0000-0000-000000000001', 'Theory of Computation & Discrete Math', 'CS-TOC', 'Automata, Regular Expressions, Turing Machines, Graph Theory'),
    ('sub00000-0000-0000-0000-000000000004', 's1000000-0000-0000-0000-000000000002', 'Quantitative Aptitude (QA)', 'CAT-QA', 'Number Theory, Algebra, Arithmetic, Modern Math, Geometry'),
    ('sub00000-0000-0000-0000-000000000005', 's1000000-0000-0000-0000-000000000002', 'Data Interpretation & Logical Reasoning', 'CAT-DILR', 'Puzzles, Matrix Arrangements, Caselets, Charts, Venn Diagrams'),
    ('sub00000-0000-0000-0000-000000000006', 's1000000-0000-0000-0000-000000000002', 'Verbal Ability & Reading Comprehension', 'CAT-VARC', 'Long Passages, Para-Jumbles, Critical Reasoning, Sentence Completion')
ON CONFLICT (id) DO NOTHING;

-- Insert Topics
INSERT INTO topics (id, subject_id, name, syllabus_weightage_pct)
VALUES
    ('top00000-0000-0000-0000-000000000001', 'sub00000-0000-0000-0000-000000000001', 'Binary Search Trees & AVL Trees', 8.5),
    ('top00000-0000-0000-0000-000000000002', 'sub00000-0000-0000-0000-000000000001', 'Shortest Paths & Minimum Spanning Trees', 9.0),
    ('top00000-0000-0000-0000-000000000003', 'sub00000-0000-0000-0000-000000000002', 'Virtual Memory & Page Replacement', 7.5),
    ('top00000-0000-0000-0000-000000000004', 'sub00000-0000-0000-0000-000000000002', 'Deadlock Detection & Semaphores', 8.0),
    ('top00000-0000-0000-0000-000000000005', 'sub00000-0000-0000-0000-000000000004', 'Modular Arithmetic & Factorials', 7.0),
    ('top00000-0000-0000-0000-000000000006', 'sub00000-0000-0000-0000-000000000005', 'Seating Arrangements & Games Tournaments', 10.0)
ON CONFLICT (id) DO NOTHING;
