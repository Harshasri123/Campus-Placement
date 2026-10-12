/**
 * CareerPath - Backend Application Server
 * End-to-end career readiness platform for campus placement training and competitive exams.
 * Express REST API with JWT Auth, Timed Assessment Engine, In-Browser Compiler,
 * AI Resume Matcher, AI Interview Assistant, and SQLite Persistence.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'online-quiz-jwt-super-secret-key-2026';

// Middleware
app.use(cors());
app.use(express.json());

const http = require('http');

// Optional Reverse-proxy /api routes to PostgreSQL Backend (Port 5000)
let isBackendAvailable = false;
let lastCheckTime = 0;

function checkBackendAvailable(callback) {
  const now = Date.now();
  if (now - lastCheckTime < 10000) {
    return callback(isBackendAvailable);
  }
  lastCheckTime = now;
  const testReq = http.request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/health',
    method: 'GET',
    timeout: 300
  }, (res) => {
    isBackendAvailable = (res.statusCode < 500);
    callback(isBackendAvailable);
  });
  testReq.on('error', () => {
    isBackendAvailable = false;
    callback(false);
  });
  testReq.on('timeout', () => {
    testReq.destroy();
    isBackendAvailable = false;
    callback(false);
  });
  testReq.end();
}

app.use(['/api/auth', '/api/topics', '/api/questions', '/api/bookmarks', '/api/placement', '/api/assessment', '/api/test-db', '/api/mock-test'], (req, res, next) => {
  checkBackendAvailable((available) => {
    if (!available) {
      return next();
    }
    const targetPath = req.baseUrl + req.url;
    const headers = { ...req.headers, host: 'localhost:5000' };
    delete headers['content-length'];
    
    let bodyData = null;
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      bodyData = JSON.stringify(req.body);
      headers['content-type'] = 'application/json';
      headers['content-length'] = Buffer.byteLength(bodyData);
    }

    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: targetPath,
      method: req.method,
      headers: headers,
      timeout: 2000
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', () => {
      isBackendAvailable = false;
      next();
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      isBackendAvailable = false;
      next();
    });

    if (bodyData) {
      proxyReq.write(bodyData);
    }
    proxyReq.end();
  });
});

// =========================================================================
// CAMPUS PLACEMENT & COMPETITIVE EXAM PREPARATION ENGINE ROUTES
// =========================================================================
const { TRACK_HIERARCHY } = require('./js/categoriesConfig');
const { PLACEMENT_QUESTIONS, PLACEMENT_PAPERS } = require('./data/placementQuestions');
const { TOPICS_CATALOG, generateTopicQuestionBank } = require('./data/topicsCatalog');

const placementRouter = express.Router();

// 0. GET /api/placement/categories - Return Taxonomy Catalog
placementRouter.get('/categories', (req, res) => {
  res.json({ tracks: TRACK_HIERARCHY });
});

// 1. GET /api/placement/daily or /api/quiz/daily - Get Today's 10 Daily Practice Questions
placementRouter.get('/daily', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  let dailyQs = PLACEMENT_QUESTIONS.filter(q => q.is_daily_question);
  if (dailyQs.length < 10) {
    const remaining = PLACEMENT_QUESTIONS.filter(q => !dailyQs.some(d => d.id === q.id));
    dailyQs = [...dailyQs, ...remaining].slice(0, 10);
  } else {
    dailyQs = dailyQs.slice(0, 10);
  }
  const sanitized = dailyQs.map(({ id, category, sub_category, topic_tag, question_text, options }) => ({
    id, category, sub_category, topic_tag, question_text, options
  }));
  res.json({ date: today, questions: sanitized });
});

// 2. GET /api/placement/placement-papers - List All Available Company Mock Papers
placementRouter.get('/placement-papers', (req, res) => {
  res.json({ papers: PLACEMENT_PAPERS });
});

// 3. GET /api/placement/placement-papers/:id - Start a Company Placement Paper
placementRouter.get('/placement-papers/:id', (req, res) => {
  const paper = PLACEMENT_PAPERS.find(p => p.id === req.params.id) || PLACEMENT_PAPERS[0];
  const questions = PLACEMENT_QUESTIONS.slice(0, 10).map((q, idx) => ({
    id: q.id,
    category: q.category,
    sub_category: q.sub_category,
    topic_tag: q.topic_tag,
    question_text: q.question_text,
    options: q.options,
    question_order: idx + 1
  }));
  res.json({ paper, questions });
});

// 4. GET /api/placement/questions - Practice Questions by Category / Sub-Category
placementRouter.get('/questions', (req, res) => {
  const { category, subCategory, limit = 15 } = req.query;
  let list = PLACEMENT_QUESTIONS;
  if (category) {
    list = list.filter(q => q.category.toLowerCase() === category.toLowerCase());
  }
  if (subCategory) {
    list = list.filter(q => q.sub_category.toLowerCase().includes(subCategory.toLowerCase()));
  }
  res.json({ questions: list.slice(0, parseInt(limit, 10)) });
});

// 5. POST /api/placement/submit & POST /api/quiz/submit - Unified Submission Engine
const handlePlacementSubmit = (req, res) => {
  try {
    const { userId, testType = 'placement_paper', referenceId, category = 'General', userAnswers = {}, timeTakenSeconds = 0 } = req.body;
    const questionIds = Object.keys(userAnswers);
    if (questionIds.length === 0) {
      return res.status(400).json({ error: 'No answers submitted' });
    }

    let score = 0;
    const topicStats = {};
    const feedbackBreakdown = [];

    const dbQuestions = PLACEMENT_QUESTIONS.filter(q => questionIds.includes(String(q.id)));
    const questionsToScore = dbQuestions.length > 0 ? dbQuestions : PLACEMENT_QUESTIONS.slice(0, questionIds.length);

    questionsToScore.forEach((q) => {
      const selected = userAnswers[q.id];
      const isCorrect = selected === q.correct_option;

      if (!topicStats[q.topic_tag]) {
        topicStats[q.topic_tag] = { correct: 0, total: 0 };
      }
      topicStats[q.topic_tag].total += 1;

      if (isCorrect) {
        score += 1;
        topicStats[q.topic_tag].correct += 1;
      }

      feedbackBreakdown.push({
        questionId: q.id,
        userSelected: selected,
        correctOption: q.correct_option,
        isCorrect,
        explanation: q.explanation
      });
    });

    const totalQuestions = questionsToScore.length || 1;
    const weakAreas = [];
    Object.keys(topicStats).forEach((topic) => {
      const stat = topicStats[topic];
      const percentage = (stat.correct / stat.total) * 100;
      if (percentage < 50) {
        weakAreas.push({ topic, score: `${stat.correct}/${stat.total}`, percentage });
      }
    });

    const attemptId = 'att-' + Date.now();
    res.json({
      attemptId,
      score,
      totalQuestions,
      percentage: ((score / totalQuestions) * 100).toFixed(1),
      weakAreas,
      review: feedbackBreakdown
    });
  } catch (err) {
    console.error('Error submitting placement quiz:', err);
    res.status(500).json({ error: err.message });
  }
};

placementRouter.post('/submit', handlePlacementSubmit);

app.use('/api/placement', placementRouter);
app.use('/api/quiz', placementRouter);

// =========================================================================
// PROCTORED ASSESSMENT & INTEGRITY AUDIT ROUTER
// =========================================================================
const assessmentRouter = express.Router();

assessmentRouter.post('/submit', optionalAuth, (req, res) => {
  try {
    const {
      userId,
      testId,
      topicSlug,
      userAnswers = {},
      answers = {},
      timeTakenSeconds = 0,
      questionsList = [],
      integrityReport = {}
    } = req.body;

    const effectiveUserId = req.user?.id || userId || 1;
    const finalAnswers = Object.keys(userAnswers).length > 0 ? userAnswers : answers;

    // Parse integrity metrics
    const tabSwitchCount = parseInt(integrityReport.tabSwitchCount, 10) || 0;
    const fullscreenExitCount = parseInt(integrityReport.fullscreenExitCount, 10) || 0;
    const forcedAutoSubmit = Boolean(integrityReport.forcedAutoSubmit);
    const totalStrikes = tabSwitchCount + fullscreenExitCount;
    const isDisqualified = forcedAutoSubmit || totalStrikes >= 3 || integrityReport.status === 'DISQUALIFIED_CHEATING';
    const integrityStatus = isDisqualified ? 'DISQUALIFIED_CHEATING' : 'COMPLETED_NORMALLY';

    // Source questions
    let questionsToScore = [];
    if (Array.isArray(questionsList) && questionsList.length > 0) {
      questionsToScore = questionsList;
    } else {
      const keys = Object.keys(finalAnswers);
      const matched = PLACEMENT_QUESTIONS.filter(q => keys.includes(String(q.id)));
      questionsToScore = matched.length > 0 ? matched : PLACEMENT_QUESTIONS.slice(0, 10);
    }

    let score = 0;
    const review = [];
    const topicStats = {};

    questionsToScore.forEach((q, idx) => {
      const qKey = q.id !== undefined ? q.id : idx;
      const userChoice = finalAnswers[qKey] !== undefined ? finalAnswers[qKey] : (finalAnswers[idx] !== undefined ? finalAnswers[idx] : (finalAnswers[String(idx)] !== undefined ? finalAnswers[String(idx)] : null));
      const isCorrect = userChoice !== null && userChoice === q.correct_option;
      if (isCorrect && !isDisqualified) {
        score += 1;
      }

      const topicTag = q.topic_tag || q.concept || 'General';
      if (!topicStats[topicTag]) {
        topicStats[topicTag] = { correct: 0, total: 0 };
      }
      topicStats[topicTag].total += 1;
      if (isCorrect && !isDisqualified) {
        topicStats[topicTag].correct += 1;
      }

      review.push({
        questionNumber: idx + 1,
        questionId: q.id,
        questionText: q.question_text || q.question,
        options: q.options,
        userSelected: userChoice,
        correctOption: q.correct_option !== undefined ? q.correct_option : q.correctIndex,
        isCorrect: !isDisqualified ? isCorrect : false,
        explanation: q.explanation || 'Refer to company placement syllabus.'
      });
    });

    const totalQuestions = questionsToScore.length || 1;
    const percentage = ((score / totalQuestions) * 100).toFixed(1);

    const weakAreas = [];
    if (isDisqualified) {
      weakAreas.push({
        topic: 'Test Integrity Violation',
        score: `${totalStrikes}/3 Strikes Exceeded`,
        percentage: 0,
        advice: 'Candidate disqualified due to proctoring policy violation (repeated tab switches or exiting full-screen mode).'
      });
    } else {
      Object.keys(topicStats).forEach((topic) => {
        const stat = topicStats[topic];
        const pct = (stat.correct / stat.total) * 100;
        if (pct < 60) {
          weakAreas.push({
            topic,
            score: `${stat.correct}/${stat.total}`,
            percentage: Math.round(pct),
            advice: `Strengthen core problem-solving speed and fundamentals for ${topic}.`
          });
        }
      });
    }

    const testSubject = testId || topicSlug || 'Proctored Timed Arena';

    // Persist into SQLite
    let savedAttempt = null;
    try {
      savedAttempt = db.saveProctoredAttempt({
        userId: effectiveUserId,
        subject: testSubject,
        score,
        totalQuestions,
        timeTakenSeconds,
        durationMinutes: 60,
        weakAreas,
        answers: review,
        recommendations: weakAreas,
        violations: totalStrikes,
        tabSwitchCount,
        fullscreenExitCount,
        forcedAutoSubmit: forcedAutoSubmit ? 1 : 0,
        status: integrityStatus,
        integrityReport: {
          tabSwitchCount,
          fullscreenExitCount,
          forcedAutoSubmit,
          status: integrityStatus
        }
      });
    } catch (saveErr) {
      console.warn('[Proctor Attempt Persistence Notice]', saveErr.message);
    }

    const responsePayload = {
      attemptId: savedAttempt ? savedAttempt.id : ('att-' + Date.now()),
      testSubject,
      score,
      totalQuestions,
      percentage,
      timeTakenSeconds,
      integrityStatus,
      integrityReport: {
        tabSwitchCount,
        fullscreenExitCount,
        forcedAutoSubmit,
        status: integrityStatus
      },
      weakAreas,
      review
    };

    res.json(responsePayload);
  } catch (err) {
    console.error('Error submitting proctored assessment:', err);
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/assessment', assessmentRouter);

// =========================================================================
// COMPANY PLACEMENT MOCK TEST ARENA ROUTER (ADAPTIVE RECRUITMENT SIMULATOR)
// =========================================================================
const mockTestRouter = express.Router();

// 1. GET /api/mock-test/companies - Catalog of recruiters with blueprints, quotas & candidate attempt counts
mockTestRouter.get('/companies', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : (req.query.userId || null);
    const stats = db.getCompanyCatalogStats(userId);
    res.json({ companies: stats });
  } catch (err) {
    console.error('[MOCK TEST COMPANIES ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/mock-test/generate - Adaptive question rotation excluding previously attempted PYQs
mockTestRouter.get('/generate', optionalAuth, (req, res) => {
  try {
    const company = req.query.company || req.query.companyName || 'TCS NQT';
    const userId = req.user ? req.user.id : (req.query.userId || null);

    const testPackage = db.generateCompanyMock(userId, company);
    res.json(testPackage);
  } catch (err) {
    console.error('[MOCK TEST GENERATE ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/mock-test/submit - Grade sectional performance, compare cut-offs, record history
mockTestRouter.post('/submit', optionalAuth, (req, res) => {
  try {
    const { sessionId, companyName, userAnswers = {}, timeTakenSeconds = 0, strikes = 0, forcedAutoSubmit = false } = req.body;
    const userId = req.user ? req.user.id : (req.body.userId || null);

    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required for submission.' });
    }

    const report = db.submitCompanyMockSession({
      userId,
      sessionId,
      companyName,
      userAnswers,
      timeTakenSeconds,
      strikes,
      forcedAutoSubmit
    });

    res.json(report);
  } catch (err) {
    console.error('[MOCK TEST SUBMIT ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/mock-test/reset-history - Reset attempted question history for a company
mockTestRouter.post('/reset-history', optionalAuth, (req, res) => {
  try {
    const { companyName } = req.body;
    const userId = req.user ? req.user.id : (req.body.userId || null);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to manage PYQ history.' });
    }
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required.' });
    }

    const success = db.resetUserCompanyHistory(userId, companyName);
    res.json({
      success,
      message: `Your previous question history for ${companyName} has been reset. All PYQs are now freshly available for mock tests!`
    });
  } catch (err) {
    console.error('[MOCK TEST RESET ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. GET /api/mock-test/history - Candidate's past completed mock tests
mockTestRouter.get('/history', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : (req.query.userId || null);
    if (!userId) {
      return res.json({ history: [] });
    }
    const history = db.getUserCompanyMockHistory(userId);
    res.json({ history });
  } catch (err) {
    console.error('[MOCK TEST HISTORY ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. GET /api/mock-test/session/:id - Detail for a specific attempt
mockTestRouter.get('/session/:id', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const details = db.getCompanyMockSessionDetails(req.params.id, userId);
    if (!details) {
      return res.status(404).json({ error: 'Mock session not found.' });
    }
    res.json({ session: details });
  } catch (err) {
    console.error('[MOCK TEST SESSION DETAILS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/mock-test', mockTestRouter);

// New Feature Modules: Compiler, Resume Matcher, AI Interview, Study Aids, Leaderboard
const compilerRoutes = require('./routes/compilerRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const studyAidRoutes = require('./routes/studyAidRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const competitiveExamRoutes = require('./routes/competitiveExamRoutes');
const workflowGateway = require('./services/workflowWebSocket');

app.use('/api/compiler', compilerRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/study-aids', studyAidRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/v1', workflowRoutes);
app.use('/api/v1', competitiveExamRoutes);

// Serve static frontend assets
app.use(express.static(path.join(__dirname)));

/**
 * Authentication Middleware
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
    }
    req.user = decodedUser;
    next();
  });
}

/**
 * Optional Authentication Middleware (allows guest fallback if needed)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (!err) {
      req.user = decodedUser;
    }
    next();
  });
}

// =========================================================================
// RATE LIMITING & RECOVERY PROTECTION
// =========================================================================
const recoveryAttempts = new Map();
const MAX_RECOVERY_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientKey(req, identifier) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const idStr = String(identifier || '').trim().toLowerCase();
  return `${ip}_${idStr}`;
}

function checkRateLimit(req, identifier) {
  const key = getClientKey(req, identifier);
  const now = Date.now();
  const record = recoveryAttempts.get(key);

  if (!record) return { allowed: true, remaining: MAX_RECOVERY_ATTEMPTS };

  if (record.lockedUntil && now < record.lockedUntil) {
    const minutesRemaining = Math.ceil((record.lockedUntil - now) / 60000);
    return {
      allowed: false,
      isLocked: true,
      message: `Too many failed recovery attempts. Account recovery is temporarily locked for security. Please try again in ${minutesRemaining} minute(s).`
    };
  }

  // Reset if window passed without locking
  if (now - record.firstAttempt > LOCKOUT_DURATION_MS && !record.lockedUntil) {
    recoveryAttempts.delete(key);
    return { allowed: true, remaining: MAX_RECOVERY_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_RECOVERY_ATTEMPTS - record.attempts);
  return { allowed: true, remaining };
}

function recordFailedAttempt(req, identifier) {
  const key = getClientKey(req, identifier);
  const now = Date.now();
  const record = recoveryAttempts.get(key) || { attempts: 0, firstAttempt: now, lockedUntil: null };

  record.attempts += 1;
  if (record.attempts >= MAX_RECOVERY_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  recoveryAttempts.set(key, record);
  return record;
}

function resetRateLimit(req, identifier) {
  const key = getClientKey(req, identifier);
  recoveryAttempts.delete(key);
}

// =========================================================================
// STANDALONE TOPICS & PRACTICE QUESTIONS ROUTER
// =========================================================================
const topicsRouter = express.Router();

// 1. GET /api/topics - List all 36 topics grouped by section with progress
topicsRouter.get('/', optionalAuth, (req, res) => {
  try {
    const userId = req.user?.id || null;
    const progressMap = userId ? db.getUserProgress(userId) : {};

    const sections = {
      'Arithmetic Aptitude': [],
      'Data Interpretation': [],
      'Verbal Ability': []
    };

    TOPICS_CATALOG.forEach(t => {
      const topicObj = {
        id: t.slug,
        section_name: t.section_name,
        topic_name: t.topic_name,
        slug: t.slug,
        icon: t.icon || '📚',
        total_questions_count: 100,
        completed_questions_count: progressMap[t.slug] || 0
      };
      if (sections[t.section_name]) {
        sections[t.section_name].push(topicObj);
      } else {
        sections[t.section_name] = [topicObj];
      }
    });

    return res.json({
      totalTopics: TOPICS_CATALOG.length,
      sections
    });
  } catch (err) {
    console.error('[GET TOPICS ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/topics/:slug - Single Topic Metadata
topicsRouter.get('/:slug', optionalAuth, (req, res) => {
  try {
    const { slug } = req.params;
    const topic = TOPICS_CATALOG.find(t => t.slug === slug);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found.' });
    }
    const userId = req.user?.id || null;
    const progressMap = userId ? db.getUserProgress(userId) : {};
    return res.json({
      topic: {
        ...topic,
        id: topic.slug,
        total_questions_count: 100,
        completed_questions_count: progressMap[slug] || 0
      }
    });
  } catch (err) {
    console.error('[GET TOPIC ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/topics/:slug/questions - Topic Questions (Practice or Timed)
topicsRouter.get('/:slug/questions', optionalAuth, (req, res) => {
  try {
    const { slug } = req.params;
    const { mode = 'practice', page = 1, limit = 10 } = req.query;
    const topic = TOPICS_CATALOG.find(t => t.slug === slug);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    const topicWithId = { ...topic, id: topic.id || topic.slug };
    let baseQuestions = (topic.questions || []).map((q, idx) => ({
      id: `base-${topic.slug}-${idx + 1}`,
      topic_id: topic.slug,
      question_number: idx + 1,
      question_text: q.question_text || q.question,
      options: q.options,
      correct_option: q.correct_option ?? q.correctIndex ?? 0,
      explanation: q.explanation || 'Detailed solution will appear here.',
      is_frequently_asked: true,
      is_bookmarked: false
    }));

    let allQuestions = [...baseQuestions];
    if (allQuestions.length < 100) {
      const needed = 100 - allQuestions.length;
      const extra = generateTopicQuestionBank(topicWithId, allQuestions.length + 1, needed);
      allQuestions = allQuestions.concat(extra);
    }

    // Attach bookmark status if user is logged in
    if (req.user?.id) {
      const userBookmarks = db.getUserBookmarks(req.user.id);
      const bookmarkedSet = new Set(userBookmarks.map(b => String(b.question_id)));
      allQuestions = allQuestions.map(q => ({
        ...q,
        is_bookmarked: bookmarkedSet.has(String(q.id))
      }));
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    if (mode === 'timed') {
      return res.json({
        topic: { ...topic, id: topic.slug },
        questions: allQuestions.slice(0, limitNum)
      });
    }

    // Practice mode (paginated)
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedQuestions = allQuestions.slice(startIndex, startIndex + limitNum);
    const totalPages = Math.ceil(allQuestions.length / limitNum);

    return res.json({
      topic: { ...topic, id: topic.slug },
      questions: paginatedQuestions,
      totalQuestions: allQuestions.length,
      totalPages,
      currentPage: pageNum
    });
  } catch (err) {
    console.error('[GET TOPIC QUESTIONS ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/topics/:slug/progress - Update practice progress
topicsRouter.post('/:slug/progress', optionalAuth, (req, res) => {
  try {
    const { slug } = req.params;
    const { completedCount = 1 } = req.body;
    if (req.user?.id) {
      db.updateUserProgress(req.user.id, slug, completedCount);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[UPDATE PROGRESS ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// BOOKMARKS ROUTER
// =========================================================================
const bookmarksRouter = express.Router();

bookmarksRouter.get('/', optionalAuth, (req, res) => {
  try {
    const userId = req.user?.id || null;
    const bookmarks = userId ? db.getUserBookmarks(userId) : [];
    return res.json({ bookmarks });
  } catch (err) {
    console.error('[GET BOOKMARKS ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

bookmarksRouter.post('/toggle', authenticateToken, (req, res) => {
  try {
    const result = db.toggleBookmark(req.user.id, req.body);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[TOGGLE BOOKMARK ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

app.use('/api/topics', topicsRouter);
app.use('/api/bookmarks', bookmarksRouter);

// =========================================================================
// AUTHENTICATION ROUTES (STANDALONE SQLITE + PG COMPATIBLE)
// =========================================================================

/**
 * Register a new student
 * Body: { fullName, email, emailOrMobile, password, confirmPassword, securityQ1, securityA1, securityQ2, securityA2 }
 */
