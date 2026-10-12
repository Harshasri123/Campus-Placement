-- =========================================================================
-- CareerPath Interview-to-Hire Workflow - PostgreSQL Relational Schema
-- Complete 12-Table Enterprise Relational Architecture with Strict Constraints,
-- Foreign Keys, Custom ENUM Types, Audit Trails, and Seed Data.
-- =========================================================================

-- Enable UUID extension if not already loaded
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean drop if recreating (safe idempotent setup)
-- DROP SCHEMA IF EXISTS recruitment CASCADE;
CREATE SCHEMA IF NOT EXISTS recruitment;
SET search_path TO recruitment, public;

-- =========================================================================
-- 1. CUSTOM ENUM TYPES
-- =========================================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('STUDENT', 'RECRUITER', 'ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_location_enum') THEN
        CREATE TYPE job_location_enum AS ENUM ('ON_SITE', 'HYBRID', 'REMOTE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status_enum') THEN
        CREATE TYPE job_status_enum AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'round_type_enum') THEN
        CREATE TYPE round_type_enum AS ENUM ('APTITUDE', 'CODING', 'TECHNICAL', 'MANAGERIAL', 'HR', 'FINAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status_enum') THEN
        CREATE TYPE application_status_enum AS ENUM (
            'APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT',
            'INTERVIEWING', 'SELECTED', 'REJECTED', 'OFFERED', 'HIRED', 'WITHDRAWN'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'candidate_status_enum') THEN
        CREATE TYPE candidate_status_enum AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED', 'RESCHEDULE_REQUESTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interview_status_enum') THEN
        CREATE TYPE interview_status_enum AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recommendation_enum') THEN
        CREATE TYPE recommendation_enum AS ENUM ('STRONG_HIRE', 'HIRE', 'NEXT_ROUND', 'ON_HOLD', 'REJECT');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status_enum') THEN
        CREATE TYPE offer_status_enum AS ENUM ('ISSUED', 'ACCEPTED', 'DECLINED', 'EXPIRED');
    END IF;
END $$;

-- =========================================================================
-- 2. TABLE DEFINITIONS (12 TARGETED TABLES)
-- =========================================================================

-- TABLE 1: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'STUDENT',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- TABLE 2: students
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    college_name VARCHAR(255) NOT NULL,
    degree VARCHAR(100) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    graduation_year INT NOT NULL,
    cgpa NUMERIC(3, 2) NOT NULL CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    backlogs_count INT DEFAULT 0 CHECK (backlogs_count >= 0),
    resume_url TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_college ON students(college_name);
CREATE INDEX IF NOT EXISTS idx_students_branch_cgpa ON students(branch, cgpa);

-- TABLE 3: companies
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    website VARCHAR(255),
    logo_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 4: recruiters
CREATE TABLE IF NOT EXISTS recruiters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    designation VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recruiters_company ON recruiters(company_id);

-- TABLE 5: jobs
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location_type job_location_enum NOT NULL DEFAULT 'HYBRID',
    ctc_or_stipend VARCHAR(100),
    eligibility JSONB NOT NULL DEFAULT '{
        "min_cgpa": 7.0,
        "allowed_branches": ["CSE", "IT", "ECE"],
        "max_backlogs": 0,
        "grad_years": [2026, 2027]
    }'::jsonb,
    status job_status_enum NOT NULL DEFAULT 'PUBLISHED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_company_status ON jobs(company_id, status);

-- TABLE 6: job_round_configs
CREATE TABLE IF NOT EXISTS job_round_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    round_order INT NOT NULL,
    round_name VARCHAR(100) NOT NULL,
    round_type round_type_enum NOT NULL,
    description TEXT,
    CONSTRAINT unique_job_round_order UNIQUE (job_id, round_order)
);

CREATE INDEX IF NOT EXISTS idx_round_configs_job ON job_round_configs(job_id, round_order);

