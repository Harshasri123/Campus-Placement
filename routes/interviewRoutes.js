const express = require('express');
const router = express.Router();
const { INTERVIEW_PYQ_DATASET } = require('../data/interviewQuestionsBank');
const { buildInterviewPrompt } = require('../services/systemPrompt');
const {
  getCandidateWeakAreasForInterview,
  saveInterviewSession,
  getInterviewHistory,
  getInterviewSessionDetails
} = require('../db/database');

// Active in-memory session cache for low-latency turn-taking
const activeSessions = new Map();

/**
 * Filler words and verbal crutches detection
 */
const FILLER_WORDS = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'basically', 'actually', 'sort of', 'kind of', 'i mean'];

/**
 * Helper: Evaluate a single interview answer
 */
function evaluateCandidateAnswer(question, answerText) {
  const text = (answerText || '').trim();
  const lowerAnswer = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Keyword coverage (up to 4.0 points)
  const expectedKeywords = question.expectedKeywords || [];
  const matchedKeywords = expectedKeywords.filter(kw => lowerAnswer.includes(kw.toLowerCase()));
  const missingKeywords = expectedKeywords.filter(kw => !lowerAnswer.includes(kw.toLowerCase()));
  const keywordRatio = expectedKeywords.length > 0 ? (matchedKeywords.length / expectedKeywords.length) : 0.8;
  const keywordScore = Math.min(4.0, Math.round(keywordRatio * 4.0 * 10) / 10);

  // 2. Length & Structural Depth (up to 3.5 points)
  let depthScore = 1.0;
  if (wordCount >= 60) depthScore = 3.5;
  else if (wordCount >= 40) depthScore = 2.8;
  else if (wordCount >= 25) depthScore = 2.0;
  else depthScore = 1.2;

  // 3. Communication Clarity & Filler Words (up to 2.5 points)
  let detectedFillers = [];
  FILLER_WORDS.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      detectedFillers.push({ word: filler, count: matches.length });
    }
  });

  const totalFillerCount = detectedFillers.reduce((acc, f) => acc + f.count, 0);
  let clarityScore = 2.5;
  if (totalFillerCount >= 4) clarityScore = 1.0;
  else if (totalFillerCount >= 2) clarityScore = 1.8;
  else if (totalFillerCount === 1) clarityScore = 2.2;

  // Total rating out of 10
  const rawScore = keywordScore + depthScore + clarityScore;
  const ratingOutOf10 = Math.min(10, Math.max(1, Math.round(rawScore * 10) / 10));

  // Diagnostic feedback items
  const feedbackItems = [];
  if (matchedKeywords.length >= 2) {
    feedbackItems.push(`Accurate key terminology used: ${matchedKeywords.slice(0, 3).join(', ')}.`);
  } else {
    feedbackItems.push(`Missed core concepts the interviewer expected: ${missingKeywords.slice(0, 3).join(', ') || 'essential terminology'}.`);
  }

  if (wordCount < 30) {
    feedbackItems.push('Response was relatively brief; consider expanding with practical examples or architectural impact.');
  } else if (wordCount >= 60) {
    feedbackItems.push('Strong explanation depth and structural articulation.');
  }

  if (totalFillerCount >= 2) {
    feedbackItems.push(`Noticed repeated filler words (${detectedFillers.map(f => `"${f.word}" (${f.count}x)`).join(', ')}). Practice pausing instead.`);
  } else {
    feedbackItems.push('Polished vocal clarity with minimal verbal filler crutches.');
  }

  return {
    scoreOutOf10: ratingOutOf10,
    wordCount,
    matchedKeywords,
    missingKeywords,
    detectedFillers,
    feedbackItems,
    modelAnswer: question.modelAnswer || null
  };
}

/**
 * Helper: Generate Final Comprehensive Evaluation Summary after 6 questions
 */
