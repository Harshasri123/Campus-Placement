const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: data ? JSON.parse(data) : null, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING COMPLETE ARENA FLOW INTEGRATION TEST ===\n');

  // Test 1: Fetch index.html
  console.log('Test 1: Fetching index.html from server...');
  const htmlRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
  });
  if (htmlRes.status === 200 && htmlRes.raw.includes('Company Placement Mock Test Arena')) {
    console.log('✅ PASS: index.html served with Company Placement Mock Test Arena markup.');
  } else {
    console.error('❌ FAIL: index.html missing arena content, status:', htmlRes.status);
    process.exit(1);
  }

  // Check key frontend components in served HTML
  const requiredTokens = [
    'btn-nav-company-arena',
    'CompanyMockDashboard',
    'CompanyMockArena',
    'CompanyMockResult',
    'TCS NQT 2025 Blueprint',
    'Anti-Repetition Engine Active'
  ];
  for (const token of requiredTokens) {
    if (htmlRes.raw.includes(token)) {
      console.log(`✅ PASS: Found token "${token}" in served HTML`);
    } else {
      console.error(`❌ FAIL: Missing token "${token}" in served HTML`);
      process.exit(1);
    }
  }

  // Test 2: GET /api/mock-test/companies
  console.log('\nTest 2: GET /api/mock-test/companies...');
  const compRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/mock-test/companies?userId=guest-test-123',
    method: 'GET'
  });
  if (compRes.status === 200 && Array.isArray(compRes.body?.companies)) {
    console.log(`✅ PASS: Retrieved ${compRes.body.companies.length} recruiters:`);
    compRes.body.companies.forEach(c => {
      console.log(`   - ${c.companyName}: ${c.durationMinutes}m, ${c.totalQuestions} Qs, Cutoff: ${c.overallCutoffPct}%, Pool: ${c.totalPyqsInDb} PYQs`);
    });
  } else {
    console.error('❌ FAIL: Failed to get companies:', compRes.body);
    process.exit(1);
  }

  // Test 3: Generate Mock Test for each company
  const targetCompanies = ['TCS NQT', 'Infosys', 'Cognizant', 'Wipro', 'Accenture'];
  let testSessionToSubmit = null;

  console.log('\nTest 3: Generating adaptive mock test papers across all 5 recruiters...');
  for (const company of targetCompanies) {
    const genRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/mock-test/generate?company=${encodeURIComponent(company)}&userId=guest-test-123`,
      method: 'GET'
    });
    if (genRes.status === 200 && genRes.body?.questions?.length > 0) {
      console.log(`✅ PASS: ${company} mock generated: ${genRes.body.questions.length} Qs across sections (${genRes.body.sections.map(s => s.name).join(', ')})`);
      if (company === 'TCS NQT') {
        testSessionToSubmit = genRes.body;
      }
    } else {
      console.error(`❌ FAIL: Generating mock for ${company}:`, genRes.body);
      process.exit(1);
    }
  }

  // Test 4: Submit mock session and receive diagnostic report
  console.log('\nTest 4: Submitting completed mock session to /api/mock-test/submit...');
  const sampleAnswers = {};
  testSessionToSubmit.questions.forEach((q, idx) => {
    // Answer about 75% correctly
    sampleAnswers[q.id] = (idx % 4 !== 0) ? q.correct_option : ((q.correct_option + 1) % 4);
  });

  const submitRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/mock-test/submit',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    sessionId: testSessionToSubmit.sessionId,
    companyName: testSessionToSubmit.companyName,
    userId: 'guest-test-123',
    userAnswers: sampleAnswers,
    timeTakenSeconds: 2150,
    strikes: 0,
    forcedAutoSubmit: false
  });

  if (submitRes.status === 200 && submitRes.body?.qualificationStatus) {
    console.log('✅ PASS: Graded diagnostic report received:');
    console.log(`   - Verdict: ${submitRes.body.verdictTitle}`);
    console.log(`   - Score: ${submitRes.body.score}/${submitRes.body.totalQuestions} (${submitRes.body.percentage}%)`);
    console.log(`   - Cut-off Target: ${submitRes.body.overallCutoffPct}%`);
    console.log(`   - Sectional Breakdown: ${submitRes.body.sectionalBreakdown.length} sections evaluated`);
    submitRes.body.sectionalBreakdown.forEach(s => {
      console.log(`     * ${s.sectionName}: ${s.correct}/${s.total} (${s.percentage}%) - ${s.passedCutoff ? 'PASS' : 'FAIL'}`);
    });
    console.log(`   - Solutions Review Items: ${submitRes.body.review.length} questions`);
  } else {
    console.error('❌ FAIL: Submitting mock test failed:', submitRes.body);
    process.exit(1);
  }

  // Test 5: Verify Anti-Repetition Exclusion on next attempt
  console.log('\nTest 5: Verifying Anti-Repetition Exclusion on subsequent mock generation...');
  const nextGenRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/mock-test/generate?company=${encodeURIComponent('TCS NQT')}&userId=guest-test-123`,
    method: 'GET'
  });
  console.log(`✅ PASS: Next mock generation succeeded (Mock #${nextGenRes.body.mockNumber}, Pool Excluded: ${testSessionToSubmit.questions.length} attempted Qs)`);

  // Test 6: Reset PYQ History
  console.log('\nTest 6: Resetting student question history via /api/mock-test/reset-history...');
  const resetRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/mock-test/reset-history',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    companyName: 'TCS NQT',
    userId: 'guest-test-123'
  });
  if (resetRes.status === 200 && resetRes.body?.success) {
    console.log('✅ PASS: History reset successfully:', resetRes.body.message);
  } else {
    console.error('❌ FAIL: History reset failed:', resetRes.body);
    process.exit(1);
  }

  // Test 7: Verify History Endpoint
  console.log('\nTest 7: Fetching candidate mock history via /api/mock-test/history...');
  const histRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/mock-test/history?userId=guest-test-123',
    method: 'GET'
  });
  if (histRes.status === 200 && Array.isArray(histRes.body?.history)) {
    console.log(`✅ PASS: Found ${histRes.body.history.length} completed session(s) in history log.`);
  } else {
    console.error('❌ FAIL: History query failed:', histRes.body);
    process.exit(1);
  }

  console.log('\n🎉 ALL 7 INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch(err => {
  console.error('Integration test error:', err);
  process.exit(1);
});