-- TABLE 7: applications
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    resume_snapshot_url TEXT NOT NULL,
    status application_status_enum NOT NULL DEFAULT 'APPLIED',
    current_round_order INT DEFAULT 0,
    applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_job_student UNIQUE (job_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_job_status ON applications(job_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);

-- TABLE 8: interviews
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    round_config_id UUID NOT NULL REFERENCES job_round_configs(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE RESTRICT,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    meeting_link TEXT,
    meeting_location TEXT,
    instructions TEXT,
    candidate_status candidate_status_enum NOT NULL DEFAULT 'INVITED',
    interview_status interview_status_enum NOT NULL DEFAULT 'SCHEDULED',
    reschedule_reason TEXT,
    reschedule_slots JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interviews_app_round ON interviews(application_id, round_config_id);
CREATE INDEX IF NOT EXISTS idx_interviews_schedule ON interviews(scheduled_start);

-- TABLE 9: interview_feedback
CREATE TABLE IF NOT EXISTS interview_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID UNIQUE NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    interviewer_name VARCHAR(150),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    technical_skills_rating INT CHECK (technical_skills_rating BETWEEN 1 AND 5),
    soft_skills_rating INT CHECK (soft_skills_rating BETWEEN 1 AND 5),
    comments TEXT NOT NULL,
    recommendation recommendation_enum NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 10: offers
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    ctc_breakdown JSONB NOT NULL,
    joining_date DATE NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    offer_letter_url TEXT NOT NULL,
    status offer_status_enum NOT NULL DEFAULT 'ISSUED',
    acted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offers_status_expiry ON offers(status, valid_until);

-- TABLE 11: notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- TABLE 12: application_audit_logs
CREATE TABLE IF NOT EXISTS application_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    action_note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_app ON application_audit_logs(application_id, created_at);

-- =========================================================================
-- 3. AUDIT TRIGGER FOR AUTOMATIC STATUS AUDITING
-- =========================================================================

CREATE OR REPLACE FUNCTION audit_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.status IS DISTINCT FROM NEW.status) THEN
            INSERT INTO application_audit_logs (
                application_id,
                actor_id,
                previous_status,
                new_status,
                action_note
            )
            VALUES (
                NEW.id,
                NEW.student_id, -- Fallback actor if not explicitly injected
                OLD.status::text,
                NEW.status::text,
                'Automated status transition via database trigger'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_application_status ON applications;
CREATE TRIGGER trg_audit_application_status
AFTER UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION audit_application_status_change();

-- =========================================================================
-- 4. SEED DATA (SAMPLE ENTERPRISE PLACEMENT ECOSYSTEM)
-- =========================================================================

-- Insert Companies
INSERT INTO companies (id, name, website, logo_url, verified)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Tata Consultancy Services', 'https://www.tcs.com', 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg', TRUE),
    ('c0000000-0000-0000-0000-000000000002', 'Google Cloud India', 'https://careers.google.com', 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', TRUE),
    ('c0000000-0000-0000-0000-000000000003', 'Microsoft IDC', 'https://careers.microsoft.com', 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg', TRUE),
    ('c0000000-0000-0000-0000-000000000004', 'Amazon AWS', 'https://amazon.jobs', 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insert Users (Password: Password123!)
INSERT INTO users (id, email, password_hash, role)
VALUES
    ('u0000000-0000-0000-0000-000000000001', 'student.harsha@college.edu', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'STUDENT'),
    ('u0000000-0000-0000-0000-000000000002', 'recruiter.tcs@tcs.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'RECRUITER'),
    ('u0000000-0000-0000-0000-000000000003', 'recruiter.google@google.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'RECRUITER'),
    ('u0000000-0000-0000-0000-000000000004', 'admin.placement@careerpath.internal', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ADMIN')
ON CONFLICT (id) DO NOTHING;

-- Insert Student Profile
INSERT INTO students (id, user_id, full_name, college_name, degree, branch, graduation_year, cgpa, backlogs_count, resume_url, skills)
VALUES (
    's0000000-0000-0000-0000-000000000001',
    'u0000000-0000-0000-0000-000000000001',
    'Harshasri Reddy',
    'National Institute of Technology',
    'B.Tech',
    'Computer Science & Engineering',
    2026,
    8.85,
    0,
    '/uploads/resumes/harshasri_resume_2026.pdf',
    ARRAY['Python', 'Java', 'Data Structures & Algorithms', 'PostgreSQL', 'System Design', 'React']
)
ON CONFLICT (id) DO NOTHING;

-- Insert Recruiters
INSERT INTO recruiters (id, user_id, company_id, designation)
VALUES
    ('r0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Lead Campus Talent Partner'),
    ('r0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Senior University Recruiter')
ON CONFLICT (id) DO NOTHING;

-- Insert Jobs
INSERT INTO jobs (id, company_id, recruiter_id, title, description, location_type, ctc_or_stipend, eligibility, status)
VALUES
(
    'j0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'r0000000-0000-0000-0000-000000000002',
    'Software Engineer - University Graduate (2026)',
    'Join Google Engineering to build world-scale distributed systems, machine learning pipelines, and cloud services. We seek exceptional analytical skills and proficiency in algorithms, data structures, and computer science fundamentals.',
    'HYBRID',
    '₹32,00,000 - ₹38,00,000 CTC',
    '{
        "min_cgpa": 7.5,
        "allowed_branches": ["CSE", "IT", "ECE", "AI & DS"],
        "max_backlogs": 0,
        "grad_years": [2026, 2027]
    }'::jsonb,
    'PUBLISHED'
),
(
    'j0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'r0000000-0000-0000-0000-000000000001',
    'TCS Digital Cadre - Systems Engineer',
    'TCS Digital offers accelerated career pathways for top engineering graduates in cloud architectures, AI engineering, full-stack, and cyber security domains.',
    'ON_SITE',
    '₹7,50,000 - ₹9,00,000 CTC',
    '{
        "min_cgpa": 7.0,
        "allowed_branches": ["CSE", "IT", "ECE", "EEE", "Mech"],
        "max_backlogs": 0,
        "grad_years": [2026]
    }'::jsonb,
    'PUBLISHED'
)
ON CONFLICT (id) DO NOTHING;

-- Insert Job Round Configs (Google SE)
INSERT INTO job_round_configs (id, job_id, round_order, round_name, round_type, description)
VALUES
    ('rc000000-0000-0000-0000-000000000001', 'j0000000-0000-0000-0000-000000000001', 0, 'Round 0: Online Assessment', 'CODING', '60-min coding challenges covering DSA, graph algorithms, and proctored environment'),
    ('rc000000-0000-0000-0000-000000000002', 'j0000000-0000-0000-0000-000000000001', 1, 'Technical Round 1: Data Structures & Algorithms', 'TECHNICAL', '45-minute live interview covering trees, dynamic programming, and space-time complexity analysis'),
    ('rc000000-0000-0000-0000-000000000003', 'j0000000-0000-0000-0000-000000000001', 2, 'Technical Round 2: System Design & CS Core', 'TECHNICAL', '45-minute interview focusing on OS concurrency, database indexing, caching strategies, and REST/gRPC'),
    ('rc000000-0000-0000-0000-000000000004', 'j0000000-0000-0000-0000-000000000001', 3, 'Googleyness & Behavioral Leadership', 'HR', 'Cultural fit, team collaboration, ethical leadership, and conflict resolution scenarios')
ON CONFLICT (id) DO NOTHING;

-- Insert Job Round Configs (TCS Digital)
INSERT INTO job_round_configs (id, job_id, round_order, round_name, round_type, description)
VALUES
    ('rc000000-0000-0000-0000-000000000005', 'j0000000-0000-0000-0000-000000000002', 0, 'National Qualifier Test (NQT)', 'APTITUDE', 'Advanced quantitative, reasoning, and verbal aptitude combined with pseudo-code analysis'),
    ('rc000000-0000-0000-0000-000000000006', 'j0000000-0000-0000-0000-000000000002', 1, 'Technical Interview', 'TECHNICAL', 'Project walkthrough, OOPs concepts, SQL queries, and fundamental data structures'),
    ('rc000000-0000-0000-0000-000000000007', 'j0000000-0000-0000-0000-000000000002', 2, 'Managerial & HR Round', 'HR', 'Career orientation, flexibility in tech stacks, location preferences, and communication assessment')
ON CONFLICT (id) DO NOTHING;
