import express from 'express';
import { pool } from '../config/db.js';
import { requireAuth, optionalAuth } from './authRoutes.js';

const router = express.Router();

// Helper to generate procedural recurring placement questions for any topic up to 100 questions
function generateTopicQuestionBank(topic, startNum = 1, count = 100) {
  const generated = [];
  const name = topic.topic_name;
  const section = topic.section_name;

  for (let i = startNum; i < startNum + count; i++) {
    let qText = '';
    let options = [];
    let correct = 0;
    let explanation = '';

    if (section === 'Arithmetic Aptitude') {
      const v1 = (i * 3) + 12;
      const v2 = (i * 2) + 8;
      const v3 = (i * 5) + 20;

      if (name.includes('Trains')) {
        const speedKmph = 36 + (i % 5) * 18;
        const speedMs = speedKmph * (5 / 18);
        const lengthM = 150 + (i % 6) * 50;
        const timeSec = Math.round(lengthM / speedMs);
        qText = `Q${i}: A train ${lengthM} meters long runs at a uniform speed of ${speedKmph} km/h. How many seconds will it take to pass a stationary telegraph pole?`;
        options = [`${timeSec} seconds`, `${timeSec + 4} seconds`, `${Math.max(5, timeSec - 3)} seconds`, `${timeSec + 8} seconds`];
        correct = 0;
        explanation = `Speed in m/s = ${speedKmph} * (5/18) = ${speedMs} m/s.\nTime to pass a pole = Length of train / Speed = ${lengthM} / ${speedMs} = ${timeSec} seconds.`;
      } else if (name.includes('Work')) {
        const aDays = 10 + (i % 8) * 2;
        const bDays = aDays + 5;
        const combined = ((aDays * bDays) / (aDays + bDays)).toFixed(1);
        qText = `Q${i}: Worker A can finish an engineering assignment in ${aDays} days, while Worker B takes ${bDays} days. If both collaborate, how many days are required?`;
        options = [`${combined} days`, `${(parseFloat(combined) + 2.5).toFixed(1)} days`, `${(parseFloat(combined) - 1.2).toFixed(1)} days`, `${(aDays / 2).toFixed(1)} days`];
        correct = 0;
        explanation = `Combined 1-day work = (1/${aDays}) + (1/${bDays}) = (${bDays + aDays}) / ${aDays * bDays}.\nTotal days = (${aDays} * ${bDays}) / (${aDays + bDays}) = ${combined} days.`;
      } else if (name.includes('Pipes')) {
        const fillHours = 6 + (i % 6);
        const emptyHours = fillHours + 4;
        const netTime = ((fillHours * emptyHours) / (emptyHours - fillHours)).toFixed(1);
        qText = `Q${i}: Inlet Pipe A fills a reservoir in ${fillHours} hours, while Outlet Pipe B drains it in ${emptyHours} hours. How many hours to fill if both are open?`;
        options = [`${netTime} hours`, `${(parseFloat(netTime) + 4).toFixed(1)} hours`, `${(parseFloat(netTime) - 3).toFixed(1)} hours`, `${fillHours * 2} hours`];
        correct = 0;
        explanation = `Net rate = (1/${fillHours}) - (1/${emptyHours}) = (${emptyHours - fillHours}) / ${fillHours * emptyHours}.\nTime = (${fillHours} * ${emptyHours}) / (${emptyHours - fillHours}) = ${netTime} hours.`;
      } else if (name.includes('Profit')) {
        const cp = 200 + (i % 10) * 50;
        const profitPct = 10 + (i % 5) * 5;
        const sp = Math.round(cp * (1 + profitPct / 100));
        qText = `Q${i}: A retailer purchases an electronic gadget for $${cp} and aims for a net profit margin of ${profitPct}%. At what selling price should it be listed?`;
        options = [`$${sp}`, `$${sp - 15}`, `$${sp + 20}`, `$${sp + 35}`];
        correct = 0;
        explanation = `Selling Price = Cost Price * (1 + Profit% / 100) = $${cp} * ${1 + profitPct / 100} = $${sp}.`;
      } else if (name.includes('Interest')) {
        const p = 1000 + (i % 8) * 500;
        const r = 5 + (i % 4) * 2.5;
        const t = 2;
        const si = (p * r * t) / 100;
        qText = `Q${i}: Calculate the Simple Interest on an investment of $${p} at ${r}% annual interest rate over a duration of ${t} years.`;
        options = [`$${si}`, `$${si + 25}`, `$${si - 15}`, `$${si * 2}`];
        correct = 0;
        explanation = `Simple Interest = (P * R * T) / 100 = (${p} * ${r} * ${t}) / 100 = $${si}.`;
      } else {
        qText = `Q${i}: In a standard placement quantitative scenario on ${name}, if ratio component X is ${v1} and component Y is ${v2}, evaluate the proportional index.`;
        options = [`${(v1 / (v2 || 1)).toFixed(2)}`, `${((v1 + 5) / (v2 || 1)).toFixed(2)}`, `${((v1 - 3) / (v2 || 1)).toFixed(2)}`, `None of these`];
        correct = 0;
        explanation = `Proportional index = X / Y = ${v1} / ${v2} = ${(v1 / (v2 || 1)).toFixed(2)}.`;
      }
    } else if (section === 'Data Interpretation') {
      const baseVal = 120 + (i * 15);
      const targetVal = baseVal + 45;
      const pct = Math.round(((targetVal - baseVal) / baseVal) * 100);
      qText = `Q${i} [${name}]: According to the corporate analytics dataset for Period ${i}, department metric rose from ${baseVal} units to ${targetVal} units. Calculate the percentage increase.`;
      options = [`${pct}%`, `${pct + 5}%`, `${Math.max(2, pct - 6)}%`, `${pct + 12}%`];
      correct = 0;
      explanation = `Percentage Increase = [(${targetVal} - ${baseVal}) / ${baseVal}] * 100 = [${targetVal - baseVal} / ${baseVal}] * 100 = ${pct}%.`;
    } else {
      // Verbal Ability
      const verbalPairs = [
        { word: 'ABERRATION', syn: 'Anomaly', ant: 'Normality', exp: 'Deviation from what is normal.' },
        { word: 'BENEVOLENT', syn: 'Kind-hearted', ant: 'Malevolent', exp: 'Well meaning and kindly.' },
        { word: 'COGENT', syn: 'Convincing', ant: 'Unpersuasive', exp: 'Clear, logical, and convincing.' },
        { word: 'DILIGENT', syn: 'Hardworking', ant: 'Lazy', exp: 'Showing care and conscientiousness in work.' },
        { word: 'EQUANIMITY', syn: 'Composure', ant: 'Agitation', exp: 'Mental calmness under stress.' }
      ];
      const item = verbalPairs[i % verbalPairs.length];

      if (name.includes('Synonyms')) {
        qText = `Q${i}: Choose the most accurate synonym for the uppercase vocabulary word: "${item.word}".`;
        options = [item.syn, 'Disorderly', 'Hostile', 'Fragile'];
        correct = 0;
        explanation = `"${item.word}" means ${item.exp}. Its closest synonym is "${item.syn}".`;
      } else if (name.includes('Antonyms')) {
        qText = `Q${i}: Choose the word that is most nearly OPPOSITE in meaning to: "${item.word}".`;
        options = [item.ant, item.syn, 'Neutral', 'Complex'];
        correct = 0;
        explanation = `"${item.word}" means ${item.exp}. Its direct antonym is "${item.ant}".`;
      } else if (name.includes('Voice')) {
        qText = `Q${i}: Convert to Passive Voice: "The team developed candidate module ${i} successfully."`;
        options = [
          `Candidate module ${i} was successfully developed by the team.`,
          `Candidate module ${i} had been developed by the team.`,
          `The team was developing candidate module ${i}.`,
          `Candidate module ${i} is being developed.`
        ];
        correct = 0;
        explanation = `Simple past active (Subject + V2 + Object) converts into (Object + was/were + V3 + by Subject).`;
      } else {
        qText = `Q${i} [${name}]: Identify the correct grammatical choice or idiom interpretation for corporate communication scenario #${i}.`;
        options = [
          `Option A: Grammatically sound and logically aligned with formal syntax.`,
          `Option B: Contains misplaced modifier and subject-verb discord.`,
          `Option C: Redundant prepositional structure.`,
          `Option D: Tense inconsistency.`
        ];
        correct = 0;
        explanation = `Option A represents standard formal English adherence in accordance with competitive recruitment test patterns.`;
      }
    }

    generated.push({
      id: `gen-${topic.id}-${i}`,
      topic_id: topic.id,
      question_number: i,
      question_text: qText,
      data_asset_url: null,
      options,
      correct_option: correct,
      explanation,
      is_frequently_asked: true,
      is_bookmarked: false
    });
  }

  return generated;
}

