import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

const COMPANY_BLUEPRINTS = {
  'TCS NQT': {
    code: 'tcs',
    name: 'TCS NQT',
    fullName: 'Tata Consultancy Services - National Qualifier Test',
    tagline: 'Standard Blueprint for Ninja & Digital Profiles (2022-2025 Pattern)',
    badge: 'Tier-1 Mass & Digital',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    overallCutoffPct: 65,
    durationMinutes: 75,
    sections: [
      { name: 'Numerical Ability', quota: 10, cutoffPct: 65, durationMin: 25 },
      { name: 'Reasoning Ability', quota: 10, cutoffPct: 65, durationMin: 25 },
      { name: 'Verbal Ability', quota: 10, cutoffPct: 60, durationMin: 25 },
      { name: 'Advanced Coding & Logic', quota: 5, cutoffPct: 70, durationMin: 15 }
    ]
  },
  'Infosys': {
    code: 'infosys',
    name: 'Infosys',
    fullName: 'Infosys Campus Recruitment (Springboard / DSE / Specialist Programmer)',
    tagline: 'Authentic Sectional Timed Pattern for Systems Engineer & DSE',
    badge: 'Tier-1 IT Giant',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    overallCutoffPct: 70,
    durationMinutes: 80,
    sections: [
      { name: 'Mathematical Thinking', quota: 10, cutoffPct: 70, durationMin: 25 },
      { name: 'Logical & Analytical Reasoning', quota: 10, cutoffPct: 70, durationMin: 25 },
      { name: 'Verbal Ability', quota: 10, cutoffPct: 65, durationMin: 20 },
      { name: 'Pseudocode & Tech Concepts', quota: 5, cutoffPct: 70, durationMin: 10 }
    ]
  },
  'Cognizant': {
    code: 'cognizant',
    name: 'Cognizant',
    fullName: 'Cognizant GenC & GenC Next Hiring Assessment',
    tagline: 'Analytical Speed & Technical Reasoning Architecture',
    badge: 'GenC & GenC Next',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    overallCutoffPct: 65,
    durationMinutes: 70,
    sections: [
      { name: 'Quantitative Ability', quota: 10, cutoffPct: 65, durationMin: 25 },
      { name: 'Analytical Reasoning', quota: 10, cutoffPct: 65, durationMin: 25 },
      { name: 'English Comprehension', quota: 10, cutoffPct: 60, durationMin: 20 },
      { name: 'Coding & SQL Assessment', quota: 5, cutoffPct: 70, durationMin: 15 }
    ]
  },
  'Wipro': {
    code: 'wipro',
    name: 'Wipro',
    fullName: 'Wipro Elite National Talent Hunt (NTH)',
    tagline: 'Standard Graduate Hiring Assessment Blueprint',
    badge: 'Elite NTH',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    overallCutoffPct: 60,
    durationMinutes: 65,
    sections: [
      { name: 'Quantitative Aptitude', quota: 10, cutoffPct: 60, durationMin: 20 },
      { name: 'Logical Ability', quota: 10, cutoffPct: 60, durationMin: 20 },
      { name: 'English Verbal', quota: 10, cutoffPct: 60, durationMin: 15 },
      { name: 'Coding Logic & Architecture', quota: 5, cutoffPct: 65, durationMin: 10 }
    ]
  },
  'Accenture': {
    code: 'accenture',
    name: 'Accenture',
    fullName: 'Accenture Cognitive & Technical Assessment (ASE / FSE)',
    tagline: 'Critical Thinking, Abstract Reasoning & Cloud Essentials',
    badge: 'ASE / FSE Track',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    overallCutoffPct: 65,
    durationMinutes: 75,
    sections: [
      { name: 'Cognitive Assessment', quota: 10, cutoffPct: 65, durationMin: 25 },
      { name: 'Technical & Pseudocode', quota: 10, cutoffPct: 65, durationMin: 25 },
      { name: 'Cloud & Security Fundamentals', quota: 5, cutoffPct: 60, durationMin: 15 },
      { name: 'Algorithmic Problem Solving', quota: 5, cutoffPct: 70, durationMin: 10 }
    ]
  }
};

