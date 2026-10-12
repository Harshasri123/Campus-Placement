const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

console.log('Original index.html length:', html.length);

// 1. Add state variables in App()
const stateTarget = `const [placementResultData, setPlacementResultData] = useState(null);`;
const stateReplacement = `const [placementResultData, setPlacementResultData] = useState(null);

      // Company Placement Mock Test Arena States
      const [companyMockSession, setCompanyMockSession] = useState(null);
      const [companyMockResult, setCompanyMockResult] = useState(null);
      const [companyMockLoading, setCompanyMockLoading] = useState(false);`;

if (!html.includes(stateTarget)) {
  console.error('Could not find stateTarget in index.html');
  process.exit(1);
}
html = html.replace(stateTarget, stateReplacement);

// 2. Add handlers in App()
const handlerTarget = `      // Session Verification
      useEffect(() => {`;

const handlerReplacement = `      // Company Placement Mock Test Arena Handlers
      const handleStartCompanyMock = async (companyName) => {
        try {
          setCompanyMockLoading(true);
          const userId = currentUser ? currentUser.id : null;
          const res = await fetch(\`/api/mock-test/generate?company=\${encodeURIComponent(companyName)}&userId=\${userId || ''}\`);
          const data = await res.json();
          if (data.error) throw new Error(data.error);

          setCompanyMockSession(data);
          setCurrentView('company_mock_test');
        } catch (err) {
          alert('Could not start company mock test: ' + err.message);
        } finally {
          setCompanyMockLoading(false);
        }
      };

      const handleSubmitCompanyMock = async ({ sessionId, companyName, userAnswers, timeTakenSeconds, strikes, forcedAutoSubmit }) => {
        try {
          const userId = currentUser ? currentUser.id : null;
          const token = localStorage.getItem('portal_auth_token');
          const res = await fetch('/api/mock-test/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': \`Bearer \${token}\` } : {})
            },
            body: JSON.stringify({
              sessionId,
              companyName,
              userAnswers,
              timeTakenSeconds,
              strikes,
              forcedAutoSubmit,
              userId
            })
          });
          const report = await res.json();
          if (report.error) throw new Error(report.error);

          setCompanyMockResult(report);
          setCurrentView('company_mock_result');
        } catch (err) {
          alert('Error submitting mock test: ' + err.message);
        }
      };

      const handleViewCompanySessionDetails = async (sessionId) => {
        try {
          const token = localStorage.getItem('portal_auth_token');
          const res = await fetch(\`/api/mock-test/session/\${sessionId}\`, {
            headers: token ? { 'Authorization': \`Bearer \${token}\` } : {}
          });
          const session = await res.json();
          if (session.error) throw new Error(session.error);

          const pct = Math.round((session.score / (session.total_questions || 1)) * 100);
          setCompanyMockResult({
            sessionId: session.id,
            companyName: session.company_name,
            score: session.score,
            totalQuestions: session.total_questions,
            percentage: pct,
            overallCutoffPct: 65,
            qualificationStatus: session.qualification_status,
            verdictTitle: session.qualification_status === 'QUALIFIED_INTERVIEW'
              ? '🎉 Qualified for Interview Round!'
              : (session.qualification_status === 'DISQUALIFIED_CHEATING' ? 'Disqualified (Proctoring Violation)' : 'Needs Improvement to Clear Cut-off'),
            verdictMessage: session.qualification_status === 'QUALIFIED_INTERVIEW'
              ? \`You scored \${pct}%, successfully clearing the required threshold.\`
              : \`Your score of \${pct}% needs improvement to reach the required cut-off.\`,
            sectionalBreakdown: session.sectional_scores || [],
            weakTopics: [],
            review: [],
            timeTakenSeconds: 1800
          });
          setCurrentView('company_mock_result');
        } catch (err) {
          alert('Error loading test report: ' + err.message);
        }
      };

      // Session Verification
      useEffect(() => {`;

if (!html.includes(handlerTarget)) {
  console.error('Could not find handlerTarget in index.html');
  process.exit(1);
}
html = html.replace(handlerTarget, handlerReplacement);

// 3. Add Navbar Button
const navTarget = `                <button
                  id="btn-nav-timed-arena"`;

const navReplacement = `                <button
                  id="btn-nav-company-arena"
                  onClick={() => { setCurrentView('company_mock_arena'); setSelectedTopicSlug(null); }}
                  className={\`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-2xs cursor-pointer \${currentView === 'company_mock_arena'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                    : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80'
                    }\`}
                >
                  <span>🏢</span>
                  <span>Company Mock Arena</span>
                </button>

                <button
                  id="btn-nav-timed-arena"`;

if (!html.includes(navTarget)) {
  console.error('Could not find navTarget in index.html');
  process.exit(1);
}
html = html.replace(navTarget, navReplacement);