app.post('/api/auth/register', (req, res) => {
  try {
    const fullName = (req.body.fullName || req.body.name || req.body.username || (req.body.email ? req.body.email.split('@')[0] : 'Candidate')).trim();
    const email = (req.body.email || req.body.emailOrMobile || req.body.identifier || '').trim();
    const password = req.body.password || '';
    const confirmPassword = req.body.confirmPassword;
    const grade = req.body.grade || 'Candidate';
    let securityQ1 = (req.body.securityQ1 || req.body.securityQuestion1 || '').trim() || 'What is your primary school name?';
    let securityA1 = (req.body.securityA1 || req.body.securityAnswer1 || '').trim() || 'school';
    let securityQ2 = (req.body.securityQ2 || req.body.securityQuestion2 || '').trim() || 'What city were you born in?';
    let securityA2 = (req.body.securityA2 || req.body.securityAnswer2 || '').trim() || 'city';

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email/mobile number, and password are required.' });
    }

    // Parity check
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: 'Password and Confirm Password do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email/mobile already exists. Please sign in.' });
    }

    const newUser = db.createUser(
      fullName,
      email,
      grade,
      password,
      securityQ1,
      securityA1,
      securityQ2,
      securityA2
    );

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, emailOrMobile: newUser.email, fullName: newUser.full_name, grade: newUser.grade, role: newUser.role || 'student' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful!',
      token,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        emailOrMobile: newUser.email,
        grade: newUser.grade,
        role: newUser.role || 'student'
      }
    });
  } catch (err) {
    console.error('[AUTH REGISTER ERROR]', err);
    return res.status(500).json({ error: 'Internal server error during registration: ' + err.message });
  }
});

