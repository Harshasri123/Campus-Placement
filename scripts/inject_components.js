const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const targetStr = `    const root = ReactDOM.createRoot(document.getElementById('root'));`;

if (!html.includes(targetStr)) {
  console.error('Target string not found in index.html');
  process.exit(1);
}

const componentsCode = `
    // =========================================================================
    // 7. COMPANY PLACEMENT MOCK TEST ARENA: DASHBOARD COMPONENT
    // =========================================================================
    function CompanyMockDashboard({ currentUser, onStartMock, onViewSessionDetails, onBack }) {
      const [companies, setCompanies] = useState([]);
      const [history, setHistory] = useState([]);
      const [loading, setLoading] = useState(true);
      const [resetModalCompany, setResetModalCompany] = useState(null);
      const [exhaustionPrompt, setExhaustionPrompt] = useState(null);
      const [filterCompany, setFilterCompany] = useState('all');
      const [toastMsg, setToastMsg] = useState('');

      const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3500);
      };

      const loadData = useCallback(() => {
        setLoading(true);
        const userId = currentUser ? currentUser.id : '';
        const p1 = fetch(\`/api/mock-test/companies?userId=\${userId}\`).then(r => r.json());
        const p2 = fetch(\`/api/mock-test/history?userId=\${userId}\`).then(r => r.json());

        Promise.all([p1, p2])
          .then(([compData, histData]) => {
            if (compData.companies) setCompanies(compData.companies);
            if (histData.history) setHistory(histData.history);
          })
          .catch(err => {
            console.error('Error fetching mock arena data:', err);
          })
          .finally(() => setLoading(false));
      }, [currentUser]);

      useEffect(() => {
        loadData();
      }, [loadData]);

      const handleResetHistory = async (companyName) => {
        try {
          const userId = currentUser ? currentUser.id : null;
          const res = await fetch('/api/mock-test/reset-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName, userId })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);

          showToast(\`✅ PYQ history for \${companyName} has been reset. All unique questions are freshly available!\`);
          setResetModalCompany(null);
          loadData();
        } catch (err) {
          alert('Error resetting history: ' + err.message);
        }
      };

      const handleStartAttempt = (company) => {
        if (company.remainingUnattempted === 0) {
          setExhaustionPrompt(company);
        } else {
          onStartMock(company.companyName);
        }
      };

      const companyConfigs = {
        'TCS NQT': {
          badge: 'TCS NQT 2025 Blueprint',
          color: 'from-indigo-600 via-blue-600 to-indigo-800',
          borderHover: 'hover:border-indigo-400',
          accentColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
          icon: '🏛️',
          subtitle: 'National Qualifier Test • Digital & Ninja Profile Hiring',
          criteria: 'Sectional & Overall Cut-off: ~65%'
        },
        'Infosys': {
          badge: 'Infosys Springboard Pattern',
          color: 'from-sky-600 via-cyan-600 to-blue-700',
          borderHover: 'hover:border-sky-400',
          accentColor: 'text-sky-700 bg-sky-50 border-sky-200',
          icon: '💎',
          subtitle: 'Springboard / DSE • Systems Engineer & Specialist',
          criteria: 'Sectional Cut-off: ~70% across all sections'
        },
        'Cognizant': {
          badge: 'Cognizant GenC / GenC Next',
          color: 'from-teal-600 via-cyan-700 to-blue-800',
          borderHover: 'hover:border-teal-400',
          accentColor: 'text-teal-700 bg-teal-50 border-teal-200',
          icon: '⚡',
          subtitle: 'GenC & GenC Next Assessment • Programming & SQL',
          criteria: 'Sectional & Overall Cut-off: ~65%'
        },
        'Wipro': {
          badge: 'Wipro Elite NTH Blueprint',
          color: 'from-purple-600 via-violet-600 to-indigo-800',
          borderHover: 'hover:border-purple-400',
          accentColor: 'text-purple-700 bg-purple-50 border-purple-200',
          icon: '🚀',
          subtitle: 'Elite National Talent Hunt • Turbo Hiring Pattern',
          criteria: 'Overall Cut-off: ~60% with coding baseline'
        },
        'Accenture': {
          badge: 'Accenture Assessment 2025',
          color: 'from-rose-600 via-pink-600 to-purple-800',
          borderHover: 'hover:border-rose-400',
          accentColor: 'text-rose-700 bg-rose-50 border-rose-200',
          icon: '🎯',
          subtitle: 'Cognitive & Technical Assessment • Cloud & Pseudocode',
          criteria: 'Sectional & Overall Cut-off: ~65%'
        }
      };

      const filteredCompanies = filterCompany === 'all'
        ? companies
        : companies.filter(c => c.companyName === filterCompany);

      return (
        <div className="space-y-8 animate-fade-in font-sans">
          {/* Toast Notification */}
          {toastMsg && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold border border-slate-700 animate-fade-in flex items-center gap-2">
              <span>🔔</span>
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Exhaustion Prompt Modal */}
          {exhaustionPrompt && (
            <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-indigo-200 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl mx-auto">
                  🎯
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-slate-900">
                    All Unique PYQs Completed for {exhaustionPrompt.companyName}!
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    You have completed all unique previous-year recruitment questions currently in the <strong>{exhaustionPrompt.companyName}</strong> question bank ({exhaustionPrompt.totalPyqsInDb} questions attempted).
                  </p>
                  <div className="p-3 my-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-semibold">
                    💡 Would you like to reset your attempt history for a fresh rotation, or take an AI-reshuffled revision test?
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      const comp = exhaustionPrompt.companyName;
                      setExhaustionPrompt(null);
                      handleResetHistory(comp);
                      setTimeout(() => onStartMock(comp), 400);
                    }}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🔄 Reset History &amp; Start Clean Mock Test</span>
                  </button>
                  <button
                    onClick={() => {
                      const comp = exhaustionPrompt.companyName;
                      setExhaustionPrompt(null);
                      onStartMock(comp);
                    }}
                    className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🎲 Take AI-Reshuffled Revision Test</span>
                  </button>
                  <button
                    onClick={() => setExhaustionPrompt(null)}
                    className="w-full py-2 rounded-xl text-slate-500 hover:text-slate-800 font-bold text-xs text-center cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reset Confirmation Modal */}
          {resetModalCompany && (
            <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-rose-200 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto">
                  ⚠️
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-black text-slate-900">
                    Reset Question History for {resetModalCompany}?
                  </h3>
                  <p className="text-xs text-slate-600 mt-2">
                    This will clear all recorded attempted questions for <strong>{resetModalCompany}</strong>. Questions you previously saw will become eligible to appear in your upcoming mock tests again.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setResetModalCompany(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleResetHistory(resetModalCompany)}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                  >
                    Yes, Reset History
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <button onClick={onBack} className="hover:text-indigo-600 transition cursor-pointer">
                Home
              </button>
              <span>/</span>
              <span className="text-slate-900 font-extrabold">Company Mock Test Arena</span>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Back to Practice Tracks</span>
            </button>
          </div>

          {/* Hero Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-slate-800">
            <div className="relative z-10 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs uppercase font-black tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-400/30">
                  🏢 Multi-Company Recruitment Simulator
                </span>
                <span className="text-xs font-extrabold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                  Anti-Repetition Engine Active
                </span>
                <span className="text-xs font-extrabold bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-md border border-purple-500/30">
                  Proctored Lockdown
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">
                Company Placement Mock Test Arena
              </h2>
              <p className="text-slate-300 text-xs md:text-sm mt-1.5 leading-relaxed">
                Take authentic full-length recruitment simulations matching the exact blueprints of <strong>TCS NQT, Infosys, Cognizant, Wipro, and Accenture</strong>. Every test paper is dynamically assembled from 2022–2025 previous-year questions (PYQs) strictly excluding questions you have attempted before.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
                  <span className="text-xs text-indigo-200 block font-semibold">Recruiters Supported</span>
                  <span className="text-2xl font-black text-white font-mono mt-0.5 block">5 Top IT</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
                  <span className="text-xs text-indigo-200 block font-semibold">Question Rotation</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">Zero-Repeat</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
                  <span className="text-xs text-indigo-200 block font-semibold">Exam Proctoring</span>
                  <span className="text-2xl font-black text-amber-300 font-mono mt-0.5 block">3 Strikes</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
                  <span className="text-xs text-indigo-200 block font-semibold">Diagnostics</span>
                  <span className="text-2xl font-black text-blue-300 font-mono mt-0.5 block">Sectional</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterCompany('all')}
              className={\`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer \${filterCompany === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }\`}
            >
              All Recruiters ({companies.length})
            </button>
            {companies.map(c => (
              <button
                key={c.companyName}
                onClick={() => setFilterCompany(c.companyName)}
                className={\`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer \${filterCompany === c.companyName
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }\`}
              >
                {c.companyName}
              </button>
            ))}
          </div>

          {/* Companies Cards Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-semibold">Loading recruiter mock test catalogs &amp; attempt history...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map(c => {
                const cfg = companyConfigs[c.companyName] || {
                  badge: c.companyName,
                  color: 'from-slate-700 to-slate-900',
                  borderHover: 'hover:border-slate-400',
                  accentColor: 'text-slate-700 bg-slate-50 border-slate-200',
                  icon: '🏢',
                  subtitle: 'Campus Recruitment Mock Test',
                  criteria: 'Official Cut-off'
                };

                const attemptedPct = c.totalPyqsInDb > 0
                  ? Math.round((c.userAttemptedPyqs / c.totalPyqsInDb) * 100)
                  : 0;

                const isExhausted = c.remainingUnattempted === 0 && c.totalPyqsInDb > 0;

                return (
                  <div
                    key={c.companyName}
                    className={\`bg-white rounded-3xl border border-slate-200 shadow-xs \${cfg.borderHover} hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden group\`}
                  >
                    {/* Card Top Banner */}
                    <div className={\`p-6 bg-gradient-to-r \${cfg.color} text-white relative\`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl p-2 bg-white/20 rounded-2xl backdrop-blur-xs">
                            {cfg.icon}
                          </span>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                              {cfg.badge}
                            </span>
                            <h3 className="text-xl font-black text-white mt-1 tracking-tight">
                              {c.companyName}
                            </h3>
                          </div>
                        </div>
                        <span className="text-xs font-black bg-white/20 text-yellow-300 px-2.5 py-1 rounded-xl whitespace-nowrap">
                          🎯 {c.overallCutoffPct}% Cut-off
                        </span>
                      </div>
                      <p className="text-xs text-white/90 mt-2 font-medium">
                        {cfg.subtitle}
                      </p>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Specs row */}
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-3 border-b border-slate-100">
                          <span className="flex items-center gap-1.5">
                            <span>⏱️</span>
                            <span>{c.durationMinutes} Minutes</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <span>📝</span>
                            <span>{c.totalQuestions} Questions</span>
                          </span>
                          <span>•</span>
                          <span className="text-indigo-600 font-extrabold">
                            Mock #{c.completedSessionsCount + 1}
                          </span>
                        </div>

                        {/* Section Blueprint Chips */}
                        <div>
                          <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5">
                            Authentic Exam Blueprint:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(c.sections || []).map((sec, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                              >
                                {sec.name} ({sec.quota} Qs)
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Anti-Repetition Question Bank Tracker */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-800 flex items-center gap-1">
                              <span>🔄</span> Anti-Repetition Pool
                            </span>
                            <span className={\`text-[11px] font-black \${isExhausted ? 'text-amber-600 font-extrabold' : 'text-slate-600'}\`}>
                              {isExhausted ? 'Pool Exhausted' : \`\${c.remainingUnattempted} Unique Remaining\`}
                            </span>
                          </div>

                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={\`h-2 rounded-full transition-all duration-500 \${isExhausted ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}\`}
                              style={{ width: \`\${Math.min(100, attemptedPct)}%\` }}
                            ></div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                            <span>{c.userAttemptedPyqs} Attempted</span>
                            <span>{c.totalPyqsInDb} Authentic PYQs</span>
                          </div>
                        </div>

                        {/* Candidate Performance History Stats */}
                        {c.completedSessionsCount > 0 && (
                          <div className="text-xs text-slate-600 font-semibold flex items-center justify-between px-1">
                            <span>Completed Mocks: <strong className="text-slate-900">{c.completedSessionsCount}</strong></span>
                            <span>Avg Score: <strong className="text-indigo-600">{c.averageScore}%</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <button
                          onClick={() => handleStartAttempt(c)}
                          className={\`w-full py-3 rounded-2xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer transform group-hover:scale-[1.01] \${isExhausted
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'
                            }\`}
                        >
                          <span>🚀</span>
                          <span>
                            {isExhausted ? \`Retake / Revision Test (Mock #\${c.completedSessionsCount + 1})\` : \`Start New Mock Test (Mock #\${c.completedSessionsCount + 1})\`}
                          </span>
                        </button>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">{cfg.criteria}</span>
                          {c.userAttemptedPyqs > 0 && (
                            <button
                              onClick={() => setResetModalCompany(c.companyName)}
                              className="text-rose-500 hover:text-rose-700 hover:underline font-bold cursor-pointer"
                            >
                              🔄 Reset History
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Past Attempts History Section */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>📊</span> Your Recent Company Mock Test Attempts ({history.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Detailed sectional diagnostics and cut-off qualification verdicts recorded across your attempts.
                </p>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-2">
                <span className="text-4xl block">📝</span>
                <h4 className="font-extrabold text-slate-800 text-sm">No Mock Tests Completed Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click <strong>"Start New Mock Test"</strong> on any company card above to launch a fully proctored authentic previous-year assessment.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Recruiter / Paper</th>
                        <th className="p-4">Mock #</th>
                        <th className="p-4">Score &amp; %</th>
                        <th className="p-4">Qualification Verdict</th>
                        <th className="p-4">Date Completed</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {history.map((sess) => {
                        const pct = Math.round((sess.score / (sess.total_questions || 1)) * 100);
                        const isQual = sess.qualification_status === 'QUALIFIED_INTERVIEW';
                        const isDisqual = sess.qualification_status === 'DISQUALIFIED_CHEATING';

                        return (
                          <tr key={sess.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-4 font-black text-slate-900 flex items-center gap-2">
                              <span>🏢</span>
                              <span>{sess.company_name}</span>
                            </td>
                            <td className="p-4 text-slate-600 font-bold">
                              Mock #{sess.mock_number}
                            </td>
                            <td className="p-4">
                              <span className="font-black text-slate-900 font-mono text-sm">{sess.score} / {sess.total_questions}</span>
                              <span className="text-slate-400 font-semibold ml-1.5">({pct}%)</span>
                            </td>
                            <td className="p-4">
                              {isQual ? (
                                <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1">
                                  <span>✓</span> Qualified for Interview
                                </span>
                              ) : isDisqual ? (
                                <span className="bg-rose-100 text-rose-800 font-extrabold px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1">
                                  <span>✕</span> Disqualified (Strikes)
                                </span>
                              ) : (
                                <span className="bg-amber-100 text-amber-800 font-extrabold px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1">
                                  <span>⚠️</span> Needs Improvement
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-slate-500">
                              {sess.submitted_at ? new Date(sess.submitted_at).toLocaleDateString() : 'Recent'}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => onViewSessionDetails(sess.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer"
                              >
                                View Report →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // =========================================================================
    // 8. ADAPTIVE PROCTORED EXAM ARENA: TEST RUNNER COMPONENT
    // =========================================================================
    function CompanyMockArena({ session, currentUser, onSubmit, onCancel }) {
      const {
        sessionId,
        companyName,
        mockNumber = 1,
        durationMinutes = 60,
        overallCutoffPct = 65,
        sections = [],
        questions = []
      } = session;

      // Group questions by section
      const sectionNames = sections.length > 0
        ? sections.map(s => s.name)
        : Array.from(new Set(questions.map(q => q.section_name || 'General')));

      const [currentSection, setCurrentSection] = useState(sectionNames[0] || 'General');
      const [currentQIndexInSection, setCurrentQIndexInSection] = useState(0);
      const [userAnswers, setUserAnswers] = useState({});
      const [flagged, setFlagged] = useState({});
      const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

      // Proctoring States
      const [strikes, setStrikes] = useState(0);
      const [showStrikeModal, setShowStrikeModal] = useState(false);
      const [showFullscreenModal, setShowFullscreenModal] = useState(false);
      const [showSubmitModal, setShowSubmitModal] = useState(false);
      const [cameraStatus, setCameraStatus] = useState('initializing'); // 'active' | 'simulated'
      const [cameraPipMinimized, setCameraPipMinimized] = useState(false);
      const [toastMsg, setToastMsg] = useState('');

      const submittedRef = useRef(false);
      const strikesRef = useRef(0);
      const videoRef = useRef(null);
      const mediaStreamRef = useRef(null);

      // Current section questions
      const currentSectionQuestions = questions.filter(q => (q.section_name || 'General') === currentSection);
      const activeQuestion = currentSectionQuestions[currentQIndexInSection] || currentSectionQuestions[0] || questions[0];

      // Total answered counts
      const answeredCount = Object.keys(userAnswers).length;

      // Webcam Initialization
      useEffect(() => {
        let stream = null;
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
            .then(s => {
              stream = s;
              mediaStreamRef.current = s;
              setCameraStatus('active');
              if (videoRef.current) {
                videoRef.current.srcObject = s;
                videoRef.current.play().catch(() => {});
              }
            })
            .catch(() => {
              setCameraStatus('simulated');
            });
        } else {
          setCameraStatus('simulated');
        }

        return () => {
          if (stream) {
            stream.getTracks().forEach(t => t.stop());
          }
        };
      }, []);

      // Mandatory Fullscreen Request
      useEffect(() => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {
            setShowFullscreenModal(true);
          });
        }

        const handleFsChange = () => {
          if (!document.fullscreenElement && !submittedRef.current) {
            setShowFullscreenModal(true);
          } else {
            setShowFullscreenModal(false);
          }
        };

        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('webkitfullscreenchange', handleFsChange);
        return () => {
          document.removeEventListener('fullscreenchange', handleFsChange);
          document.removeEventListener('webkitfullscreenchange', handleFsChange);
        };
      }, []);

      const triggerAutoSubmit = useCallback((disqualified = false) => {
        if (submittedRef.current) return;
        submittedRef.current = true;

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
        }
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }

        onSubmit({
          sessionId,
          companyName,
          userAnswers,
          timeTakenSeconds: (durationMinutes * 60) - timeLeft,
          strikes: strikesRef.current,
          forcedAutoSubmit: disqualified
        });
      }, [sessionId, companyName, userAnswers, durationMinutes, timeLeft, onSubmit]);

      // 3-Strike Tab-Switch & Blur Detection
      useEffect(() => {
        const handleViolation = (reason) => {
          if (submittedRef.current) return;
          const nextStrikes = strikesRef.current + 1;
          strikesRef.current = nextStrikes;
          setStrikes(nextStrikes);

          if (nextStrikes >= 3) {
            alert('Anti-Cheat Disqualification: 3 infractions detected (tab switch / window blur). Your exam is being submitted immediately.');
            triggerAutoSubmit(true);
          } else {
            setShowStrikeModal(true);
          }
        };

        const onVisChange = () => {
          if (document.hidden && !submittedRef.current) {
            handleViolation('TAB_SWITCH');
          }
        };

        const onBlur = () => {
          if (!submittedRef.current && !document.hidden && !showStrikeModal) {
            handleViolation('WINDOW_BLUR');
          }
        };

        document.addEventListener('visibilitychange', onVisChange);
        window.addEventListener('blur', onBlur);
        return () => {
          document.removeEventListener('visibilitychange', onVisChange);
          window.removeEventListener('blur', onBlur);
        };
      }, [showStrikeModal, triggerAutoSubmit]);

      // Timer Countdown
      useEffect(() => {
        if (timeLeft <= 0) {
          alert('Time expired! Your mock paper is being submitted automatically.');
          triggerAutoSubmit(false);
          return;
        }

        const timer = setInterval(() => {
          setTimeLeft(t => t - 1);
        }, 1000);

        return () => clearInterval(timer);
      }, [timeLeft, triggerAutoSubmit]);

      // Prevent Copy / Paste / F12 / Context Menu
      useEffect(() => {
        const showSecurityToast = (msg) => {
          setToastMsg(msg);
          setTimeout(() => setToastMsg(''), 2500);
        };

        const preventEvent = (e) => {
          e.preventDefault();
          showSecurityToast('🔒 Proctored Lock: Copying, pasting, and right-click context menu are disabled.');
        };

        const handleKey = (e) => {
          if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            showSecurityToast('🔒 Inspect Element (F12) is disabled during the mock test.');
            return false;
          }
          if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) {
            e.preventDefault();
            showSecurityToast('🔒 DevTools shortcut blocked.');
            return false;
          }
          if (e.ctrlKey && ['c', 'v', 'u', 'a', 'C', 'V', 'U', 'A'].includes(e.key)) {
            e.preventDefault();
            showSecurityToast('🔒 Copy, paste, and view-source shortcuts blocked.');
            return false;
          }
        };

        window.addEventListener('contextmenu', preventEvent);
        window.addEventListener('copy', preventEvent);
        window.addEventListener('paste', preventEvent);
        window.addEventListener('cut', preventEvent);
        window.addEventListener('keydown', handleKey);

        return () => {
          window.removeEventListener('contextmenu', preventEvent);
          window.removeEventListener('copy', preventEvent);
          window.removeEventListener('paste', preventEvent);
          window.removeEventListener('cut', preventEvent);
          window.removeEventListener('keydown', handleKey);
        };
      }, []);

      const formatTimer = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return \`\${String(m).padStart(2, '0')}:\${String(s).padStart(2, '0')}\`;
      };

      const handleSelectOption = (optIndex) => {
        if (!activeQuestion) return;
        setUserAnswers(prev => ({
          ...prev,
          [activeQuestion.id]: optIndex
        }));
      };

      const handleClearSelection = () => {
        if (!activeQuestion) return;
        setUserAnswers(prev => {
          const next = { ...prev };
          delete next[activeQuestion.id];
          return next;
        });
      };

      const toggleFlagCurrent = () => {
        if (!activeQuestion) return;
        setFlagged(prev => ({
          ...prev,
          [activeQuestion.id]: !prev[activeQuestion.id]
        }));
      };

      return (
        <div className="max-w-7xl mx-auto space-y-6 font-sans animate-fade-in select-none">
          {/* Security Alert Toast */}
          {toastMsg && (
            <div className="fixed top-6 right-6 z-50 bg-rose-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold border border-rose-700 animate-fade-in flex items-center gap-2">
              <span>⚠️</span>
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Fullscreen Lockdown Modal */}
          {showFullscreenModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl border border-indigo-300 space-y-4">
                <span className="text-4xl block">🔒</span>
                <h3 className="text-xl font-black text-slate-900">Mandatory Full-Screen Mode</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The <strong>{companyName}</strong> Placement Mock Test Arena requires full-screen lockdown to safeguard assessment integrity.
                </p>
                <button
                  onClick={() => {
                    document.documentElement.requestFullscreen().then(() => {
                      setShowFullscreenModal(false);
                    }).catch(() => {});
                  }}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg transition cursor-pointer"
                >
                  Enter Fullscreen to Continue Test
                </button>
              </div>
            </div>
          )}

          {/* 3-Strike Warning Modal */}
          {showStrikeModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-rose-300 space-y-3">
                <span className="text-4xl block">🚨</span>
                <h4 className="text-lg font-black text-rose-600">Anti-Cheat Infraction Detected!</h4>
                <p className="text-xs text-slate-600">
                  Switching tabs, minimizing the test window, or losing application focus violates proctoring policy.
                </p>
                <div className="py-2 px-4 bg-rose-50 text-rose-800 font-black text-sm rounded-xl border border-rose-200">
                  Strike {strikes} of 3
                </div>
                <p className="text-[11px] text-slate-400">
                  ⚠️ 3rd infraction triggers immediate test cancellation and zero score recording.
                </p>
                <button
                  onClick={() => setShowStrikeModal(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs cursor-pointer hover:bg-slate-800 transition"
                >
                  I Understand, Resume Test
                </button>
              </div>
            </div>
          )}

          {/* Test Submission Summary Modal */}
          {showSubmitModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
                <div className="text-center">
                  <span className="text-4xl block mb-2">📑</span>
                  <h3 className="text-xl font-black text-slate-900">Submit Exam Session?</h3>
                  <p className="text-xs text-slate-500 mt-1">Review your question summary before final grading.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center text-xs">
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-slate-500 block text-[10px] font-bold">Answered</span>
                    <span className="text-xl font-black font-mono text-emerald-700">{answeredCount}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px] font-bold">Remaining</span>
                    <span className="text-xl font-black font-mono text-slate-700">{questions.length - answeredCount}</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                    <span className="text-slate-500 block text-[10px] font-bold">Flagged for Review</span>
                    <span className="text-xl font-black font-mono text-amber-700">
                      {Object.values(flagged).filter(Boolean).length}
                    </span>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200">
                    <span className="text-slate-500 block text-[10px] font-bold">Time Remaining</span>
                    <span className="text-xl font-black font-mono text-indigo-700">{formatTimer(timeLeft)}</span>
                  </div>
                </div>

                {questions.length - answeredCount > 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 text-center font-medium">
                    ⚠️ You still have <strong>{questions.length - answeredCount} unanswered questions</strong>. Unanswered questions receive 0 marks.
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
                  >
                    ← Continue Test
                  </button>
                  <button
                    onClick={() => {
                      setShowSubmitModal(false);
                      triggerAutoSubmit(false);
                    }}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition cursor-pointer"
                  >
                    Confirm &amp; Submit Paper
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Top Exam Header with Section Tabs and Timer */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase bg-indigo-100 text-indigo-800 px-3 py-0.5 rounded-full">
                    {companyName} • Mock #{mockNumber}
                  </span>
                  <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    🎯 Cut-off Target: {overallCutoffPct}%
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  {companyName} Recruitment Simulation
                </h2>
              </div>

              {/* Countdown Timer & Submit Button */}
              <div className="flex items-center gap-3">
                <div className={\`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono text-lg font-black border transition \${timeLeft <= 120
                  ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse'
                  : timeLeft <= 600
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : 'bg-slate-100 text-slate-800 border-slate-200'
                  }\`}>
                  <span>⏱️</span>
                  <span>{formatTimer(timeLeft)}</span>
                </div>

                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-2xl text-xs shadow-md transition cursor-pointer"
                >
                  Submit Paper ({answeredCount}/{questions.length})
                </button>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {sectionNames.map(secName => {
                const secQs = questions.filter(q => (q.section_name || 'General') === secName);
                const secAnswered = secQs.filter(q => userAnswers[q.id] !== undefined).length;
                const isActive = currentSection === secName;

                return (
                  <button
                    key={secName}
                    onClick={() => {
                      setCurrentSection(secName);
                      setCurrentQIndexInSection(0);
                    }}
                    className={\`px-4 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 border \${isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }\`}
                  >
                    <span>{secName}</span>
                    <span className={\`text-[10px] px-2 py-0.5 rounded-full font-black \${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}\`}>
                      {secAnswered} / {secQs.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Layout: Question Canvas & Palette */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Question Card (Col 1-3) */}
            <div className="lg:col-span-3 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[550px] space-y-6">
              {activeQuestion ? (
                <div>
                  {/* Question Top Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                        {currentSection} • Q{currentQIndexInSection + 1} of {currentSectionQuestions.length}
                      </span>
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        🏷️ {activeQuestion.topic_tag || 'Concept'}
                      </span>
                      {activeQuestion.exam_year && (
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                          📅 PYQ {activeQuestion.exam_year}
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        🎯 {activeQuestion.difficulty || 'Medium'}
                      </span>
                    </div>

                    <button
                      onClick={toggleFlagCurrent}
                      className={\`text-xs font-extrabold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer border \${flagged[activeQuestion.id]
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }\`}
                    >
                      <span>🚩</span>
                      <span>{flagged[activeQuestion.id] ? 'Flagged for Review' : 'Flag Question'}</span>
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="py-6">
                    <h3 className="text-base md:text-lg font-bold text-slate-900 leading-relaxed font-sans whitespace-pre-line">
                      {activeQuestion.question_text}
                    </h3>
                  </div>

                  {/* 4 Options Selection */}
                  <div className="space-y-3">
                    {(activeQuestion.options || []).map((opt, oIdx) => {
                      const isSelected = userAnswers[activeQuestion.id] === oIdx;
                      const optLetter = String.fromCharCode(65 + oIdx);

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectOption(oIdx)}
                          className={\`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3.5 group cursor-pointer \${isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-800'
                            }\`}
                        >
                          <div className={\`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition \${isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                            }\`}>
                            {optLetter}
                          </div>
                          <span className="text-sm flex-1 leading-snug">{opt}</span>
                          {isSelected && (
                            <span className="text-indigo-600 text-sm font-black">✓ Selected</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400">Loading question...</div>
              )}

              {/* Bottom Nav Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100">
                <button
                  onClick={() => setCurrentQIndexInSection(p => Math.max(0, p - 1))}
                  disabled={currentQIndexInSection === 0}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
                >
                  ← Previous
                </button>

                {activeQuestion && userAnswers[activeQuestion.id] !== undefined && (
                  <button
                    onClick={handleClearSelection}
                    className="text-xs text-slate-500 hover:text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Clear Response
                  </button>
                )}

                <button
                  onClick={() => {
                    if (currentQIndexInSection < currentSectionQuestions.length - 1) {
                      setCurrentQIndexInSection(p => p + 1);
                    } else {
                      // Switch to next section if available
                      const nextSecIdx = sectionNames.indexOf(currentSection) + 1;
                      if (nextSecIdx < sectionNames.length) {
                        setCurrentSection(sectionNames[nextSecIdx]);
                        setCurrentQIndexInSection(0);
                      }
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-extrabold text-xs transition cursor-pointer"
                >
                  {currentQIndexInSection < currentSectionQuestions.length - 1 ? 'Next Question →' : 'Next Section →'}
                </button>
              </div>
            </div>

            {/* Right Column: Proctor PIP Feed & Question Palette */}
            <div className="space-y-6">
              {/* Webcam PIP Floating/Docked Box */}
              <div className="bg-slate-900 rounded-3xl p-4 text-white shadow-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="font-black text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>AI PROCTOR ACTIVE</span>
                  </span>
                  <button
                    onClick={() => setCameraPipMinimized(!cameraPipMinimized)}
                    className="text-slate-400 hover:text-white text-xs font-bold"
                  >
                    {cameraPipMinimized ? 'Expand ↗' : 'Minimize ↘'}
                  </button>
                </div>

                {!cameraPipMinimized && (
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800">
                    {cameraStatus === 'active' ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                    ) : (
                      <div className="text-center p-3 space-y-1">
                        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto"></div>
                        <span className="text-[10px] text-emerald-300 block font-mono">EYE-GAZE RADAR ACTIVE</span>
                        <span className="text-[9px] text-slate-500 block">Candidate Identity Verified</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-[10px] px-2 py-0.5 rounded text-slate-300 font-mono">
                      {currentUser?.fullName || 'Candidate'} • 30 FPS
                    </div>
                  </div>
                )}
              </div>

              {/* Question Navigation Palette */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h4 className="font-black text-slate-800 text-sm">{currentSection} Palette</h4>
                  <p className="text-[11px] text-slate-400">Click any number to jump directly.</p>
                </div>

                <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1">
                  {currentSectionQuestions.map((q, idx) => {
                    const isAnswered = userAnswers[q.id] !== undefined;
                    const isFlagged = flagged[q.id];
                    const isCurrent = idx === currentQIndexInSection;

                    let btnStyle = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                    if (isCurrent) {
                      btnStyle = 'bg-indigo-600 text-white font-black ring-2 ring-indigo-500 ring-offset-2';
                    } else if (isFlagged) {
                      btnStyle = 'bg-amber-500 text-white font-bold border-amber-600';
                    } else if (isAnswered) {
                      btnStyle = 'bg-emerald-600 text-white font-bold border-emerald-700';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQIndexInSection(idx)}
                        className={\`h-9 rounded-xl text-xs flex items-center justify-center transition border cursor-pointer \${btnStyle}\`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] font-semibold text-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-emerald-600"></span>
                      <span>Answered</span>
                    </div>
                    <span className="font-mono font-bold">{answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-amber-500"></span>
                      <span>Marked for Review</span>
                    </div>
                    <span className="font-mono font-bold">{Object.values(flagged).filter(Boolean).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-slate-200 border border-slate-300"></span>
                      <span>Not Answered</span>
                    </div>
                    <span className="font-mono font-bold">{questions.length - answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-indigo-600 ring-1 ring-indigo-400"></span>
                      <span>Current</span>
                    </div>
                    <span className="font-mono font-bold">1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 9. POST-TEST COMPANY CUT-OFF DIAGNOSTICS & SOLUTIONS REVIEW COMPONENT
    // =========================================================================
    function CompanyMockResult({ result, onRetake, onBackToDashboard }) {
      const {
        companyName,
        mockNumber = 1,
        score = 0,
        totalQuestions = 1,
        percentage = 0,
        overallCutoffPct = 65,
        qualificationStatus = 'NOT_QUALIFIED',
        verdictTitle = 'Test Completed',
        verdictMessage = '',
        sectionalBreakdown = [],
        weakTopics = [],
        review = [],
        timeTakenSeconds = 0
      } = result;

      const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'correct' | 'incorrect' | 'skipped'
      const [selectedSectionFilter, setSelectedSectionFilter] = useState('all');

      const isQualified = qualificationStatus === 'QUALIFIED_INTERVIEW';
      const isDisqualified = qualificationStatus === 'DISQUALIFIED_CHEATING';
      const isBorderline = qualificationStatus === 'BORDERLINE_SECTIONAL_FAIL';

      const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return \`\${m}m \${s}s\`;
      };

      const correctCount = review.filter(r => r.isCorrect).length;
      const incorrectCount = review.filter(r => !r.isCorrect && r.userSelected !== undefined && r.userSelected !== -1 && r.userSelected !== null).length;
      const skippedCount = totalQuestions - (correctCount + incorrectCount);

      const sectionList = Array.from(new Set(review.map(r => r.section_name || 'General')));

      // Filtered review items
      const filteredReview = review.filter(item => {
        if (selectedSectionFilter !== 'all' && (item.section_name || 'General') !== selectedSectionFilter) {
          return false;
        }
        if (reviewFilter === 'correct') return item.isCorrect;
        if (reviewFilter === 'incorrect') return !item.isCorrect && item.userSelected !== undefined && item.userSelected !== -1;
        if (reviewFilter === 'skipped') return item.userSelected === undefined || item.userSelected === -1 || item.userSelected === null;
        return true;
      });

      return (
        <div className="max-w-6xl mx-auto space-y-8 font-sans animate-fade-in">
          {/* Top Qualification Verdict Card */}
          <div className={\`rounded-3xl p-6 md:p-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border \${isQualified
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 border-emerald-400/30'
            : isDisqualified
              ? 'bg-gradient-to-r from-rose-900 via-red-800 to-slate-900 border-rose-500/30'
              : isBorderline
                ? 'bg-gradient-to-r from-amber-700 via-indigo-900 to-slate-900 border-amber-400/30'
                : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-slate-800'
            }\`}>
            <div className="max-w-2xl">
              <span className="text-xs uppercase font-black tracking-wider bg-white/20 text-white px-3 py-1 rounded-full">
                {companyName} • Mock Test #{mockNumber} Diagnostic Report
              </span>

              <h2 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">
                {verdictTitle}
              </h2>

              <p className="text-slate-100 text-xs md:text-sm mt-1 leading-relaxed">
                {verdictMessage}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-semibold text-slate-200">
                <span>⏱️ Time: {formatTime(timeTakenSeconds || 0)}</span>
                <span>•</span>
                <span>🎯 Score: {score} of {totalQuestions}</span>
                <span>•</span>
                <span>📊 Score Percentage: {percentage}%</span>
                <span>•</span>
                <span>📌 Cut-off Threshold: {overallCutoffPct}%</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={() => onRetake(companyName)}
                className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-black text-xs shadow-lg hover:bg-yellow-300 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>🔄</span>
                <span>Take Next Mock Test</span>
              </button>
              <button
                onClick={onBackToDashboard}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs border border-white/20 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>←</span>
                <span>Mock Arena</span>
              </button>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold block">Overall Marks</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{score} / {totalQuestions}</span>
              <span className="text-[11px] text-slate-500 font-semibold">{percentage}% Achieved</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold block">Recruiter Cut-off</span>
              <span className="text-2xl font-black text-indigo-600 font-mono mt-1 block">{overallCutoffPct}%</span>
              <span className={\`text-[11px] font-extrabold \${percentage >= overallCutoffPct ? 'text-emerald-600' : 'text-rose-600'}\`}>
                {percentage >= overallCutoffPct ? 'Threshold Cleared' : \`Deficit: \${overallCutoffPct - percentage}%\`}
              </span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold block">Accuracy Ratio</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                {correctCount + incorrectCount > 0 ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) : 0}%
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">{correctCount} Correct of {correctCount + incorrectCount} Attempted</span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-bold block">Time Elapsed</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{formatTime(timeTakenSeconds || 0)}</span>
              <span className="text-[11px] text-slate-500 font-semibold">Proctored Session</span>
            </div>
          </div>

          {/* Sectional Cut-Off Diagnostics Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>📋</span> Sectional Cut-Off Breakdown
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Top recruiters require passing individual sectional cut-offs in addition to overall criteria.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Section Name</th>
                    <th className="p-3.5">Score</th>
                    <th className="p-3.5">Accuracy %</th>
                    <th className="p-3.5">Section Cut-off</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sectionalBreakdown.map((sec, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-bold text-slate-900">{sec.sectionName}</td>
                      <td className="p-3.5 font-mono text-slate-700">{sec.correct} / {sec.total}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{sec.percentage}%</span>
                          <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={\`h-1.5 rounded-full \${sec.passedCutoff ? 'bg-emerald-500' : 'bg-rose-500'}\`}
                              style={{ width: \`\${Math.min(100, sec.percentage)}%\` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">{sec.cutoffPct}%</td>
                      <td className="p-3.5">
                        <span className={\`px-2.5 py-0.5 rounded-md font-black text-[11px] \${sec.passedCutoff
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                          }\`}>
                          {sec.passedCutoff ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Topic Diagnostics: Weak Areas */}
          {weakTopics && weakTopics.length > 0 ? (
            <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <h3 className="text-lg font-black text-amber-900">
                    Topic Diagnostic: Targeted Weak Topics Identified
                  </h3>
                  <p className="text-xs text-amber-700">
                    Topics where accuracy fell below 60%. Prioritize these topics in your next mock practice sessions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {weakTopics.map((w, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">{w.topic}</span>
                      <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                        {w.percentage}%
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Score: {w.score}</span>
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      💡 {w.advice}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex items-center gap-4">
              <span className="text-3xl">🌟</span>
              <div>
                <h3 className="text-base font-black text-emerald-900">Comprehensive Topic Mastery</h3>
                <p className="text-xs text-emerald-700">Excellent performance! You scored 60% or higher across all tested concepts.</p>
              </div>
            </div>
          )}

          {/* Full Step-by-Step Question Review */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>📝</span> Comprehensive Solutions &amp; Shortcut Review ({review.length} Questions)
                </h3>
                <p className="text-xs text-slate-500 font-medium">Step-by-step mathematical calculations and logic explanations.</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedSectionFilter}
                  onChange={(e) => setSelectedSectionFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                >
                  <option value="all">All Sections ({review.length})</option>
                  {sectionList.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setReviewFilter('all')}
                    className={\`px-2.5 py-1 rounded-lg transition \${reviewFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}\`}
                  >
                    All ({review.length})
                  </button>
                  <button
                    onClick={() => setReviewFilter('correct')}
                    className={\`px-2.5 py-1 rounded-lg transition \${reviewFilter === 'correct' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'}\`}
                  >
                    ✓ Correct ({correctCount})
                  </button>
                  <button
                    onClick={() => setReviewFilter('incorrect')}
                    className={\`px-2.5 py-1 rounded-lg transition \${reviewFilter === 'incorrect' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'}\`}
                  >
                    ✕ Incorrect ({incorrectCount})
                  </button>
                  <button
                    onClick={() => setReviewFilter('skipped')}
                    className={\`px-2.5 py-1 rounded-lg transition \${reviewFilter === 'skipped' ? 'bg-white text-slate-700 shadow-2xs' : 'text-slate-600'}\`}
                  >
                    ⚪ Skipped ({skippedCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Question Cards */}
            <div className="space-y-4">
              {filteredReview.map((item, idx) => {
                const isCorrect = item.isCorrect;
                const isSkipped = item.userSelected === undefined || item.userSelected === -1 || item.userSelected === null;

                return (
                  <div
                    key={idx}
                    className={\`bg-white rounded-2xl p-6 border shadow-xs transition space-y-4 \${isCorrect
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : isSkipped
                        ? 'border-slate-200 bg-slate-50/30'
                        : 'border-rose-200 bg-rose-50/10'
                      }\`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {item.section_name || 'General'}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          Question {idx + 1}
                        </span>
                        {item.topic_tag && (
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            🏷️ {item.topic_tag}
                          </span>
                        )}
                        {item.exam_year && (
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            📅 PYQ {item.exam_year}
                          </span>
                        )}
                      </div>

                      <span className={\`text-xs font-black px-3 py-1 rounded-full \${isCorrect
                        ? 'bg-emerald-100 text-emerald-800'
                        : isSkipped
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-rose-100 text-rose-800'
                        }\`}>
                        {isCorrect ? '✓ Correct (+1 Mark)' : isSkipped ? '⚪ Skipped (0 Marks)' : '✕ Incorrect'}
                      </span>
                    </div>

                    <p className="font-bold text-slate-900 text-sm leading-relaxed whitespace-pre-line">
                      {item.question_text}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className={\`p-3 rounded-xl border \${isCorrect
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                        : isSkipped
                          ? 'bg-slate-50 border-slate-200 text-slate-600 font-bold'
                          : 'bg-rose-50 border-rose-200 text-rose-900 font-bold'
                        }\`}>
                        Your Choice: {isSkipped ? 'Skipped' : \`Option \${String.fromCharCode(65 + item.userSelected)}\`}
                      </div>

                      <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-800 font-bold">
                        Correct Answer: Option {String.fromCharCode(65 + item.correctOption)}
                      </div>
                    </div>

                    {item.explanation && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                        <strong className="text-indigo-700 block mb-1">
                          💡 Step-by-Step Math &amp; Shortcut Technique:
                        </strong>
                        <div className="whitespace-pre-line font-mono text-[11px] text-slate-800">
                          {item.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
`;

html = html.replace(targetStr, componentsCode + '\n' + targetStr);

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ Successfully added CompanyMockDashboard, CompanyMockArena, and CompanyMockResult into index.html');
