/**
 * CareerPath - Competitive Exam Prep & Real-Time Examination Arena Suite
 * Implements Section 5 & 8 Specification:
 * 1. ExamHubPage - Category filtering, search, and JSONB eligibility verification modal
 * 2. ExamDetailsPage - Multi-stage tabs, nested Subject -> Topic syllabus tree, pattern specs
 * 3. StudyPlannerDashboard - Streak tracker, daily hours gauge, AI targets, confidence ratings
 * 4. MockTestListPage - Full-length, sectional, and diagnostic test listings
 * 5. ExamEngineArena - TCS-iON 5-state palette, server-authoritative clock, sectional lockout, polymorphic input
 * 6. PerformanceReportPage - Time-Loss Matrix, Topic Mastery Index (TMI), step-by-step solutions
 * 7. AIStudyAssistantPage - Gemini concept explanations with LaTeX math and remedial drill generation
 * 8. ExamTrackerPage - Multi-stage lifecycle tracking from Application to Final Merit
 * 9. AdminExamStudio - Exam configurator, LaTeX question bank manager, test creator studio
 */

// =========================================================================
// HELPER: MATH & LATEX FORMATTER (KaTeX Compatible with Fallback)
// =========================================================================
function MathRenderer({ text, inline = false }) {
  if (!text) return null;

  // If text contains LaTeX delimiters ($...$ or $$...$$)
  const renderMathContent = () => {
    // Check if KaTeX is globally available
    if (typeof window !== 'undefined' && window.katex) {
      try {
        const parts = [];
        let remaining = String(text);
        let key = 0;

        // Simple regex to detect $...$ or $$...$$
        const regex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g;
        let match;
        let lastIdx = 0;

        while ((match = regex.exec(remaining)) !== null) {
          if (match.index > lastIdx) {
            parts.push(<span key={`txt-${key++}`}>{remaining.substring(lastIdx, match.index)}</span>);
          }
          const rawFormula = match[0];
          const isBlock = rawFormula.startsWith('$$');
          const math = isBlock ? rawFormula.slice(2, -2) : rawFormula.slice(1, -1);
          try {
            const html = window.katex.renderToString(math, {
              displayMode: isBlock,
              throwOnError: false
            });
            parts.push(<span key={`math-${key++}`} dangerouslySetInnerHTML={{ __html: html }} />);
          } catch {
            parts.push(<code key={`fallback-${key++}`} className="px-1.5 py-0.5 bg-amber-50 text-amber-900 rounded font-mono text-sm">{math}</code>);
          }
          lastIdx = regex.lastIndex;
        }

        if (lastIdx < remaining.length) {
          parts.push(<span key={`txt-${key++}`}>{remaining.substring(lastIdx)}</span>);
        }

        return parts.length > 0 ? parts : text;
      } catch (err) {
        return text;
      }
    }

    // Elegant fallback formatting for mathematical notation
    const formatted = String(text)
      .replace(/\$\$(.*?)\$\$/g, (_, eq) => `\n【 ${eq.trim()} 】\n`)
      .replace(/\$(.*?)\$/g, (_, eq) => ` ${eq.trim()} `);

    return <span>{formatted}</span>;
  };

  return inline ? (
    <span className="inline-math font-medium">{renderMathContent()}</span>
  ) : (
    <div className="math-block leading-relaxed">{renderMathContent()}</div>
  );
}