/**
 * Step 1: Challenge - Retrieve Security Questions for an account identifier
 * Supports both /challenge and /initiate endpoints
 */
const handleForgotStep1 = (req, res) => {
  try {
    const identifier = (req.body.identifier || req.body.emailOrMobile || req.body.email || '').trim();
    if (!identifier) {
      return res.status(400).json({ error: 'Please provide your email or mobile number.' });
    }

    const limitStatus = checkRateLimit(req, identifier);
    if (!limitStatus.allowed) {
      return res.status(429).json({ error: limitStatus.message });
    }

    const userQuestions = db.getUserSecurityQuestions(identifier);
    if (!userQuestions || !userQuestions.security_q1 || !userQuestions.security_q2) {
      recordFailedAttempt(req, identifier);
      return res.status(404).json({
        error: 'Unable to initiate recovery. Please ensure the email or mobile is registered and has recovery questions configured.'
      });
    }

    return res.json({
      success: true,
      identifier: userQuestions.email,
      emailOrMobile: userQuestions.email,
      question1: userQuestions.security_q1,
      question2: userQuestions.security_q2,
      questions: [userQuestions.security_q1, userQuestions.security_q2]
    });
  } catch (err) {
    console.error('[FORGOT PASSWORD CHALLENGE ERROR]', err);
    return res.status(500).json({ error: 'Failed to retrieve recovery challenge.' });
  }
};

