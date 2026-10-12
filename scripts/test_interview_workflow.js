/**
 * Automated Verification Test Suite for Interview-to-Hire Workflow
 * Tests complete lifecycle trace across all 12 REST endpoints and state machine.
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

async function runFullWorkflowVerification() {
  console.log('=================================================================');
  console.log('🧪 Starting End-to-End Interview-to-Hire Workflow Test Suite...');
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

  // 1. GET /api/v1/jobs
  const jobsRes = await req('/api/v1/jobs');
  assert('1. Get Published Jobs', jobsRes.status === 200 && jobsRes.body?.jobs?.length >= 2, `Total jobs: ${jobsRes.body?.jobs?.length}`);
  const targetJob = jobsRes.body.jobs[0];
  const jobId = targetJob.id;

  // 2. GET /api/v1/jobs/:id
  const jobDetailRes = await req(`/api/v1/jobs/${jobId}`);
  assert('2. Get Job Details & Rounds', jobDetailRes.status === 200 && jobDetailRes.body?.job?.rounds?.length >= 3, `Rounds configured: ${jobDetailRes.body?.job?.rounds?.length}`);

  // 3. POST /api/v1/jobs/:id/check-eligibility (Student Harshasri)
  const eligRes = await req(`/api/v1/jobs/${jobId}/check-eligibility`, 'POST', {
    studentId: 's0000000-0000-0000-0000-000000000001'
  });
  assert('3. Check Student Eligibility', eligRes.status === 200 && eligRes.body?.eligible === true, `Candidate CGPA: ${eligRes.body?.studentStats?.cgpa}`);

  // 4. GET /api/v1/student/applications
  const appsRes = await req('/api/v1/student/applications?studentId=s0000000-0000-0000-0000-000000000001');
  assert('4. Get Student Applications', appsRes.status === 200 && appsRes.body?.applications?.length > 0, `Active apps: ${appsRes.body?.applications?.length}`);
  const existingApp = appsRes.body.applications[0];
  const appId = existingApp.id;

  // 5. GET /api/v1/student/applications/:id (Visual Timeline & Audit Logs)
  const appDetailRes = await req(`/api/v1/student/applications/${appId}`);
  assert('5. Application Detail & Visual Timeline', appDetailRes.status === 200 && appDetailRes.body?.application?.auditLogs?.length >= 2, `Audit events: ${appDetailRes.body?.application?.auditLogs?.length}`);

  // 6. GET /api/v1/recruiter/jobs/:id/applicants
  const applicantsRes = await req(`/api/v1/recruiter/jobs/${jobId}/applicants`);
  assert('6. Recruiter Applicants Listing', applicantsRes.status === 200 && applicantsRes.body?.applicants?.length >= 1, `Applicants: ${applicantsRes.body?.applicants?.length}`);

  // 7. PATCH /api/v1/recruiter/applications/:id/status
  const statusRes = await req(`/api/v1/recruiter/applications/${appId}/status`, 'PATCH', {
    status: 'INTERVIEWING',
    note: 'Candidate verified for round evaluation'
  });
  assert('7. Transition Application Status', statusRes.status === 200 && statusRes.body?.newStatus === 'INTERVIEWING', `New Status: ${statusRes.body?.newStatus}`);

  // 8. POST /api/v1/recruiter/applications/:id/interviews (Schedule Interview)
  const roundConfigId = jobDetailRes.body.job.rounds[1].id;
  const schedRes = await req(`/api/v1/recruiter/applications/${appId}/interviews`, 'POST', {
    roundConfigId,
    scheduledStart: new Date(Date.now() + 86400000).toISOString(),
    scheduledEnd: new Date(Date.now() + 86400000 + 3600000).toISOString(),
    meetingLink: 'https://meet.google.com/xyz-careerpath-verify',
    instructions: 'Live code review and algorithmic problem solving'
  });
  assert('8. Schedule Interview Slot', schedRes.status === 201 && schedRes.body?.interviewId, `Interview ID: ${schedRes.body?.interviewId}`);
  const newInterviewId = schedRes.body.interviewId;

  // 9. GET /api/v1/student/interviews
  const interviewsRes = await req('/api/v1/student/interviews?studentId=s0000000-0000-0000-0000-000000000001');
  assert('9. Student Interview Center Fetch', interviewsRes.status === 200 && interviewsRes.body?.counts?.total >= 1, `Pending RSVP: ${interviewsRes.body?.counts?.pendingRsvp}`);

  // 10. PATCH /api/v1/student/interviews/:id/respond (Request Reschedule)
  const reschedRes = await req(`/api/v1/student/interviews/${newInterviewId}/respond`, 'PATCH', {
    studentId: 's0000000-0000-0000-0000-000000000001',
    action: 'RESCHEDULE',
    reason: 'University End-Semester Exam clash with current time window',
    slotPreferences: ['Tomorrow 4:00 PM IST', 'Day after tomorrow 11:00 AM IST']
  });
  assert('10. Candidate Reschedule Request Negotiation', reschedRes.status === 200 && reschedRes.body?.candidateStatus === 'RESCHEDULE_REQUESTED', `Status: ${reschedRes.body?.candidateStatus}`);

  // 11. PATCH /api/v1/student/interviews/:id/respond (Accept Slot)
  const acceptRes = await req(`/api/v1/student/interviews/${newInterviewId}/respond`, 'PATCH', {
    studentId: 's0000000-0000-0000-0000-000000000001',
    action: 'ACCEPT'
  });
  assert('11. Candidate Confirm Interview RSVP', acceptRes.status === 200 && acceptRes.body?.candidateStatus === 'ACCEPTED', `Status: ${acceptRes.body?.candidateStatus}`);

  // 12. POST /api/v1/recruiter/interviews/:id/feedback (Submit Scorecard)
  const feedbackRes = await req(`/api/v1/recruiter/interviews/${newInterviewId}/feedback`, 'POST', {
    interviewerName: 'Google Staff Engineer',
    rating: 5,
    technicalRating: 5,
    softSkillsRating: 5,
    comments: 'Superb depth in LRU cache design, thread concurrency, and clean code principles. Highly recommended.',
    recommendation: 'STRONG_HIRE'
  });
  assert('12. Recruiter Scorecard & Recommendation Submission', feedbackRes.status === 201 && feedbackRes.body?.recommendation === 'STRONG_HIRE', `App Status: ${feedbackRes.body?.applicationStatus}`);

  // 13. POST /api/v1/ai/interview-prep/generate
  const prepGenRes = await req('/api/v1/ai/interview-prep/generate', 'POST', {
    jobId,
    roundConfigId
  });
  assert('13. AI Prep Question Generator', prepGenRes.status === 200 && prepGenRes.body?.prep?.questions?.length >= 2, `Tailored Questions: ${prepGenRes.body?.prep?.questions?.length}`);

  // 14. POST /api/v1/ai/interview-prep/evaluate
  const sampleQuestion = prepGenRes.body.prep.questions[0];
  const prepEvalRes = await req('/api/v1/ai/interview-prep/evaluate', 'POST', {
    question: sampleQuestion,
    answerText: 'To implement an LRU cache with O(1) time complexity, I use a combination of a Doubly Linked List and a Hash Map. The Hash Map stores keys mapping to list nodes for instant lookup. When a key is accessed or updated, it is moved to the head of the list. When capacity is exceeded, the least recently used node at the tail is evicted. For concurrency, I use a ReadWriteLock to ensure thread safety without blocking simultaneous reads.'
  });
  assert('14. AI Prep Response Rubric Evaluation', prepEvalRes.status === 200 && prepEvalRes.body?.evaluation?.conceptualAccuracy >= 70, `Score: ${prepEvalRes.body?.evaluation?.scoreOutOf10}/10, Accuracy: ${prepEvalRes.body?.evaluation?.conceptualAccuracy}%`);

  // 15. POST /api/v1/recruiter/applications/:id/offer (Issue Offer)
  const offerRes = await req(`/api/v1/recruiter/applications/${appId}/offer`, 'POST', {
    joiningDate: '2026-07-01',
    validDays: 5,
    ctcBreakdown: {
      baseSalary: '₹22,00,000',
      variableBonus: '₹4,50,000',
      stockGrants: '₹8,50,000 (US$10,000)',
      relocationBenefits: '₹2,00,000',
      totalCtc: '₹37,00,000'
    }
  });
  assert('15. Recruiter Issues Formal Offer with Expiration', offerRes.status === 201 && offerRes.body?.offerId, `Expires: ${offerRes.body?.validUntil}`);
  const offerId = offerRes.body.offerId;

  // 16. PATCH /api/v1/student/offers/:id/respond (Accept Offer -> HIRED)
  const offerAcceptRes = await req(`/api/v1/student/offers/${offerId}/respond`, 'PATCH', {
    studentId: 's0000000-0000-0000-0000-000000000001',
    action: 'ACCEPT'
  });
  assert('16. Candidate Digital Offer Acceptance -> HIRED', offerAcceptRes.status === 200 && offerAcceptRes.body?.status === 'HIRED', `Status: ${offerAcceptRes.body?.status}`);

  // 17. Verify Final Audit Trail & Notifications
  const finalAppRes = await req(`/api/v1/student/applications/${appId}`);
  const logs = finalAppRes.body?.application?.auditLogs || [];
  const hiredLog = logs.find(l => l.new_status === 'HIRED');
  assert('17. Immutable Application Audit Trail Check', Boolean(hiredLog) && logs.length >= 5, `Total audit records: ${logs.length}`);

  // 18. Check Notifications
  const notifsRes = await req('/api/v1/student/notifications?userId=u0000000-0000-0000-0000-000000000001');
  assert('18. Student Real-Time Notification Log', notifsRes.status === 200 && notifsRes.body?.notifications?.length >= 3, `Unread count: ${notifsRes.body?.notifications?.filter(n => !n.is_read).length}`);

  console.log('\n=================================================================');
  console.log(`🎉 TEST SUMMARY: ${testPassed} / ${testTotal} TESTS PASSED (${Math.round(testPassed/testTotal*100)}%)`);
  console.log('=================================================================\n');

  if (testPassed === testTotal) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runFullWorkflowVerification().catch(err => {
  console.error('Fatal error running test:', err);
  process.exit(1);
});
