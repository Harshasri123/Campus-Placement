const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'database.js');
let content = fs.readFileSync(dbPath, 'utf8');

const targetFunction = `function getCompanyCatalogStats(userId) {`;

const newCode = `function resolveOrCreateUserId(rawUserId) {
  if (!rawUserId) return null;
  // If already an integer ID
  const num = parseInt(rawUserId, 10);
  if (!isNaN(num) && String(num) === String(rawUserId)) {
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(num);
    if (existing) return existing.id;
  }

  // String identifier check
  const guestEmail = \`\${rawUserId}@guest.campus.edu\`;
  const byEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(guestEmail);
  if (byEmail) return byEmail.id;

  try {
    const insert = db.prepare(\`
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES (?, ?, ?, 'student')
    \`);
    const res = insert.run(
      'Candidate (' + rawUserId + ')',
      guestEmail,
      'guest-auth-token'
    );
    return res.lastInsertRowid;
  } catch (err) {
    const fallback = db.prepare('SELECT id FROM users WHERE email = ?').get(guestEmail);
    return fallback ? fallback.id : null;
  }
}

function getCompanyCatalogStats(rawUserId) {
  const userId = resolveOrCreateUserId(rawUserId);`;

if (!content.includes(targetFunction)) {
  console.error('Target not found in db/database.js');
  process.exit(1);
}

content = content.replace(targetFunction, newCode);

// Update catalog attributes returned
const oldStatsTarget = `    result.push({
      companyName,
      code: blueprint.code,
      fullName: blueprint.fullName,
      tagline: blueprint.tagline,
      badge: blueprint.badge,
      badgeColor: blueprint.badgeColor,
      overallCutoffPct: blueprint.overallCutoffPct,
      durationMinutes: blueprint.durationMinutes,
      sections: blueprint.sections,
      totalPoolQuestions: total,
      userAttemptedCount: attempted,
      remainingUnattemptedCount: remaining,
      completedMocksCount: completedMocks,
      bestScorePct: bestScore,
      latestSession,
      isExhausted: total > 0 && remaining < 5
    });`;

const newStatsReplacement = `    const totalQs = (blueprint.sections || []).reduce((acc, s) => acc + s.quota, 0);

    result.push({
      companyName,
      code: blueprint.code,
      fullName: blueprint.fullName,
      tagline: blueprint.tagline,
      badge: blueprint.badge,
      badgeColor: blueprint.badgeColor,
      overallCutoffPct: blueprint.overallCutoffPct,
      durationMinutes: blueprint.durationMinutes,
      sections: blueprint.sections,
      totalQuestions: totalQs,
      totalPoolQuestions: total,
      totalPyqsInDb: total,
      userAttemptedCount: attempted,
      userAttemptedPyqs: attempted,
      remainingUnattemptedCount: remaining,
      remainingUnattempted: remaining,
      completedMocksCount: completedMocks,
      completedSessionsCount: completedMocks,
      bestScorePct: bestScore,
      averageScore: bestScore !== null ? bestScore : 0,
      latestSession,
      isExhausted: total > 0 && remaining < 5
    });`;

content = content.replace(oldStatsTarget, newStatsReplacement);

// Update generateCompanyMock
const oldGenTarget = `function generateCompanyMock(userId, companyName) {`;
const newGenReplacement = `function generateCompanyMock(rawUserId, companyName) {
  const userId = resolveOrCreateUserId(rawUserId);`;
content = content.replace(oldGenTarget, newGenReplacement);

// Update submitCompanyMockSession
const oldSubmitTarget = `function submitCompanyMockSession({ userId, sessionId, companyName, userAnswers = {}, timeTakenSeconds = 0, strikes = 0, forcedAutoSubmit = false }) {`;
const newSubmitReplacement = `function submitCompanyMockSession({ userId: rawUserId, sessionId, companyName, userAnswers = {}, timeTakenSeconds = 0, strikes = 0, forcedAutoSubmit = false }) {
  const userId = resolveOrCreateUserId(rawUserId);`;
content = content.replace(oldSubmitTarget, newSubmitReplacement);

// Update resetUserCompanyHistory
const oldResetTarget = `function resetUserCompanyHistory(userId, companyName) {
  if (!userId || !companyName) return false;`;
const newResetReplacement = `function resetUserCompanyHistory(rawUserId, companyName) {
  const userId = resolveOrCreateUserId(rawUserId);
  if (!userId || !companyName) return false;`;
content = content.replace(oldResetTarget, newResetReplacement);

// Update getUserCompanyMockHistory
const oldHistTarget = `function getUserCompanyMockHistory(userId) {
  if (!userId) return [];`;
const newHistReplacement = `function getUserCompanyMockHistory(rawUserId) {
  const userId = resolveOrCreateUserId(rawUserId);
  if (!userId) return [];`;
content = content.replace(oldHistTarget, newHistReplacement);

fs.writeFileSync(dbPath, content, 'utf8');
console.log('✅ Successfully patched db/database.js user resolution and stats fields');
