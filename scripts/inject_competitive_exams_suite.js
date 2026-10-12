const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const suitePath = path.join(__dirname, '..', 'components', 'CompetitiveExamsSuite.jsx');

let html = fs.readFileSync(indexPath, 'utf8');
const suiteCode = fs.readFileSync(suitePath, 'utf8');

console.log('🔄 Injecting Competitive Exams Suite into index.html...');

// 1. Inject KaTeX in <head> if not already present
if (!html.includes('katex.min.css')) {
  const katexTags = `  <!-- KaTeX for High-Performance LaTeX Math Rendering in Competitive Exams -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>\n`;
  html = html.replace('<!-- Google Fonts:', `${katexTags}  <!-- Google Fonts:`);
  console.log('✅ Added KaTeX CSS and JS to <head>');
}

// 2. Inject Components before root render
const rootTarget = `    const root = ReactDOM.createRoot(document.getElementById('root'));`;

if (!html.includes('CompetitiveExamsManager')) {
  if (!html.includes(rootTarget)) {
    console.error('❌ Root target render not found in index.html');
    process.exit(1);
  }
  const replacementWithComponents = `\n    // =========================================================================\n    // 16. COMPETITIVE EXAM WORKFLOW & ARENA SUITE COMPONENTS\n    // =========================================================================\n${suiteCode}\n\n${rootTarget}`;
  html = html.replace(rootTarget, replacementWithComponents);
  console.log('✅ Injected CompetitiveExamsSuite components before root.render');
}

// 3. Inject Navbar Button
const navCampusDrivesTarget = `                <button
                  id="btn-nav-campus-drives"`;

const newNavButton = `                <button
                  id="btn-nav-competitive-exams"
                  onClick={() => { setCurrentView('competitive_exams'); setSelectedTopicSlug(null); }}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer \${currentView === 'competitive_exams'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                    }\`}
                >
                  <span>📚</span>
                  <span>Exam Hub</span>
                </button>\n\n                <button\n                  id="btn-nav-campus-drives"`;

if (!html.includes('btn-nav-competitive-exams')) {
  html = html.replace(navCampusDrivesTarget, newNavButton);
  console.log('✅ Injected btn-nav-competitive-exams in Navbar');
}

// 4. Inject View Route in App()
const viewJobsPortalTarget = `{/* VIEW 14: JOBS & CAMPUS PLACEMENT DRIVES */}`;

const newViewRoute = `{/* VIEW 20: COMPETITIVE EXAM PREP & REAL-TIME ARENA */}
            {currentView === 'competitive_exams' && (
              <CompetitiveExamsManager
                onBack={() => setCurrentView('home')}
              />
            )}

            {/* VIEW 14: JOBS & CAMPUS PLACEMENT DRIVES */}`;

if (!html.includes("currentView === 'competitive_exams'")) {
  html = html.replace(viewJobsPortalTarget, newViewRoute);
  console.log('✅ Injected competitive_exams view route');
}

// 5. Inject Home Banner after Recruitment Ecosystem Grid
const homeBannerTarget = `{/* 2. Multi-Tier Practice Tracks & Syllabus */}`;

const newHomeBanner = `{/* 1.5 National Competitive Exam Workflow Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold tracking-wide uppercase mb-3 border border-blue-400/30">
                      <span>🏛️</span> National Competitive Examination Engine
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
                      Master GATE, CAT, UPSC &amp; Banking with Real-Time Arenas
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
                      Server-authoritative TCS-iON / NTA palettes, KaTeX LaTeX math derivations, sectional time lockouts, Time-Loss Matrix, and Gemini AI targeted remedial drills.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        id="btn-home-launch-exam-hub"
                        onClick={() => { setCurrentView('competitive_exams'); setSelectedTopicSlug(null); }}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                      >
                        <span>📚</span> Open National Exam Hub ➔
                      </button>
                      <button
                        onClick={() => { setCurrentView('competitive_exams'); setSelectedTopicSlug(null); }}
                        className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold rounded-xl border border-slate-700 transition flex items-center gap-2 cursor-pointer"
                      >
                        <span>🚀</span> Full-Length Mock Tests
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full md:w-auto text-center">
                    <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
                      <span className="text-2xl block mb-1">⚙️</span>
                      <span className="text-xs font-black block">GATE CSE</span>
                      <span className="text-[10px] text-blue-300">MCQ, MSQ &amp; NAT</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
                      <span className="text-2xl block mb-1">📈</span>
                      <span className="text-xs font-black block">CAT Quant</span>
                      <span className="text-[10px] text-emerald-300">Sectional Lockout</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
                      <span className="text-2xl block mb-1">⚖️</span>
                      <span className="text-xs font-black block">UPSC CSE</span>
                      <span className="text-[10px] text-amber-300">Multi-Stage</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
                      <span className="text-2xl block mb-1">🏦</span>
                      <span className="text-xs font-black block">SBI / IBPS</span>
                      <span className="text-[10px] text-purple-300">Bank Prelims/Mains</span>
                    </div>
                  </div>
                </div>

                {/* 2. Multi-Tier Practice Tracks & Syllabus */}`;

if (!html.includes('btn-home-launch-exam-hub')) {
  html = html.replace(homeBannerTarget, newHomeBanner);
  console.log('✅ Injected home view launcher banner');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✨ All Competitive Exams components and wiring successfully injected into index.html!');
