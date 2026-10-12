import express from 'express';
import { pool } from '../config/db.js';
import { requireAuth, optionalAuth } from './authRoutes.js';

const router = express.Router();

/**
 * POST /api/assessment/submit
 * Handles proctored timed test submission, anti-cheating audit logging,
 * automatic evaluation, and diagnostics.
 */
router.post('/submit', optionalAuth, async (req, res) => {
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

    let effectiveUserId = req.user?.id || userId;
    
    // Ensure effectiveUserId exists in quiz.users
    let userRow = null;
    if (effectiveUserId) {
      const uRes = await pool.query('SELECT id FROM quiz.users WHERE id::text = $1', [String(effectiveUserId)]);
      if (uRes.rows.length > 0) {
        userRow = uRes.rows[0];
      }
    }

    if (!userRow) {
      // Fallback to first registered candidate in database
      const fallbackUser = await pool.query('SELECT id FROM quiz.users ORDER BY created_at ASC LIMIT 1');
      if (fallbackUser.rows.length > 0) {
        effectiveUserId = fallbackUser.rows[0].id;
      } else {
        // Auto-provision candidate user record if DB has 0 users
        const createdUser = await pool.query(`
          INSERT INTO quiz.users (full_name, email_or_mobile, email, password_hash, security_question_1, security_answer_hash_1, security_question_2, security_answer_hash_2)
          VALUES ('Candidate Student', 'candidate@campus.prep', 'candidate@campus.prep', 'proctored_candidate_hash', 'School', 'hash1', 'City', 'hash2')
          RETURNING id
        `);
        effectiveUserId = createdUser.rows[0].id;
      }
    } else {
      effectiveUserId = userRow.id;
    }

    // Merge answers format (supports either userAnswers: {0: 1} or answers: {0: 1})
    const finalAnswers = Object.keys(userAnswers).length > 0 ? userAnswers : answers;

    // Resolve Topic info if testId or topicSlug provided
    let topicId = null;
    let topicName = 'General Aptitude Proctored Arena';

    if (testId) {
      // Check if testId is a UUID or slug
      const tRes = await pool.query(
        'SELECT id, topic_name FROM quiz.topics WHERE id::text = $1 OR slug = $1',
        [String(testId)]
      );
      if (tRes.rows.length > 0) {
        topicId = tRes.rows[0].id;
        topicName = tRes.rows[0].topic_name;
      }
    } else if (topicSlug) {
      const tRes = await pool.query('SELECT id, topic_name FROM quiz.topics WHERE slug = $1', [topicSlug]);
      if (tRes.rows.length > 0) {
        topicId = tRes.rows[0].id;
        topicName = tRes.rows[0].topic_name;
      }
    }

    // Parse integrity metrics
    const tabSwitchCount = parseInt(integrityReport.tabSwitchCount, 10) || 0;
    const fullscreenExitCount = parseInt(integrityReport.fullscreenExitCount, 10) || 0;
    const forcedAutoSubmit = Boolean(integrityReport.forcedAutoSubmit);
    const integrityStatus = integrityReport.status || (forcedAutoSubmit || (tabSwitchCount + fullscreenExitCount >= 3) ? 'DISQUALIFIED_CHEATING' : 'COMPLETED_NORMALLY');

    // Score evaluation
    let score = 0;
    const review = [];
    const questions = questionsList || [];

    questions.forEach((q, idx) => {
      const userChoice = finalAnswers[idx] !== undefined ? finalAnswers[idx] : finalAnswers[String(idx)];
      const isCorrect = userChoice === q.correct_option;
      if (isCorrect && integrityStatus !== 'DISQUALIFIED_CHEATING') {
        score += 1;
      }

      review.push({
        questionNumber: idx + 1,
        questionText: q.question_text,
        options: q.options,
        userSelected: userChoice !== undefined ? userChoice : null,
        correctOption: q.correct_option,
        isCorrect: integrityStatus !== 'DISQUALIFIED_CHEATING' ? isCorrect : false,
        explanation: q.explanation
      });
    });

    const totalQuestions = questions.length || 1;
    const percentage = ((score / totalQuestions) * 100).toFixed(1);

    // Diagnostics & Weak areas
    const weakAreas = [];
    if (integrityStatus === 'DISQUALIFIED_CHEATING') {
      weakAreas.push({
        topic: 'Test Integrity Violation',
        score: '0/3 Strikes Exceeded',
        percentage: 0,
        advice: 'Candidate disqualified due to proctoring policy violation (repeated tab switches or exiting full-screen mode).'
      });
    } else if (parseFloat(percentage) < 60) {
      weakAreas.push({
        topic: topicName,
        score: `${score}/${totalQuestions}`,
        percentage: parseFloat(percentage),
        advice: `Review core formulas, speed-drills, and shortcut methodologies for ${topicName}.`
      });
    }

    // Persist attempt into PostgreSQL
    const insertAttemptRes = await pool.query(`
      INSERT INTO quiz.quiz_attempts (
        user_id,
        topic_id,
        test_type,
        score,
        total_questions,
        time_taken_seconds,
        tab_switch_count,
        fullscreen_exit_count,
        forced_auto_submit,
        status,
        integrity_report,
        weak_areas
      )
      VALUES ($1, $2, 'proctored_timed_arena', $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb)
      RETURNING id, submitted_at
    `, [
      effectiveUserId,
      topicId,
      score,
      totalQuestions,
      timeTakenSeconds,
      tabSwitchCount,
      fullscreenExitCount,
      forcedAutoSubmit,
      integrityStatus,
      JSON.stringify(integrityReport),
      JSON.stringify(weakAreas)
    ]);

    // Update practice progress if not disqualified
    if (topicId && integrityStatus !== 'DISQUALIFIED_CHEATING') {
      await pool.query(`
        INSERT INTO quiz.practice_progress (user_id, topic_id, completed_questions_count, last_attempted_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, topic_id)
        DO UPDATE SET 
          completed_questions_count = GREATEST(quiz.practice_progress.completed_questions_count, EXCLUDED.completed_questions_count),
          last_attempted_at = CURRENT_TIMESTAMP
      `, [effectiveUserId, topicId, totalQuestions]);
    }

    res.json({
      attemptId: insertAttemptRes.rows[0].id,
      topicName,
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
    });
  } catch (err) {
    console.error('[PROCTORED ASSESSMENT SUBMIT ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
