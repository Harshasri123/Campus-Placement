/**
 * Automated Verification Test Suite for Competitive Exam Platform
 * Tests complete lifecycle: Categories, Multi-Stage Exams, Polymorphic Evaluator,
 * Server-Authoritative Clock Sessions, Time-Loss Analytics, AI Explainer, and Exam Trackers.
 */

const http = require('http');

function req(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const r = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(buf) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: buf });
        }
      });
    });
    r.on('error', reject);
    if (postData) r.write(postData);
    r.end();
  });
}

async function runCompetitiveExamTests() {
  console.log('=================================================================');
  console.log('🧪 Starting Competitive Exam Platform Test Suite...');
  console.log('=================================================================\n');

  let testPassed = 0;
  let testTotal = 0;

  function assert(title, condition, extra = '') {
    testTotal++;
    if (condition) {
      testPassed++;
      console.log(`✅ [PASS] ${title} ${extra ? `(${extra})` : ''}`);
    } else {
      console.error(`❌ [FAIL] ${title} ${extra ? `(${extra})` : ''}`);
    }
  }

  // 1. GET /api/v1/exams
  const examsRes = await req('/api/v1/exams');
  assert('1. Get Exams Grouped by Category', examsRes.status === 200 && examsRes.body?.categories?.length >= 4, `Categories: ${examsRes.body?.categories?.length}`);
  const catEngg = examsRes.body.categories.find(c => c.slug === 'engineering-entrance');
  const gateExam = catEngg?.exams?.find(e => e.slug === 'gate-cse');
  const gateId = gateExam?.id;

  // 2. GET /api/v1/exams/:slug
  const examSlugRes = await req('/api/v1/exams/gate-cse');
  assert('2. Get Exam By Slug & Stages', examSlugRes.status === 200 && examSlugRes.body?.exam?.stages?.length >= 1, `Stages: ${examSlugRes.body?.exam?.stages?.length}`);
  const stageId = examSlugRes.body.exam.stages[0].id;

  // 3. POST /api/v1/exams/:id/check-eligibility
  const eligRes = await req(`/api/v1/exams/${gateId}/check-eligibility`, 'POST', {
    age: 22,
    degree: 'B.Tech in CSE',
    percentage: 78.5,
    pastAttempts: 1
  });
  assert('3. Check Exam Eligibility (GATE)', eligRes.status === 200 && eligRes.body?.eligible === true, `Evaluated Age: ${eligRes.body?.evaluatedProfile?.age}`);

  // 4. GET /api/v1/exams/:id/stages/:stageId/syllabus
  const syllabusRes = await req(`/api/v1/exams/${gateId}/stages/${stageId}/syllabus`);
  assert('4. Nested Subject -> Topic Syllabus Tree', syllabusRes.status === 200 && syllabusRes.body?.syllabus?.length >= 2, `Subjects: ${syllabusRes.body?.syllabus?.length}`);

  // 5. GET /api/v1/questions
  const qRes = await req('/api/v1/questions');
  assert('5. Filter Question Bank', qRes.status === 200 && qRes.body?.questions?.length >= 3, `Questions fetched: ${qRes.body?.questions?.length}`);

  // 6. POST /api/v1/mock-tests/start (GATE Full Mock)
  const mockStartRes = await req('/api/v1/mock-tests/start', 'POST', {
    mockTestId: 'mt000000-0000-0000-0000-000000000001'
  });
  assert('6. Start Server-Authoritative Mock Session', mockStartRes.status === 201 && mockStartRes.body?.submissionId, `Session: ${mockStartRes.body?.submissionId}`);
  const submissionId = mockStartRes.body?.submissionId;
  const questionsList = mockStartRes.body?.sections?.flatMap(s => s.questions) || [];

  // Security Check: Verify correct answers stripped!
  const hasLeakedAnswers = questionsList.some(q => q.correct_answer !== undefined || q.explanation !== undefined);
  assert('7. Security Guardrail: No Leaked Answers in Active Test Payload', !hasLeakedAnswers, 'Payload is securely sanitized');

  // 8. POST /api/v1/mock-tests/:id/heartbeat-sync (Sync responses)
  const q1 = questionsList[0]; // MCQ (AVL tree -> Option B)
  const q2 = questionsList[1]; // MSQ (Dijkstra -> ['A', 'C'])
  const q3 = questionsList[2]; // NAT (Virtual Memory -> 4)

  const heartbeatRes = await req(`/api/v1/mock-tests/${submissionId}/heartbeat-sync`, 'POST', {
    responses: [
      { questionId: q1.id, answer: 'B', state: 'ANSWERED', timeSpent: 45 },
      { questionId: q2.id, answer: ['A', 'C'], state: 'ANSWERED_AND_MARKED', timeSpent: 90 },
      { questionId: q3.id, answer: 4.0, state: 'ANSWERED', timeSpent: 110 }
    ]
  });
  assert('8. Heartbeat Sync & Authoritative Timer Update', heartbeatRes.status === 200 && heartbeatRes.body?.remainingSeconds > 0, `Remaining: ${heartbeatRes.body?.remainingSeconds}s`);

  // 9. POST /api/v1/mock-tests/:id/submit
  const submitRes = await req(`/api/v1/mock-tests/${submissionId}/submit`, 'POST');
  assert('9. Deterministic Polymorphic Scoring Submission', submitRes.status === 200 && submitRes.body?.accuracyPct === 100, `Score: ${submitRes.body?.totalScore} / ${submitRes.body?.totalPossibleMarks}, Accuracy: ${submitRes.body?.accuracyPct}%`);

  // 10. GET /api/v1/mock-tests/reports/:submissionId
  const reportRes = await req(`/api/v1/mock-tests/reports/${submissionId}`);
  assert('10. Comprehensive Diagnostics & Time-Loss Report', reportRes.status === 200 && reportRes.body?.analytics?.topicMasteryIndices?.length >= 2, `TMI Topics: ${reportRes.body?.analytics?.topicMasteryIndices?.length}`);

  // 11. POST /api/v1/study-plans & GET /api/v1/study-plans/streak
  const planRes = await req('/api/v1/study-plans', 'POST', {
    examStageId: stageId,
    targetExamDate: '2027-02-14',
    dailyHours: 4.5
  });
  assert('11. Adaptive Study Plan Generation', planRes.status === 200 && planRes.body?.plan, `Target: ${planRes.body?.plan?.targetExamDate}`);

  const streakRes = await req('/api/v1/study-plans/streak');
  assert('12. Daily Revision & Streak Tracker', streakRes.status === 200 && streakRes.body?.streak >= 1, `Streak: ${streakRes.body?.streak} days`);

  // 13. POST /api/v1/ai/explain-concept (LaTeX & Analogies)
  const conceptRes = await req('/api/v1/ai/explain-concept', 'POST', {
    topicName: 'Binary Search Trees & AVL Trees',
    conceptQuery: 'AVL Tree Rotations and Balance Factor'
  });
  assert('13. AI Concept Explainer with LaTeX Math', conceptRes.status === 200 && conceptRes.body?.explanation?.mathematicalFormula, `Formula: ${conceptRes.body?.explanation?.mathematicalFormula?.slice(0, 30)}...`);

  // 14. POST /api/v1/ai/generate-drill-quiz (Targeted Weak-Area Fixer)
  const drillRes = await req('/api/v1/ai/generate-drill-quiz', 'POST', {
    topicName: 'Virtual Memory & Page Replacement',
    questionCount: 2
  });
  assert('14. AI Weak-Area Remedial Drill Generator', drillRes.status === 200 && drillRes.body?.drill?.questions?.length >= 2, `Questions: ${drillRes.body?.drill?.questions?.length}`);

  // 15. GET /api/v1/exam-trackers & PATCH /api/v1/exam-trackers/:id
  const trackersRes = await req('/api/v1/exam-trackers');
  assert('15. Student Exam Lifecycle Milestones', trackersRes.status === 200 && trackersRes.body?.trackers?.length >= 1, `Tracked Exams: ${trackersRes.body?.trackers?.length}`);
  const trackerId = trackersRes.body.trackers[0].id;

  const updateTrackerRes = await req(`/api/v1/exam-trackers/${trackerId}`, 'PATCH', {
    status: 'ADMIT_CARD_DOWNLOADED',
    rollNumber: 'CS26S3819201-VERIFIED'
  });
  assert('16. Transition Exam Milestone Status', updateTrackerRes.status === 200 && updateTrackerRes.body?.status === 'ADMIT_CARD_DOWNLOADED', `Status: ${updateTrackerRes.body?.status}`);

  console.log('\n=================================================================');
  console.log(`🎉 TEST SUMMARY: ${testPassed} / ${testTotal} TESTS PASSED (${Math.round(testPassed/testTotal*100)}%)`);
  console.log('=================================================================\n');

  if (testPassed === testTotal) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runCompetitiveExamTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
