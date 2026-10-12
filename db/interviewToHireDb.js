/**
 * CareerPath - Relational Database Engine for Interview-to-Hire Workflow
 * 12-table enterprise architecture supporting SQLite (Node 22 DatabaseSync)
 * with strict foreign keys, compound constraints, automated audit logging,
 * and background offer expiration checks.
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

// Enable foreign key constraints in SQLite
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Initialize the 12 Targeted Relational Tables for Interview-to-Hire Workflow
 */
function initRelationalRecruitmentSchema() {
  db.exec(`
    -- TABLE 1: users (Recruitment & RBAC)
    CREATE TABLE IF NOT EXISTS recruitment_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('STUDENT', 'RECRUITER', 'ADMIN')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- TABLE 2: students
    CREATE TABLE IF NOT EXISTS recruitment_students (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      college_name TEXT NOT NULL,
      degree TEXT NOT NULL,
      branch TEXT NOT NULL,
      graduation_year INTEGER NOT NULL,
      cgpa REAL NOT NULL CHECK (cgpa >= 0.0 AND cgpa <= 10.0),
      backlogs_count INTEGER DEFAULT 0 CHECK (backlogs_count >= 0),
      resume_url TEXT NOT NULL,
      skills TEXT DEFAULT '[]', -- JSON array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES recruitment_users(id) ON DELETE CASCADE
    );

    -- TABLE 3: companies
    CREATE TABLE IF NOT EXISTS recruitment_companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      website TEXT,
      logo_url TEXT,
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- TABLE 4: recruiters
    CREATE TABLE IF NOT EXISTS recruitment_recruiters (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      company_id TEXT NOT NULL,
      designation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES recruitment_users(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES recruitment_companies(id) ON DELETE CASCADE
    );

    -- TABLE 5: jobs
    CREATE TABLE IF NOT EXISTS recruitment_jobs (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      recruiter_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location_type TEXT NOT NULL CHECK(location_type IN ('ON_SITE', 'HYBRID', 'REMOTE')),
      ctc_or_stipend TEXT,
      eligibility TEXT NOT NULL, -- JSON { min_cgpa, allowed_branches, max_backlogs, grad_years }
      status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK(status IN ('DRAFT', 'PUBLISHED', 'CLOSED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES recruitment_companies(id) ON DELETE CASCADE,
      FOREIGN KEY (recruiter_id) REFERENCES recruitment_recruiters(id) ON DELETE RESTRICT
    );

    -- TABLE 6: job_round_configs
    CREATE TABLE IF NOT EXISTS recruitment_job_round_configs (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      round_order INTEGER NOT NULL,
      round_name TEXT NOT NULL,
      round_type TEXT NOT NULL CHECK(round_type IN ('APTITUDE', 'CODING', 'TECHNICAL', 'MANAGERIAL', 'HR', 'FINAL')),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(job_id, round_order),
      FOREIGN KEY (job_id) REFERENCES recruitment_jobs(id) ON DELETE CASCADE
    );

    -- TABLE 7: applications
    CREATE TABLE IF NOT EXISTS recruitment_applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      resume_snapshot_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'APPLIED' CHECK(status IN (
        'APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT',
        'INTERVIEWING', 'SELECTED', 'REJECTED', 'OFFERED', 'HIRED', 'WITHDRAWN'
      )),
      current_round_order INTEGER DEFAULT 0,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(job_id, student_id),
      FOREIGN KEY (job_id) REFERENCES recruitment_jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES recruitment_students(id) ON DELETE CASCADE
    );

    -- TABLE 8: interviews
    CREATE TABLE IF NOT EXISTS recruitment_interviews (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      round_config_id TEXT NOT NULL,
      recruiter_id TEXT NOT NULL,
      scheduled_start DATETIME NOT NULL,
      scheduled_end DATETIME NOT NULL,
      meeting_link TEXT,
      meeting_location TEXT,
      instructions TEXT,
      candidate_status TEXT NOT NULL DEFAULT 'INVITED' CHECK(candidate_status IN ('INVITED', 'ACCEPTED', 'DECLINED', 'RESCHEDULE_REQUESTED')),
      interview_status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK(interview_status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
      reschedule_reason TEXT,
      reschedule_slots TEXT DEFAULT '[]', -- JSON array of requested slots
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES recruitment_applications(id) ON DELETE CASCADE,
      FOREIGN KEY (round_config_id) REFERENCES recruitment_job_round_configs(id) ON DELETE CASCADE,
      FOREIGN KEY (recruiter_id) REFERENCES recruitment_recruiters(id) ON DELETE RESTRICT
    );

    -- TABLE 9: interview_feedback
    CREATE TABLE IF NOT EXISTS recruitment_interview_feedback (
      id TEXT PRIMARY KEY,
      interview_id TEXT UNIQUE NOT NULL,
      interviewer_name TEXT NOT NULL,
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      technical_skills_rating INTEGER CHECK(technical_skills_rating BETWEEN 1 AND 5),
      soft_skills_rating INTEGER CHECK(soft_skills_rating BETWEEN 1 AND 5),
      comments TEXT NOT NULL,
      recommendation TEXT NOT NULL CHECK(recommendation IN ('STRONG_HIRE', 'HIRE', 'NEXT_ROUND', 'ON_HOLD', 'REJECT')),
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (interview_id) REFERENCES recruitment_interviews(id) ON DELETE CASCADE
    );

    -- TABLE 10: offers
    CREATE TABLE IF NOT EXISTS recruitment_offers (
      id TEXT PRIMARY KEY,
      application_id TEXT UNIQUE NOT NULL,
      ctc_breakdown TEXT NOT NULL, -- JSON
      joining_date TEXT NOT NULL,
      valid_until DATETIME NOT NULL,
      offer_letter_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ISSUED' CHECK(status IN ('ISSUED', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
      acted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES recruitment_applications(id) ON DELETE CASCADE
    );

    -- TABLE 11: notifications
    CREATE TABLE IF NOT EXISTS recruitment_notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata TEXT DEFAULT '{}', -- JSON
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES recruitment_users(id) ON DELETE CASCADE
    );

    -- TABLE 12: application_audit_logs
    CREATE TABLE IF NOT EXISTS recruitment_application_audit_logs (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      previous_status TEXT,
      new_status TEXT,
      action_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES recruitment_applications(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_id) REFERENCES recruitment_users(id) ON DELETE RESTRICT
    );

    -- Create Indices for High Performance
    CREATE INDEX IF NOT EXISTS idx_r_apps_job ON recruitment_applications(job_id, status);
    CREATE INDEX IF NOT EXISTS idx_r_apps_student ON recruitment_applications(student_id);
    CREATE INDEX IF NOT EXISTS idx_r_interviews_app ON recruitment_interviews(application_id);
    CREATE INDEX IF NOT EXISTS idx_r_audit_app ON recruitment_application_audit_logs(application_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_r_notifs_user ON recruitment_notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_r_offers_expiry ON recruitment_offers(status, valid_until);
  `);

  seedInitialRecruitmentData();
}

