/**
 * CareerPath - REST API Endpoints for Interview-to-Hire Workflow
 * Implements Phase 3 Specification with strict role-based operations,
 * eligibility gate checks, multi-parameter interview scorecards,
 * offer expiration checks, AI interview preparation, and real-time event publishing.
 */

const express = require('express');
const router = express.Router();
const db = require('../db/interviewToHireDb');
const gateway = require('../services/workflowWebSocket');

// Helper to resolve current student ID (defaults to primary demo student)
function resolveStudentId(req) {
  return req.body.studentId || req.query.studentId || 's0000000-0000-0000-0000-000000000001';
}

// Helper to resolve recruiter ID (defaults to Google recruiter)
function resolveRecruiterId(req) {
  return req.body.recruiterId || req.query.recruiterId || 'r0000000-0000-0000-0000-000000000001';
}

// Helper to resolve user ID
function resolveUserId(req) {
  return req.body.userId || req.query.userId || 'u0000000-0000-0000-0000-000000000001';
}

// =========================================================================
// 1. JOBS & ELIGIBILITY VERIFICATION
// =========================================================================

/**
 * GET /api/v1/jobs - List all published jobs & campus drives
 */
router.get('/jobs', (req, res) => {
  try {
    const jobs = db.getPublishedJobs();
    res.json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    console.error('[WORKFLOW GET JOBS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/jobs/:id - Get specific job details & round configurations
 */
router.get('/jobs/:id', (req, res) => {
  try {
    const job = db.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job posting not found.' });
    }
    res.json({ success: true, job });
  } catch (err) {
    console.error('[WORKFLOW GET JOB BY ID ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/jobs/:id/check-eligibility - Validate student profile against rules
 * Access Role: STUDENT
 */
router.post('/jobs/:id/check-eligibility', (req, res) => {
  try {
    const studentId = resolveStudentId(req);
    const result = db.checkStudentEligibility(req.params.id, studentId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[CHECK ELIGIBILITY ERROR]', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/v1/jobs/:id/apply - Multipart/resume snapshot lock + application record
 * Access Role: STUDENT
 */
router.post('/jobs/:id/apply', (req, res) => {
  try {
    const studentId = resolveStudentId(req);
    const { resumeUrl } = req.body;

    const result = db.applyForJob(req.params.id, studentId, resumeUrl);
    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error,
        disqualified: result.disqualified,
        reasons: result.reasons
      });
    }

    // Broadcast Real-time Event to Recruiter / Job Manager
    gateway.broadcast('APPLICATION_STATUS_UPDATED', {
      applicationId: result.applicationId,
      jobId: req.params.id,
      status: 'APPLIED'
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully with locked resume snapshot.',
      applicationId: result.applicationId,
      status: 'APPLIED'
    });
  } catch (err) {
    console.error('[APPLY ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 2. APPLICATIONS MANAGEMENT
// =========================================================================

/**
 * GET /api/v1/student/applications - Paginated summary with current status & events
 * Access Role: STUDENT
 */
router.get('/student/applications', (req, res) => {
  try {
    const studentId = resolveStudentId(req);
    const applications = db.getStudentApplications(studentId);

    // Compute top stats strip
    const totalApplied = applications.length;
    const inProgress = applications.filter(a => ['UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEWING'].includes(a.status)).length;
    const interviewsScheduled = applications.filter(a => a.status === 'INTERVIEWING' && a.active_interview).length;
    const offersReceived = applications.filter(a => ['OFFERED', 'HIRED'].includes(a.status)).length;

    res.json({
      success: true,
      stats: {
        totalApplied,
        inProgress,
        interviewsScheduled,
        offersReceived
      },
      applications
    });
  } catch (err) {
    console.error('[GET STUDENT APPS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/student/applications/:id - Full details with visual timeline & audit logs
 * Access Role: STUDENT / RECRUITER
 */
router.get('/student/applications/:id', (req, res) => {
  try {
    const application = db.getApplicationDetails(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application record not found.' });
    }
    res.json({ success: true, application });
  } catch (err) {
    console.error('[GET APP DETAILS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/recruiter/jobs - Recruiter's jobs list
 * Access Role: RECRUITER
 */
router.get('/recruiter/jobs', (req, res) => {
  try {
    const jobs = db.getPublishedJobs();
    res.json({ success: true, jobs });
  } catch (err) {
    console.error('[GET RECRUITER JOBS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/recruiter/jobs/:id/applicants - Filterable candidate table
 * Access Role: RECRUITER
 */
router.get('/recruiter/jobs/:id/applicants', (req, res) => {
  try {
    const { status, minCgpa, branch } = req.query;
    const applicants = db.getJobApplicants(req.params.id, { status, minCgpa, branch });
    res.json({ success: true, count: applicants.length, applicants });
  } catch (err) {
    console.error('[GET APPLICANTS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/v1/recruiter/applications/:id/status - Transitions candidate status
 * Access Role: RECRUITER
 */
router.patch('/recruiter/applications/:id/status', (req, res) => {
  try {
    const { status, note } = req.body;
    const actorId = resolveUserId(req);

    if (!status) {
      return res.status(400).json({ error: 'New status is required.' });
    }

    const result = db.updateApplicationStatus(req.params.id, status, actorId, note);

    // Push Real-time update
    gateway.broadcast('APPLICATION_STATUS_UPDATED', {
      applicationId: req.params.id,
      oldStatus: result.oldStatus,
      newStatus: result.newStatus,
      note
    });

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      ...result
    });
  } catch (err) {
    console.error('[UPDATE APP STATUS ERROR]', err);
    res.status(400).json({ error: err.message });
  }
});

// =========================================================================
// 3. INTERVIEW SCHEDULING & STUDENT RSVP
// =========================================================================

/**
 * POST /api/v1/recruiter/applications/:id/interviews - Creates interview record & pushes invite
 * Access Role: RECRUITER
 */
router.post('/recruiter/applications/:id/interviews', (req, res) => {
  try {
    const {
      roundConfigId,
      scheduledStart,
      scheduledEnd,
      meetingLink,
      meetingLocation,
      instructions
    } = req.body;

    const recruiterId = resolveRecruiterId(req);

    if (!roundConfigId || !scheduledStart || !scheduledEnd) {
      return res.status(400).json({ error: 'roundConfigId, scheduledStart, and scheduledEnd are required.' });
    }

    const result = db.scheduleInterview(req.params.id, roundConfigId, recruiterId, {
      scheduledStart,
      scheduledEnd,
      meetingLink,
      meetingLocation,
      instructions
    });

    // Push Real-time Event to Candidate
    gateway.broadcast('INTERVIEW_INVITED', {
      interviewId: result.interviewId,
      applicationId: req.params.id,
      scheduledStart,
      meetingLink
    });

    res.status(201).json({
      success: true,
      message: 'Interview scheduled and candidate invited.',
      interviewId: result.interviewId
    });
  } catch (err) {
    console.error('[SCHEDULE INTERVIEW ERROR]', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/v1/student/interviews - Get student's interview schedule
 * Access Role: STUDENT
 */
router.get('/student/interviews', (req, res) => {
  try {
    const studentId = resolveStudentId(req);
    const applications = db.getStudentApplications(studentId);

    const allInterviews = [];
    applications.forEach(app => {
      const details = db.getApplicationDetails(app.id);
      if (details && details.interviews) {
        details.interviews.forEach(inv => {
          allInterviews.push({
            ...inv,
            company_name: app.company_name,
            company_logo: app.company_logo,
            job_title: app.job_title,
            application_id: app.id,
            job_id: app.job_id
          });
        });
      }
    });

    // Split into upcoming, pending RSVP, and past
    const now = new Date();
    const pendingRsvp = allInterviews.filter(i => i.candidate_status === 'INVITED');
    const upcoming = allInterviews.filter(i => i.candidate_status === 'ACCEPTED' && new Date(i.scheduled_start) >= now);
    const past = allInterviews.filter(i => i.interview_status === 'COMPLETED' || new Date(i.scheduled_end) < now);

    res.json({
      success: true,
      counts: {
        total: allInterviews.length,
        pendingRsvp: pendingRsvp.length,
        upcoming: upcoming.length,
        past: past.length
      },
      interviews: {
        pendingRsvp,
        upcoming,
        past,
        all: allInterviews
      }
    });
  } catch (err) {
    console.error('[GET STUDENT INTERVIEWS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/v1/student/interviews/:id/respond - RSVP response: ACCEPT, DECLINE, RESCHEDULE
 * Access Role: STUDENT
 */
router.patch('/student/interviews/:id/respond', (req, res) => {
  try {
    const studentId = resolveStudentId(req);
    const { action, reason, slotPreferences } = req.body;

    if (!['ACCEPT', 'DECLINE', 'RESCHEDULE'].includes(action)) {
      return res.status(400).json({ error: 'Action must be ACCEPT, DECLINE, or RESCHEDULE.' });
    }

    const result = db.respondToInterview(req.params.id, studentId, action, reason, slotPreferences);

    // Broadcast Real-time event
    if (action === 'ACCEPT') {
      gateway.broadcast('INTERVIEW_CONFIRMED', { interviewId: req.params.id, status: 'ACCEPTED' });
    } else if (action === 'RESCHEDULE') {
      gateway.broadcast('INTERVIEW_RESCHEDULE_REQ', {
        interviewId: req.params.id,
        reason,
        slotPreferences
      });
    }

    res.json({
      success: true,
      message: `Interview response recorded: ${action}`,
      ...result
    });
  } catch (err) {
    console.error('[RESPOND INTERVIEW ERROR]', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/v1/recruiter/interviews/:id/feedback - Submits structured scorecards & recommendation
 * Access Role: RECRUITER
 */
router.post('/recruiter/interviews/:id/feedback', (req, res) => {
  try {
    const recruiterId = resolveRecruiterId(req);
    const {
      interviewerName,
      rating,
      technicalRating,
      softSkillsRating,
      comments,
      recommendation
    } = req.body;

    if (!comments || !recommendation) {
      return res.status(400).json({ error: 'Comments and recommendation are mandatory.' });
    }

    const result = db.submitInterviewFeedback(req.params.id, recruiterId, {
      interviewerName,
      rating,
      technicalRating,
      softSkillsRating,
      comments,
      recommendation
    });

    // Real-time broadcast
    gateway.broadcast('APPLICATION_STATUS_UPDATED', {
      interviewId: req.params.id,
      recommendation,
      applicationStatus: result.applicationStatus
    });

    res.status(201).json({
      success: true,
      message: 'Evaluation scorecard submitted successfully.',
      ...result
    });
  } catch (err) {
    console.error('[SUBMIT FEEDBACK ERROR]', err);
    res.status(400).json({ error: err.message });
  }
});

// =========================================================================
// 4. HIRING, OFFERS & EXPIRATION LIFECYCLE
// =========================================================================

/**
 * POST /api/v1/recruiter/applications/:id/offer - Issues official offer with CTC payload and expiry
 * Access Role: RECRUITER
 */
router.post('/recruiter/applications/:id/offer', (req, res) => {
  try {
    const recruiterId = resolveRecruiterId(req);
    const { ctcBreakdown, joiningDate, validDays, offerLetterUrl } = req.body;

    const result = db.issueOffer(req.params.id, recruiterId, {
      ctcBreakdown,
      joiningDate,
      validDays: validDays || 5,
      offerLetterUrl
    });

    // Real-time Push Celebration
    gateway.broadcast('OFFER_ISSUED', {
      applicationId: req.params.id,
      offerId: result.offerId,
      validUntil: result.validUntil
    });

    res.status(201).json({
      success: true,
      message: 'Official employment offer issued with expiration deadline.',
      ...result
    });
  } catch (err) {
    console.error('[ISSUE OFFER ERROR]', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * PATCH /api/v1/student/offers/:id/respond - Respond to offer (ACCEPT / DECLINE)
 * Access Role: STUDENT
 */
router.patch('/student/offers/:id/respond', (req, res) => {
  try {
    const studentId = resolveStudentId(req);
    const { action } = req.body;

    if (!['ACCEPT', 'DECLINE'].includes(action)) {
      return res.status(400).json({ error: 'Action must be ACCEPT or DECLINE.' });
    }

    const result = db.respondToOffer(req.params.id, studentId, action);

    if (action === 'ACCEPT') {
      gateway.broadcast('APPLICATION_STATUS_UPDATED', {
        offerId: req.params.id,
        status: 'HIRED'
      });
    }

    res.json({
      success: true,
      message: action === 'ACCEPT' ? '🎉 Congratulations! Offer accepted. Status is now HIRED.' : 'Offer declined.',
      ...result
    });
  } catch (err) {
    console.error('[RESPOND OFFER ERROR]', err);
    res.status(400).json({ error: err.message });
  }
});

// =========================================================================
// 5. AI INTERVIEW PREPARATION SUITE
// =========================================================================

/**
 * POST /api/v1/ai/interview-prep/generate - Generates tailored questions based on JD, round & resume
 * Access Role: STUDENT
 */
router.post('/ai/interview-prep/generate', (req, res) => {
  try {
    const { jobId, roundConfigId, resumeText } = req.body;
    if (!jobId || !roundConfigId) {
      return res.status(400).json({ error: 'jobId and roundConfigId are required.' });
    }

    const prep = db.generateAiPrepQuestions(jobId, roundConfigId, resumeText);
    res.json({ success: true, prep });
  } catch (err) {
    console.error('[AI PREP GENERATE ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/ai/interview-prep/evaluate - Evaluates student answer with rubric & STAR model answer
 * Access Role: STUDENT
 */
router.post('/ai/interview-prep/evaluate', (req, res) => {
  try {
    const { question, answerText } = req.body;
    if (!question || !answerText) {
      return res.status(400).json({ error: 'question object and answerText are required.' });
    }

    const evaluation = db.evaluateAiPrepAnswer(question, answerText);
    res.json({ success: true, evaluation });
  } catch (err) {
    console.error('[AI PREP EVALUATE ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// 6. NOTIFICATIONS & REAL-TIME EVENT STREAM
// =========================================================================

/**
 * GET /api/v1/student/notifications - In-app notifications
 */
router.get('/student/notifications', (req, res) => {
  try {
    const userId = resolveUserId(req);
    const notifications = db.getUserNotifications(userId);
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('[GET NOTIFS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/v1/notifications/:id/read - Mark notification as read
 */
router.patch('/notifications/:id/read', (req, res) => {
  try {
    const userId = resolveUserId(req);
    const result = db.markNotificationAsRead(req.params.id, userId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[MARK READ ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/events/stream - Server-Sent Events stream for real-time frontend updates
 */
router.get('/events/stream', (req, res) => {
  gateway.handleSseRoute(req, res);
});

module.exports = router;
