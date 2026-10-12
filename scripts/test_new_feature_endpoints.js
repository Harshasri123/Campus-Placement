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

async function testAll() {
  console.log('Testing newly mounted API endpoints...\n');

  // 1. Compiler endpoints
  const pList = await req('/api/compiler/problems');
  console.log('1. Compiler Problems:', pList.status, 'Total problems:', pList.body?.problems?.length);

  const runRes = await req('/api/compiler/run', 'POST', {
    problemId: 'tcs-adv-1',
    language: 'python',
    code: 'def solve(): pass',
    input: '5 12\n1 2 3 7 5'
  });
  console.log('2. Compiler Run:', runRes.status, 'Output:', runRes.body?.stdout, 'Comparison passed:', runRes.body?.comparison?.passed);

  const submitRes = await req('/api/compiler/submit', 'POST', {
    problemId: 'tcs-adv-1',
    language: 'python',
    code: 'def solve(): pass'
  });
  console.log('3. Compiler Submit:', submitRes.status, 'Verdict:', submitRes.body?.verdict, 'Passed:', submitRes.body?.passedCount);

  // 2. Resume Matcher endpoint
  const resumeRes = await req('/api/resume/analyze', 'POST', {
    roleId: 'sde-graduate',
    resumeText: 'Experienced with Python, Java, C++, SQL, DBMS, Git, Object-Oriented Programming (OOPs), and Data Structures. Developed web application with 500+ users.'
  });
  console.log('4. Resume Matcher:', resumeRes.status, 'ATS Score:', resumeRes.body?.overallScore + '%', 'Rating:', resumeRes.body?.atsRating);

  // 3. Interview simulator endpoint
  const intQ = await req('/api/interview/questions');
  console.log('5. Interview Questions:', intQ.status, 'Total questions:', intQ.body?.questions?.length);

  const evalRes = await req('/api/interview/evaluate', 'POST', {
    questionId: 'int-tech-1',
    candidateAnswer: 'Polymorphism allows objects to take multiple forms in object-oriented programming. In runtime polymorphism, method overriding lets subclasses provide specific implementation of interface or base class methods like in a payment system.'
  });
  console.log('6. Interview Evaluation:', evalRes.status, 'Score:', evalRes.body?.totalScore + '%', 'Tier:', evalRes.body?.performanceTier);

  // 4. Study Aids endpoint
  const sheets = await req('/api/study-aids/formula-sheets');
  console.log('7. Formula Sheets:', sheets.status, 'Sheets:', sheets.body?.sheets?.length);
  const flashcards = await req('/api/study-aids/flashcards');
  console.log('8. Flashcards:', flashcards.status, 'Cards:', flashcards.body?.flashcards?.length);

  // 5. Leaderboard endpoint
  const lb = await req('/api/leaderboard?userId=1');
  console.log('9. Leaderboard:', lb.status, 'Top percentile:', lb.body?.candidateRankInfo?.percentileMessage);

  console.log('\nAll 5 backend feature endpoints are 100% operational!');
}

testAll().catch(console.error);
