-- Campus Placement & Competitive Exam Preparation Portal Migration
-- Database Architecture Migration Script

-- 1. Create Question Type Enum
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

-- 2. Enhanced Questions Table
DROP TABLE IF EXISTS placement_paper_questions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category question_category_type NOT NULL,
    sub_category VARCHAR(100) NOT NULL,       -- e.g., 'Arithmetic', 'Python Programming', 'Logical', 'HR'
    topic_tag VARCHAR(100) NOT NULL,          -- e.g., 'Time & Work', 'Recursion', 'Syllogism'
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,                   -- ["A", "B", "C", "D"]
    correct_option INT NOT NULL,              -- 0, 1, 2, or 3
    explanation TEXT NOT NULL,
    is_daily_question BOOLEAN DEFAULT FALSE,  -- Flag for daily test module
    daily_date DATE NULL,                     -- Target date for daily challenge
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Placement Test Papers Table
CREATE TABLE IF NOT EXISTS placement_papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(150) NOT NULL,       -- e.g., 'TCS NQT', 'Infosys', 'Cognizant', 'Wipro'
    paper_title VARCHAR(255) NOT NULL,        -- e.g., 'TCS National Qualifier Test 2026 Model Paper 1'
    duration_minutes INT DEFAULT 60,
    total_marks INT DEFAULT 100,
    pass_marks INT DEFAULT 50,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Mapping Questions to Placement Papers
CREATE TABLE IF NOT EXISTS placement_paper_questions (
    paper_id UUID REFERENCES placement_papers(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    question_order INT NOT NULL,
    PRIMARY KEY (paper_id, question_id)
);

-- 5. Track Daily Quiz & Placement Paper Submissions with Proctoring Integrity
DROP TABLE IF EXISTS quiz_attempts CASCADE;
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    test_type VARCHAR(50) NOT NULL,           -- 'daily_test', 'category_quiz', 'placement_paper', 'proctored_timed_arena'
    reference_id UUID NULL,                   -- placement_paper id if applicable
    category VARCHAR(100),                    -- Track name
    score INT NOT NULL,
    total_questions INT NOT NULL,
    time_taken_seconds INT NOT NULL,
    weak_areas JSONB DEFAULT '[]'::jsonb,     -- [{ "topic": "Time & Work", "score": 0 }]
    tab_switch_count INT DEFAULT 0,
    fullscreen_exit_count INT DEFAULT 0,
    forced_auto_submit BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'COMPLETED_NORMALLY', -- 'COMPLETED_NORMALLY' | 'DISQUALIFIED_CHEATING'
    integrity_report JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for fast daily and category lookups
CREATE INDEX IF NOT EXISTS idx_daily_quiz ON questions (is_daily_question, daily_date);
CREATE INDEX IF NOT EXISTS idx_category_sub ON questions (category, sub_category);
CREATE INDEX IF NOT EXISTS idx_attempts_integrity ON quiz_attempts (status, forced_auto_submit);