function buildFinalEvaluationReport(session) {
  const answers = session.answers || [];
  const questionCount = answers.length || 6;
  const avgScoreOutOf10 = answers.reduce((sum, a) => sum + (a.scoreOutOf10 || 5), 0) / (questionCount || 1);
  const overallScore = Math.min(100, Math.max(20, Math.round(avgScoreOutOf10 * 10)));

  // Determine recommendation
  let hiringRecommendation = 'Borderline';
  if (overallScore >= 80) hiringRecommendation = 'Strong Hire';
  else if (overallScore >= 65) hiringRecommendation = 'Hire';
  else if (overallScore >= 50) hiringRecommendation = 'Borderline';
  else hiringRecommendation = 'Reject';

  // Aggregate strengths
  const strengths = [];
  const allMatched = answers.flatMap(a => a.matchedKeywords || []);
  if (allMatched.length >= 10) {
    strengths.push(`Rich technical vocabulary: Demonstrated fluent command of ${[...new Set(allMatched)].slice(0, 5).join(', ')}.`);
  } else {
    strengths.push('Demonstrated solid foundational awareness and consistent effort across all interview questions.');
  }

  const avgWords = answers.reduce((sum, a) => sum + (a.wordCount || 0), 0) / (questionCount || 1);
  if (avgWords >= 45) {
    strengths.push('Articulate verbal delivery with well-paced technical walkthroughs.');
  }
  strengths.push(`Good alignment with ${session.company}'s core hiring criteria and cultural standards.`);

  // Aggregate areas to improve
  const areasToImprove = [];
  const allMissing = answers.flatMap(a => a.missingKeywords || []);
  if (allMissing.length > 0) {
    areasToImprove.push(`Deepen conceptual precision around: ${[...new Set(allMissing)].slice(0, 4).join(', ')}.`);
  }
  const totalFillers = answers.reduce((sum, a) => sum + (a.detectedFillers?.length || 0), 0);
  if (totalFillers > 2) {
    areasToImprove.push('Reduce conversational hesitation and filler words by taking a 2-second breath before answering.');
  } else {
    areasToImprove.push('Structure complex answers using the STAR method (Situation, Task, Action, Result) for added executive clarity.');
  }

  return {
    overallScore,
    hiringRecommendation,
    strengths,
    areasToImprove,
    targetCompany: session.company,
    roundType: session.roundType,
    totalQuestions: session.questions.length,
    completedAt: new Date().toISOString(),
    breakdown: answers.map((ans, idx) => ({
      questionIndex: idx + 1,
      questionText: session.questions[idx]?.question,
      topic: session.questions[idx]?.topic,
      scoreOutOf10: ans.scoreOutOf10,
      wordCount: ans.wordCount,
      matchedKeywords: ans.matchedKeywords,
      missingKeywords: ans.missingKeywords,
      feedback: ans.feedbackItems,
      modelAnswer: session.questions[idx]?.modelAnswer
    }))
  };
}

// =========================================================================
// 1. POST /api/interview/start - Initialize Session with Company Context & Weak Areas
// =========================================================================
router.post('/start', (req, res) => {
  try {
    const { userId, company = 'TCS NQT', roundType = 'Technical' } = req.body;

    // 1. Fetch historical weak areas from database
    const weakAreas = getCandidateWeakAreasForInterview(userId, company);

    // 2. Filter matching company questions from authentic PYQ dataset
    const matchingQuestions = INTERVIEW_PYQ_DATASET.filter(
      q => q.company.toLowerCase().includes(company.toLowerCase()) &&
           q.roundType.toLowerCase() === roundType.toLowerCase()
    );

    // Fallback if specific company questions are fewer than 6
    let selectedQuestions = [...matchingQuestions];
    if (selectedQuestions.length < 6) {
      const fallbackPool = INTERVIEW_PYQ_DATASET.filter(
        q => q.roundType.toLowerCase() === roundType.toLowerCase() &&
             !selectedQuestions.some(sq => sq.id === q.id)
      );
      selectedQuestions = selectedQuestions.concat(fallbackPool.slice(0, 6 - selectedQuestions.length));
    }
    // Limit to 6 structured questions per session
    selectedQuestions = selectedQuestions.slice(0, 6);

    const sessionId = `int-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const q1 = selectedQuestions[0];

    // Build tailored icebreaker + first question speech text
    let openingSpeech = '';
    if (roundType.toLowerCase() === 'technical') {
      openingSpeech = `Welcome to your ${company} technical campus interview. We reviewed your recent assessments highlighting topics like ${weakAreas.slice(0, 2).join(' and ') || 'Core Computing'}. Let's begin with our first question: ${q1.question}`;
    } else {
      openingSpeech = `Hello and welcome! I am delighted to speak with you today for the ${company} HR and behavioral round. Let's start with our opening question: ${q1.question}`;
    }

    const conversationLog = [
      {
        speaker: 'ai',
        text: openingSpeech,
        timestamp: new Date().toISOString()
      }
    ];

    const sessionData = {
      sessionId,
      userId,
      company,
      roundType,
      weakAreas,
      questions: selectedQuestions,
      currentIndex: 0,
      probedQuestions: new Set(),
      answers: [],
      conversationLog
    };

    activeSessions.set(sessionId, sessionData);

    // Save initial session to database
    saveInterviewSession({
      sessionId,
      userId,
      companyName: company,
      roundType,
      totalQuestions: 6,
      conversationLog,
      evaluationReport: null,
      status: 'IN_PROGRESS'
    });

    res.json({
      success: true,
      sessionId,
      company,
      roundType,
      currentQuestionIndex: 1,
      totalQuestions: 6,
      question: {
        id: q1.id,
        topic: q1.topic,
        question: q1.question,
        expectedKeywords: q1.expectedKeywords
      },
      spokenText: openingSpeech,
      weakAreas,
      conversationLog
    });
  } catch (err) {
    console.error('[INTERVIEW START ERROR]', err);
    res.status(500).json({ error: 'Failed to initialize AI interview session: ' + err.message });
  }
});

