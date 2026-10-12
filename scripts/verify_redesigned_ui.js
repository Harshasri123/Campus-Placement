const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);

if (!scriptMatch) {
  console.error('❌ Script block not found in index.html');
  process.exit(1);
}

const code = scriptMatch[1];
console.log('Script block extracted. Length:', code.length);

// Balance check
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

console.log(`Balance check: braces=${braceDepth}, parens=${parenDepth}, brackets=${bracketDepth}`);

// Verify navigation categories and components
const requiredTokens = [
  'CareerPathNavbar',
  'CareerPathDashboard',
  'UserProfileModal',
  'UserSettingsModal',
  'Dashboard',
  'Practice & Learn',
  'Career & Jobs',
  'Interview Prep',
  'Exam Hub',
  'More',
  'Practice Tracks',
  'Formulas',
  'Mock Papers',
  'Bookmarks',
  'Drives',
  'Applications',
  'Recruiter',
  'Resume ATS',
  'AI Interview',
  'Interviews',
  'Company Mock Arena',
  'Timed Test Arena',
  'GATE',
  'CAT',
  'UPSC',
  'Banking Exams (SBI/IBPS)',
  'Study Planner',
  'Progress Tracker',
  'In-Browser Compiler'
];

let allPassed = true;
for (const token of requiredTokens) {
  const found = html.includes(token);
  console.log(`Token "${token}": ${found ? '✅ FOUND' : '❌ MISSING'}`);
  if (!found) allPassed = false;
}

if (allPassed && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
  console.log('🎉 ALL REDESIGNED NAVIGATION & DASHBOARD COMPONENTS VERIFIED SUCCESSFULLY!');
} else {
  console.error('❌ Verification failed!');
  process.exit(1);
}