// 1. GET /api/mock-test/companies - List companies with stats
router.get('/companies', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId || null;
    const list = [];

    for (const [companyName, bp] of Object.entries(COMPANY_BLUEPRINTS)) {
      let total = 0;
      let attempted = 0;
      let completedMocks = 0;
      let bestScore = null;

      try {
        const totalRes = await pool.query('SELECT COUNT(*)::int as count FROM company_questions WHERE company_name = $1', [companyName]);
        total = totalRes.rows[0]?.count || 0;

        if (userId) {
          const attRes = await pool.query('SELECT COUNT(DISTINCT question_id)::int as count FROM student_question_history WHERE user_id = $1 AND company_name = $2', [userId, companyName]);
          attempted = attRes.rows[0]?.count || 0;

          const mocksRes = await pool.query('SELECT score, total_questions FROM company_mock_sessions WHERE user_id = $1 AND company_name = $2 AND is_completed = TRUE', [userId, companyName]);
          completedMocks = mocksRes.rows.length;
          if (completedMocks > 0) {
            const max = mocksRes.rows.reduce((m, r) => Math.max(m, Math.round((r.score / (r.total_questions || 1)) * 100)), 0);
            bestScore = max;
          }
        }
      } catch (dbErr) {
        console.warn('Postgres query warning:', dbErr.message);
      }

      list.push({
        companyName,
        code: bp.code,
        fullName: bp.fullName,
        tagline: bp.tagline,
        badge: bp.badge,
        badgeColor: bp.badgeColor,
        overallCutoffPct: bp.overallCutoffPct,
        durationMinutes: bp.durationMinutes,
        sections: bp.sections,
        totalPoolQuestions: total,
        userAttemptedCount: attempted,
        remainingUnattemptedCount: Math.max(0, total - attempted),
        completedMocksCount: completedMocks,
        bestScorePct: bestScore,
        isExhausted: total > 0 && (total - attempted) < 5
      });
    }

    res.json({ companies: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/mock-test/generate - Non-repeating question rotation
router.get('/generate', async (req, res) => {
  try {
    const { company = 'TCS NQT', userId } = req.query;
    const bp = COMPANY_BLUEPRINTS[company] || COMPANY_BLUEPRINTS['TCS NQT'];

    // 1. Fetch unattempted questions
    let query = `
      SELECT id, company_name, exam_year, section_name, topic_tag, question_text, options, difficulty
      FROM company_questions
      WHERE company_name = $1
    `;
    const params = [company];

    if (userId) {
      query += ` AND id NOT IN (SELECT question_id FROM student_question_history WHERE user_id = $2)`;
      params.push(userId);
    }

    query += ` ORDER BY RANDOM() LIMIT 40;`;

    const { rows: questions } = await pool.query(query, params);

    if (userId && questions.length < 5) {
      return res.json({
        exhausted: true,
        companyName: company,
        message: `You have completed all unique PYQs for ${company}! Would you like to reset your attempt history or take a revision test?`
      });
    }

    res.json({
      exhausted: false,
      sessionId: 'cms-pg-' + Date.now(),
      companyName: company,
      companyCode: bp.code,
      mockNumber: 1,
      totalQuestions: questions.length,
      durationMinutes: bp.durationMinutes,
      overallCutoffPct: bp.overallCutoffPct,
      sections: bp.sections,
      questions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/mock-test/submit - Grade and cut-off evaluation
router.post('/submit', async (req, res) => {
  try {
    const { userId, sessionId, companyName, userAnswers = {}, timeTakenSeconds = 0 } = req.body;
    const bp = COMPANY_BLUEPRINTS[companyName] || { overallCutoffPct: 65, sections: [] };

    const qIds = Object.keys(userAnswers);
    let score = 0;
    const review = [];

    if (qIds.length > 0) {
      const qRes = await pool.query('SELECT * FROM company_questions WHERE id = ANY($1)', [qIds]);
      for (const q of qRes.rows) {
        const chosen = userAnswers[q.id];
        const isCorrect = chosen === q.correct_option;
        if (isCorrect) score++;

        review.push({
          questionId: q.id,
          section_name: q.section_name,
          topic_tag: q.topic_tag,
          question_text: q.question_text,
          options: q.options,
          userSelected: chosen,
          correctOption: q.correct_option,
          isCorrect,
          explanation: q.explanation
        });

        if (userId) {
          await pool.query(
            `INSERT INTO student_question_history (user_id, question_id, session_id, company_name, selected_option, is_correct)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT DO NOTHING`,
            [userId, q.id, sessionId || null, companyName, chosen, isCorrect]
          );
        }
      }
    }

    const totalQuestions = review.length || 1;
    const percentage = Math.round((score / totalQuestions) * 100);
    const qualified = percentage >= bp.overallCutoffPct;

    res.json({
      sessionId,
      companyName,
      score,
      totalQuestions,
      percentage,
      overallCutoffPct: bp.overallCutoffPct,
      qualificationStatus: qualified ? 'QUALIFIED_INTERVIEW' : 'NOT_QUALIFIED',
      verdictTitle: qualified ? '🎉 Qualified for Interview Round!' : 'Needs Improvement to Clear Cut-off',
      verdictMessage: qualified
        ? `Congratulations! You scored ${percentage}%, clearing the ${bp.overallCutoffPct}% cut-off for ${companyName}.`
        : `Your score of ${percentage}% is below the estimated ${bp.overallCutoffPct}% threshold.`,
      sectionalBreakdown: [],
      weakTopics: [],
      review
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/mock-test/reset-history
router.post('/reset-history', async (req, res) => {
  try {
    const { userId, companyName } = req.body;
    if (userId && companyName) {
      await pool.query('DELETE FROM student_question_history WHERE user_id = $1 AND company_name = $2', [userId, companyName]);
    }
    res.json({ success: true, message: `Question history reset for ${companyName}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
