import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'quiz_super_secret_jwt_key_2026';
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || 'recovery_session_secret_key_2026';

// Helper: Validate email or mobile number
export function isValidEmailOrMobile(value) {
  if (!value || typeof value !== 'string') return false;
  const str = value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
  const generalPhoneRegex = /^\+?[0-9]{10,13}$/;
  return emailRegex.test(str) || mobileRegex.test(str) || generalPhoneRegex.test(str);
}

// Middleware to verify JWT authentication
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
    }
    req.user = decoded;
    next();
  });
};

// Optional auth middleware (sets req.user if token present)
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err) req.user = decoded;
    next();
  });
};

// 1. POST /api/auth/register - Dynamic Student Registration
router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      emailOrMobile,
      email, // Support alternate key
      password,
      confirmPassword,
      securityQuestion1,
      securityAnswer1,
      securityQuestion2,
      securityAnswer2
    } = req.body;

    const identifier = (emailOrMobile || email || '').trim();

    if (!fullName || !identifier || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Full name, email or mobile number, and password are required.' });
    }

    if (!isValidEmailOrMobile(identifier)) {
      return res.status(400).json({ 
        error: 'Please enter a valid Email address (e.g. name@gmail.com) or a valid 10-digit Mobile number.' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (!securityQuestion1 || !securityAnswer1 || !securityQuestion2 || !securityAnswer2) {
      return res.status(400).json({ error: 'Both security questions and answers are required for account recovery.' });
    }

    const cleanIdentifier = identifier.toLowerCase();

    // Check duplicate account
    const existing = await pool.query(
      `SELECT id FROM quiz.users WHERE email_or_mobile = $1 OR email = $1`,
      [cleanIdentifier]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this Email or Mobile number already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user into quiz.users
    const userRes = await pool.query(`
      INSERT INTO quiz.users (full_name, email_or_mobile, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email_or_mobile, created_at
    `, [fullName.trim(), cleanIdentifier, cleanIdentifier, passwordHash]);

    const newUser = userRes.rows[0];

    // Normalize and hash security answers
    const hashA1 = await bcrypt.hash(securityAnswer1.trim().toLowerCase(), 10);
    const hashA2 = await bcrypt.hash(securityAnswer2.trim().toLowerCase(), 10);

    await pool.query(`
      INSERT INTO quiz.user_security_questions (user_id, question_text, answer_hash)
      VALUES 
        ($1, $2, $3),
        ($1, $4, $5)
    `, [
      newUser.id,
      securityQuestion1.trim(),
      hashA1,
      securityQuestion2.trim(),
      hashA2
    ]);

    // Sign JWT
    const token = jwt.sign(
      { id: newUser.id, emailOrMobile: newUser.email_or_mobile, fullName: newUser.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account successfully registered!',
      token,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        emailOrMobile: newUser.email_or_mobile,
        email: newUser.email_or_mobile,
        createdAt: newUser.created_at
      }
    });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/auth/login - Dynamic Student Login
router.post('/login', async (req, res) => {
  try {
    const { emailOrMobile, email, password } = req.body;
    const identifier = (emailOrMobile || email || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email or Mobile number and password are required.' });
    }

    const cleanIdentifier = identifier.toLowerCase();
    const userRes = await pool.query(
      `SELECT * FROM quiz.users WHERE email_or_mobile = $1 OR email = $1`,
      [cleanIdentifier]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials. No account found for this Email or Mobile.' });
    }

    const user = userRes.rows[0];

    // Check lockout
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const minutesRemaining = Math.ceil((new Date(user.lockout_until) - new Date()) / 60000);
      return res.status(429).json({
        error: `Account is temporarily locked due to multiple failed attempts. Please try again in ${minutesRemaining} minute(s).`
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      const failed = (user.failed_reset_attempts || 0) + 1;
      let lockout = null;
      if (failed >= 5) {
        lockout = new Date(Date.now() + 15 * 60000); // 15 min lock
      }
      await pool.query(
        'UPDATE quiz.users SET failed_reset_attempts = $1, lockout_until = $2 WHERE id = $3',
        [failed, lockout, user.id]
      );
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    // Reset failed counter
    await pool.query(
      'UPDATE quiz.users SET failed_reset_attempts = 0, lockout_until = NULL WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, emailOrMobile: user.email_or_mobile, fullName: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Welcome back!',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        emailOrMobile: user.email_or_mobile,
        email: user.email_or_mobile,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/auth/me - Current User Profile & Progress Overview
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT id, full_name, email_or_mobile, created_at FROM quiz.users WHERE id = $1',
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];

    // Fetch user bookmarks count
    const bookmarksCount = await pool.query(
      'SELECT COUNT(*)::int as count FROM quiz.user_bookmarks WHERE user_id = $1',
      [req.user.id]
    );

    // Fetch user practice progress
    const progressRes = await pool.query(`
      SELECT p.topic_id, p.completed_questions_count, p.last_attempted_at, t.topic_name, t.section_name, t.slug
      FROM quiz.practice_progress p
      JOIN quiz.topics t ON p.topic_id = t.id
      WHERE p.user_id = $1
      ORDER BY p.last_attempted_at DESC
    `, [req.user.id]);

    // Fetch quiz attempts history
    const attemptsRes = await pool.query(`
      SELECT id, test_type, score, total_questions, time_taken_seconds, weak_areas, submitted_at
      FROM quiz.quiz_attempts
      WHERE user_id = $1
      ORDER BY submitted_at DESC
      LIMIT 10
    `, [req.user.id]);

    res.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        emailOrMobile: user.email_or_mobile,
        createdAt: user.created_at
      },
      stats: {
        bookmarkedCount: bookmarksCount.rows[0]?.count || 0,
        topicsInProgressCount: progressRes.rows.length
      },
      progress: progressRes.rows,
      attempts: attemptsRes.rows
    });
  } catch (err) {
    console.error('[ME ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/auth/forgot-password/initiate - Step 1: Challenge Security Questions
router.post('/forgot-password/initiate', async (req, res) => {
  try {
    const { emailOrMobile, email } = req.body;
    const identifier = (emailOrMobile || email || '').trim();

    if (!identifier) {
      return res.status(400).json({ error: 'Email or Mobile number is required.' });
    }

    const cleanIdentifier = identifier.toLowerCase();
    const userRes = await pool.query(
      'SELECT id, lockout_until FROM quiz.users WHERE email_or_mobile = $1 OR email = $1',
      [cleanIdentifier]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'No account registered with this Email or Mobile number.' });
    }

    const user = userRes.rows[0];

    // Check lockout
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const minutesRemaining = Math.ceil((new Date(user.lockout_until) - new Date()) / 60000);
      return res.status(429).json({
        error: `Account recovery is temporarily locked due to repeated incorrect attempts. Please try again in ${minutesRemaining} minute(s).`
      });
    }

    // Fetch questions
    const qRes = await pool.query(`
      SELECT question_text
      FROM quiz.user_security_questions
      WHERE user_id = $1
      ORDER BY id ASC
    `, [user.id]);

    if (qRes.rows.length < 2) {
      return res.status(400).json({ error: 'No security questions configured for this account.' });
    }

    res.json({
      emailOrMobile: cleanIdentifier,
      questions: [qRes.rows[0].question_text, qRes.rows[1].question_text]
    });
  } catch (err) {
    console.error('[FORGOT INITIATE ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/auth/forgot-password/verify - Step 2: Verify Answers & Issue Token
router.post('/forgot-password/verify', async (req, res) => {
  try {
    const { emailOrMobile, email, answer1, answer2 } = req.body;
    const identifier = (emailOrMobile || email || '').trim();

    if (!identifier || !answer1 || !answer2) {
      return res.status(400).json({ error: 'Email/Mobile and both security answers are required.' });
    }

    const cleanIdentifier = identifier.toLowerCase();
    const userRes = await pool.query(
      'SELECT id, failed_reset_attempts, lockout_until FROM quiz.users WHERE email_or_mobile = $1 OR email = $1',
      [cleanIdentifier]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const user = userRes.rows[0];

    // Check lockout
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const minutesRemaining = Math.ceil((new Date(user.lockout_until) - new Date()) / 60000);
      return res.status(429).json({
        error: `Too many failed recovery attempts. Locked for ${minutesRemaining} more minute(s).`
      });
    }

    const qRes = await pool.query(
      'SELECT answer_hash FROM quiz.user_security_questions WHERE user_id = $1 ORDER BY id ASC',
      [user.id]
    );

    if (qRes.rows.length < 2) {
      return res.status(400).json({ error: 'Security questions not found for this account.' });
    }

    const a1Match = await bcrypt.compare(answer1.trim().toLowerCase(), qRes.rows[0].answer_hash);
    const a2Match = await bcrypt.compare(answer2.trim().toLowerCase(), qRes.rows[1].answer_hash);

    if (!a1Match || !a2Match) {
      const attempts = (user.failed_reset_attempts || 0) + 1;
      let lockout = null;
      if (attempts >= 3) {
        lockout = new Date(Date.now() + 15 * 60000); // 15-min lockout on 3 strikes
      }

      await pool.query(
        'UPDATE quiz.users SET failed_reset_attempts = $1, lockout_until = $2 WHERE id = $3',
        [attempts, lockout, user.id]
      );

      const remaining = 3 - attempts;
      if (remaining <= 0) {
        return res.status(403).json({
          error: 'Security challenge failed 3 times. Account recovery locked for 15 minutes.'
        });
      }

      return res.status(401).json({
        error: `Incorrect security answer(s). You have ${remaining} attempt(s) remaining before temporary lockout.`
      });
    }

    // Success: Reset failed attempts counter and issue signed reset session token
    await pool.query(
      'UPDATE quiz.users SET failed_reset_attempts = 0, lockout_until = NULL WHERE id = $1',
      [user.id]
    );

    const resetToken = jwt.sign(
      { userId: user.id, emailOrMobile: cleanIdentifier, purpose: 'password_reset' },
      RESET_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      message: 'Identity verified successfully! You may now create a new password.',
      resetToken
    });
  } catch (err) {
    console.error('[FORGOT VERIFY ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/auth/forgot-password/reset - Step 3: Complete Password Reset
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Reset token, new password, and confirmation are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, RESET_TOKEN_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Password reset session has expired or is invalid. Please try again.' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(403).json({ error: 'Invalid token purpose.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE quiz.users SET password_hash = $1, failed_reset_attempts = 0, lockout_until = NULL WHERE id = $2',
      [newHash, decoded.userId]
    );

    res.json({ message: 'Password has been successfully updated! You can now sign in.' });
  } catch (err) {
    console.error('[FORGOT RESET ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
