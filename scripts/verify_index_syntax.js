const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);

if (!scriptMatch) {
  console.error('❌ Script block not found in index.html');
  process.exit(1);
}

const code = scriptMatch[1];
console.log('Script block extracted. Length:', code.length);

// Count braces, parentheses, and brackets
let braceDepth = 0;
let parenDepth = 0;
let bracketDepth = 0;

for (let i = 0; i < code.length; i++) {
  const ch = code[i];
  if (ch === '{') braceDepth++;
  else if (ch === '}') braceDepth--;
  else if (ch === '(') parenDepth++;
  else if (ch === ')') parenDepth--;
  else if (ch === '[') bracketDepth++;
  else if (ch === ']') bracketDepth--;

  if (braceDepth < 0 || parenDepth < 0 || bracketDepth < 0) {
    console.error(`❌ Negative depth at character ${i}: braces=${braceDepth}, parens=${parenDepth}, brackets=${bracketDepth}`);
    process.exit(1);
  }
}

console.log(`Depths: braces=${braceDepth}, parens=${parenDepth}, brackets=${bracketDepth}`);

// Check essential symbols
const requiredTokens = [
  'ExamHubPage',
  'ExamDetailsPage',
  'StudyPlannerDashboard',
  'MockTestListPage',
  'ExamEngineArena',
  'PerformanceReportPage',
  'AIStudyAssistantPage',
  'ExamTrackerPage',
  'CompetitiveExamsManager',
  'btn-nav-competitive-exams',
  'btn-home-launch-exam-hub'
];

let allTokensFound = true;
for (const token of requiredTokens) {
  const found = html.includes(token);
  console.log(`Token "${token}": ${found ? '✅ FOUND' : '❌ MISSING'}`);
  if (!found) allTokensFound = false;
}

if (allTokensFound) {
  console.log('🎉 ALL COMPETITIVE EXAMS FRONTEND COMPONENTS VERIFIED IN INDEX.HTML!');
} else {
  console.error('❌ Some tokens missing!');
  process.exit(1);
}
