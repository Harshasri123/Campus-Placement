import express from 'express';
import { pool } from '../config/db.js';
import { TRACK_HIERARCHY } from '../config/categoriesConfig.js';

const router = express.Router();

// 0. GET /api/placement/categories - Return Taxonomy Catalog
router.get('/categories', (req, res) => {
  res.json({ tracks: TRACK_HIERARCHY });
});

// 1. GET /api/placement/daily or /api/quiz/daily - Get Today's 10 Daily Practice Questions
router.get('/daily', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Fetch questions assigned to today, or fallback to random 10 questions
    let result = await pool.query(
      `SELECT id, category, sub_category, topic_tag, question_text, options 
       FROM questions 
       WHERE is_daily_question = TRUE AND daily_date = $1 
       LIMIT 10`,
      [today]
    );

    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT id, category, sub_category, topic_tag, question_text, options 
         FROM questions 
         ORDER BY RANDOM() 
         LIMIT 10`
      );
    }

    res.json({ date: today, questions: result.rows });
  } catch (err) {
    console.error('Error fetching daily quiz:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/placement/placement-papers - List All Available Company Mock Papers
router.get('/placement-papers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, COUNT(pq.question_id)::int as total_questions
       FROM placement_papers p
       LEFT JOIN placement_paper_questions pq ON p.id = pq.paper_id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );
    res.json({ papers: result.rows });
  } catch (err) {
    console.error('Error fetching placement papers:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/placement/placement-papers/:id - Start a Company Placement Paper
router.get('/placement-papers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const paperInfo = await pool.query('SELECT * FROM placement_papers WHERE id = $1', [id]);
    if (paperInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Placement paper not found.' });
    }

    let questions = await pool.query(
      `SELECT q.id, q.category, q.sub_category, q.topic_tag, q.question_text, q.options, pq.question_order
       FROM questions q
       JOIN placement_paper_questions pq ON q.id = pq.question_id
       WHERE pq.paper_id = $1
       ORDER BY pq.question_order ASC`,
      [id]
    );

    // If paper has no linked questions yet, provide a curated set of questions
    if (questions.rows.length === 0) {
      const fallbackQuestions = await pool.query(
        `SELECT id, category, sub_category, topic_tag, question_text, options, 1 as question_order
         FROM questions 
         ORDER BY RANDOM() 
         LIMIT 10`
      );
      return res.json({ paper: paperInfo.rows[0], questions: fallbackQuestions.rows });
    }

    res.json({ paper: paperInfo.rows[0], questions: questions.rows });
  } catch (err) {
    console.error('Error fetching paper details:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/placement/questions - Practice Questions by Category / Sub-Category
router.get('/questions', async (req, res) => {
  try {
    const { category, subCategory, limit = 15 } = req.query;
    let queryStr = 'SELECT id, category, sub_category, topic_tag, question_text, options FROM questions';
    const params = [];

    if (category && subCategory) {
      queryStr += ' WHERE category = $1 AND sub_category ILIKE $2';
      params.push(category, `%${subCategory}%`);
    } else if (category) {
      queryStr += ' WHERE category = $1';
      params.push(category);
    } else if (subCategory) {
      queryStr += ' WHERE sub_category ILIKE $1';
      params.push(`%${subCategory}%`);
    }

    queryStr += ' ORDER BY RANDOM() LIMIT $' + (params.length + 1);
    params.push(parseInt(limit, 10));

    const result = await pool.query(queryStr, params);
    res.json({ questions: result.rows });
  } catch (err) {
    console.error('Error fetching questions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/placement/submit - Unified Submission Engine with Topic Diagnostic
router.post('/submit', async (req, res) => {
  try {
    const { userId, testType = 'placement_paper', referenceId, category, userAnswers = {}, timeTakenSeconds = 0 } = req.body;
    // userAnswers format: { [questionId]: chosenOptionIndex }

    const questionIds = Object.keys(userAnswers);
    if (questionIds.length === 0) {
      return res.status(400).json({ error: 'No answers submitted' });
    }

    // Fetch correct options & explanations
    const { rows: dbQuestions } = await pool.query(
      `SELECT id, topic_tag, correct_option, explanation FROM questions WHERE id = ANY($1::uuid[])`,
      [questionIds]
    );

    let score = 0;
    const topicStats = {}; // { 'Arithmetic': { correct: 0, total: 0 } }
    const feedbackBreakdown = [];

    dbQuestions.forEach((q) => {
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

    // Identify weak topics (less than 50% score)
    const weakAreas = [];
    Object.keys(topicStats).forEach((topic) => {
      const stat = topicStats[topic];
      const percentage = (stat.correct / stat.total) * 100;
      if (percentage < 50) {
        weakAreas.push({ topic, score: `${stat.correct}/${stat.total}`, percentage });
      }
    });

    // Save to Database
    const attempt = await pool.query(
      `INSERT INTO quiz_attempts (user_id, test_type, reference_id, category, score, total_questions, time_taken_seconds, weak_areas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       RETURNING id, submitted_at`,
      [userId || null, testType, referenceId || null, category || 'General', score, dbQuestions.length, timeTakenSeconds, JSON.stringify(weakAreas)]
    );

    res.json({
      attemptId: attempt.rows[0].id,
      score,
      totalQuestions: dbQuestions.length,
      percentage: ((score / dbQuestions.length) * 100).toFixed(1),
      weakAreas,
      review: feedbackBreakdown
    });
  } catch (err) {
    console.error('Error submitting test:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