// =========================================================================
// 2. POST /api/interview/respond - Multi-Turn Turn Taking Engine & Probing
// =========================================================================
router.post('/respond', async (req, res) => {
  try {
    const { sessionId, userId, candidateAnswer } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required.' });
    }

    let session = activeSessions.get(sessionId);
    if (!session) {
      // Rehydrate from DB if server restarted
      const dbRow = getInterviewSessionDetails(sessionId);
      if (!dbRow) {
        return res.status(404).json({ error: 'Interview session not found or expired.' });
      }
      session = {
        sessionId: dbRow.id,
        userId: dbRow.user_id,
        company: dbRow.company_name,
        roundType: dbRow.round_type,
        weakAreas: [],
        questions: INTERVIEW_PYQ_DATASET.filter(q => q.company.toLowerCase().includes(dbRow.company_name.toLowerCase()) && q.roundType.toLowerCase() === dbRow.round_type.toLowerCase()).slice(0, 6),
        currentIndex: 0,
        probedQuestions: new Set(),
        answers: [],
        conversationLog: dbRow.conversation_log || []
      };
      activeSessions.set(sessionId, session);
    }

    const text = (candidateAnswer || '').trim();
    if (text.length < 5) {
      return res.status(400).json({ error: 'Please provide a spoken or typed response before submitting.' });
    }

    // Record candidate response in conversation log
    session.conversationLog.push({
      speaker: 'candidate',
      text: text,
      timestamp: new Date().toISOString()
    });

    const activeQuestion = session.questions[session.currentIndex] || session.questions[0];

    // Evaluate candidate response
    const answerEval = evaluateCandidateAnswer(activeQuestion, text);

    // Probing Rule: If answer is shallow (< 25 words or low keywords) and not yet probed for this question
    const isShallow = answerEval.wordCount < 25 || answerEval.matchedKeywords.length <= 1;
    const hasBeenProbed = session.probedQuestions.has(activeQuestion.id);

    if (isShallow && !hasBeenProbed && activeQuestion.followUpProbes && activeQuestion.followUpProbes.length > 0) {
      session.probedQuestions.add(activeQuestion.id);
      const probeText = activeQuestion.followUpProbes[0];
      const spokenProbe = `I see your point, but to explore your technical depth further: ${probeText}`;

      session.conversationLog.push({
        speaker: 'ai',
        text: spokenProbe,
        timestamp: new Date().toISOString()
      });

      // Update DB
      saveInterviewSession({
        sessionId: session.sessionId,
        userId: session.userId,
        companyName: session.company,
        roundType: session.roundType,
        totalQuestions: 6,
        conversationLog: session.conversationLog,
        evaluationReport: null,
        status: 'IN_PROGRESS'
      });

      return res.json({
        success: true,
        isFollowUpProbe: true,
        isCompleted: false,
        currentQuestionIndex: session.currentIndex + 1,
        totalQuestions: 6,
        question: {
          ...activeQuestion,
          question: probeText,
          isProbe: true
        },
        spokenText: spokenProbe,
        conversationLog: session.conversationLog,
        partialEvaluation: answerEval
      });
    }

    // Advance to next question
    session.answers.push(answerEval);
    session.currentIndex += 1;

    // Check if interview completed (all 6 questions answered)
    if (session.currentIndex >= session.questions.length) {
      const finalReport = buildFinalEvaluationReport(session);
      const conclusionSpeech = `Thank you! That concludes your ${session.company} ${session.roundType} interview. You scored ${finalReport.overallScore} out of 100 with a hiring recommendation of ${finalReport.hiringRecommendation}. Let's review your complete feedback matrix.`;

      session.conversationLog.push({
        speaker: 'ai',
        text: conclusionSpeech,
        timestamp: new Date().toISOString()
      });

      // Persist completed session to database
      saveInterviewSession({
        sessionId: session.sessionId,
        userId: session.userId,
        companyName: session.company,
        roundType: session.roundType,
        totalQuestions: 6,
        conversationLog: session.conversationLog,
        evaluationReport: finalReport,
        status: 'COMPLETED'
      });

      return res.json({
        success: true,
        isFollowUpProbe: false,
        isCompleted: true,
        currentQuestionIndex: 6,
        totalQuestions: 6,
        spokenText: conclusionSpeech,
        conversationLog: session.conversationLog,
        evaluationReport: finalReport
      });
    }

    // Next Question
    const nextQ = session.questions[session.currentIndex];
    const transitionSpeech = `Thank you. Let's move to question ${session.currentIndex + 1} of 6: ${nextQ.question}`;

    session.conversationLog.push({
      speaker: 'ai',
      text: transitionSpeech,
      timestamp: new Date().toISOString()
    });

    saveInterviewSession({
      sessionId: session.sessionId,
      userId: session.userId,
      companyName: session.company,
      roundType: session.roundType,
      totalQuestions: 6,
      conversationLog: session.conversationLog,
      evaluationReport: null,
      status: 'IN_PROGRESS'
    });

    res.json({
      success: true,
      isFollowUpProbe: false,
      isCompleted: false,
      currentQuestionIndex: session.currentIndex + 1,
      totalQuestions: 6,
      question: {
        id: nextQ.id,
        topic: nextQ.topic,
        question: nextQ.question,
        expectedKeywords: nextQ.expectedKeywords
      },
      spokenText: transitionSpeech,
      conversationLog: session.conversationLog,
      lastAnswerEvaluation: answerEval
    });
  } catch (err) {
    console.error('[INTERVIEW RESPOND ERROR]', err);
    res.status(500).json({ error: 'Failed to process candidate interview response: ' + err.message });
  }
});

