const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const content = fs.readFileSync(htmlPath, 'utf8');

const scriptMatch = content.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('No <script type="text/babel"> found in index.html');
  process.exit(1);
}

const babelCode = scriptMatch[1];
console.log('Found Babel script. Length:', babelCode.length, 'chars');

try {
  // Test basic syntax checks
  const babel = require('@babel/core');
  babel.transformSync(babelCode, {
    presets: ['react'],
    filename: 'index.babel.jsx'
  });
  console.log('✅ Babel JSX syntax check PASSED! No syntax errors.');
} catch (err) {
  console.error('❌ Babel JSX compilation error:');
  console.error(err.message);
  process.exit(1);
}