// 4. Add Hero Banner in Home view
const homeBannerTarget = `                {/* 1. Daily Challenge Banner */}
                <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700`;

const homeBannerReplacement = `                {/* Top Recruiter Mock Arena Quick Launch Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs uppercase font-black tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-400/30">
                          🏢 Company Placement Mock Test Arena
                        </span>
                        <span className="text-xs font-extrabold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                          Anti-Repetition Engine Active
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                        Simulate Real Campus Recruitment Drives
                      </h3>
                      <p className="text-slate-300 text-xs md:text-sm mt-1.5 leading-relaxed">
                        Practice authentic previous-year papers with strict sectional timing, proctoring controls, and non-repeating dynamic question rotation for <strong>TCS NQT, Infosys, Cognizant, Wipro, and Accenture</strong>.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold text-slate-300">
                        <span className="bg-white/10 px-2.5 py-1 rounded-lg">🏛️ TCS NQT (75m)</span>
                        <span className="bg-white/10 px-2.5 py-1 rounded-lg">💎 Infosys DSE (60m)</span>
                        <span className="bg-white/10 px-2.5 py-1 rounded-lg">⚡ Cognizant GenC (60m)</span>
                        <span className="bg-white/10 px-2.5 py-1 rounded-lg">🚀 Wipro NTH (50m)</span>
                        <span className="bg-white/10 px-2.5 py-1 rounded-lg">🎯 Accenture ASE (60m)</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                      <button
                        onClick={() => { setCurrentView('company_mock_arena'); setSelectedTopicSlug(null); }}
                        className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-black text-sm shadow-xl hover:shadow-indigo-500/25 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                      >
                        <span>🏢 Enter Mock Arena</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                  <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                </div>

                {/* 1. Daily Challenge Banner */}
                <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700`;

if (!html.includes(homeBannerTarget)) {
  console.error('Could not find homeBannerTarget in index.html');
  process.exit(1);
}
html = html.replace(homeBannerTarget, homeBannerReplacement);

// 5. Add View Routing in Main Content Area
const viewTarget = `            {/* VIEW 5: PLACEMENT RESULT & PROCTORING AUDIT REPORT */}
            {currentView === 'placement_result' && placementResultData && (
              <PlacementResultScreen
                result={placementResultData}
                onBack={() => {
                  setPendingArenaConfig(null);
                  setPlacementResultData(null);
                  setCurrentView('home');
                }}
                onRetake={() => {
                  setPlacementResultData(null);
                  setShowAppPreFlightModal(true);
                }}
              />
            )}`;

const viewReplacement = `            {/* VIEW 5: PLACEMENT RESULT & PROCTORING AUDIT REPORT */}
            {currentView === 'placement_result' && placementResultData && (
              <PlacementResultScreen
                result={placementResultData}
                onBack={() => {
                  setPendingArenaConfig(null);
                  setPlacementResultData(null);
                  setCurrentView('home');
                }}
                onRetake={() => {
                  setPlacementResultData(null);
                  setShowAppPreFlightModal(true);
                }}
              />
            )}

            {/* VIEW 6: COMPANY PLACEMENT MOCK TEST ARENA DASHBOARD */}
            {currentView === 'company_mock_arena' && (
              <CompanyMockDashboard
                currentUser={currentUser}
                onStartMock={handleStartCompanyMock}
                onViewSessionDetails={handleViewCompanySessionDetails}
                onBack={() => setCurrentView('home')}
              />
            )}

            {/* VIEW 7: ADAPTIVE PROCTORED COMPANY MOCK TEST */}
            {currentView === 'company_mock_test' && companyMockSession && (
              <CompanyMockArena
                session={companyMockSession}
                currentUser={currentUser}
                onSubmit={handleSubmitCompanyMock}
                onCancel={() => {
                  if (confirm('Cancel company mock test and return to Mock Arena? Your answers will not be scored.')) {
                    if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
                    setCurrentView('company_mock_arena');
                  }
                }}
              />
            )}

            {/* VIEW 8: POST-TEST COMPANY CUT-OFF DIAGNOSTICS & SOLUTIONS */}
            {currentView === 'company_mock_result' && companyMockResult && (
              <CompanyMockResult
                result={companyMockResult}
                onRetake={(companyName) => handleStartCompanyMock(companyName)}
                onBackToDashboard={() => {
                  setCompanyMockResult(null);
                  setCurrentView('company_mock_arena');
                }}
              />
            )}`;

if (!html.includes(viewTarget)) {
  console.error('Could not find viewTarget in index.html');
  process.exit(1);
}
html = html.replace(viewTarget, viewReplacement);

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ Successfully injected state, handlers, navbar, and view routing into index.html');
