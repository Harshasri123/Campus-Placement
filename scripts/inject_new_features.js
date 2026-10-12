const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

console.log('Starting injection of 5 new features into index.html...');

// 1. Add PDF.js to head if not present
if (!html.includes('pdf.min.js')) {
  const headTarget = `  <!-- Tailwind CSS CDN -->`;
  const headReplacement = `  <!-- PDF.js CDN for In-Browser Resume Parsing -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <!-- Tailwind CSS CDN -->`;
  html = html.replace(headTarget, headReplacement);
  console.log('✅ Added PDF.js to head');
}

// 2. Add Navbar Navigation Buttons
const navTarget = `                <button
                  id="btn-nav-company-arena"`;

const navReplacement = `                <button
                  id="btn-nav-coding-sandbox"
                  onClick={() => { setCurrentView('coding_sandbox'); setSelectedTopicSlug(null); }}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer \${currentView === 'coding_sandbox'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                    }\`}
                >
                  <span>💻</span>
                  <span>Compiler</span>
                </button>

                <button
                  id="btn-nav-resume-matcher"
                  onClick={() => { setCurrentView('resume_matcher'); setSelectedTopicSlug(null); }}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer \${currentView === 'resume_matcher'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                    }\`}
                >
                  <span>📄</span>
                  <span>Resume ATS</span>
                </button>

                <button
                  id="btn-nav-mock-interview"
                  onClick={() => { setCurrentView('mock_interview'); setSelectedTopicSlug(null); }}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer \${currentView === 'mock_interview'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                    }\`}
                >
                  <span>🎙️</span>
                  <span>AI Interview</span>
                </button>

                <button
                  id="btn-nav-formula-sheets"
                  onClick={() => { setCurrentView('formula_sheets'); setSelectedTopicSlug(null); }}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer \${currentView === 'formula_sheets'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                    }\`}
                >
                  <span>⚡</span>
                  <span>Formulas</span>
                </button>

                <button
                  id="btn-nav-leaderboard"
                  onClick={() => { setCurrentView('campus_leaderboard'); setSelectedTopicSlug(null); }}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer \${currentView === 'campus_leaderboard'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                    }\`}
                >
                  <span>🏆</span>
                  <span>Rankings</span>
                </button>

                <button
                  id="btn-nav-company-arena"`;

if (!html.includes('btn-nav-coding-sandbox')) {
  html = html.replace(navTarget, navReplacement);
  console.log('✅ Added Navbar buttons');
}

// 3. Add Feature Launchers on Home View
const homeHeroTarget = `                {/* 2. Multi-Tier Practice Tracks & Syllabus */}`;

const homeHeroReplacement = `                {/* Advanced Campus Preparation Ecosystem Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <span>🚀</span> Recruitment Acceleration Ecosystem
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Live coding sandbox, AI resume ATS analyzer, speech interview simulator, and campus leaderboard.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                    {/* 1. Live Coding Compiler */}
                    <div
                      onClick={() => setCurrentView('coding_sandbox')}
                      className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition">
                          💻
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Live Coding Sandbox</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Python, Java, C, C++ code editor with hidden edge case test suites.
                        </p>
                      </div>
                      <span className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1">
                        Open Compiler →
                      </span>
                    </div>

                    {/* 2. AI Resume vs JD Matcher */}
                    <div
                      onClick={() => setCurrentView('resume_matcher')}
                      className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition">
                          📄
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Resume vs. JD Matcher</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          PDF parser, keyword gap matrix &amp; ATS compatibility score.
                        </p>
                      </div>
                      <span className="mt-3 text-xs font-bold text-blue-600 flex items-center gap-1">
                        Check ATS Score →
                      </span>
                    </div>

                    {/* 3. AI Mock Interview */}
                    <div
                      onClick={() => setCurrentView('mock_interview')}
                      className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition">
                          🎙️
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">AI Interview Simulator</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Voice speech evaluation with ideal STAR-method model answers.
                        </p>
                      </div>
                      <span className="mt-3 text-xs font-bold text-purple-600 flex items-center gap-1">
                        Practice Interview →
                      </span>
                    </div>

                    {/* 4. Formula Cheat Sheets */}
                    <div
                      onClick={() => setCurrentView('formula_sheets')}
                      className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition">
                          ⚡
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Formula Drawers &amp; Cards</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Slide-out cheat sheets &amp; active-recall flashcard trainer.
                        </p>
                      </div>
                      <span className="mt-3 text-xs font-bold text-amber-600 flex items-center gap-1">
                        Quick Revision →
                      </span>
                    </div>

                    {/* 5. Campus Leaderboard */}
                    <div
                      onClick={() => setCurrentView('campus_leaderboard')}
                      className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-rose-400 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition">
                          🏆
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Campus Leaderboard</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Percentile vs peer cohort &amp; exportable PDF placement report card.
                        </p>
                      </div>
                      <span className="mt-3 text-xs font-bold text-rose-600 flex items-center gap-1">
                        View Rankings →
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Multi-Tier Practice Tracks & Syllabus */}`;

if (!html.includes('Recruitment Acceleration Ecosystem')) {
  html = html.replace(homeHeroTarget, homeHeroReplacement);
  console.log('✅ Added Home view ecosystem grid');
}

// 4. Add View Routing in Main Content Area
const viewTarget = `            {/* VIEW 8: POST-TEST COMPANY CUT-OFF DIAGNOSTICS & SOLUTIONS */}
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

const viewReplacement = `            {/* VIEW 8: POST-TEST COMPANY CUT-OFF DIAGNOSTICS & SOLUTIONS */}
            {currentView === 'company_mock_result' && companyMockResult && (
              <CompanyMockResult
                result={companyMockResult}
                onRetake={(companyName) => handleStartCompanyMock(companyName)}
                onBackToDashboard={() => {
                  setCompanyMockResult(null);
                  setCurrentView('company_mock_arena');
                }}
              />
            )}

            {/* VIEW 9: IN-BROWSER LIVE CODING SANDBOX (COMPILER) */}
            {currentView === 'coding_sandbox' && (
              <LiveCodingSandbox
                currentUser={currentUser}
                onBack={() => setCurrentView('home')}
              />
            )}

            {/* VIEW 10: AI RESUME VS JOB DESCRIPTION MATCHER */}
            {currentView === 'resume_matcher' && (
              <ResumeJobMatcher
                currentUser={currentUser}
                onBack={() => setCurrentView('home')}
              />
            )}

            {/* VIEW 11: AI MOCK HR & TECHNICAL INTERVIEW SIMULATOR */}
            {currentView === 'mock_interview' && (
              <MockInterviewSimulator
                currentUser={currentUser}
                onBack={() => setCurrentView('home')}
              />
            )}

            {/* VIEW 12: FORMULA SHEETS & ACTIVE-RECALL FLASHCARDS */}
            {currentView === 'formula_sheets' && (
              <FormulaCheatSheets
                currentUser={currentUser}
                onBack={() => setCurrentView('home')}
              />
            )}

            {/* VIEW 13: MULTI-USER COLLEGE LEADERBOARD & REPORT CARD */}
            {currentView === 'campus_leaderboard' && (
              <CampusLeaderboard
                currentUser={currentUser}
                onBack={() => setCurrentView('home')}
              />
            )}`;

if (!html.includes('coding_sandbox')) {
  html = html.replace(viewTarget, viewReplacement);
  console.log('✅ Added view routing for 5 new modules');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ Updated index.html shell with new routes and navbar.');
