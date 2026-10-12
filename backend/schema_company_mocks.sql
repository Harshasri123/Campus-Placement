-- =========================================================================
-- Company Placement Mock Test Arena - PostgreSQL Database Schema
-- Multi-Company Recruitment Simulation Engine (TCS NQT, Infosys, Cognizant, Wipro, Accenture)
-- =========================================================================

-- 1. Previous Year Questions Bank
CREATE TABLE IF NOT EXISTS company_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(100) NOT NULL,       -- 'TCS NQT', 'Infosys', 'Cognizant', 'Wipro', 'Accenture'
    exam_year INT,                            -- e.g., 2023, 2024, 2025
    section_name VARCHAR(100) NOT NULL,       -- 'Quantitative', 'Reasoning', 'Verbal', 'Technical'
    topic_tag VARCHAR(100) NOT NULL,          -- 'Time and Work', 'Syllogism', 'Pseudocode'
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,                   -- ["A", "B", "C", "D"]
    correct_option INT NOT NULL CHECK (correct_option BETWEEN 0 AND 3),
    explanation TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'Medium',  -- 'Easy', 'Medium', 'Hard'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cq_company_section ON company_questions(company_name, section_name);

-- 2. Mock Test Sessions
CREATE TABLE IF NOT EXISTS company_mock_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(100) NOT NULL,
    mock_number INT NOT NULL,                 -- e.g., Mock Test #1, Mock Test #2
    total_questions INT NOT NULL,
    duration_minutes INT NOT NULL,
    score INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE,
    sectional_scores JSONB DEFAULT '{}'::jsonb,
    qualification_status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    integrity_report JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_cms_user_company ON company_mock_sessions(user_id, company_name);

-- 3. Tracking Every Question Served to a Student (Prevents Repeated Questions)
CREATE TABLE IF NOT EXISTS student_question_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES company_questions(id) ON DELETE CASCADE,
    session_id UUID REFERENCES company_mock_sessions(id) ON DELETE CASCADE,
    company_name VARCHAR(100) NOT NULL,
    selected_option INT,
    is_correct BOOLEAN,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_question_session UNIQUE (user_id, question_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_user_history ON student_question_history(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_user_company_history ON student_question_history(user_id, company_name);

-- 4. Real-Time AI Placement Interview Assistant Sessions
CREATE TABLE IF NOT EXISTS ai_interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(100) NOT NULL,
    round_type VARCHAR(50) NOT NULL,            -- 'Technical' or 'HR'
    total_questions INT DEFAULT 6,
    conversation_log JSONB NOT NULL,            -- [{ "speaker": "ai"|"user", "text": "...", "timestamp": ... }]
    evaluation_report JSONB,                    -- { overallScore, strengths, areasToImprove, hiringRecommendation }
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_int_user ON ai_interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_int_company ON ai_interview_sessions(company_name);