// =========================================================================
// 1. EXAM HUB PAGE (CATALOG, CATEGORY FILTER, ELIGIBILITY MODAL)
// =========================================================================
function ExamHubPage({ onSelectExam, onStartTest, onOpenTracker, onOpenStudyPlan }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibilityExam, setEligibilityExam] = useState(null);
  const [eligibilityForm, setEligibilityForm] = useState({
    age: 22,
    degree: 'B.Tech',
    percentage: 72.5,
    attempts: 1
  });
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/exams');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEligibility = async (e) => {
    e.preventDefault();
    if (!eligibilityExam) return;
    try {
      setCheckingEligibility(true);
      const res = await fetch(`/api/v1/exams/${eligibilityExam.id}/check-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eligibilityForm)
      });
      const data = await res.json();
      setEligibilityResult(data);
    } catch (err) {
      console.error('Eligibility check error:', err);
    } finally {
      setCheckingEligibility(false);
    }
  };

  // Filter exams by category and search query
  const filteredCategories = categories.map(cat => {
    const matchesCat = selectedCategory === 'ALL' || cat.slug === selectedCategory;
    if (!matchesCat) return null;

    const filteredExams = (cat.exams || []).filter(ex => {
      const q = searchQuery.toLowerCase();
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.code.toLowerCase().includes(q) ||
        (ex.stages || []).some(s => s.name.toLowerCase().includes(q))
      );
    });

    if (filteredExams.length === 0) return null;
    return { ...cat, exams: filteredExams };
  }).filter(Boolean);

  const allExamsCount = categories.reduce((acc, c) => acc + (c.exams?.length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-8 text-white shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold tracking-wide uppercase mb-4 border border-blue-400/30">
            <span>🏛️</span> National Examination Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Competitive Exam Hub & Multi-Stage Prep
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Closed-loop learning engine for <strong>GATE, CAT, UPSC, and Banking (SBI/IBPS)</strong> with 
            metadata-driven rules, server-authoritative mock test arena, KaTeX LaTeX math support, and AI remediation.
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            <button
              id="btn-hub-study-plan"
              onClick={onOpenStudyPlan}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <span>🔥</span> Study Planner & Streaks
            </button>
            <button
              id="btn-hub-track-exams"
              onClick={onOpenTracker}
              className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold rounded-xl border border-slate-700 shadow-md transition flex items-center gap-2"
            >
              <span>📌</span> Lifecycle Tracker
            </button>
            <div className="text-xs text-slate-400 flex items-center gap-2 ml-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span><strong>{allExamsCount}</strong> National Exams Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${selectedCategory === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            All Categories ({allExamsCount})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${selectedCategory === cat.slug
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              <span>{cat.slug === 'engineering' ? '⚙️' : cat.slug === 'management' ? '📈' : cat.slug === 'civil-services' ? '⚖️' : '🏦'}</span>
              <span>{cat.name}</span>
              <span className="opacity-70 text-[10px]">({cat.exams?.length || 0})</span>
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
          <input
            id="input-exam-search"
            type="text"
            placeholder="Search exam code, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Exam Categories and Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">Loading competitive examination catalog...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No competitive exams found</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mb-4">Try adjusting your category selection or search keywords.</p>
          <button
            onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredCategories.map(cat => (
            <div key={cat.id} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                <span className="text-xl">
                  {cat.slug === 'engineering' ? '⚙️' : cat.slug === 'management' ? '📈' : cat.slug === 'civil-services' ? '⚖️' : '🏦'}
                </span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">{cat.name}</h2>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold">
                  {cat.exams.length} Exam{cat.exams.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cat.exams.map(exam => {
                  const stages = exam.stages || [];
                  const rules = exam.eligibility_rules ? (typeof exam.eligibility_rules === 'string' ? JSON.parse(exam.eligibility_rules) : exam.eligibility_rules) : {};

                  return (
                    <div
                      key={exam.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-black tracking-wide mb-1.5 border border-blue-100">
                              {exam.code}
                            </span>
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                              {exam.name}
                            </h3>
                          </div>
                        </div>

                        {/* Stages summary badges */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {stages.map((st, idx) => (
                            <span
                              key={st.id || idx}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium border border-slate-200"
                            >
                              Stage {st.stage_order}: {st.name} ({st.total_marks || 100} M)
                            </span>
                          ))}
                        </div>

                        {/* Eligibility snapshot */}
                        <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 border border-slate-100 space-y-1 mb-4">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Age Bracket:</span>
                            <span className="font-semibold text-slate-700">
                              {rules.min_age ? `${rules.min_age} - ${rules.max_age} yrs` : 'No restriction'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Min Percentage:</span>
                            <span className="font-semibold text-slate-700">{rules.min_degree_percentage ? `${rules.min_degree_percentage}%` : 'Passing'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Max Attempts:</span>
                            <span className="font-semibold text-slate-700">{rules.max_attempts ? `${rules.max_attempts} max` : 'Unlimited'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action footer */}
                      <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setEligibilityExam(exam);
                            setEligibilityResult(null);
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition flex items-center gap-1"
                        >
                          <span>🔍</span> Check Eligibility
                        </button>

                        <button
                          onClick={() => onSelectExam(exam)}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1 ml-auto"
                        >
                          <span>Syllabus & Tests</span> ➔
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ELIGIBILITY VERIFICATION MODAL */}
      {eligibilityExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setEligibilityExam(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="p-2.5 bg-blue-100 text-blue-700 rounded-xl text-lg font-black">
                {eligibilityExam.code}
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">Check Eligibility</h3>
                <p className="text-xs text-slate-500">{eligibilityExam.name}</p>
              </div>
            </div>

            <form onSubmit={handleCheckEligibility} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Age</label>
                  <input
                    type="number"
                    value={eligibilityForm.age}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="16"
                    max="60"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Degree %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={eligibilityForm.percentage}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="35"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Degree / Qualification</label>
                  <select
                    value={eligibilityForm.degree}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, degree: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="B.Tech">B.Tech / B.E.</option>
                    <option value="B.Sc">B.Sc</option>
                    <option value="B.Com">B.Com</option>
                    <option value="B.A.">B.A.</option>
                    <option value="BBA">BBA</option>
                    <option value="MCA">MCA</option>
                    <option value="M.Sc">M.Sc</option>
                    <option value="M.Tech">M.Tech</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Past Attempts</label>
                  <input
                    type="number"
                    value={eligibilityForm.attempts}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, attempts: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="10"
                    required
                  />
                </div>
              </div>

              <button
                id="btn-evaluate-eligibility"
                type="submit"
                disabled={checkingEligibility}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {checkingEligibility ? 'Evaluating Criteria...' : 'Evaluate Against Official Criteria'}
              </button>
            </form>

            {/* Results Display */}
            {eligibilityResult && (
              <div className={`mt-5 p-4 rounded-2xl border ${eligibilityResult.isEligible ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                <div className="flex items-center gap-2 mb-2 font-black text-sm">
                  <span>{eligibilityResult.isEligible ? '✅' : '❌'}</span>
                  <span>{eligibilityResult.isEligible ? 'Eligible for Examination' : 'Ineligible for Examination'}</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {eligibilityResult.criteriaBreakdown?.map((crit, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>{crit.passed ? '✓' : '✗'}</span>
                        <span className="font-medium capitalize">{crit.criterion.replace('_', ' ')}</span>
                      </span>
                      <span className="text-[11px] opacity-80">{crit.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 2. EXAM DETAILS PAGE (MULTI-STAGE TABS, SYLLABUS TREE, SPECS)
// =========================================================================
function ExamDetailsPage({ exam, onBack, onLaunchTest, onOpenStudyPlan }) {
  const [activeStageId, setActiveStageId] = useState(exam?.stages?.[0]?.id || null);
  const [syllabusTree, setSyllabusTree] = useState([]);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState({});

  useEffect(() => {
    if (activeStageId) {
      fetchSyllabus(activeStageId);
    }
  }, [activeStageId]);

  const fetchSyllabus = async (stageId) => {
    try {
      setLoadingSyllabus(true);
      const res = await fetch(`/api/v1/exams/${exam.id}/stages/${stageId}/syllabus`);
      const data = await res.json();
      if (data.success) {
        setSyllabusTree(data.syllabus || []);
        // Expand first subject by default
        if (data.syllabus?.length > 0) {
          setExpandedSubjects({ [data.syllabus[0].id]: true });
        }
      }
    } catch (err) {
      console.error('Failed to fetch syllabus tree:', err);
    } finally {
      setLoadingSyllabus(false);
    }
  };

  const toggleSubject = (subjId) => {
    setExpandedSubjects(prev => ({ ...prev, [subjId]: !prev[subjId] }));
  };

  const activeStage = exam?.stages?.find(s => s.id === activeStageId) || exam?.stages?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Back button and Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition text-xs font-bold flex items-center gap-1 shadow-2xs"
        >
          <span>⬅️</span> Back to Exam Hub
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{exam?.code} Specifications</span>
      </div>

      {/* Main Spec Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-black tracking-wider">
                {exam?.code}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{exam?.name}</h1>
            </div>
            {exam?.official_website_url && (
              <a
                href={exam.official_website_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1"
              >
                <span>🌐</span> Official Examination Portal ↗
              </a>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onLaunchTest(exam, activeStage)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-md transition flex items-center gap-2"
            >
              <span>🚀</span> Start Diagnostic Mock
            </button>
            <button
              onClick={() => onOpenStudyPlan(exam, activeStage)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2"
            >
              <span>📅</span> Generate Study Plan
            </button>
          </div>
        </div>

        {/* Multi-Stage Dependent Entities Tabs */}
        <div className="mt-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            First-Class Exam Stages & Patterns
          </div>
          <div className="flex flex-wrap gap-2">
            {(exam?.stages || []).map(st => (
              <button
                key={st.id}
                onClick={() => setActiveStageId(st.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeStageId === st.id
                  ? 'bg-blue-50 text-blue-800 border-2 border-blue-500 shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
              >
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                  {st.stage_order}
                </span>
                <span>{st.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Stage Technical Parameters */}
        {activeStage && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Marks</span>
              <div className="text-xl font-black text-slate-900 mt-0.5">{activeStage.total_marks || 100} Marks</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Duration</span>
              <div className="text-xl font-black text-slate-900 mt-0.5">{activeStage.duration_minutes || 180} Minutes</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Section Navigation</span>
              <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                <span>{activeStage.has_sectional_timing ? '🔒 Strict Section Lockout' : '🔓 Free Bidirectional'}</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Marking Scheme</span>
              <div className="text-sm font-bold text-slate-800 mt-1">
                {activeStage.has_negative_marking ? 'Negative Penalty (−1/3)' : 'Zero Negative Penalty'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Syllabus Tree Component */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Nested Syllabus Architecture</h2>
            <p className="text-xs text-slate-500">Subject ➔ Topic ➔ Syllabus Weightage Breakdown</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {syllabusTree.length} Subjects Defined
          </span>
        </div>

        {loadingSyllabus ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading syllabus tree...</div>
        ) : syllabusTree.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No syllabus records populated yet.</div>
        ) : (
          <div className="space-y-4">
            {syllabusTree.map(subj => {
              const isExpanded = expandedSubjects[subj.id];
              return (
                <div key={subj.id} className="border border-slate-200 rounded-2xl overflow-hidden transition">
                  <button
                    onClick={() => toggleSubject(subj.id)}
                    className="w-full px-5 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{isExpanded ? '📂' : '📁'}</span>
                      <div>
                        <span className="text-xs font-bold text-blue-600 mr-2">[{subj.code}]</span>
                        <span className="text-sm font-black text-slate-800">{subj.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500">
                        {subj.topics?.length || 0} Topics
                      </span>
                      <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-slate-100 space-y-3">
                      {(subj.topics || []).map(topic => (
                        <div key={topic.id} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              <span>📌</span> {topic.name}
                            </div>
                            {topic.subtopics && topic.subtopics.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2 ml-6">
                                {topic.subtopics.map(st => (
                                  <span key={st.id} className="px-2 py-0.5 bg-white text-slate-600 rounded text-[10px] border border-slate-200">
                                    {st.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-semibold">Weightage</span>
                              <span className="text-xs font-black text-blue-700">{topic.syllabus_weightage_pct || 10}%</span>
                            </div>
                            <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, (topic.syllabus_weightage_pct || 10) * 5)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// 3. STUDY PLANNER DASHBOARD (STREAKS, AI TARGETS, PROGRESS)
// =========================================================================
function StudyPlannerDashboard({ onBack, onStartQuiz, onExplainConcept }) {
  const [streak, setStreak] = useState(9);
  const [freezeDays, setFreezeDays] = useState(2);
  const [plan, setPlan] = useState({
    targetExamDate: '2027-02-14',
    dailyHours: 4.5,
    completedToday: 3.2
  });

  const dailyWeakTopics = [
    { id: 'wt-1', name: 'Virtual Memory & Page Replacement', subject: 'Operating Systems', errorRate: '68%', priority: 'HIGH' },
    { id: 'wt-2', name: 'AVL Tree Rotations and Height Analysis', subject: 'Algorithms & Data Structures', errorRate: '54%', priority: 'MEDIUM' },
    { id: 'wt-3', name: 'Eigenvalues and Cayley-Hamilton Theorem', subject: 'Engineering Mathematics', errorRate: '42%', priority: 'MEDIUM' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Back and Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition text-xs font-bold flex items-center gap-1 shadow-2xs"
        >
          <span>⬅️</span> Back
        </button>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Adaptive Closed-Loop Learning Engine
        </div>
      </div>

      {/* Top Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {/* Streak card */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Daily Study Streak</span>
            <span className="text-2xl animate-bounce">🔥</span>
          </div>
          <div className="text-4xl font-black">{streak} Days</div>
          <div className="mt-3 text-xs opacity-90 flex items-center justify-between">
            <span>Streak Freeze Available: {freezeDays}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">Top 5% Consistent</span>
          </div>
          {/* 7-day dot trail */}
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/20">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <div key={idx} className="flex-1 text-center">
                <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-black ${idx <= 5 ? 'bg-white text-orange-600 shadow-xs' : 'bg-white/30 text-white'}`}>
                  {idx <= 5 ? '✓' : day}
                </div>
                <span className="text-[9px] mt-1 block opacity-80">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Study Target */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Study Allocation</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900">{plan.completedToday}</span>
              <span className="text-sm font-semibold text-slate-400">/ {plan.dailyHours} hrs</span>
            </div>
          </div>
          <div className="my-3">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (plan.completedToday / plan.dailyHours) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
              <span>71% Completed</span>
              <span>1.3 hrs remaining</span>
            </div>
          </div>
          <button
            onClick={() => setPlan(p => ({ ...p, completedToday: Math.min(p.dailyHours, Math.round((p.completedToday + 0.5) * 10) / 10) }))}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-blue-600 text-xs font-bold rounded-xl border border-slate-200 transition"
          >
            + Log 30 Mins Study Session
          </button>
        </div>

        {/* Target Countdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Exam Milestone</span>
            <div className="text-2xl font-black text-slate-900 mt-1">GATE CSE 2027</div>
            <p className="text-xs text-slate-500 mt-0.5">Scheduled for February 14, 2027</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100 text-center my-2">
            <span className="text-2xl font-black text-blue-700">133</span>
            <span className="text-xs font-bold text-blue-900 block">Days Remaining</span>
          </div>
          <div className="text-[11px] text-slate-500 text-center">
            Pacing: ~42 topics left to master
          </div>
        </div>
      </div>

      {/* Daily AI Targeted Interventions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold mb-1">
              <span>🤖</span> AI Diagnostic Interventions
            </div>
            <h2 className="text-lg font-black text-slate-900">High-Yield Weak Area Remediation</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Ranked by Mock Test Error Rates</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {dailyWeakTopics.map(topic => (
            <div key={topic.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-purple-300 transition">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded-md">
                    {topic.errorRate} Error Rate
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{topic.subject}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-snug mb-2">{topic.name}</h4>
              </div>

              <div className="pt-3 border-t border-slate-200 flex gap-2">
                <button
                  onClick={() => onExplainConcept(topic.name)}
                  className="flex-1 py-1.5 bg-white hover:bg-slate-100 text-purple-700 text-[11px] font-bold rounded-lg border border-purple-200 transition"
                >
                  💡 Concept
                </button>
                <button
                  onClick={() => onStartQuiz(topic.name)}
                  className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg transition"
                >
                  ⚡ AI Drill
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 4. MOCK TEST LIST PAGE (FULL LENGTH, SECTIONAL, DIAGNOSTIC)
// =========================================================================
function MockTestListPage({ onLaunchTest, onBack }) {
  const [filterType, setFilterType] = useState('ALL');

  const mockTests = [
    {
      id: 'mt000000-0000-0000-0000-000000000001',
      title: 'GATE CSE 2026 All-India Full Length Mock Test #1',
      examCode: 'GATE',
      stageName: 'Single Stage',
      type: 'FULL_LENGTH',
      durationMinutes: 180,
      totalQuestions: 65,
      sectionsCount: 2,
      navigationType: 'OPEN',
      markingSummary: '+1 & +2 marks (MCQ/MSQ/NAT), -1/3 penalty on MCQs'
    },
    {
      id: 'mt000000-0000-0000-0000-000000000002',
      title: 'CAT 2026 National Diagnostic Simulation #1',
      examCode: 'CAT',
      stageName: 'Single Stage',
      type: 'FULL_LENGTH',
      durationMinutes: 120,
      totalQuestions: 66,
      sectionsCount: 3,
      navigationType: 'LOCKED',
      markingSummary: '+3 marks, -1 penalty on MCQ, zero penalty on TITA'
    },
    {
      id: 'mt000000-0000-0000-0000-000000000003',
      title: 'Algorithms & Data Structures Sectional Drill',
      examCode: 'GATE',
      stageName: 'Sectional',
      type: 'SECTIONAL',
      durationMinutes: 45,
      totalQuestions: 20,
      sectionsCount: 1,
      navigationType: 'OPEN',
      markingSummary: '+1 & +2 marks, standard GATE CS rubric'
    },
    {
      id: 'mt000000-0000-0000-0000-000000000004',
      title: 'UPSC CSE 2026 GS Paper-I Diagnostic Arena',
      examCode: 'UPSC CSE',
      stageName: 'Prelims',
      type: 'DIAGNOSTIC',
      durationMinutes: 60,
      totalQuestions: 30,
      sectionsCount: 1,
      navigationType: 'OPEN',
      markingSummary: '+2 marks, -0.66 penalty'
    }
  ];

  const filteredTests = mockTests.filter(t => filterType === 'ALL' || t.type === filterType);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={onBack}
            className="mb-2 p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition text-xs font-bold inline-flex items-center gap-1"
          >
            <span>⬅️</span> Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">National Mock Test Vault</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time simulations with server-authoritative timer, TCS-iON palette, and anti-cheat sync
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {['ALL', 'FULL_LENGTH', 'SECTIONAL', 'DIAGNOSTIC'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${filterType === t
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTests.map(test => (
          <div
            key={test.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-lg transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-black">
                  {test.examCode} • {test.stageName}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${test.navigationType === 'LOCKED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {test.navigationType === 'LOCKED' ? '🔒 Section Lockout' : '🔓 Free Navigation'}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{test.title}</h3>

              <div className="grid grid-cols-3 gap-2 my-4 text-center">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Duration</span>
                  <span className="text-xs font-black text-slate-800">{test.durationMinutes} Mins</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Questions</span>
                  <span className="text-xs font-black text-slate-800">{test.totalQuestions} Qs</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Sections</span>
                  <span className="text-xs font-black text-slate-800">{test.sectionsCount} Sec</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                ⚖️ <strong>Rules:</strong> {test.markingSummary}
              </p>
            </div>

            <button
              id={`btn-launch-mock-${test.id}`}
              onClick={() => onLaunchTest(test)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <span>🚀</span> Launch Test Arena
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// 5. EXAM ENGINE ARENA (LOW-LATENCY, TCS-iON PALETTE, SERVER-AUTHORITATIVE)
// =========================================================================
function ExamEngineArena({ mockTestId, onFinishExam, onExit }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [responses, setResponses] = useState({}); // { [qId]: { answer, state, timeSpent } }
  const [remainingSeconds, setRemainingSeconds] = useState(10800);
  const [syncingHeartbeat, setSyncingHeartbeat] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [virtualKeypadVal, setVirtualKeypadVal] = useState('');

  // 1. Initialise Server Authoritative Session
  useEffect(() => {
    startSession();
  }, [mockTestId]);

  const startSession = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/mock-tests/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockTestId })
      });
      const data = await res.json();
      if (data.success) {
        setSession(data);
        setRemainingSeconds(data.mockTest?.total_time_seconds || 10800);

        // Pre-populate empty responses in UNVISITED state
        const initialResp = {};
        (data.sections || []).forEach(sec => {
          (sec.questions || []).forEach(q => {
            initialResp[q.id] = { answer: null, state: 'UNVISITED', timeSpent: 0 };
          });
        });
        setResponses(initialResp);
      }
    } catch (err) {
      console.error('Failed to start mock test session:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Authoritative Server Clock Countdown & Heartbeat Sync (every 10s)
  useEffect(() => {
    if (!session || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(); // Auto-submit when time expires!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const heartbeat = setInterval(() => {
      syncHeartbeatWithServer();
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(heartbeat);
    };
  }, [session, responses]);

  const syncHeartbeatWithServer = async () => {
    if (!session?.submissionId) return;
    try {
      setSyncingHeartbeat(true);
      const payload = Object.keys(responses).map(qId => ({
        questionId: qId,
        answer: responses[qId].answer,
        state: responses[qId].state,
        timeSpent: responses[qId].timeSpent
      }));

      const res = await fetch(`/api/v1/mock-tests/${session.submissionId}/heartbeat-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: payload })
      });
      const data = await res.json();
      if (data.success && data.remainingSeconds !== undefined) {
        setRemainingSeconds(data.remainingSeconds);
        if (data.isTimeUp) {
          handleSubmitExam();
        }
      }
    } catch (err) {
      console.warn('Heartbeat sync skipped:', err);
    } finally {
      setSyncingHeartbeat(false);
    }
  };

  const currentSection = session?.sections?.[activeSectionIdx];
  const currentQuestions = currentSection?.questions || [];
  const currentQuestion = currentQuestions[activeQuestionIdx];
  const currentResp = currentQuestion ? responses[currentQuestion.id] || { answer: null, state: 'UNVISITED' } : null;

  // Mark question visited when rendered
  useEffect(() => {
    if (currentQuestion && responses[currentQuestion.id]?.state === 'UNVISITED') {
      setResponses(prev => ({
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          state: 'NOT_ANSWERED'
        }
      }));
    }
    // Sync virtual keypad if NAT
    if (currentQuestion?.question_type === 'NUMERICAL') {
      setVirtualKeypadVal(responses[currentQuestion.id]?.answer !== null ? String(responses[currentQuestion.id]?.answer) : '');
    }
  }, [currentQuestion?.id]);

  // Response handlers
  const handleSelectOption = (optIndex) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;

    if (currentQuestion.question_type === 'MCQ') {
      // Single choice
      const optLetter = String.fromCharCode(65 + optIndex); // A, B, C, D
      setResponses(prev => ({
        ...prev,
        [qId]: { ...prev[qId], answer: optLetter, state: 'ANSWERED' }
      }));
    } else if (currentQuestion.question_type === 'MSQ') {
      // Multiple selection
      const optLetter = String.fromCharCode(65 + optIndex);
      const currentAns = Array.isArray(responses[qId]?.answer) ? [...responses[qId].answer] : [];
      const newAns = currentAns.includes(optLetter)
        ? currentAns.filter(x => x !== optLetter)
        : [...currentAns, optLetter].sort();

      setResponses(prev => ({
        ...prev,
        [qId]: {
          ...prev[qId],
          answer: newAns.length > 0 ? newAns : null,
          state: newAns.length > 0 ? 'ANSWERED' : 'NOT_ANSWERED'
        }
      }));
    }
  };

  const handleKeypadPress = (val) => {
    if (!currentQuestion) return;
    let nextVal = virtualKeypadVal;
    if (val === 'CLEAR') nextVal = '';
    else if (val === 'BACK') nextVal = nextVal.slice(0, -1);
    else if (val === '.' && nextVal.includes('.')) return;
    else nextVal += val;

    setVirtualKeypadVal(nextVal);
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        answer: nextVal !== '' ? parseFloat(nextVal) : null,
        state: nextVal !== '' ? 'ANSWERED' : 'NOT_ANSWERED'
      }
    }));
  };

  const handleSaveAndNext = () => {
    const hasAnswer = currentResp?.answer !== null && currentResp?.answer !== undefined && currentResp?.answer !== '';
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        state: hasAnswer ? 'ANSWERED' : 'NOT_ANSWERED'
      }
    }));
    advanceQuestion();
  };

  const handleMarkForReviewAndNext = () => {
    const hasAnswer = currentResp?.answer !== null && currentResp?.answer !== undefined && currentResp?.answer !== '';
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        state: hasAnswer ? 'ANSWERED_AND_MARKED' : 'MARKED_FOR_REVIEW'
      }
    }));
    advanceQuestion();
  };

  const handleClearResponse = () => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        answer: null,
        state: 'NOT_ANSWERED'
      }
    }));
    setVirtualKeypadVal('');
  };

  const advanceQuestion = () => {
    if (activeQuestionIdx < currentQuestions.length - 1) {
      setActiveQuestionIdx(activeQuestionIdx + 1);
    } else if (activeSectionIdx < (session?.sections?.length || 1) - 1) {
      // Advance to next section if not locked
      setActiveSectionIdx(activeSectionIdx + 1);
      setActiveQuestionIdx(0);
    }
  };

  const handleSubmitExam = async () => {
    if (!session?.submissionId) return;
    try {
      setShowSubmitModal(false);
      setLoading(true);

      // Final sync before submit
      await syncHeartbeatWithServer();

      const res = await fetch(`/api/v1/mock-tests/${session.submissionId}/submit`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        onFinishExam(session.submissionId);
      }
    } catch (err) {
      console.error('Failed to submit mock test:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format Timer HH:MM:SS
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Palette State Counts
  const paletteStats = {
    answered: Object.values(responses).filter(r => r.state === 'ANSWERED').length,
    notAnswered: Object.values(responses).filter(r => r.state === 'NOT_ANSWERED').length,
    notVisited: Object.values(responses).filter(r => r.state === 'UNVISITED').length,
    markedForReview: Object.values(responses).filter(r => r.state === 'MARKED_FOR_REVIEW').length,
    answeredAndMarked: Object.values(responses).filter(r => r.state === 'ANSWERED_AND_MARKED').length
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center text-white z-50">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-lg font-bold">Securing Testing Environment...</h2>
          <p className="text-xs text-slate-400 mt-1">Starting Server-Authoritative Session & Anti-Cheat Sync</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* 1. TCS-iON Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <span className="p-1.5 bg-blue-600 rounded-lg text-xs font-black">NTA/TCS-iON</span>
          <div>
            <h1 className="text-sm font-black tracking-tight">{session?.mockTest?.title}</h1>
            <span className="text-[10px] text-slate-400">Strict Anti-Cheat & Dynamic Marking Engine Active</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Heartbeat Sync Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className={`w-2 h-2 rounded-full ${syncingHeartbeat ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
            <span>{syncingHeartbeat ? 'Syncing...' : 'Encrypted Cloud Sync'}</span>
          </div>

          {/* Authoritative Countdown Clock */}
          <div className={`px-4 py-1.5 rounded-xl border font-mono font-bold text-sm sm:text-base flex items-center gap-2 ${remainingSeconds < 300 ? 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse' : 'bg-slate-800 border-slate-700 text-emerald-400'}`}>
            <span>⏳</span>
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Submit Test Button */}
          <button
            id="btn-submit-exam"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-lg shadow-sm transition"
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* 2. Section Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Sections:</span>
          {(session?.sections || []).map((sec, idx) => (
            <button
              key={sec.id}
              onClick={() => {
                if (!sec.is_time_locked) {
                  setActiveSectionIdx(idx);
                  setActiveQuestionIdx(0);
                }
              }}
              disabled={sec.is_time_locked && activeSectionIdx !== idx}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${activeSectionIdx === idx
                ? 'bg-blue-600 text-white shadow-xs'
                : sec.is_time_locked
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              <span>{sec.is_time_locked ? '🔒' : '📝'}</span>
              <span>{sec.section_name}</span>
              <span className="text-[10px] opacity-75">({sec.questions?.length || 0})</span>
            </button>
          ))}
        </div>

        <div className="text-xs font-bold text-slate-500">
          Question {activeQuestionIdx + 1} of {currentQuestions.length}
        </div>
      </div>

      {/* 3. Main Split Arena Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Arena: Question Pane */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto p-6 sm:p-8">
          {currentQuestion ? (
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-between">
              <div>
                {/* Question Type and Marks Banner */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded font-black text-xs">
                      Q.{activeQuestionIdx + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${currentQuestion.question_type === 'MCQ' ? 'bg-blue-50 text-blue-700 border border-blue-200' : currentQuestion.question_type === 'MSQ' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {currentQuestion.question_type === 'MCQ' ? 'Single Choice (MCQ)' : currentQuestion.question_type === 'MSQ' ? 'Multiple Choice (MSQ)' : 'Numerical (NAT)'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Topic: {currentQuestion.topic_name}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      +{currentQuestion.positive_marks} Marks
                    </span>
                    {Number(currentQuestion.negative_marks) > 0 && (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        -{currentQuestion.negative_marks} Negative
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Body with LaTeX math */}
                <div className="text-slate-800 text-sm sm:text-base leading-relaxed mb-6 font-medium">
                  <MathRenderer text={currentQuestion.content?.text} />
                </div>

                {/* Polymorphic Input Area */}
                {currentQuestion.question_type === 'MCQ' && (
                  <div className="space-y-3 mb-6">
                    {(currentQuestion.options || []).map((opt, oIdx) => {
                      const optLetter = String.fromCharCode(65 + oIdx);
                      const isSelected = currentResp?.answer === optLetter;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectOption(oIdx)}
                          className={`w-full p-4 rounded-xl text-left text-xs sm:text-sm font-medium transition flex items-center gap-3 border ${isSelected
                            ? 'bg-blue-50/80 border-blue-500 text-blue-950 font-bold shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                            }`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {optLetter}
                          </span>
                          <div className="flex-1">
                            <MathRenderer text={opt} inline={true} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.question_type === 'MSQ' && (
                  <div className="space-y-3 mb-6">
                    <div className="text-[11px] font-bold text-purple-700 bg-purple-50 p-2 rounded-lg border border-purple-100 mb-2">
                      💡 <strong>MSQ Notice:</strong> One or more options may be correct. No negative marking.
                    </div>
                    {(currentQuestion.options || []).map((opt, oIdx) => {
                      const optLetter = String.fromCharCode(65 + oIdx);
                      const isSelected = Array.isArray(currentResp?.answer) && currentResp.answer.includes(optLetter);
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectOption(oIdx)}
                          className={`w-full p-4 rounded-xl text-left text-xs sm:text-sm font-medium transition flex items-center gap-3 border ${isSelected
                            ? 'bg-purple-50/80 border-purple-500 text-purple-950 font-bold shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                            }`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {isSelected ? '✓' : optLetter}
                          </span>
                          <div className="flex-1">
                            <MathRenderer text={opt} inline={true} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.question_type === 'NUMERICAL' && (
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-6 max-w-md">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Type-In-The-Answer (TITA / NAT)
                    </span>
                    <input
                      type="text"
                      readOnly
                      placeholder="Enter value via keypad below..."
                      value={virtualKeypadVal}
                      className="w-full text-center text-xl font-mono font-black py-2.5 bg-white border border-slate-300 rounded-xl mb-4 text-slate-900 shadow-inner"
                    />

                    {/* Virtual Keypad */}
                    <div className="grid grid-cols-3 gap-2">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '-'].map(k => (
                        <button
                          key={k}
                          onClick={() => handleKeypadPress(k)}
                          className="py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-200 shadow-2xs active:bg-slate-200 text-sm"
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => handleKeypadPress('BACK')}
                        className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg border border-amber-200"
                      >
                        ⌫ Backspace
                      </button>
                      <button
                        onClick={() => handleKeypadPress('CLEAR')}
                        className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-lg border border-rose-200"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={handleClearResponse}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
                >
                  Clear Response
                </button>

                <div className="flex items-center gap-3">
                  <button
                    id="btn-mark-review"
                    onClick={handleMarkForReviewAndNext}
                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 transition"
                  >
                    Mark for Review & Next
                  </button>
                  <button
                    id="btn-save-next"
                    onClick={handleSaveAndNext}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition"
                  >
                    Save & Next ➔
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="m-auto text-slate-400 text-xs">No questions loaded for this section.</div>
          )}
        </div>

        {/* Right Arena: TCS-iON Question Palette */}
        <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col justify-between p-4 overflow-y-auto">
          <div>
            {/* Palette Summary Legend */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs mb-4">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                TCS-iON / NTA Question Palette
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                    {paletteStats.answered}
                  </span>
                  <span className="text-slate-700 font-medium">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold">
                    {paletteStats.notAnswered}
                  </span>
                  <span className="text-slate-700 font-medium">Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[9px] font-bold">
                    {paletteStats.notVisited}
                  </span>
                  <span className="text-slate-700 font-medium">Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold">
                    {paletteStats.markedForReview}
                  </span>
                  <span className="text-slate-700 font-medium">Marked Review</span>
                </div>
                <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-slate-100">
                  <span className="w-4 h-4 rounded-full bg-purple-600 border-2 border-emerald-400 text-white flex items-center justify-center text-[8px] font-black">
                    ✓
                  </span>
                  <span className="text-slate-700 font-medium text-[10px]">
                    Answered & Marked ({paletteStats.answeredAndMarked} evaluated)
                  </span>
                </div>
              </div>
            </div>

            {/* Question Buttons Grid */}
            <div className="text-xs font-bold text-slate-500 mb-2">
              {currentSection?.section_name} ({currentQuestions.length} Questions)
            </div>
            <div className="grid grid-cols-5 gap-2">
              {currentQuestions.map((q, idx) => {
                const resp = responses[q.id] || { state: 'UNVISITED' };
                let bgClass = 'bg-slate-200 text-slate-700'; // UNVISITED

                if (resp.state === 'NOT_ANSWERED') bgClass = 'bg-rose-500 text-white';
                else if (resp.state === 'ANSWERED') bgClass = 'bg-emerald-600 text-white';
                else if (resp.state === 'MARKED_FOR_REVIEW') bgClass = 'bg-purple-600 text-white';
                else if (resp.state === 'ANSWERED_AND_MARKED') bgClass = 'bg-purple-600 text-white ring-2 ring-emerald-400';

                const isActive = activeQuestionIdx === idx;

                return (
                  <button
                    key={q.id}
                    id={`btn-q-palette-${idx + 1}`}
                    onClick={() => setActiveQuestionIdx(idx)}
                    className={`h-9 rounded-lg font-black text-xs transition relative ${bgClass} ${isActive ? 'ring-3 ring-blue-500 ring-offset-2' : ''}`}
                  >
                    {idx + 1}
                    {resp.state === 'ANSWERED_AND_MARKED' && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl transition"
            >
              Submit Section / Test
            </button>
          </div>
        </div>
      </div>

      {/* SUBMISSION CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-2">Final Submission Confirmation</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to finish the exam? Once submitted, your answers will be deterministically evaluated against official answer keys.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 mb-6 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Answered Questions:</span>
                <span className="font-bold text-emerald-700">{paletteStats.answered + paletteStats.answeredAndMarked}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unanswered Questions:</span>
                <span className="font-bold text-rose-700">{paletteStats.notAnswered + paletteStats.notVisited}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Marked for Review:</span>
                <span className="font-bold text-purple-700">{paletteStats.markedForReview}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Remaining Time:</span>
                <span className="font-bold text-slate-800 font-mono">{formatTime(remainingSeconds)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Resume Test
              </button>
              <button
                id="btn-confirm-submit-exam"
                onClick={handleSubmitExam}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition"
              >
                Yes, Final Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 6. PERFORMANCE REPORT PAGE (TIME-LOSS MATRIX, TMI RADAR, SOLUTIONS)
// =========================================================================
function PerformanceReportPage({ submissionId, onBack, onExplainConcept, onRetake }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ANALYTICS'); // ANALYTICS or SOLUTIONS

  useEffect(() => {
    if (submissionId) {
      fetchReport();
    }
  }, [submissionId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/mock-tests/reports/${submissionId}`);
      const data = await res.json();
      if (data.success) {
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to fetch mock test report:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 text-sm font-medium">Computing Deterministic Scoring & Topic Mastery Index...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-20 text-center">
        <h3 className="text-base font-bold text-slate-800">Report not found</h3>
        <button onClick={onBack} className="mt-3 px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">Back</button>
      </div>
    );
  }

  const sub = report.submission;
  const ana = report.analytics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition text-xs font-bold shadow-2xs"
          >
            <span>⬅️</span> Dashboard
          </button>
          <div>
            <span className="text-xs font-bold text-blue-600">{sub?.exam_code}</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">{sub?.mock_test_title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'ANALYTICS' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'}`}
          >
            📊 Analytics & Time Loss
          </button>
          <button
            onClick={() => setActiveTab('SOLUTIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'SOLUTIONS' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'}`}
          >
            📖 Step-by-Step Solutions
          </button>
        </div>
      </div>

      {/* Main Scorecard Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-8 text-white shadow-2xl mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Score</span>
            <div className="text-3xl sm:text-4xl font-black mt-1 text-white">
              {sub?.total_score} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </div>
            <span className="text-xs text-blue-300 mt-1 block">Deterministic Scoring Engine</span>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Accuracy</span>
            <div className="text-3xl sm:text-4xl font-black mt-1 text-emerald-400">
              {sub?.total_accuracy_pct}%
            </div>
            <span className="text-xs text-slate-300 mt-1 block">Attempt Precision Rate</span>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Percentile</span>
            <div className="text-3xl sm:text-4xl font-black mt-1 text-amber-400">
              {ana?.percentileEstimator?.estimatedPercentile}%
            </div>
            <span className="text-xs text-slate-300 mt-1 block">
              Estimated AIR: ~{ana?.percentileEstimator?.simulatedRank}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Time Expended</span>
            <div className="text-2xl sm:text-3xl font-black mt-1 text-slate-200">
              {Math.floor((sub?.time_spent_seconds || 0) / 60)} Mins
            </div>
            <span className="text-xs text-slate-300 mt-1 block">Authoritative Server Clock</span>
          </div>
        </div>
      </div>

      {activeTab === 'ANALYTICS' ? (
        <div className="space-y-8">
          {/* Analytical Lens 1: Time-Loss Matrix */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-black text-rose-600 uppercase tracking-wider">Analytical Lens 1</span>
                <h2 className="text-lg font-black text-slate-900">Time-Loss Matrix (Wasted Sinks)</h2>
              </div>
              <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200">
                {ana?.timeLossMatrix?.timeWastedMinutes} Minutes Sunk
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-6 max-w-2xl leading-relaxed">
              Identifies candidate traps by calculating authoritative seconds sunk into questions that were 
              ultimately marked wrong or abandoned unattempted.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500">Time Wasted on Incorrect Answers:</span>
                <div className="text-2xl font-black text-rose-600 mt-1">
                  {Math.round(ana?.timeLossMatrix?.secondsOnWrong / 60)} mins ({ana?.timeLossMatrix?.secondsOnWrong}s)
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Sunk on calculations resulting in negative mark penalties.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500">Time Wasted on Unattempted Qs:</span>
                <div className="text-2xl font-black text-amber-600 mt-1">
                  {Math.round(ana?.timeLossMatrix?.secondsOnUnanswered / 60)} mins ({ana?.timeLossMatrix?.secondsOnUnanswered}s)
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Time spent reading without converting to positive score.</p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <span>💡</span>
              <span><strong>Strategy Recommendation:</strong> {ana?.timeLossMatrix?.recommendation}</span>
            </div>
          </div>

          {/* Analytical Lens 2: Topic Mastery Index (TMI) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-black text-blue-600 uppercase tracking-wider">Analytical Lens 2</span>
                <h2 className="text-lg font-black text-slate-900">Topic Mastery Index (TMI)</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                TMI = (Score / Max) × (1 - TimeSkew)
              </span>
            </div>

            <div className="space-y-4">
              {(ana?.topicMasteryIndices || []).map((tmi, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-500">{tmi.subject_name}</span>
                      <h4 className="text-sm font-black text-slate-800">{tmi.topic_name}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-black ${tmi.masteryStatus === 'MASTERED' ? 'bg-emerald-100 text-emerald-800' : tmi.masteryStatus === 'PROFICIENT' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                        {tmi.masteryStatus}
                      </span>
                      <span className="text-sm font-black text-slate-900">{tmi.tmiScore}% TMI</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className={`h-2 rounded-full ${tmi.tmiScore >= 75 ? 'bg-emerald-500' : tmi.tmiScore >= 50 ? 'bg-blue-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, Math.max(5, tmi.tmiScore))}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Scored: {tmi.scoredMarks} / {tmi.totalPossibleMarks} Marks</span>
                    <span>Time Spent: {Math.round(tmi.timeSpentSeconds / 60)} mins</span>
                    <span>Syllabus Weightage: {tmi.weightage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* SOLUTIONS & DERIVATIONS VIEW */
        <div className="space-y-6">
          {(report.itemResponses || []).map((item, idx) => {
            const isCorrect = Boolean(item.is_correct);
            const studentAns = item.student_answer ? (typeof item.student_answer === 'string' ? JSON.parse(item.student_answer) : item.student_answer) : null;
            const correctAns = typeof item.correct_answer === 'string' ? JSON.parse(item.correct_answer) : item.correct_answer;

            return (
              <div key={item.id || idx} className={`bg-white rounded-3xl p-6 sm:p-8 border ${isCorrect ? 'border-emerald-200' : 'border-rose-200'} shadow-sm`}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded font-black text-xs">
                      Q.{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{item.question_type}</span>
                    <span className="text-xs text-slate-400">• {item.topic_name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {isCorrect ? `+${item.score_awarded} Marks` : `${item.score_awarded} Marks`}
                    </span>
                    <span className="text-xs text-slate-400">{item.time_spent_seconds}s spent</span>
                  </div>
                </div>

                {/* Question Content */}
                <div className="text-slate-800 text-sm font-medium mb-4 leading-relaxed">
                  <MathRenderer text={item.content?.text} />
                </div>

                {/* Answers Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs mb-4">
                  <div>
                    <span className="text-slate-400 block font-bold mb-1">Your Selected Answer:</span>
                    <span className={`font-black ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {studentAns !== null ? JSON.stringify(studentAns) : 'Unattempted'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold mb-1">Official Correct Answer:</span>
                    <span className="font-black text-emerald-800 font-mono">
                      {JSON.stringify(correctAns)}
                    </span>
                  </div>
                </div>

                {/* Derivation / Explanation with LaTeX */}
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-950 leading-relaxed">
                  <span className="font-black block text-blue-900 mb-1 flex items-center gap-1">
                    <span>💡</span> Step-by-Step Derivation & Explanation:
                  </span>
                  <MathRenderer text={item.explanation} />
                </div>

                {/* Ask AI to Explain Concept Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => onExplainConcept(item.topic_name, item.content?.text)}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 transition flex items-center gap-1.5"
                  >
                    <span>🤖</span> Deep-Dive with Gemini AI
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 7. AI STUDY ASSISTANT (GEMINI CONCEPT EXPLAINER & REMEDIAL DRILLS)
// =========================================================================
function AIStudyAssistantPage({ initialTopic = 'Binary Search Trees & AVL Trees', onBack }) {
  const [topicName, setTopicName] = useState(initialTopic);
  const [conceptQuery, setConceptQuery] = useState('');
  const [explanation, setExplanation] = useState(null);
  const [loadingExplainer, setLoadingExplainer] = useState(false);
  const [drillQuiz, setDrillQuiz] = useState(null);
  const [loadingDrill, setLoadingDrill] = useState(false);
  const [drillAnswers, setDrillAnswers] = useState({});
  const [drillSubmitted, setDrillSubmitted] = useState(false);

  const handleExplainConcept = async () => {
    try {
      setLoadingExplainer(true);
      const res = await fetch('/api/v1/ai/explain-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicName, conceptQuery })
      });
      const data = await res.json();
      if (data.success) {
        setExplanation(data.explanation);
      }
    } catch (err) {
      console.error('Failed to explain concept:', err);
    } finally {
      setLoadingExplainer(false);
    }
  };

  const handleGenerateDrill = async () => {
    try {
      setLoadingDrill(true);
      setDrillSubmitted(false);
      setDrillAnswers({});
      const res = await fetch('/api/v1/ai/generate-drill-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicName, questionCount: 2 })
      });
      const data = await res.json();
      if (data.success) {
        setDrillQuiz(data.drill);
      }
    } catch (err) {
      console.error('Failed to generate drill:', err);
    } finally {
      setLoadingDrill(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Header and Back Button */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition text-xs font-bold flex items-center gap-1 shadow-2xs"
        >
          <span>⬅️</span> Back
        </button>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Gemini 1.5 Pro / Flash Orchestrator
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-2xl mb-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold tracking-wide uppercase mb-3 border border-purple-400/30">
            <span>🤖</span> AI Exam Target Intervention
          </div>
          <h1 className="text-3xl font-black mb-2">AI Concept Explainer & Remedial Drills</h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
            Leverages structured prompt injection with the national syllabus standard to generate mathematical derivations, 
            candidate trap alerts, and targeted diagnostic drill quizzes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Topic Name (e.g., Virtual Memory, AVL Trees...)"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              id="btn-ai-explain"
              onClick={handleExplainConcept}
              disabled={loadingExplainer}
              className="px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-black rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingExplainer ? 'Deriving...' : 'Explain with KaTeX ⚡'}
            </button>
            <button
              id="btn-ai-drill"
              onClick={handleGenerateDrill}
              disabled={loadingDrill}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-purple-950 text-xs font-black rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingDrill ? 'Building Quiz...' : 'Generate 2-Q Drill 🎯'}
            </button>
          </div>
        </div>
      </div>

      {/* Structured Concept Explanation Display */}
      {explanation && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8 animate-fadeIn">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 bg-purple-100 text-purple-700 rounded-xl text-base">💡</span>
            <div>
              <h3 className="text-base font-black text-slate-900">{explanation.conceptTitle}</h3>
              <span className="text-xs text-slate-400">{explanation.topic}</span>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Executive Summary:</span>
              <p>{explanation.highLevelSummary}</p>
            </div>

            {explanation.mathematicalFormula && (
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 text-purple-950 font-mono">
                <span className="font-bold text-purple-900 block font-sans mb-2">Mathematical Formulation (KaTeX):</span>
                <MathRenderer text={explanation.mathematicalFormula} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-100 text-rose-950">
                <span className="font-bold text-rose-900 block mb-1">⚠️ Candidate Pitfalls & Exam Traps:</span>
                <p>{explanation.commonPitfall}</p>
              </div>

              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 text-blue-950">
                <span className="font-bold text-blue-900 block mb-1">🎯 Mental Model & Analogy:</span>
                <p>{explanation.intuitiveAnalogy}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adaptive Drill Quiz Display */}
      {drillQuiz && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-black text-purple-600 uppercase tracking-wider">AI Weak-Area Fixer</span>
              <h3 className="text-base font-black text-slate-900">Adaptive Remedial Drill</h3>
            </div>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-md text-xs font-bold">
              {drillQuiz.questions?.length} Questions
            </span>
          </div>

          <div className="space-y-6">
            {(drillQuiz.questions || []).map((q, idx) => {
              const selected = drillAnswers[q.id];
              return (
                <div key={q.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-700">Question {idx + 1} ({q.type})</span>
                    <span className="text-[10px] font-bold text-slate-400">{q.difficulty}</span>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-slate-800 mb-4">
                    <MathRenderer text={q.question} />
                  </p>

                  {q.type === 'MCQ' && (
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => {
                        const optLetter = String.fromCharCode(65 + oIdx);
                        const isChosen = selected === optLetter;
                        return (
                          <button
                            key={oIdx}
                            onClick={() => !drillSubmitted && setDrillAnswers(prev => ({ ...prev, [q.id]: optLetter }))}
                            className={`w-full p-2.5 rounded-xl text-left text-xs font-medium transition flex items-center gap-2 border ${isChosen
                              ? 'bg-purple-100 border-purple-500 text-purple-900 font-bold'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                              }`}
                          >
                            <span className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 text-[10px] font-black">{optLetter}</span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'NUMERICAL' && (
                    <div className="mt-2">
                      <input
                        type="number"
                        placeholder="Type your numerical answer..."
                        value={selected || ''}
                        disabled={drillSubmitted}
                        onChange={(e) => setDrillAnswers(prev => ({ ...prev, [q.id]: parseFloat(e.target.value) }))}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold w-48"
                      />
                    </div>
                  )}

                  {drillSubmitted && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-xs">
                      <strong>Solution:</strong> <MathRenderer text={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}

            {!drillSubmitted ? (
              <button
                onClick={() => setDrillSubmitted(true)}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl shadow-md transition"
              >
                Submit Drill Answers
              </button>
            ) : (
              <button
                onClick={handleGenerateDrill}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition"
              >
                Generate Next Drill ➔
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 8. EXAM TRACKER PAGE (TIMELINE CARDS, ROLL NUMBER, STAGE 2 TRANSITION)
// =========================================================================
function ExamTrackerPage({ onBack }) {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [modalForm, setModalForm] = useState({
    status: 'ADMIT_CARD_DOWNLOADED',
    rollNumber: '',
    resultScore: '',
    allIndiaRank: ''
  });

  useEffect(() => {
    fetchTrackers();
  }, []);

  const fetchTrackers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/exam-trackers');
      const data = await res.json();
      if (data.success) {
        setTrackers(data.trackers || []);
      }
    } catch (err) {
      console.error('Failed to fetch exam trackers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!updatingId) return;
    try {
      const res = await fetch(`/api/v1/exam-trackers/${updatingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modalForm)
      });
      const data = await res.json();
      if (data.success) {
        setUpdatingId(null);
        fetchTrackers();
      }
    } catch (err) {
      console.error('Failed to update tracker:', err);
    }
  };

  const milestoneSteps = [
    { key: 'NOT_APPLIED', label: 'Not Applied', icon: '⚪' },
    { key: 'APPLIED', label: 'Applied', icon: '📝' },
    { key: 'ADMIT_CARD_DOWNLOADED', label: 'Admit Card', icon: '🎫' },
    { key: 'APPEARED', label: 'Appeared', icon: '✍️' },
    { key: 'QUALIFIED', label: 'Qualified', icon: '🎉' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition text-xs font-bold flex items-center gap-1 shadow-2xs"
        >
          <span>⬅️</span> Back
        </button>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Application ➔ Result ➔ Stage 2 Transition Engine
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">National Exam Lifecycle Tracker</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor your official registration numbers, admit card availability, exam center, and Stage 2 transitions.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading application lifecycle...</div>
      ) : trackers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <p className="text-slate-500 text-sm">No competitive exam applications registered yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {trackers.map(tr => {
            const currentIdx = milestoneSteps.findIndex(s => s.key === tr.status);

            return (
              <div key={tr.id} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-black">
                        {tr.exam_code}
                      </span>
                      <h3 className="text-base font-black text-slate-900">{tr.exam_name}</h3>
                    </div>
                    <span className="text-xs text-slate-400">Stage: {tr.stage_name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setUpdatingId(tr.id);
                        setModalForm({
                          status: tr.status,
                          rollNumber: tr.roll_number || '',
                          resultScore: tr.result_score || '',
                          allIndiaRank: tr.all_india_rank || ''
                        });
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                    >
                      Update Milestone Status
                    </button>
                  </div>
                </div>

                {/* Visual Milestone Stepper */}
                <div className="py-6">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 -z-0"></div>
                    <div
                      className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 -z-0 transition-all duration-500"
                      style={{ width: `${Math.max(0, (currentIdx / (milestoneSteps.length - 1)) * 100)}%` }}
                    ></div>

                    {milestoneSteps.map((step, idx) => {
                      const isDone = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={step.key} className="flex flex-col items-center relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition ${isDone ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-500'}`}>
                            {step.icon}
                          </div>
                          <span className={`text-[11px] mt-2 font-bold ${isCurrent ? 'text-blue-700' : 'text-slate-500'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Details Footer */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Roll Number:</span>
                    <span className="font-mono font-bold text-slate-800">{tr.roll_number || 'Not Assigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Current Status:</span>
                    <span className="font-bold text-blue-700">{tr.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Result Score:</span>
                    <span className="font-bold text-slate-800">{tr.result_score ? `${tr.result_score} / 100` : 'Pending'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">All India Rank:</span>
                    <span className="font-bold text-emerald-700">{tr.all_india_rank ? `AIR #${tr.all_india_rank}` : 'Awaited'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {updatingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-4">Update Exam Lifecycle Milestone</h3>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Milestone Status</label>
                <select
                  value={modalForm.status}
                  onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="APPLIED">APPLIED</option>
                  <option value="ADMIT_CARD_DOWNLOADED">ADMIT_CARD_DOWNLOADED</option>
                  <option value="APPEARED">APPEARED</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="DISQUALIFIED">DISQUALIFIED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number / Registration ID</label>
                <input
                  type="text"
                  value={modalForm.rollNumber}
                  onChange={(e) => setModalForm({ ...modalForm, rollNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., CS26S8140123"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Score (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={modalForm.resultScore}
                    onChange={(e) => setModalForm({ ...modalForm, resultScore: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="78.50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">All India Rank</label>
                  <input
                    type="number"
                    value={modalForm.allIndiaRank}
                    onChange={(e) => setModalForm({ ...modalForm, allIndiaRank: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="412"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUpdatingId(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-tracker-milestone"
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 9. ROOT COMPETITIVE EXAMS MANAGER WRAPPER
// =========================================================================
function CompetitiveExamsManager({ onBack }) {
  const [currentSubView, setCurrentSubView] = useState('hub'); // hub, details, planner, mock_list, arena, report, ai_assistant, tracker
  const [selectedExam, setSelectedExam] = useState(null);
  const [activeMockTestId, setActiveMockTestId] = useState(null);
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const [aiInitialTopic, setAiInitialTopic] = useState('Binary Search Trees & AVL Trees');

  const handleSelectExam = (exam) => {
    setSelectedExam(exam);
    setCurrentSubView('details');
  };

  const handleLaunchTest = (testOrExam) => {
    // If launching from exam details, pick first mock test
    const testId = testOrExam?.id?.startsWith('mt') ? testOrExam.id : 'mt000000-0000-0000-0000-000000000001';
    setActiveMockTestId(testId);
    setCurrentSubView('arena');
  };

  const handleFinishExam = (submissionId) => {
    setActiveSubmissionId(submissionId);
    setCurrentSubView('report');
  };

  const handleExplainConcept = (topicName) => {
    setAiInitialTopic(topicName || 'Binary Search Trees & AVL Trees');
    setCurrentSubView('ai_assistant');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {currentSubView === 'hub' && (
        <ExamHubPage
          onSelectExam={handleSelectExam}
          onStartTest={() => setCurrentSubView('mock_list')}
          onOpenTracker={() => setCurrentSubView('tracker')}
          onOpenStudyPlan={() => setCurrentSubView('planner')}
        />
      )}

      {currentSubView === 'details' && selectedExam && (
        <ExamDetailsPage
          exam={selectedExam}
          onBack={() => setCurrentSubView('hub')}
          onLaunchTest={handleLaunchTest}
          onOpenStudyPlan={() => setCurrentSubView('planner')}
        />
      )}

      {currentSubView === 'planner' && (
        <StudyPlannerDashboard
          onBack={() => setCurrentSubView('hub')}
          onStartQuiz={handleExplainConcept}
          onExplainConcept={handleExplainConcept}
        />
      )}

      {currentSubView === 'mock_list' && (
        <MockTestListPage
          onBack={() => setCurrentSubView('hub')}
          onLaunchTest={handleLaunchTest}
        />
      )}

      {currentSubView === 'arena' && activeMockTestId && (
        <ExamEngineArena
          mockTestId={activeMockTestId}
          onFinishExam={handleFinishExam}
          onExit={() => setCurrentSubView('hub')}
        />
      )}

      {currentSubView === 'report' && activeSubmissionId && (
        <PerformanceReportPage
          submissionId={activeSubmissionId}
          onBack={() => setCurrentSubView('hub')}
          onExplainConcept={handleExplainConcept}
          onRetake={() => setCurrentSubView('mock_list')}
        />
      )}

      {currentSubView === 'ai_assistant' && (
        <AIStudyAssistantPage
          initialTopic={aiInitialTopic}
          onBack={() => setCurrentSubView('hub')}
        />
      )}

      {currentSubView === 'tracker' && (
        <ExamTrackerPage
          onBack={() => setCurrentSubView('hub')}
        />
      )}
    </div>
  );
}