// =========================================================================
// 3. GET /api/interview/history/:userId - Candidate Interview History
// =========================================================================
router.get('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const history = getInterviewHistory(userId);
    res.json({ success: true, history });
  } catch (err) {
    console.error('[INTERVIEW HISTORY ERROR]', err);
    res.status(500).json({ error: 'Failed to retrieve interview history: ' + err.message });
  }
});

// =========================================================================
// 4. GET /api/interview/pyqs - Authentic PYQ Catalog
// =========================================================================
router.get('/pyqs', (req, res) => {
  try {
    const { company, roundType } = req.query;
    let list = INTERVIEW_PYQ_DATASET;
    if (company && company !== 'all') {
      list = list.filter(q => q.company.toLowerCase().includes(company.toLowerCase()));
    }
    if (roundType && roundType !== 'all') {
      list = list.filter(q => q.roundType.toLowerCase() === roundType.toLowerCase());
    }
    res.json({ success: true, count: list.length, questions: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch PYQs: ' + err.message });
  }
});

// =========================================================================
// Backward Compatibility Endpoints for existing frontend calls
// =========================================================================
router.get('/questions', (req, res) => {
  const { category } = req.query;
  let list = INTERVIEW_PYQ_DATASET;
  if (category && category !== 'all') {
    list = list.filter(q => q.roundType.toLowerCase().includes(category.toLowerCase()));
  }
  res.json({ questions: list });
});

router.post('/evaluate', (req, res) => {
  try {
    const { questionId, candidateAnswer = '' } = req.body;
    const q = INTERVIEW_PYQ_DATASET.find(item => item.id === questionId) || INTERVIEW_PYQ_DATASET[0];
    const evalResult = evaluateCandidateAnswer(q, candidateAnswer);
    res.json({
      questionId: q.id,
      question: q.question,
      category: q.roundType,
      wordCount: evalResult.wordCount,
      totalScore: Math.round(evalResult.scoreOutOf10 * 10),
      performanceTier: evalResult.scoreOutOf10 >= 8 ? 'Interview Ready (Strong Hire)' : (evalResult.scoreOutOf10 >= 6 ? 'Competent' : 'Needs Practice'),
      tierColor: evalResult.scoreOutOf10 >= 8 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50',
      matchedKeywords: evalResult.matchedKeywords,
      missingKeywords: evalResult.missingKeywords,
      feedback: evalResult.feedbackItems,
      modelAnswerSTAR: q.modelAnswer
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.buildInterviewPrompt = buildInterviewPrompt;