// 1. GET /api/topics - List all 36 topics grouped by section with progress
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || null;

    let topicsQuery = `
      SELECT 
        t.id, 
        t.section_name, 
        t.topic_name, 
        t.slug, 
        t.icon, 
        t.total_questions_count,
        COUNT(q.id)::int as actual_db_questions_count
      FROM quiz.topics t
      LEFT JOIN quiz.questions q ON t.id = q.topic_id
      GROUP BY t.id
      ORDER BY t.section_name ASC, t.topic_name ASC
    `;

    const topicsRes = await pool.query(topicsQuery);

    // If user is authenticated, retrieve progress for all topics
    let progressMap = {};
    if (userId) {
      const progRes = await pool.query(
        `SELECT topic_id, completed_questions_count FROM quiz.practice_progress WHERE user_id = $1`,
        [userId]
      );
      progRes.rows.forEach(p => {
        progressMap[p.topic_id] = p.completed_questions_count;
      });
    }

    // Group by section
    const sections = {
      'Arithmetic Aptitude': [],
      'Data Interpretation': [],
      'Verbal Ability': []
    };

    topicsRes.rows.forEach(t => {
      const section = t.section_name || 'Arithmetic Aptitude';
      if (!sections[section]) sections[section] = [];
      sections[section].push({
        ...t,
        total_questions_count: 100, // Every folder guarantees 100 recurring questions
        completed_questions_count: progressMap[t.id] || 0
      });
    });

    res.json({
      sections,
      totalTopics: topicsRes.rows.length
    });
  } catch (err) {
    console.error('[GET TOPICS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/topics/:slug - Single Topic Metadata
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const topicRes = await pool.query('SELECT * FROM quiz.topics WHERE slug = $1', [slug]);

    if (topicRes.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    const topic = topicRes.rows[0];
    let completedCount = 0;

    if (req.user?.id) {
      const prog = await pool.query(
        'SELECT completed_questions_count FROM quiz.practice_progress WHERE user_id = $1 AND topic_id = $2',
        [req.user.id, topic.id]
      );
      if (prog.rows.length > 0) completedCount = prog.rows[0].completed_questions_count;
    }

    res.json({
      topic: {
        ...topic,
        total_questions_count: 100,
        completed_questions_count: completedCount
      }
    });
  } catch (err) {
    console.error('[GET TOPIC ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/topics/:slug/questions - Practice or Timed Test Questions
router.get('/:slug/questions', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { mode = 'practice', page = 1, limit = 20 } = req.query;

    const topicRes = await pool.query('SELECT * FROM quiz.topics WHERE slug = $1', [slug]);
    if (topicRes.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    const topic = topicRes.rows[0];
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(100, parseInt(limit, 10) || 20);

    // Fetch seeded questions from DB
    const dbQuestionsRes = await pool.query(
      `SELECT id, topic_id, question_number, question_text, data_asset_url, options, correct_option, explanation, is_frequently_asked
       FROM quiz.questions
       WHERE topic_id = $1
       ORDER BY question_number ASC`,
      [topic.id]
    );

    let allQuestions = [...dbQuestionsRes.rows];

    // If DB has fewer than 100 questions, dynamically supplement up to 100 questions
    if (allQuestions.length < 100) {
      const needed = 100 - allQuestions.length;
      const startNum = allQuestions.length + 1;
      const extraQuestions = generateTopicQuestionBank(topic, startNum, needed);
      allQuestions = allQuestions.concat(extraQuestions);
    }

    // Check user bookmarks if user logged in
    let bookmarkedIds = new Set();
    if (req.user?.id) {
      const bRes = await pool.query(
        'SELECT question_id FROM quiz.user_bookmarks WHERE user_id = $1',
        [req.user.id]
      );
      bRes.rows.forEach(r => bookmarkedIds.add(String(r.question_id)));
    }

    // Attach bookmark status
    allQuestions = allQuestions.map(q => ({
      ...q,
      is_bookmarked: bookmarkedIds.has(String(q.id))
    }));

    // If timed mode, slice the requested question count (e.g. 10, 20, 30)
    let paginated = [];
    if (mode === 'timed') {
      paginated = allQuestions.slice(0, limitNum);
    } else {
      const startIdx = (pageNum - 1) * limitNum;
      paginated = allQuestions.slice(startIdx, startIdx + limitNum);
    }

    res.json({
      topic: {
        id: topic.id,
        section_name: topic.section_name,
        topic_name: topic.topic_name,
        slug: topic.slug,
        icon: topic.icon
      },
      mode,
      page: pageNum,
      limit: limitNum,
      totalQuestions: allQuestions.length,
      totalPages: Math.ceil(allQuestions.length / limitNum),
      questions: paginated
    });
  } catch (err) {
    console.error('[GET QUESTIONS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/topics/:slug/progress - Update completed questions progress
router.post('/:slug/progress', requireAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { completedCount } = req.body;

    const topicRes = await pool.query('SELECT id FROM quiz.topics WHERE slug = $1', [slug]);
    if (topicRes.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    const topicId = topicRes.rows[0].id;
    const count = parseInt(completedCount, 10) || 1;

    await pool.query(`
      INSERT INTO quiz.practice_progress (user_id, topic_id, completed_questions_count, last_attempted_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, topic_id)
      DO UPDATE SET 
        completed_questions_count = GREATEST(quiz.practice_progress.completed_questions_count, EXCLUDED.completed_questions_count),
        last_attempted_at = CURRENT_TIMESTAMP
    `, [req.user.id, topicId, count]);

    res.json({ message: 'Progress saved successfully.', completedCount: count });
  } catch (err) {
    console.error('[PROGRESS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. GET /api/bookmarks - List all bookmarked questions for student
router.get('/user/bookmarks', requireAuth, async (req, res) => {
  try {
    const bRes = await pool.query(`
      SELECT 
        b.id as bookmark_id,
        b.created_at as bookmarked_at,
        q.id as question_id,
        q.question_text,
        q.options,
        q.correct_option,
        q.explanation,
        t.topic_name,
        t.section_name,
        t.slug as topic_slug
      FROM quiz.user_bookmarks b
      JOIN quiz.questions q ON b.question_id = q.id
      JOIN quiz.topics t ON q.topic_id = t.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);

    res.json({
      bookmarks: bRes.rows,
      total: bRes.rows.length
    });
  } catch (err) {
    console.error('[GET BOOKMARKS ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/bookmarks/toggle - Bookmark / unbookmark question
router.post('/user/bookmarks/toggle', requireAuth, async (req, res) => {
  try {
    const { questionId, questionText, topicSlug, options, correctOption, explanation } = req.body;

    if (!questionId) {
      return res.status(400).json({ error: 'Question ID is required.' });
    }

    let actualQId = questionId;

    // If it's a generated question ID (gen-UUID-num), ensure it exists in DB so FK succeeds
    if (String(questionId).startsWith('gen-')) {
      const topicRes = await pool.query('SELECT id FROM quiz.topics WHERE slug = $1', [topicSlug]);
      const topicId = topicRes.rows[0]?.id;

      if (topicId && questionText) {
        const ins = await clientOrPoolQuery(
          `INSERT INTO quiz.questions (topic_id, question_number, question_text, options, correct_option, explanation)
           VALUES ($1, 999, $2, $3::jsonb, $4, $5)
           RETURNING id`,
          [topicId, questionText, JSON.stringify(options || []), correctOption || 0, explanation || '']
        );
        actualQId = ins.rows[0].id;
      }
    }

    // Check if already bookmarked
    const check = await pool.query(
      'SELECT id FROM quiz.user_bookmarks WHERE user_id = $1 AND question_id = $2',
      [req.user.id, actualQId]
    );

    if (check.rows.length > 0) {
      await pool.query('DELETE FROM quiz.user_bookmarks WHERE id = $1', [check.rows[0].id]);
      return res.json({ isBookmarked: false, message: 'Question removed from bookmarks.' });
    } else {
      await pool.query(
        'INSERT INTO quiz.user_bookmarks (user_id, question_id) VALUES ($1, $2)',
        [req.user.id, actualQId]
      );
      return res.json({ isBookmarked: true, message: 'Question bookmarked for revision!' });
    }
  } catch (err) {
    console.error('[BOOKMARK TOGGLE ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

async function clientOrPoolQuery(text, params) {
  return pool.query(text, params);
}

// 7. POST /api/topics/submit-test - Timed test submission & scoring
router.post('/submit-test', requireAuth, async (req, res) => {
  try {
    const { topicSlug, answers, timeTakenSeconds, questionsList } = req.body;
    // answers: { [index]: selectedOptionIndex }

    let topicId = null;
    let topicName = 'General Aptitude';
    if (topicSlug) {
      const tRes = await pool.query('SELECT id, topic_name FROM quiz.topics WHERE slug = $1', [topicSlug]);
      if (tRes.rows.length > 0) {
        topicId = tRes.rows[0].id;
        topicName = tRes.rows[0].topic_name;
      }
    }

    const questions = questionsList || [];
    let score = 0;
    const review = [];

    questions.forEach((q, idx) => {
      const userChoice = answers[idx];
      const isCorrect = userChoice === q.correct_option;
      if (isCorrect) score += 1;

      review.push({
        questionNumber: idx + 1,
        questionText: q.question_text,
        options: q.options,
        userSelected: userChoice,
        correctOption: q.correct_option,
        isCorrect,
        explanation: q.explanation
      });
    });

    const totalQuestions = questions.length || 1;
    const percentage = ((score / totalQuestions) * 100).toFixed(1);

    // Weak areas calculation
    const weakAreas = [];
    if (parseFloat(percentage) < 60) {
      weakAreas.push({
        topic: topicName,
        score: `${score}/${totalQuestions}`,
        percentage: parseFloat(percentage),
        advice: `Review core formulas and speed-drill shortcuts for ${topicName}.`
      });
    }

    // Persist attempt
    const attemptRes = await pool.query(`
      INSERT INTO quiz.quiz_attempts (user_id, topic_id, test_type, score, total_questions, time_taken_seconds, weak_areas)
      VALUES ($1, $2, 'timed_test', $3, $4, $5, $6::jsonb)
      RETURNING id, submitted_at
    `, [
      req.user.id,
      topicId,
      score,
      totalQuestions,
      timeTakenSeconds || 0,
      JSON.stringify(weakAreas)
    ]);

    // Update practice progress
    if (topicId) {
      await pool.query(`
        INSERT INTO quiz.practice_progress (user_id, topic_id, completed_questions_count, last_attempted_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, topic_id)
        DO UPDATE SET 
          completed_questions_count = GREATEST(quiz.practice_progress.completed_questions_count, EXCLUDED.completed_questions_count),
          last_attempted_at = CURRENT_TIMESTAMP
      `, [req.user.id, topicId, totalQuestions]);
    }

    res.json({
      attemptId: attemptRes.rows[0].id,
      topicName,
      score,
      totalQuestions,
      percentage,
      timeTakenSeconds,
      weakAreas,
      review
    });
  } catch (err) {
    console.error('[SUBMIT TEST ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