app.post('/api/auth/forgot-password/challenge', handleForgotStep1);
app.post('/api/auth/forgot-password/initiate', handleForgotStep1);

/**
 * Step 2: Verification - Validate Security Answers
 */
app.post('/api/auth/forgot-password/verify', (req, res) => {
  try {
    const identifier = (req.body.identifier || req.body.emailOrMobile || req.body.email || '').trim();
    const answer1 = (req.body.answer1 || '').trim();
    const answer2 = (req.body.answer2 || '').trim();

    if (!identifier || !answer1 || !answer2) {
      return res.status(400).json({ error: 'Identifier and answers to both security questions are required.' });
    }

    const limitStatus = checkRateLimit(req, identifier);
    if (!limitStatus.allowed) {
      return res.status(429).json({ error: limitStatus.message });
    }

    const userSecurityData = db.getUserSecurityData(identifier);
    if (!userSecurityData) {
      recordFailedAttempt(req, identifier);
      return res.status(400).json({ error: 'Verification failed. Incorrect answers or invalid account.' });
    }

    const isValid = db.verifyUserSecurityAnswers(userSecurityData, answer1, answer2);
    if (!isValid) {
      const record = recordFailedAttempt(req, identifier);
      const remaining = Math.max(0, MAX_RECOVERY_ATTEMPTS - record.attempts);
      if (record.lockedUntil) {
        return res.status(429).json({
          error: 'Maximum verification attempts exceeded. Account recovery has been temporarily locked for 15 minutes.'
        });
      }
      return res.status(400).json({
        error: `Incorrect security answers. Please verify your responses and try again. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`
      });
    }

    // Reset failed counter on success
    resetRateLimit(req, identifier);

    // Issue short-lived password reset token (15 mins)
    const resetToken = jwt.sign(
      { resetUserId: userSecurityData.id, type: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({
      success: true,
      message: 'Security answers verified successfully! Please set your new password.',
      resetToken
    });
  } catch (err) {
    console.error('[FORGOT PASSWORD VERIFY ERROR]', err);
    return res.status(500).json({ error: 'Internal server error during verification.' });
  }
});

/**
 * Step 3: Reset - Set new password using verified resetToken
 */
app.post('/api/auth/forgot-password/reset', (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset authorization token and new password are required.' });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirm password do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch {
      return res.status(403).json({ error: 'Recovery session expired or invalid. Please restart the password reset process.' });
    }

    if (decoded.type !== 'password_reset' || !decoded.resetUserId) {
      return res.status(403).json({ error: 'Invalid recovery token.' });
    }

    const user = db.getUserById(decoded.resetUserId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    db.updateUserPassword(user.id, newPassword);

    return res.json({
      success: true,
      message: 'Your password has been successfully reset! You can now sign in with your new password.',
      email: user.email
    });
  } catch (err) {
    console.error('[FORGOT PASSWORD RESET ERROR]', err);
    return res.status(500).json({ error: 'Internal server error while updating password.' });
  }
});

/**
 * Login existing student
 * Body: { email, emailOrMobile, password }
 */
app.post('/api/auth/login', (req, res) => {
  try {
    const identifier = (req.body.email || req.body.emailOrMobile || req.body.identifier || '').trim();
    const password = req.body.password || '';

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/mobile number and password are required.' });
    }

    const user = db.getUserByEmail(identifier);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email/mobile number or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email/mobile number or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, emailOrMobile: user.email, fullName: user.full_name, grade: user.grade, role: user.role || 'student' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        emailOrMobile: user.email,
        grade: user.grade,
        role: user.role || 'student'
      }
    });
  } catch (err) {
    console.error('[AUTH LOGIN ERROR]', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * Get current student profile & historical analytics
 */
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const analytics = db.getUserAnalytics(user.id);
    const bookmarkedCount = db.getUserBookmarksCount(user.id);
    const progress = db.getUserProgress(user.id);

    return res.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        emailOrMobile: user.email,
        grade: user.grade,
        role: user.role || 'student',
        createdAt: user.created_at
      },
      stats: {
        bookmarkedCount,
        topicsInProgressCount: Object.keys(progress).length
      },
      analytics
    });
  } catch (err) {
    console.error('[AUTH ME ERROR]', err);
    return res.status(500).json({ error: 'Internal server error fetching profile.' });
  }
});

