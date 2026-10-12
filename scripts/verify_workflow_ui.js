const http = require('http');

http.get('http://localhost:3000', res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode, 'Body length:', b.length);
    const tokens = [
      'btn-nav-campus-drives',
      'btn-nav-my-applications',
      'btn-nav-interview-center',
      'btn-nav-recruiter-console',
      'NotificationBellDrawer',
      'JobsDrivePortal',
      'StudentApplicationsPortal',
      'StudentInterviewCenter',
      'AiInterviewPrepSuite',
      'RecruiterConsole',
      'currentView === \'jobs_portal\'',
      'currentView === \'student_applications\'',
      'currentView === \'interview_center\'',
      'currentView === \'ai_prep_suite\'',
      'currentView === \'recruiter_console\''
    ];

    let passed = 0;
    tokens.forEach(t => {
      const found = b.includes(t);
      if (found) passed++;
      console.log(`[${found ? 'PASS' : 'FAIL'}] Token: ${t}`);
    });

    console.log(`\nOverall UI verification: ${passed} / ${tokens.length} tokens verified in served index.html!`);
    if (passed === tokens.length) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
}).on('error', err => {
  console.error('Request error:', err);
  process.exit(1);
});
