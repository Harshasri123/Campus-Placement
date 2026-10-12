import express from 'express';
import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware: Verify Admin Access
export const requireAdmin = async (req, res, next) => {
  try {
    let userEmail = req.headers['x-user-email'];

    // Or extract from verified JWT
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'quiz_super_secret_jwt_key_2026');
        if (decoded && decoded.email) {
          userEmail = decoded.email;
        }
      } catch (tokenErr) {
        // Fall back to x-user-email
      }
    }

    if (!userEmail) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await pool.query('SELECT id, full_name, email, role FROM users WHERE LOWER(email) = LOWER($1)', [userEmail.trim()]);
    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }

    req.adminUser = result.rows[0];
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/questions - Add a new question to the bank
router.post('/questions', requireAdmin, async (req, res) => {
  const {
    category = 'Aptitude',
    subCategory,
    subject,
    topicTag,
    questionText,
    options,
    correctOption,
    explanation,
    isDailyQuestion = false,
    dailyDate = null
  } = req.body;

  // Resolve category from category or subject
  const validCategories = ['Aptitude', 'Verbal', 'Reasoning', 'Programming', 'Interview', 'PlacementPaper'];
  let resolvedCategory = category;
  if (!validCategories.includes(resolvedCategory)) {
    if (subject && /math|quant/i.test(subject)) resolvedCategory = 'Aptitude';
    else if (subject && /eng|verb/i.test(subject)) resolvedCategory = 'Verbal';
    else if (subject && /reason|logic/i.test(subject)) resolvedCategory = 'Reasoning';
    else if (subject && /code|prog|comp/i.test(subject)) resolvedCategory = 'Programming';
    else resolvedCategory = 'Aptitude';
  }

  const resolvedSubCategory = subCategory || subject || 'General Practice';

  if (!topicTag || !questionText || !options || correctOption === undefined || !explanation) {
    return res.status(400).json({ error: 'All fields (topicTag, questionText, options, correctOption, explanation) are required.' });
  }

  if (!Array.isArray(options) || options.length !== 4) {
    return res.status(400).json({ error: 'Exactly 4 options are required.' });
  }

  try {
    const query = `
      INSERT INTO quiz.questions (category, sub_category, topic_tag, question_text, options, correct_option, explanation, is_daily_question, daily_date)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      resolvedCategory,
      resolvedSubCategory.trim(),
      topicTag.trim(),
      questionText.trim(),
      JSON.stringify(options),
      parseInt(correctOption, 10),
      explanation.trim(),
      Boolean(isDailyQuestion),
      dailyDate || null
    ];
    const { rows } = await pool.query(query, values);

    res.status(201).json({ message: 'Question added successfully!', question: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/questions - List existing questions
router.get('/questions', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM quiz.questions ORDER BY category, sub_category, topic_tag ASC');
    res.json({ questions: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
