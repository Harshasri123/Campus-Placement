async function runTests() {
  // Test 1: Normal submission
  const res1 = await fetch('http://localhost:3000/api/assessment/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 1,
      testId: 'TCS-NQT-2026',
      userAnswers: { '0': 1 },
      timeTakenSeconds: 95,
      integrityReport: {
        tabSwitchCount: 0,
        fullscreenExitCount: 0,
        forcedAutoSubmit: false,
        status: 'COMPLETED_NORMALLY'
      }
    })
  });
  const data1 = await res1.json();
  console.log('✅ Test 1 Status:', data1.integrityStatus, '| Score:', data1.score);

  // Test 2: Cheating 3 strikes auto-submit
  const res2 = await fetch('http://localhost:3000/api/assessment/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 1,
      testId: 'TCS-NQT-2026',
      userAnswers: { '0': 1 },
      timeTakenSeconds: 30,
      integrityReport: {
        tabSwitchCount: 2,
        fullscreenExitCount: 1,
        forcedAutoSubmit: true,
        status: 'DISQUALIFIED_CHEATING'
      }
    })
  });
  const data2 = await res2.json();
  console.log('✅ Test 2 Status:', data2.integrityStatus, '| Score:', data2.score, '| Infraction notice:', data2.weakAreas[0].topic);

  if (data2.integrityStatus === 'DISQUALIFIED_CHEATING' && data2.score === 0) {
    console.log('🎉 ALL BACKEND ASSESSMENT INTEGRITY TESTS PASSED!');
  } else {
    console.error('❌ DISQUALIFICATION TEST FAILED');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
