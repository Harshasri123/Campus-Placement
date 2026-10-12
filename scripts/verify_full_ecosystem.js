const http = require('http');

function check() {
  http.get('http://localhost:3000', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log('HTTP Status:', res.statusCode);
      const tokens = [
        'btn-nav-coding-sandbox',
        'btn-nav-resume-matcher',
        'btn-nav-mock-interview',
        'btn-nav-formula-sheets',
        'btn-nav-leaderboard',
        'LiveCodingSandbox',
        'ResumeJobMatcher',
        'MockInterviewSimulator',
        'FormulaCheatSheets',
        'CampusLeaderboard'
      ];
      tokens.forEach(t => {
        console.log(`Token "${t}": ${data.includes(t) ? '✅ FOUND' : '❌ MISSING'}`);
      });
    });
  }).on('error', console.error);
}

check();