/**
 * Middleware: Verify Admin Access
 */
function requireAdmin(req, res, next) {
  try {
    let userEmail = req.headers['x-user-email'];

    // Or extract from verified JWT
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.email) {
          userEmail = decoded.email;
        }
      } catch (tokenErr) {
        // Fall back to x-user-email
      }
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'Authentication required. Please log in as an administrator.' });
    }

    const user = db.getUserByEmail(userEmail);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// =========================================================================
// ADMIN & TEACHER QUESTION PORTAL ROUTES
// =========================================================================

// POST /api/admin/questions - Add a new question to the bank
app.post('/api/admin/questions', requireAdmin, (req, res) => {
  const { subject, topicTag, questionText, options, correctOption, explanation } = req.body;

  if (!subject || !topicTag || !questionText || !options || correctOption === undefined || !explanation) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (!Array.isArray(options) || options.length !== 4) {
    return res.status(400).json({ error: 'Exactly 4 options are required.' });
  }

  try {
    const question = db.addQuestion({
      subject,
      topicTag,
      questionText,
      options,
      correctOption,
      explanation
    });

    return res.status(201).json({ message: 'Question added successfully!', question });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/questions - List existing questions
app.get('/api/admin/questions', requireAdmin, (req, res) => {
  try {
    const questions = db.getAllQuestions();
    return res.json({ questions });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// QUESTION BANK ROUTES
// =========================================================================

/**
 * Get quiz questions for a subject
 * Query: ?subject=mathematics&limit=10
 * Note: Answers and explanations are omitted from the student-facing payload during the quiz to prevent inspection cheating!
 */
app.get('/api/questions', (req, res) => {
  try {
    const subject = req.query.subject || 'mathematics';
    const limit = parseInt(req.query.limit, 10) || 10;

    const questions = db.getQuestionsBySubject(subject, limit);

    // Return sanitized questions (without correct_option and explanation)
    const sanitized = questions.map((q, idx) => ({
      index: idx,
      id: q.id,
      subject: q.subject,
      topic_tag: q.topic_tag,
      question_text: q.question_text,
      options: q.options
    }));

    return res.json({
      subject,
      total: sanitized.length,
      questions: sanitized
    });
  } catch (err) {
    console.error('[GET QUESTIONS ERROR]', err);
    return res.status(500).json({ error: 'Failed to retrieve questions.' });
  }
});

// =========================================================================
// QUIZ ENGINE, TIMER & SUBMISSION
// =========================================================================

/**
 * Start a timed quiz session
 * Body: { subject, durationMinutes }
 */
app.post('/api/quizzes/start', optionalAuth, (req, res) => {
  try {
    const { subject = 'mathematics', durationMinutes = 10, limit = 10 } = req.body;
    const questions = db.getQuestionsBySubject(subject, limit);

    const startedAt = Date.now();
    const durationMs = durationMinutes * 60 * 1000;
    const expiresAt = startedAt + durationMs;

    const sanitizedQuestions = questions.map((q, idx) => ({
      index: idx,
      id: q.id,
      subject: q.subject,
      topic_tag: q.topic_tag,
      question_text: q.question_text,
      options: q.options
    }));

    return res.json({
      sessionId: `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      subject,
      durationMinutes,
      startedAt,
      expiresAt,
      totalQuestions: sanitizedQuestions.length,
      questions: sanitizedQuestions
    });
  } catch (err) {
    console.error('[QUIZ START ERROR]', err);
    return res.status(500).json({ error: 'Failed to start quiz session.' });
  }
});

/**
 * Targeted Feedback & Study Recommendations Generator
 */
function generateActionableRecommendations(weakTopics, subject) {
  const recommendations = [];

  const topicGuidanceMap = {
    // Mathematics
    'Calculus: Product Rule of Differentiation': 'Review the Product Rule formula d/dx [u·v] = u\'v + uv\'. Work through 5 practice problems involving polynomials multiplied by logarithmic or trigonometric functions.',
    'Calculus: Standard Trigonometric Limits': 'Review standard limits lim(x→0)[sin(kx)/(kx)] = 1. Pay close attention to adjusting the denominator to match the angle argument before taking limits.',
    'Vector Algebra: Scalar (Dot) Product': 'Practice the component-wise dot product formula: A · B = a₁b₁ + a₂b₂ + a₃b₃. Remember that the dot product is a scalar quantity.',
    'Calculus: Definite Integrals': 'Revisit the Fundamental Theorem of Calculus: ∫ f(x)dx from a to b is F(b) - F(a). Review antiderivatives for basic trigonometric functions.',
    'Algebra: Quadratic Equations by Factoring': 'Practice splitting the middle term for quadratics ax² + bx + c = 0 where a > 1. Double check roots by substitution.',
    'Coordinate Geometry: Perpendicular Slopes': 'Remember that two perpendicular lines satisfy m₁ · m₂ = -1. Practice putting linear equations into slope-intercept form (y = mx + c) first.',
    'Combinatorics: Permutations': 'Review factorial permutations for distinct items (n!). Differentiate between permutations (order matters) and combinations (order does not matter).',
    'Trigonometry: Double Angle Identities': 'Memorize and practice the 3 forms of cos(2θ) and sin(2θ) = 2sinθcosθ. Use them to simplify rational trigonometric fractions.',
    'Linear Algebra: Determinants': 'Practice the 2x2 determinant formula |A| = ad - bc. Solve linear systems using Cramer\'s rule for extra practice.',
    'Probability: Complementary Events': 'Utilize the complementary probability rule P(not A) = 1 - P(A) to quickly solve non-event questions.',

    // Physics
    'Mechanics: Projectile Motion': 'Review projectile equations: R = (v² sin 2θ)/g. Remember maximum horizontal range always occurs at 45° in absence of drag.',
    'Thermodynamics: First Law & Internal Energy': 'Apply ΔU = Q - W carefully. Ensure correct sign conventions: heat added is +Q, work done BY system is +W.',
    'Optics: Snell\'s Law of Refraction': 'Practice Snell\'s law: n₁ sin θ₁ = n₂ sin θ₂. Keep track of which medium is incident vs refracted.',
    'Electromagnetism: Capacitors and Dielectrics': 'Remember C = ε₀A/d for parallel plates. Note that increasing distance d decreases capacitance inversely.',
    'Modern Physics: Photoelectric Effect': 'Review Einstein\'s photoelectric equation hf = Φ + KE_max. Note that work function Φ is the minimum energy to release an electron.',
    'Mechanics: Newton\'s Second Law': 'Ensure you isolate net force: F_net = m·a. Always construct a free-body diagram for multi-force scenarios.',
    'Wave Optics: Interference and Fringe Width': 'Fringe width is β = λD/d. Since β ∝ λ, using longer wavelength light (e.g. red vs violet) increases fringe separation.',
    'Waves: Nature of Sound': 'Remember sound waves in air are longitudinal mechanical waves (particles oscillate parallel to propagation).',
    'Thermodynamics: Carnot Engine Efficiency': 'Efficiency η = 1 - (T_cold / T_hot) requires absolute temperatures in Kelvin (K). Never calculate with Celsius values directly.',
    'Electromagnetism: Faraday\'s and Lenz\'s Laws': 'Lenz\'s law enforces conservation of energy: the induced current creates a magnetic field that opposes the change producing it.',

    // English
    'Grammar: Proximity Rule in Correlative Conjunctions': 'With "neither... nor" and "either... or", the verb agrees with the closer subject.',
    'Grammar: Subjunctive Mood with Verbs of Demand': 'Verbs like insist, recommend, and demand require the base verb form ("be", "go") in the that-clause.',
    'Idioms & Figurative Language': 'Study common idiomatic expressions and their historical origins to deduce meanings in context.',
    'Vocabulary: Antonyms and Etymology': 'Study root words and prefixes. "Ephemeral" (fleeting) is the exact antonym of "perpetual" (everlasting).',
    'Syntax: Dangling and Misplaced Modifiers': 'Ensure introductory participial phrases immediately precede the actual subject performing the action.',
    'Verbal Reasoning: Analogies': 'Identify the exact relationship between the primary pair (e.g., concluding chapter : literary work = epilogue : novel) before selecting answers.',
    'Grammar: Active and Passive Voice Conversion': 'In passive voice, simple future "will publish" converts to "will be published" with past participle.',
    'Punctuation: Non-Restrictive Relative Clauses': 'Non-restrictive clauses add extra non-essential details and must be enclosed in commas; use "who" for persons.',
    'Vocabulary: Contextual Sentence Completion': 'Look for contextual clues and contrast words. "Devoid of any discrepancy" demands "impeccable".',
    'Literary Devices: Figures of Speech': 'Personification attributes human actions or emotions to inanimate objects (e.g., wind whispering).'
  };

  if (weakTopics.length === 0) {
    recommendations.push({
      topic: 'Comprehensive Mastery',
      advice: '🌟 Outstanding performance! You demonstrated complete intermediate mastery across all tested sub-skills. Recommended next step: Attempt 5-minute speed drills or advanced university-prep problem sets.'
    });
  } else {
    for (const topic of weakTopics) {
      const guidance = topicGuidanceMap[topic] || `Focus on reviewing foundational concepts and practice 3-5 standard exercises for ${topic}.`;
      recommendations.push({
        topic,
        advice: guidance
      });
    }
  }

  return recommendations;
}

/**
 * Submit Quiz Assessment
 * Body: { subject, durationMinutes, timeTakenSeconds, answers: { [questionId]: chosenOptionIndex } }
 */
app.post('/api/quizzes/submit', optionalAuth, (req, res) => {
  try {
    const {
      subject = 'mathematics',
      durationMinutes = 10,
      timeTakenSeconds = 0,
      tabSwitchViolations = 0,
      violations = 0,
      answers = {}
    } = req.body;

    const violationCount = parseInt(tabSwitchViolations || violations || 0, 10);

    // Determine student ID
    let userId = req.user ? req.user.id : null;
    if (!userId) {
      // Find or use default student
      const defaultStudent = db.getUserByEmail('rohan@student.edu');
      userId = defaultStudent ? defaultStudent.id : 1;
    }

    // Retrieve full questions from database to evaluate
    const submittedQIds = Object.keys(answers).map(id => parseInt(id, 10));
    let questions;

    if (submittedQIds.length > 0) {
      questions = submittedQIds.map(id => db.getQuestionById(id)).filter(Boolean);
    } else {
      questions = db.getQuestionsBySubject(subject, 10);
    }

    let score = 0;
    const detailedAnswers = [];
    const topicStats = {};

    for (const q of questions) {
      const chosenOptionIndex = answers[q.id] !== undefined ? parseInt(answers[q.id], 10) : null;
      const isCorrect = chosenOptionIndex !== null && chosenOptionIndex === q.correct_option;

      if (isCorrect) score += 1;

      // Track by topic
      const topic = q.topic_tag || 'General';
      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, correct: 0 };
      }
      topicStats[topic].total += 1;
      if (isCorrect) topicStats[topic].correct += 1;

      detailedAnswers.push({
        questionId: q.id,
        questionText: q.question_text,
        options: q.options,
        chosenOptionIndex,
        correctOptionIndex: q.correct_option,
        isCorrect,
        explanation: q.explanation,
        topicTag: q.topic_tag
      });
    }

    // Identify weak areas (topics with < 50% accuracy)
    const weakAreas = [];
    const skillDiagnostics = [];

    for (const [topic, stats] of Object.entries(topicStats)) {
      const accuracyPercent = Math.round((stats.correct / stats.total) * 100);
      const isWeak = accuracyPercent < 50;
      if (isWeak) {
        weakAreas.push(topic);
      }
      skillDiagnostics.push({
        topic,
        total: stats.total,
        correct: stats.correct,
        accuracyPercent,
        status: accuracyPercent >= 80 ? 'Mastered' : accuracyPercent >= 50 ? 'Proficient' : 'Needs Improvement'
      });
    }

    // Sort skill diagnostics so weak areas appear first
    skillDiagnostics.sort((a, b) => a.accuracyPercent - b.accuracyPercent);

    // Generate actionable recommendations
    const recommendations = generateActionableRecommendations(weakAreas, subject);

    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    // Save into database
    const savedAttempt = db.saveQuizAttempt(
      userId,
      subject,
      score,
      totalQuestions,
      timeTakenSeconds,
      durationMinutes,
      weakAreas,
      detailedAnswers,
      recommendations,
      violationCount
    );

    return res.status(201).json({
      attemptId: savedAttempt ? savedAttempt.id : null,
      userId,
      subject,
      score,
      totalQuestions,
      percentage,
      timeTakenSeconds,
      durationMinutes,
      tabSwitchViolations: violationCount,
      violations: violationCount,
      weakAreas,
      skillDiagnostics,
      recommendations,
      detailedAnswers,
      submittedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[QUIZ SUBMIT ERROR]', err);
    return res.status(500).json({ error: 'Failed to evaluate and save quiz submission.' });
  }
});

// =========================================================================
// HISTORICAL ASSESSMENTS ROUTES
// =========================================================================

/**
 * Get student's assessment history
 */
app.get('/api/quizzes/history', authenticateToken, (req, res) => {
  try {
    const attempts = db.getUserAttempts(req.user.id);
    return res.json({
      total: attempts.length,
      attempts
    });
  } catch (err) {
    console.error('[GET HISTORY ERROR]', err);
    return res.status(500).json({ error: 'Failed to retrieve assessment history.' });
  }
});

/**
 * Get full report of a specific attempt
 */
app.get('/api/quizzes/attempt/:id', authenticateToken, (req, res) => {
  try {
    const attemptId = parseInt(req.params.id, 10);
    const attempt = db.getAttemptById(attemptId, req.user.id);

    if (!attempt) {
      return res.status(404).json({ error: 'Assessment attempt not found.' });
    }

    return res.json({ attempt });
  } catch (err) {
    console.error('[GET ATTEMPT ERROR]', err);
    return res.status(500).json({ error: 'Failed to retrieve attempt details.' });
  }
});

// Default fallback to index.html for root
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CareerPath Application Server Running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`💾 Database: SQLite (quiz.db) Initialized`);
  console.log(`🔌 WebSocket Gateway attached on /ws/events`);
  console.log(`====================================================`);
});
workflowGateway.attachHttpServer(server);
