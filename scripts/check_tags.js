const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Basic bracket balancing check on script block
const match = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
if (!match) {
  console.log('No babel script found');
  process.exit(1);
}

const code = match[1];

let curlies = 0;
let parens = 0;
let brackets = 0;
let inString = false;
let stringChar = '';
let inComment = false;

for (let i = 0; i < code.length; i++) {
  const c = code[i];
  const next = code[i + 1];

  if (inComment) {
    if (inComment === 'line' && (c === '\n' || c === '\r')) {
      inComment = false;
    } else if (inComment === 'block' && c === '*' && next === '/') {
      inComment = false;
      i++;
    }
    continue;
  }

  if (inString) {
    if (c === '\\') {
      i++; // skip escaped char
    } else if (c === stringChar) {
      inString = false;
    }
    continue;
  }

  if (c === '/' && next === '/') {
    inComment = 'line';
    i++;
    continue;
  }
  if (c === '/' && next === '*') {
    inComment = 'block';
    i++;
    continue;
  }

  if (c === '"' || c === "'" || c === '`') {
    inString = true;
    stringChar = c;
    continue;
  }

  if (c === '{') curlies++;
  if (c === '}') curlies--;
  if (c === '(') parens++;
  if (c === ')') parens--;
  if (c === '[') brackets++;
  if (c === ']') brackets--;

  if (curlies < 0) {
    console.error('Negative curlies at char ' + i);
    break;
  }
  if (parens < 0) {
    console.error('Negative parens at char ' + i);
    break;
  }
  if (brackets < 0) {
    console.error('Negative brackets at char ' + i);
    break;
  }
}

console.log('Balance result:', { curlies, parens, brackets });
if (curlies === 0 && parens === 0 && brackets === 0) {
  console.log('✅ Brackets are completely balanced!');
} else {
  console.error('❌ Mismatched brackets!');
}