/**
 * Seed Initial Recruitment Ecosystem Data
 */
function seedInitialRecruitmentData() {
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM recruitment_users').get();
  if (existingUsers && existingUsers.count > 0) {
    return; // Already seeded
  }

  // 1. Seed Companies
  const cGoogle = 'c0000000-0000-0000-0000-000000000001';
  const cTcs = 'c0000000-0000-0000-0000-000000000002';
  const cMicrosoft = 'c0000000-0000-0000-0000-000000000003';
  const cAmazon = 'c0000000-0000-0000-0000-000000000004';

  const insertCompany = db.prepare(`
    INSERT INTO recruitment_companies (id, name, website, logo_url, verified)
    VALUES (?, ?, ?, ?, 1)
  `);
  insertCompany.run(cGoogle, 'Google Cloud India', 'https://careers.google.com', 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg');
  insertCompany.run(cTcs, 'Tata Consultancy Services', 'https://www.tcs.com', 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg');
  insertCompany.run(cMicrosoft, 'Microsoft IDC', 'https://careers.microsoft.com', 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg');
  insertCompany.run(cAmazon, 'Amazon AWS', 'https://amazon.jobs', 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg');

  // 2. Seed Users (1 Student, 2 Recruiters, 1 Admin)
  const uStudent = 'u0000000-0000-0000-0000-000000000001';
  const uRecruiterGoogle = 'u0000000-0000-0000-0000-000000000002';
  const uRecruiterTcs = 'u0000000-0000-0000-0000-000000000003';
  const uAdmin = 'u0000000-0000-0000-0000-000000000004';

  const insertUser = db.prepare(`
    INSERT INTO recruitment_users (id, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);
  const defaultPw = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'; // Password123!
  insertUser.run(uStudent, 'student.harsha@college.edu', defaultPw, 'STUDENT');
  insertUser.run(uRecruiterGoogle, 'recruiter.google@google.com', defaultPw, 'RECRUITER');
  insertUser.run(uRecruiterTcs, 'recruiter.tcs@tcs.com', defaultPw, 'RECRUITER');
  insertUser.run(uAdmin, 'admin@careerpath.edu', defaultPw, 'ADMIN');

  // 3. Seed Student Profile
  const sStudent = 's0000000-0000-0000-0000-000000000001';
  db.prepare(`
    INSERT INTO recruitment_students (
      id, user_id, full_name, college_name, degree, branch,
      graduation_year, cgpa, backlogs_count, resume_url, skills
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sStudent,
    uStudent,
    'Harshasri Reddy',
    'National Institute of Technology',
    'B.Tech',
    'CSE',
    2026,
    8.85,
    0,
    '/uploads/resumes/harshasri_resume_2026.pdf',
    JSON.stringify(['Python', 'Java', 'Data Structures & Algorithms', 'PostgreSQL', 'System Design', 'React'])
  );

  // 4. Seed Recruiters
  const rGoogle = 'r0000000-0000-0000-0000-000000000001';
  const rTcs = 'r0000000-0000-0000-0000-000000000002';
  db.prepare(`
    INSERT INTO recruitment_recruiters (id, user_id, company_id, designation)
    VALUES (?, ?, ?, ?)
  `).run(rGoogle, uRecruiterGoogle, cGoogle, 'Senior University Recruiter');
  db.prepare(`
    INSERT INTO recruitment_recruiters (id, user_id, company_id, designation)
    VALUES (?, ?, ?, ?)
  `).run(rTcs, uRecruiterTcs, cTcs, 'Lead Campus Talent Partner');

  // 5. Seed Jobs
  const jGoogle = 'j0000000-0000-0000-0000-000000000001';
  const jTcs = 'j0000000-0000-0000-0000-000000000002';

  const insertJob = db.prepare(`
    INSERT INTO recruitment_jobs (
      id, company_id, recruiter_id, title, description,
      location_type, ctc_or_stipend, eligibility, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')
  `);

  insertJob.run(
    jGoogle,
    cGoogle,
    rGoogle,
    'Software Engineer - University Graduate (2026)',
    'Join Google Cloud & Core Systems. Build planet-scale distributed platforms, cloud database engines, and ML inference infrastructure. Exceptional analytical ability, algorithms proficiency, and OS systems depth required.',
    'HYBRID',
    '₹32,00,000 - ₹38,00,000 CTC',
    JSON.stringify({
      min_cgpa: 7.5,
      allowed_branches: ['CSE', 'IT', 'ECE', 'AI & DS'],
      max_backlogs: 0,
      grad_years: [2026, 2027]
    })
  );

  insertJob.run(
    jTcs,
    cTcs,
    rTcs,
    'TCS Digital Cadre - Systems Engineer',
    'TCS Digital is an elite hiring track for top engineering graduates. Roles span Cloud Computing, Distributed Microservices, Artificial Intelligence, and Modern DevSecOps.',
    'ON_SITE',
    '₹7,50,000 - ₹9,00,000 CTC',
    JSON.stringify({
      min_cgpa: 7.0,
      allowed_branches: ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical'],
      max_backlogs: 0,
      grad_years: [2026]
    })
  );

  // 6. Seed Job Round Configs (Google)
  const insertRound = db.prepare(`
    INSERT INTO recruitment_job_round_configs (id, job_id, round_order, round_name, round_type, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const rcG0 = 'rc000000-0000-0000-0000-000000000001';
  const rcG1 = 'rc000000-0000-0000-0000-000000000002';
  const rcG2 = 'rc000000-0000-0000-0000-000000000003';
  const rcG3 = 'rc000000-0000-0000-0000-000000000004';

  insertRound.run(rcG0, jGoogle, 0, 'Round 0: Online Assessment', 'CODING', '60-min timed coding challenges covering DSA, graph algorithms, and proctored compiler');
  insertRound.run(rcG1, jGoogle, 1, 'Technical Round 1: Data Structures & Algorithms', 'TECHNICAL', '45-minute live session covering trees, dynamic programming, and space-time complexity analysis');
  insertRound.run(rcG2, jGoogle, 2, 'Technical Round 2: System Design & CS Core', 'TECHNICAL', '45-minute interview focusing on OS concurrency, database indexing, caching strategies, and REST/gRPC');
  insertRound.run(rcG3, jGoogle, 3, 'Googleyness & Leadership', 'HR', 'Behavioral leadership, team collaboration, ethical dilemma scenarios, and STAR responses');

  // TCS Rounds
  const rcT0 = 'rc000000-0000-0000-0000-000000000005';
  const rcT1 = 'rc000000-0000-0000-0000-000000000006';
  const rcT2 = 'rc000000-0000-0000-0000-000000000007';

  insertRound.run(rcT0, jTcs, 0, 'National Qualifier Test (NQT)', 'APTITUDE', 'Advanced quantitative, reasoning, and verbal aptitude combined with pseudo-code analysis');
  insertRound.run(rcT1, jTcs, 1, 'Technical Interview', 'TECHNICAL', 'Project walkthrough, OOPs concepts, SQL queries, and fundamental data structures');
  insertRound.run(rcT2, jTcs, 2, 'Managerial & HR Round', 'HR', 'Career goals, team adaptability, location preferences, and communication assessment');

  // 7. Seed Sample Application for Harshasri with Google (status = 'INTERVIEWING')
  const appGoogle = 'app00000-0000-0000-0000-000000000001';
  db.prepare(`
    INSERT INTO recruitment_applications (
      id, job_id, student_id, resume_snapshot_url, status, current_round_order
    ) VALUES (?, ?, ?, ?, 'INTERVIEWING', 1)
  `).run(appGoogle, jGoogle, sStudent, '/uploads/resumes/harshasri_resume_2026.pdf');

  // Audit Logs for Application
  const insertAudit = db.prepare(`
    INSERT INTO recruitment_application_audit_logs (id, application_id, actor_id, previous_status, new_status, action_note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run(crypto.randomUUID(), appGoogle, uStudent, null, 'APPLIED', 'Application submitted with verified primary resume', '2026-10-01 10:00:00');
  insertAudit.run(crypto.randomUUID(), appGoogle, uRecruiterGoogle, 'APPLIED', 'SHORTLISTED', 'Resume shortlisted after screening (CGPA 8.85, Top Tier)', '2026-10-02 14:30:00');
  insertAudit.run(crypto.randomUUID(), appGoogle, uRecruiterGoogle, 'SHORTLISTED', 'INTERVIEWING', 'Candidate advanced to Technical Round 1: DSA', '2026-10-03 09:15:00');

  // 8. Seed Sample Interview Slot
  const intGoogle1 = 'int00000-0000-0000-0000-000000000001';
  db.prepare(`
    INSERT INTO recruitment_interviews (
      id, application_id, round_config_id, recruiter_id,
      scheduled_start, scheduled_end, meeting_link, meeting_location,
      instructions, candidate_status, interview_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'INVITED', 'SCHEDULED')
  `).run(
    intGoogle1,
    appGoogle,
    rcG1,
    rGoogle,
    new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    new Date(Date.now() + 86400000 * 2 + 3600000).toISOString(),
    'https://meet.google.com/xyz-careerpath-g',
    'Google Meet (Virtual Coding Sandbox Enabled)',
    'Please keep a working webcam, microphone, and Python/Java environment ready. You will be asked to implement algorithms and analyze Big-O complexity live.'
  );

  // 9. Seed Initial Notification
  db.prepare(`
    INSERT INTO recruitment_notifications (id, user_id, type, title, message, metadata, is_read)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(
    crypto.randomUUID(),
    uStudent,
    'INTERVIEW_INVITED',
    'Interview Invitation: Google Cloud India',
    'You have been invited to Technical Round 1: Data Structures & Algorithms. Please confirm your slot or request reschedule in the Interview Center.',
    JSON.stringify({ interviewId: intGoogle1, jobId: jGoogle })
  );

  console.log('✅ Initialized and seeded 12-table Interview-to-Hire database schema.');
}

// Call initialization
initRelationalRecruitmentSchema();

// =========================================================================
// DATABASE ACCESS & RECRUITMENT OPERATIONS API
// =========================================================================

/**
 * 1. Jobs & Eligibility
 */
function getPublishedJobs() {
  const rows = db.prepare(`
    SELECT j.*, 
           c.name as company_name, c.logo_url as company_logo, c.website as company_website, c.verified as company_verified,
           r.designation as recruiter_designation,
           (SELECT COUNT(*) FROM recruitment_applications a WHERE a.job_id = j.id) as applicant_count,
           (SELECT COUNT(*) FROM recruitment_job_round_configs rc WHERE rc.job_id = j.id) as round_count
    FROM recruitment_jobs j
    JOIN recruitment_companies c ON j.company_id = c.id
    JOIN recruitment_recruiters r ON j.recruiter_id = r.id
    WHERE j.status = 'PUBLISHED'
    ORDER BY j.created_at DESC
  `).all();

  return rows.map(r => ({
    ...r,
    eligibility: JSON.parse(r.eligibility || '{}'),
    company_verified: Boolean(r.company_verified)
  }));
}

function getJobById(jobId) {
  const job = db.prepare(`
    SELECT j.*, 
           c.name as company_name, c.logo_url as company_logo, c.website as company_website, c.verified as company_verified,
           r.id as recruiter_id, r.designation as recruiter_designation
    FROM recruitment_jobs j
    JOIN recruitment_companies c ON j.company_id = c.id
    JOIN recruitment_recruiters r ON j.recruiter_id = r.id
    WHERE j.id = ?
  `).get(jobId);

  if (!job) return null;

  const roundConfigs = db.prepare(`
    SELECT * FROM recruitment_job_round_configs
    WHERE job_id = ?
    ORDER BY round_order ASC
  `).all(jobId);

  return {
    ...job,
    eligibility: JSON.parse(job.eligibility || '{}'),
    company_verified: Boolean(job.company_verified),
    rounds: roundConfigs
  };
}

/**
 * Check Student Eligibility for a Job Posting
 */
function checkStudentEligibility(jobId, studentId) {
  const job = getJobById(jobId);
  if (!job) throw new Error('Job posting not found.');

  const student = db.prepare('SELECT * FROM recruitment_students WHERE id = ?').get(studentId);
  if (!student) throw new Error('Student profile not found.');

  const criteria = job.eligibility || {};
  const reasons = [];

  // 1. CGPA check
  if (criteria.min_cgpa && student.cgpa < criteria.min_cgpa) {
    reasons.push(`Minimum CGPA required is ${criteria.min_cgpa}, your CGPA is ${student.cgpa}.`);
  }

  // 2. Backlogs check
  if (criteria.max_backlogs !== undefined && student.backlogs_count > criteria.max_backlogs) {
    reasons.push(`Maximum allowed active backlogs is ${criteria.max_backlogs}, you currently have ${student.backlogs_count}.`);
  }

  // 3. Branch check
  if (criteria.allowed_branches && criteria.allowed_branches.length > 0) {
    const studentBranchUpper = (student.branch || '').toUpperCase();
    const branchMatch = criteria.allowed_branches.some(b => studentBranchUpper.includes(b.toUpperCase()) || b.toUpperCase().includes(studentBranchUpper));
    if (!branchMatch) {
      reasons.push(`Allowed branches: ${criteria.allowed_branches.join(', ')}. Your registered branch is ${student.branch}.`);
    }
  }

  // 4. Graduation year check
  if (criteria.grad_years && criteria.grad_years.length > 0) {
    if (!criteria.grad_years.includes(student.graduation_year)) {
      reasons.push(`Eligible graduation batches: ${criteria.grad_years.join(', ')}. Your graduation year is ${student.graduation_year}.`);
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    criteria,
    studentStats: {
      fullName: student.full_name,
      collegeName: student.college_name,
      branch: student.branch,
      cgpa: student.cgpa,
      backlogs: student.backlogs_count,
      graduationYear: student.graduation_year
    }
  };
}

/**
 * 2. Applications
 */
function applyForJob(jobId, studentId, resumeUrl) {
  // Check if already applied
  const existing = db.prepare('SELECT * FROM recruitment_applications WHERE job_id = ? AND student_id = ?').get(jobId, studentId);
  if (existing) {
    return { error: 'You have already applied for this position.', application: existing };
  }

  // Auto-Eligibility Verification
  const elig = checkStudentEligibility(jobId, studentId);
  if (!elig.eligible) {
    return {
      error: 'You do not meet the strict eligibility criteria for this campus drive.',
      disqualified: true,
      reasons: elig.reasons
    };
  }

  const student = db.prepare('SELECT * FROM recruitment_students WHERE id = ?').get(studentId);
  const finalResumeUrl = resumeUrl || student.resume_url;

  const appId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO recruitment_applications (id, job_id, student_id, resume_snapshot_url, status, current_round_order)
    VALUES (?, ?, ?, ?, 'APPLIED', 0)
  `).run(appId, jobId, studentId, finalResumeUrl);

  // Write first audit log
  createAuditLog(appId, student.user_id, null, 'APPLIED', 'Application submitted with locked resume snapshot.');

  return { success: true, applicationId: appId };
}

function getStudentApplications(studentId) {
  // Check for expired offers first
  sweepExpiredOffers();

  const rows = db.prepare(`
    SELECT a.*,
           j.title as job_title, j.location_type, j.ctc_or_stipend,
           c.id as company_id, c.name as company_name, c.logo_url as company_logo, c.verified as company_verified,
           (
             SELECT json_object(
               'id', i.id,
               'round_name', rc.round_name,
               'round_type', rc.round_type,
               'scheduled_start', i.scheduled_start,
               'scheduled_end', i.scheduled_end,
               'meeting_link', i.meeting_link,
               'candidate_status', i.candidate_status,
               'interview_status', i.interview_status
             )
             FROM recruitment_interviews i
             JOIN recruitment_job_round_configs rc ON i.round_config_id = rc.id
             WHERE i.application_id = a.id
             ORDER BY i.scheduled_start DESC
             LIMIT 1
           ) as active_interview,
           (
             SELECT json_object(
               'id', o.id,
               'status', o.status,
               'joining_date', o.joining_date,
               'valid_until', o.valid_until,
               'ctc_breakdown', o.ctc_breakdown,
               'offer_letter_url', o.offer_letter_url
             )
             FROM recruitment_offers o
             WHERE o.application_id = a.id
           ) as offer_details
    FROM recruitment_applications a
    JOIN recruitment_jobs j ON a.job_id = j.id
    JOIN recruitment_companies c ON j.company_id = c.id
    WHERE a.student_id = ?
    ORDER BY a.applied_at DESC
  `).all(studentId);

  return rows.map(r => ({
    ...r,
    company_verified: Boolean(r.company_verified),
    active_interview: r.active_interview ? JSON.parse(r.active_interview) : null,
    offer_details: r.offer_details ? JSON.parse(r.offer_details) : null
  }));
}

function getApplicationDetails(applicationId) {
  sweepExpiredOffers();

  const app = db.prepare(`
    SELECT a.*,
           j.title as job_title, j.description as job_description, j.location_type, j.ctc_or_stipend,
           c.id as company_id, c.name as company_name, c.logo_url as company_logo, c.website as company_website,
           s.full_name as student_name, s.college_name as student_college, s.branch as student_branch,
           s.cgpa as student_cgpa, s.backlogs_count as student_backlogs, s.skills as student_skills,
           s.resume_url as student_primary_resume
    FROM recruitment_applications a
    JOIN recruitment_jobs j ON a.job_id = j.id
    JOIN recruitment_companies c ON j.company_id = c.id
    JOIN recruitment_students s ON a.student_id = s.id
    WHERE a.id = ?
  `).get(applicationId);

  if (!app) return null;

  // Rounds for this job
  const rounds = db.prepare(`
    SELECT * FROM recruitment_job_round_configs
    WHERE job_id = ?
    ORDER BY round_order ASC
  `).all(app.job_id);

  // Interviews for this application
  const interviews = db.prepare(`
    SELECT i.*, 
           rc.round_name, rc.round_type, rc.round_order,
           r.designation as recruiter_designation,
           (
             SELECT json_object(
               'id', fb.id,
               'interviewer_name', fb.interviewer_name,
               'rating', fb.rating,
               'technical_skills_rating', fb.technical_skills_rating,
               'soft_skills_rating', fb.soft_skills_rating,
               'comments', fb.comments,
               'recommendation', fb.recommendation,
               'submitted_at', fb.submitted_at
             )
             FROM recruitment_interview_feedback fb
             WHERE fb.interview_id = i.id
           ) as feedback
    FROM recruitment_interviews i
    JOIN recruitment_job_round_configs rc ON i.round_config_id = rc.id
    JOIN recruitment_recruiters r ON i.recruiter_id = r.id
    WHERE i.application_id = ?
    ORDER BY rc.round_order ASC, i.scheduled_start ASC
  `).all(applicationId);

  // Offer if any
  const offer = db.prepare(`
    SELECT * FROM recruitment_offers WHERE application_id = ?
  `).get(applicationId);

  // Audit Logs
  const auditLogs = db.prepare(`
    SELECT l.*, u.email as actor_email, u.role as actor_role
    FROM recruitment_application_audit_logs l
    JOIN recruitment_users u ON l.actor_id = u.id
    WHERE l.application_id = ?
    ORDER BY l.created_at ASC
  `).all(applicationId);

  return {
    ...app,
    student_skills: JSON.parse(app.student_skills || '[]'),
    rounds,
    interviews: interviews.map(i => ({
      ...i,
      reschedule_slots: JSON.parse(i.reschedule_slots || '[]'),
      feedback: i.feedback ? JSON.parse(i.feedback) : null
    })),
    offer: offer ? {
      ...offer,
      ctc_breakdown: JSON.parse(offer.ctc_breakdown || '{}')
    } : null,
    auditLogs
  };
}

/**
 * 3. Recruiter Candidate Management
 */
function getJobApplicants(jobId, filters = {}) {
  let query = `
    SELECT a.*,
           s.full_name, s.college_name, s.degree, s.branch, s.graduation_year,
           s.cgpa, s.backlogs_count, s.skills, s.resume_url,
           u.email as student_email,
           (SELECT COUNT(*) FROM recruitment_interviews i WHERE i.application_id = a.id) as interview_count,
           (
             SELECT i.candidate_status FROM recruitment_interviews i
             WHERE i.application_id = a.id ORDER BY i.scheduled_start DESC LIMIT 1
           ) as latest_interview_rsvp,
           (
             SELECT rc.round_name FROM recruitment_job_round_configs rc
             WHERE rc.job_id = a.job_id AND rc.round_order = a.current_round_order LIMIT 1
           ) as current_round_name
    FROM recruitment_applications a
    JOIN recruitment_students s ON a.student_id = s.id
    JOIN recruitment_users u ON s.user_id = u.id
    WHERE a.job_id = ?
  `;

  const params = [jobId];

  if (filters.status) {
    query += ' AND a.status = ?';
    params.push(filters.status);
  }
  if (filters.minCgpa) {
    query += ' AND s.cgpa >= ?';
    params.push(Number(filters.minCgpa));
  }
  if (filters.branch) {
    query += ' AND s.branch LIKE ?';
    params.push(`%${filters.branch}%`);
  }

  query += ' ORDER BY s.cgpa DESC, a.applied_at ASC';

  const rows = db.prepare(query).all(...params);
  return rows.map(r => ({
    ...r,
    skills: JSON.parse(r.skills || '[]')
  }));
}

function updateApplicationStatus(applicationId, newStatus, actorId, actionNote = '') {
  const app = db.prepare('SELECT * FROM recruitment_applications WHERE id = ?').get(applicationId);
  if (!app) throw new Error('Application not found.');

  const oldStatus = app.status;
  db.prepare(`
    UPDATE recruitment_applications
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, applicationId);

  createAuditLog(applicationId, actorId, oldStatus, newStatus, actionNote || `Transitioned status to ${newStatus}`);

  // Create notification for student
  const student = db.prepare(`
    SELECT s.user_id, j.title, c.name as company_name
    FROM recruitment_applications a
    JOIN recruitment_students s ON a.student_id = s.id
    JOIN recruitment_jobs j ON a.job_id = j.id
    JOIN recruitment_companies c ON j.company_id = c.id
    WHERE a.id = ?
  `).get(applicationId);

  if (student) {
    createNotification(
      student.user_id,
      'APPLICATION_STATUS_UPDATED',
      `Application Status Update: ${student.company_name}`,
      `Your application for ${student.title} is now ${newStatus}.`,
      { applicationId, status: newStatus }
    );
  }

  return { success: true, oldStatus, newStatus };
}

/**
 * 4. Interview Scheduling & RSVP
 */
function scheduleInterview(applicationId, roundConfigId, recruiterId, details) {
  const app = db.prepare('SELECT * FROM recruitment_applications WHERE id = ?').get(applicationId);
  if (!app) throw new Error('Application not found.');

  const roundConfig = db.prepare('SELECT * FROM recruitment_job_round_configs WHERE id = ?').get(roundConfigId);
  if (!roundConfig) throw new Error('Round configuration not found.');

  const interviewId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO recruitment_interviews (
      id, application_id, round_config_id, recruiter_id,
      scheduled_start, scheduled_end, meeting_link, meeting_location,
      instructions, candidate_status, interview_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'INVITED', 'SCHEDULED')
  `).run(
    interviewId,
    applicationId,
    roundConfigId,
    recruiterId,
    details.scheduledStart,
    details.scheduledEnd,
    details.meetingLink || 'https://meet.google.com/careerpath-session',
    details.meetingLocation || 'Virtual Room',
    details.instructions || 'Please review your project portfolio and fundamentals.'
  );

  // Advance application state to INTERVIEWING and update current_round_order
  const oldStatus = app.status;
  db.prepare(`
    UPDATE recruitment_applications
    SET status = 'INTERVIEWING', current_round_order = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(roundConfig.round_order, applicationId);

  const recruiter = db.prepare('SELECT user_id FROM recruitment_recruiters WHERE id = ?').get(recruiterId);
  const actorUserId = recruiter ? recruiter.user_id : recruiterId;

  createAuditLog(
    applicationId,
    actorUserId,
    oldStatus,
    'INTERVIEWING',
    `Scheduled ${roundConfig.round_name} for ${details.scheduledStart}`
  );

  // Notify Student
  const student = db.prepare(`
    SELECT s.user_id, j.title, c.name as company_name
    FROM recruitment_applications a
    JOIN recruitment_students s ON a.student_id = s.id
    JOIN recruitment_jobs j ON a.job_id = j.id
    JOIN recruitment_companies c ON j.company_id = c.id
    WHERE a.id = ?
  `).get(applicationId);

  if (student) {
    createNotification(
      student.user_id,
      'INTERVIEW_INVITED',
      `Interview Slot Proposed: ${student.company_name}`,
      `You are invited to ${roundConfig.round_name} scheduled on ${new Date(details.scheduledStart).toLocaleString()}. Please confirm RSVP.`,
      { interviewId, applicationId, roundName: roundConfig.round_name }
    );
  }

  return { success: true, interviewId };
}

function respondToInterview(interviewId, studentId, action, reason = '', slotPreferences = []) {
  const interview = db.prepare(`
    SELECT i.*, a.student_id, a.id as application_id, r.user_id as recruiter_user_id, rc.round_name
    FROM recruitment_interviews i
    JOIN recruitment_applications a ON i.application_id = a.id
    JOIN recruitment_job_round_configs rc ON i.round_config_id = rc.id
    JOIN recruitment_recruiters r ON i.recruiter_id = r.id
    WHERE i.id = ?
  `).get(interviewId);

  if (!interview) throw new Error('Interview not found.');
  if (interview.student_id !== studentId) throw new Error('Unauthorized RSVP action.');

  let newCandidateStatus = 'INVITED';
  let auditNote = '';

  if (action === 'ACCEPT') {
    newCandidateStatus = 'ACCEPTED';
    auditNote = `Student accepted interview slot for ${interview.round_name}.`;
    
    // Notify recruiter
    createNotification(
      interview.recruiter_user_id,
      'INTERVIEW_CONFIRMED',
      'Candidate Confirmed Interview Slot',
      `Candidate confirmed attendance for ${interview.round_name}.`,
      { interviewId, applicationId: interview.application_id }
    );
  } else if (action === 'RESCHEDULE') {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Mandatory reason required to request a reschedule.');
    }
    newCandidateStatus = 'RESCHEDULE_REQUESTED';
    auditNote = `Student requested reschedule for ${interview.round_name}. Reason: ${reason}`;

    // Notify recruiter
    createNotification(
      interview.recruiter_user_id,
      'INTERVIEW_RESCHEDULE_REQ',
      'Action Required: Candidate Requested Interview Reschedule',
      `Candidate requested reschedule for ${interview.round_name}. Reason: ${reason}`,
      { interviewId, applicationId: interview.application_id, reason, slotPreferences }
    );
  } else if (action === 'DECLINE') {
    newCandidateStatus = 'DECLINED';
    auditNote = `Student declined interview slot for ${interview.round_name}. Note: ${reason || 'No reason provided'}`;

    // Update application to WITHDRAWN
    db.prepare(`UPDATE recruitment_applications SET status = 'WITHDRAWN' WHERE id = ?`).run(interview.application_id);
  } else {
    throw new Error('Invalid RSVP action.');
  }

  db.prepare(`
    UPDATE recruitment_interviews
    SET candidate_status = ?,
        reschedule_reason = ?,
        reschedule_slots = ?
    WHERE id = ?
  `).run(newCandidateStatus, reason, JSON.stringify(slotPreferences), interviewId);

  // Student user ID
  const student = db.prepare('SELECT user_id FROM recruitment_students WHERE id = ?').get(studentId);
  createAuditLog(interview.application_id, student.user_id, 'INTERVIEWING', 'INTERVIEWING', auditNote);

  return { success: true, candidateStatus: newCandidateStatus };
}

function submitInterviewFeedback(interviewId, recruiterId, feedbackData) {
  const interview = db.prepare(`
    SELECT i.*, a.id as application_id, a.job_id, rc.round_order, rc.round_name,
           (SELECT COUNT(*) FROM recruitment_job_round_configs rc2 WHERE rc2.job_id = a.job_id) as total_rounds
    FROM recruitment_interviews i
    JOIN recruitment_applications a ON i.application_id = a.id
    JOIN recruitment_job_round_configs rc ON i.round_config_id = rc.id
    WHERE i.id = ?
  `).get(interviewId);

  if (!interview) throw new Error('Interview record not found.');

  const feedbackId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO recruitment_interview_feedback (
      id, interview_id, interviewer_name, rating,
      technical_skills_rating, soft_skills_rating, comments, recommendation
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (interview_id) DO UPDATE SET
      rating = excluded.rating,
      technical_skills_rating = excluded.technical_skills_rating,
      soft_skills_rating = excluded.soft_skills_rating,
      comments = excluded.comments,
      recommendation = excluded.recommendation,
      submitted_at = CURRENT_TIMESTAMP
  `).run(
    feedbackId,
    interviewId,
    feedbackData.interviewerName || 'Campus Technical Panel',
    feedbackData.rating || 4,
    feedbackData.technicalRating || 4,
    feedbackData.softSkillsRating || 4,
    feedbackData.comments || 'Evaluated candidate on problem solving and clarity.',
    feedbackData.recommendation || 'NEXT_ROUND'
  );

  // Mark interview COMPLETED
  db.prepare(`UPDATE recruitment_interviews SET interview_status = 'COMPLETED' WHERE id = ?`).run(interviewId);

  // Handle Round Verdict & State Transitions
  let newAppStatus = 'INTERVIEWING';
  let actionNote = `Feedback submitted for ${interview.round_name}. Recommendation: ${feedbackData.recommendation}.`;

  if (feedbackData.recommendation === 'REJECT') {
    newAppStatus = 'REJECTED';
    actionNote = `Candidate rejected based on ${interview.round_name} evaluation.`;
  } else if (feedbackData.recommendation === 'STRONG_HIRE' || feedbackData.recommendation === 'HIRE') {
    // If it's the final round or strong hire
    if (interview.round_order >= interview.total_rounds - 1) {
      newAppStatus = 'SELECTED';
      actionNote = `Candidate passed final round (${interview.round_name}) with recommendation: ${feedbackData.recommendation}. Ready for offer issuance.`;
    } else {
      newAppStatus = 'SHORTLISTED';
      actionNote = `Candidate cleared ${interview.round_name} and advanced to next stage.`;
    }
  } else if (feedbackData.recommendation === 'NEXT_ROUND') {
    newAppStatus = 'SHORTLISTED';
    actionNote = `Candidate recommended for next round after ${interview.round_name}.`;
  }

  // Update application
  db.prepare(`
    UPDATE recruitment_applications
    SET status = ?, current_round_order = current_round_order + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newAppStatus, interview.application_id);

  // Recruiter User ID
  const recruiter = db.prepare('SELECT user_id FROM recruitment_recruiters WHERE id = ?').get(recruiterId);
  createAuditLog(interview.application_id, recruiter.user_id, 'INTERVIEWING', newAppStatus, actionNote);

  return { success: true, recommendation: feedbackData.recommendation, applicationStatus: newAppStatus };
}

/**
 * 5. Offers & Lifecycle Expiration
 */
function issueOffer(applicationId, recruiterId, offerData) {
  const app = db.prepare('SELECT * FROM recruitment_applications WHERE id = ?').get(applicationId);
  if (!app) throw new Error('Application not found.');

  const existingOffer = db.prepare('SELECT id FROM recruitment_offers WHERE application_id = ?').get(applicationId);
  const offerId = existingOffer ? existingOffer.id : crypto.randomUUID();
  const validUntilDays = offerData.validDays || 5;
  const validUntil = new Date(Date.now() + validUntilDays * 86400000).toISOString();

  const ctcPayload = JSON.stringify(offerData.ctcBreakdown || {
    baseSalary: '₹14,00,000',
    variablePay: '₹3,00,000',
    stockGrants: '₹4,00,000 (4-year vesting)',
    benefits: '₹1,50,000',
    totalCtc: '₹22,50,000'
  });

  db.prepare(`
    INSERT INTO recruitment_offers (
      id, application_id, ctc_breakdown, joining_date, valid_until, offer_letter_url, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'ISSUED')
    ON CONFLICT (application_id) DO UPDATE SET
      ctc_breakdown = excluded.ctc_breakdown,
      joining_date = excluded.joining_date,
      valid_until = excluded.valid_until,
      offer_letter_url = excluded.offer_letter_url,
      status = 'ISSUED',
      acted_at = NULL
  `).run(
    offerId,
    applicationId,
    ctcPayload,
    offerData.joiningDate || '2027-07-01',
    validUntil,
    offerData.offerLetterUrl || `/documents/offers/offer_${applicationId}.pdf`
  );

  // Update application status to OFFERED
  const oldStatus = app.status;
  db.prepare(`
    UPDATE recruitment_applications
    SET status = 'OFFERED', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(applicationId);

  const recruiter = db.prepare('SELECT user_id FROM recruitment_recruiters WHERE id = ?').get(recruiterId);
  createAuditLog(
    applicationId,
    recruiter.user_id,
    oldStatus,
    'OFFERED',
    `Official employment offer issued. Expiration window: ${validUntilDays} days (expires ${validUntil}).`
  );

  // Push Celebration Notification to Student
  const student = db.prepare(`
    SELECT s.user_id, j.title, c.name as company_name
    FROM recruitment_applications a
    JOIN recruitment_students s ON a.student_id = s.id
    JOIN recruitment_jobs j ON a.job_id = j.id
    JOIN recruitment_companies c ON j.company_id = c.id
    WHERE a.id = ?
  `).get(applicationId);

  if (student) {
    createNotification(
      student.user_id,
      'OFFER_ISSUED',
      `🎉 Congratulations! Offer Received from ${student.company_name}`,
      `You have received an official offer of employment for ${student.title}! Review CTC breakdown and accept before ${new Date(validUntil).toLocaleDateString()}.`,
      { offerId, applicationId, validUntil }
    );
  }

  return { success: true, offerId, validUntil };
}

function respondToOffer(offerId, studentId, action) {
  sweepExpiredOffers();

  const offer = db.prepare(`
    SELECT o.*, a.student_id, a.id as application_id, j.recruiter_id, j.title, c.name as company_name
    FROM recruitment_offers o
    JOIN recruitment_applications a ON o.application_id = a.id
    JOIN recruitment_jobs j ON a.job_id = j.id
    JOIN recruitment_companies c ON j.company_id = c.id
    WHERE o.id = ?
  `).get(offerId);

  if (!offer) throw new Error('Offer not found.');
  if (offer.student_id !== studentId) throw new Error('Unauthorized offer response.');

  if (offer.status === 'EXPIRED') {
    throw new Error('This offer has elapsed its validity window and is now expired.');
  }

  const now = new Date();
  if (new Date(offer.valid_until) < now) {
    db.prepare(`UPDATE recruitment_offers SET status = 'EXPIRED' WHERE id = ?`).run(offerId);
    db.prepare(`UPDATE recruitment_applications SET status = 'REJECTED' WHERE id = ?`).run(offer.application_id);
    throw new Error('Offer expiration deadline passed. Status updated to EXPIRED.');
  }

  const student = db.prepare('SELECT user_id FROM recruitment_students WHERE id = ?').get(studentId);

  if (action === 'ACCEPT') {
    db.prepare(`
      UPDATE recruitment_offers
      SET status = 'ACCEPTED', acted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(offerId);

    db.prepare(`
      UPDATE recruitment_applications
      SET status = 'HIRED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(offer.application_id);

    createAuditLog(
      offer.application_id,
      student.user_id,
      'OFFERED',
      'HIRED',
      'Student signed and accepted employment offer. Candidate successfully HIRED.'
    );

    // Notify Recruiter
    const recruiter = db.prepare('SELECT user_id FROM recruitment_recruiters WHERE id = ?').get(offer.recruiter_id);
    createNotification(
      recruiter.user_id,
      'OFFER_ACCEPTED',
      'Candidate Accepted Offer!',
      `Candidate has accepted the offer for ${offer.title} at ${offer.company_name}!`,
      { offerId, applicationId: offer.application_id }
    );

    return { success: true, status: 'HIRED' };
  } else if (action === 'DECLINE') {
    db.prepare(`
      UPDATE recruitment_offers
      SET status = 'DECLINED', acted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(offerId);

    db.prepare(`
      UPDATE recruitment_applications
      SET status = 'REJECTED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(offer.application_id);

    createAuditLog(
      offer.application_id,
      student.user_id,
      'OFFERED',
      'REJECTED',
      'Student declined employment offer.'
    );

    return { success: true, status: 'DECLINED' };
  } else {
    throw new Error('Invalid action. Must be ACCEPT or DECLINE.');
  }
}

/**
 * Sweeps and auto-expires unacted offers past valid_until timestamp
 */
function sweepExpiredOffers() {
  const expired = db.prepare(`
    SELECT o.id, o.application_id, a.student_id, a.job_id
    FROM recruitment_offers o
    JOIN recruitment_applications a ON o.application_id = a.id
    WHERE o.status = 'ISSUED' AND o.valid_until < datetime('now')
  `).all();

  for (const item of expired) {
    db.prepare(`UPDATE recruitment_offers SET status = 'EXPIRED' WHERE id = ?`).run(item.id);
    db.prepare(`UPDATE recruitment_applications SET status = 'REJECTED' WHERE id = ?`).run(item.application_id);

    // SYSTEM actor
    const adminUser = db.prepare("SELECT id FROM recruitment_users WHERE role = 'ADMIN' LIMIT 1").get();
    const actorId = adminUser ? adminUser.id : 'u0000000-0000-0000-0000-000000000004';

    createAuditLog(
      item.application_id,
      actorId,
      'OFFERED',
      'REJECTED',
      'Offer validity period expired automatically. Recruitment quota freed.'
    );
  }
}

/**
 * 6. Audit Logs & Notifications
 */
function createAuditLog(applicationId, actorId, prevStatus, newStatus, actionNote) {
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO recruitment_application_audit_logs (
      id, application_id, actor_id, previous_status, new_status, action_note
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, applicationId, actorId, prevStatus, newStatus, actionNote);
  return id;
}

function createNotification(userId, type, title, message, metadata = {}) {
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO recruitment_notifications (
      id, user_id, type, title, message, metadata, is_read
    ) VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(id, userId, type, title, message, JSON.stringify(metadata));
  return id;
}

function getUserNotifications(userId) {
  const rows = db.prepare(`
    SELECT * FROM recruitment_notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 30
  `).all(userId);

  return rows.map(r => ({
    ...r,
    metadata: JSON.parse(r.metadata || '{}'),
    is_read: Boolean(r.is_read)
  }));
}

function markNotificationAsRead(notificationId, userId) {
  db.prepare(`
    UPDATE recruitment_notifications
    SET is_read = 1
    WHERE id = ? AND user_id = ?
  `).run(notificationId, userId);
  return { success: true };
}

/**
 * 7. AI Prep Suite Generation & Evaluation
 */
function generateAiPrepQuestions(jobId, roundConfigId) {
  const job = getJobById(jobId);
  const round = db.prepare('SELECT * FROM recruitment_job_round_configs WHERE id = ?').get(roundConfigId);

  const roundName = round ? round.round_name : 'Technical Round';
  const roundType = round ? round.round_type : 'TECHNICAL';

  let questions = [];

  if (roundType === 'CODING' || roundType === 'TECHNICAL') {
    questions = [
      {
        id: 'q-dsa-1',
        category: 'Algorithms & Data Structures',
        question: `In a high-scale service like ${job ? job.company_name : 'Google'}, explain how you would design an LRU (Least Recently Used) cache with O(1) get and put operations. What data structures are required, and how would you make it thread-safe for concurrent read/write threads?`,
        hints: ['Consider combination of Doubly Linked List and Hash Map', 'Think about ReadWriteLock vs fine-grained segment locks'],
        expectedKeywords: ['doubly linked list', 'hash map', 'o(1)', 'concurrency', 'readwritelock', 'mutex', 'thread safe', 'eviction']
      },
      {
        id: 'q-dsa-2',
        category: 'System Design & Distributed Data',
        question: `How would you design a distributed rate limiter that throttles API clients to 100 requests per minute? Discuss the trade-offs between Token Bucket, Leaky Bucket, and Sliding Window Counter across multiple stateless server nodes.`,
        hints: ['Redis atomic scripts (INCR, EXPIRE) or sliding window sorted sets', 'Race conditions with eventual consistency'],
        expectedKeywords: ['token bucket', 'sliding window', 'redis', 'lua script', 'concurrency', 'clock skew', 'race condition']
      },
      {
        id: 'q-dsa-3',
        category: 'Database Architecture & CS Core',
        question: `Explain how B+ Tree database indexes work in PostgreSQL or relational engines. Why are B+ Trees preferred over Binary Search Trees or Hash Indexes for range queries?`,
        hints: ['Disk page I/O, cache locality, sequential disk scan for range scans', 'Tree fanout and shallow depth'],
        expectedKeywords: ['b+ tree', 'range query', 'disk i/o', 'page', 'fanout', 'leaf nodes', 'linked list', 'cache locality']
      }
    ];
  } else if (roundType === 'HR' || roundType === 'MANAGERIAL') {
    questions = [
      {
        id: 'q-hr-1',
        category: 'Behavioral Leadership (STAR)',
        question: `Tell me about a time when you were working on a complex group engineering project and encountered a fundamental technical disagreement with a teammate. How did you resolve the conflict to ship on time?`,
        hints: ['Structure using Situation, Task, Action, Result', 'Focus on data-driven benchmarking and respectful communication'],
        expectedKeywords: ['situation', 'task', 'action', 'result', 'data', 'communication', 'benchmark', 'compromise', 'collaboration']
      },
      {
        id: 'q-hr-2',
        category: 'Ownership & Failure Analysis',
        question: `Describe a scenario where a piece of code or design you submitted failed in production or during evaluation. What did you learn, and what automated safeguards did you put in place?`,
        hints: ['Emphasize accountability, post-mortem root cause analysis, and regression tests'],
        expectedKeywords: ['root cause', 'post-mortem', 'testing', 'safeguards', 'accountability', 'unit tests', 'monitoring']
      }
    ];
  } else {
    questions = [
      {
        id: 'q-apt-1',
        category: 'Analytical Problem Solving',
        question: `A worker takes 12 days to complete a job alone, while a second worker takes 18 days. If they work on alternate days starting with the first worker, in how many days will the job be completed? Walk through your mathematical reasoning step by step.`,
        hints: ['Find 2-day combined efficiency using LCM of 12 and 18 (36 units)'],
        expectedKeywords: ['lcm', 'efficiency', 'units of work', 'alternate days', '14.5 days', '36 units']
      }
    ];
  }

  return {
    targetCompany: job ? job.company_name : 'Enterprise Partner',
    targetRole: job ? job.title : 'Software Engineer',
    roundName,
    roundType,
    questions
  };
}

function evaluateAiPrepAnswer(question, answerText) {
  const text = (answerText || '').trim();
  const lowerAnswer = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const expectedKeywords = question.expectedKeywords || [];
  const matchedKeywords = expectedKeywords.filter(kw => lowerAnswer.includes(kw.toLowerCase()));
  const missingKeywords = expectedKeywords.filter(kw => !lowerAnswer.includes(kw.toLowerCase()));

  // 1. Conceptual Accuracy %
  const keywordRatio = expectedKeywords.length > 0 ? (matchedKeywords.length / expectedKeywords.length) : 0.8;
  const conceptualAccuracy = Math.min(100, Math.round(keywordRatio * 85 + (wordCount >= 50 ? 15 : wordCount * 0.3)));

  // 2. Communication Clarity %
  const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'actually'];
  const fillerCount = fillers.reduce((acc, f) => {
    const reg = new RegExp(`\\b${f}\\b`, 'gi');
    return acc + (text.match(reg) || []).length;
  }, 0);
  let clarityScore = 95;
  if (fillerCount > 4) clarityScore -= 30;
  else if (fillerCount > 2) clarityScore -= 15;
  if (wordCount < 25) clarityScore -= 20;

  // 3. Missing Edge Cases
  const missingEdgeCases = [];
  if (!lowerAnswer.includes('concurrency') && !lowerAnswer.includes('thread') && question.category.includes('Algorithms')) {
    missingEdgeCases.push('Thread safety & race conditions during simultaneous read/write operations');
  }
  if (!lowerAnswer.includes('time complexity') && !lowerAnswer.includes('o(1)') && !lowerAnswer.includes('big-o')) {
    missingEdgeCases.push('Explicit Big-O time and space complexity quantification');
  }
  if (!lowerAnswer.includes('result') && question.category.includes('STAR')) {
    missingEdgeCases.push('Measurable business impact or quantifiable metrics in the Result phase');
  }

  // 4. STAR Model Answer Comparison
  const modelAnswer = `A high-scoring answer clearly articulates the core architecture first: combine a Doubly Linked List with a Hash Map where keys map to list nodes. The Hash Map provides O(1) lookup, and the Doubly Linked List enables O(1) removal and insertion at the head for recency. When capacity is exceeded, evict the node at the tail. To ensure thread safety, wrap operations in a ReadWriteLock or employ concurrent segmentation.`;

  return {
    scoreOutOf10: Math.round(((conceptualAccuracy * 0.6 + clarityScore * 0.4) / 10) * 10) / 10,
    conceptualAccuracy,
    communicationClarity: clarityScore,
    matchedKeywords,
    missingKeywords,
    missingEdgeCases,
    modelAnswer,
    wordCount,
    fillerCount
  };
}

module.exports = {
  db,
  initRelationalRecruitmentSchema,
  getPublishedJobs,
  getJobById,
  checkStudentEligibility,
  applyForJob,
  getStudentApplications,
  getApplicationDetails,
  getJobApplicants,
  updateApplicationStatus,
  scheduleInterview,
  respondToInterview,
  submitInterviewFeedback,
  issueOffer,
  respondToOffer,
  sweepExpiredOffers,
  createAuditLog,
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  generateAiPrepQuestions,
  evaluateAiPrepAnswer
};
