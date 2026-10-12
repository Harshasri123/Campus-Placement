const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const targetStr = `    const root = ReactDOM.createRoot(document.getElementById('root'));`;

if (!html.includes(targetStr)) {
  console.error('Target root render string not found in index.html');
  process.exit(1);
}

const newComponentsCode = `
    // =========================================================================
    // 10. IN-BROWSER LIVE CODING SANDBOX (COMPILER) COMPONENT
    // =========================================================================
    function LiveCodingSandbox({ onBack, currentUser }) {
      const [problems, setProblems] = useState([]);
      const [selectedProblemId, setSelectedProblemId] = useState('');
      const [selectedProblem, setSelectedProblem] = useState(null);
      const [language, setLanguage] = useState('python');
      const [code, setCode] = useState('');
      const [customInput, setCustomInput] = useState('');
      const [activeConsoleTab, setActiveConsoleTab] = useState('input'); // 'input' | 'output' | 'submission'
      const [runOutput, setRunOutput] = useState(null);
      const [submissionResult, setSubmissionResult] = useState(null);
      const [loadingRun, setLoadingRun] = useState(false);
      const [loadingSubmit, setLoadingSubmit] = useState(false);
      const [toastMsg, setToastMsg] = useState('');

      const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3000);
      };

      // Fetch problem list
      useEffect(() => {
        fetch('/api/compiler/problems')
          .then(r => r.json())
          .then(data => {
            if (data.problems) {
              setProblems(data.problems);
              if (data.problems.length > 0) {
                setSelectedProblemId(data.problems[0].id);
              }
            }
          })
          .catch(err => console.error(err));
      }, []);

      // Fetch problem details when selected
      useEffect(() => {
        if (!selectedProblemId) return;
        fetch(\`/api/compiler/problems/\${selectedProblemId}\`)
          .then(r => r.json())
          .then(data => {
            if (data.problem) {
              setSelectedProblem(data.problem);
              // Set default starter code
              const starters = data.problem.starterCode || {};
              const starter = starters[language] || starters['python'] || '// Write your solution here';
              setCode(starter);
              if (data.problem.sampleTestCases && data.problem.sampleTestCases.length > 0) {
                setCustomInput(data.problem.sampleTestCases[0].input);
              }
              setRunOutput(null);
              setSubmissionResult(null);
            }
          })
          .catch(err => console.error(err));
      }, [selectedProblemId]);

      // Change language starter template
      const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        if (selectedProblem && selectedProblem.starterCode) {
          const newCode = selectedProblem.starterCode[newLang] || '// Write your solution here';
          setCode(newCode);
        }
      };

      const handleRunCode = async () => {
        setLoadingRun(true);
        setActiveConsoleTab('output');
        setRunOutput(null);
        try {
          const res = await fetch('/api/compiler/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              language,
              input: customInput,
              problemId: selectedProblemId
            })
          });
          const data = await res.json();
          setRunOutput(data);
        } catch (err) {
          setRunOutput({ stderr: 'Execution request failed: ' + err.message });
        } finally {
          setLoadingRun(false);
        }
      };

      const handleSubmitSolution = async () => {
        setLoadingSubmit(true);
        setActiveConsoleTab('submission');
        setSubmissionResult(null);
        try {
          const res = await fetch('/api/compiler/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              language,
              problemId: selectedProblemId,
              userId: currentUser ? currentUser.id : null
            })
          });
          const data = await res.json();
          setSubmissionResult(data);
        } catch (err) {
          setSubmissionResult({ verdict: 'ERROR', verdictTitle: 'Submission failed: ' + err.message });
        } finally {
          setLoadingSubmit(false);
        }
      };

      return (
        <div className="space-y-6 font-sans animate-fade-in">
          {toastMsg && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold border border-slate-700 animate-fade-in flex items-center gap-2">
              <span>🔔</span>
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Top Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <button onClick={onBack} className="hover:text-indigo-600 transition cursor-pointer">Home</button>
                <span>/</span>
                <span className="text-slate-900 font-extrabold">In-Browser Live Coding Sandbox</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>💻</span> Live Coding Sandbox &amp; Test Runner
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Practice campus technical coding rounds (TCS Advanced Coding, Infosys DSE, Cognizant) with multi-language execution and hidden edge test suites.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onBack}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>←</span>
                <span>Back to Home</span>
              </button>
            </div>
          </div>

          {/* Problem Selector Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Select Problem:</span>
              <select
                value={selectedProblemId}
                onChange={(e) => setSelectedProblemId(e.target.value)}
                className="px-3.5 py-2 text-xs font-extrabold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {problems.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.company}] {p.title} ({p.difficulty})
                  </option>
                ))}
              </select>
            </div>

            {selectedProblem && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-extrabold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                  🏢 {selectedProblem.company}
                </span>
                <span className="font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  🏷️ {selectedProblem.category}
                </span>
                <span className="font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  ⏱️ {selectedProblem.timeLimitSeconds || 2.0}s Limit
                </span>
              </div>
            )}
          </div>

          {/* Main Split Layout: Problem Statement (Left) & Editor (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Problem Statement & Sample Cases (Col 1-5) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5 max-h-[750px] overflow-y-auto pr-2">
              {selectedProblem ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-black uppercase text-indigo-600 tracking-wider">
                      {selectedProblem.company} Official Coding Round
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">
                      {selectedProblem.title}
                    </h3>
                  </div>

                  <div className="text-xs text-slate-700 leading-relaxed space-y-2 whitespace-pre-line border-t border-slate-100 pt-3">
                    <strong className="block font-black text-slate-900">Problem Description:</strong>
                    {selectedProblem.description}
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                    <div>
                      <strong className="text-slate-800 block">📥 Input Format:</strong>
                      <span className="text-slate-600 whitespace-pre-line">{selectedProblem.inputFormat}</span>
                    </div>
                    <div>
                      <strong className="text-slate-800 block">📤 Output Format:</strong>
                      <span className="text-slate-600 whitespace-pre-line">{selectedProblem.outputFormat}</span>
                    </div>
                    <div>
                      <strong className="text-slate-800 block">🔒 Constraints:</strong>
                      <span className="text-slate-600 font-mono text-[11px] whitespace-pre-line">{selectedProblem.constraints}</span>
                    </div>
                  </div>

                  {/* Sample Test Cases */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                      Sample Test Cases:
                    </h4>
                    {(selectedProblem.sampleTestCases || []).map((tc, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-700">Sample #{idx + 1}</span>
                          <button
                            onClick={() => {
                              setCustomInput(tc.input);
                              showToast('Sample input loaded into Testcase Box');
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                          >
                            Load to Testcase Box
                          </button>
                        </div>
                        <div className="bg-slate-900 text-slate-100 font-mono text-[11px] p-2.5 rounded-xl">
                          <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Input:</div>
                          <pre className="whitespace-pre-wrap">{tc.input}</pre>
                          <div className="text-slate-400 text-[10px] uppercase font-bold mt-2 mb-1">Expected Output:</div>
                          <pre className="text-emerald-400">{tc.expectedOutput}</pre>
                        </div>
                        {tc.explanation && (
                          <p className="text-[11px] text-slate-500 italic">
                            Explanation: {tc.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400">Loading problem...</div>
              )}
            </div>

            {/* Right: Code Editor & Execution Console (Col 6-12) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Editor Frame */}
              <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
                {/* Editor Toolbar */}
                <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-300 flex items-center gap-1.5">
                      <span>💻</span> Editor
                    </span>
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="python">Python 3 (Standard)</option>
                      <option value="java">Java 17 (Main class)</option>
                      <option value="cpp">C++ 17 (std::cin)</option>
                      <option value="c">C (GCC)</option>
                      <option value="javascript">JavaScript (Node.js)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (confirm('Reset code to initial boilerplate template?')) {
                          handleLanguageChange(language);
                        }
                      }}
                      className="text-slate-400 hover:text-white text-[11px] font-bold px-2 py-1 rounded hover:bg-slate-800 transition cursor-pointer"
                    >
                      🔄 Reset Template
                    </button>
                  </div>
                </div>

                {/* Editor Textarea */}
                <div className="relative p-4 bg-slate-900 text-slate-100 font-mono text-xs">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const start = e.target.selectionStart;
                        const end = e.target.selectionEnd;
                        setCode(code.substring(0, start) + '    ' + code.substring(end));
                        setTimeout(() => {
                          e.target.selectionStart = e.target.selectionEnd = start + 4;
                        }, 0);
                      }
                    }}
                    rows={16}
                    spellCheck="false"
                    className="w-full bg-transparent font-mono text-xs text-slate-100 focus:outline-none resize-none leading-relaxed selection:bg-indigo-600"
                    placeholder="// Write your solution here..."
                  />
                </div>

                {/* Action Bar */}
                <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Time Limit: {selectedProblem?.timeLimitSeconds || 2.0}s • Memory: 256MB
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunCode}
                      disabled={loadingRun || loadingSubmit}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {loadingRun ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span>▶️</span>
                      )}
                      <span>Run Custom Input</span>
                    </button>

                    <button
                      onClick={handleSubmitSolution}
                      disabled={loadingRun || loadingSubmit}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {loadingSubmit ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span>🚀</span>
                      )}
                      <span>Submit Solution (Run All Test Cases)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Console Panel */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Console Tabs */}
                <div className="flex items-center border-b border-slate-100 bg-slate-50 text-xs font-bold">
                  <button
                    onClick={() => setActiveConsoleTab('input')}
                    className={\`px-4 py-3 border-b-2 transition cursor-pointer \${activeConsoleTab === 'input'
                      ? 'border-indigo-600 text-indigo-700 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                      }\`}
                  >
                    Custom Testcase Input
                  </button>
                  <button
                    onClick={() => setActiveConsoleTab('output')}
                    className={\`px-4 py-3 border-b-2 transition cursor-pointer \${activeConsoleTab === 'output'
                      ? 'border-indigo-600 text-indigo-700 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                      }\`}
                  >
                    Execution Output {runOutput && '• Ready'}
                  </button>
                  <button
                    onClick={() => setActiveConsoleTab('submission')}
                    className={\`px-4 py-3 border-b-2 transition cursor-pointer \${activeConsoleTab === 'submission'
                      ? 'border-indigo-600 text-indigo-700 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                      }\`}
                  >
                    Test Suite Evaluation {submissionResult && '• Graded'}
                  </button>
                </div>

                <div className="p-4 text-xs">
                  {/* Tab 1: Input */}
                  {activeConsoleTab === 'input' && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 block">
                        Standard Input (stdin):
                      </label>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        rows={4}
                        placeholder="Paste or enter test input here..."
                        className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {/* Tab 2: Run Output */}
                  {activeConsoleTab === 'output' && (
                    <div>
                      {loadingRun ? (
                        <div className="py-6 text-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <span>Executing code against test input...</span>
                        </div>
                      ) : runOutput ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-500">
                              Runtime: <strong className="text-slate-900 font-mono">{runOutput.executionTimeMs}ms</strong>
                            </span>
                            {runOutput.comparison && (
                              <span className={\`px-2.5 py-0.5 rounded-md font-black \${runOutput.comparison.passed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                                }\`}>
                                {runOutput.comparison.passed ? '✓ Output Matched Sample Case' : '✕ Output Mismatch'}
                              </span>
                            )}
                          </div>

                          <div className="p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl overflow-x-auto">
                            <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">Standard Output:</div>
                            <pre className="text-emerald-400 whitespace-pre-wrap">{runOutput.stdout || '(No output produced)'}</pre>
                            {runOutput.stderr && (
                              <div className="mt-2 text-rose-400 border-t border-slate-800 pt-2">
                                <div className="text-[10px] font-bold uppercase mb-1">Error Stream:</div>
                                <pre className="whitespace-pre-wrap">{runOutput.stderr}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-400">
                          Click <strong>"Run Custom Input"</strong> to execute your code and inspect terminal output.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Submission Results */}
                  {activeConsoleTab === 'submission' && (
                    <div>
                      {loadingSubmit ? (
                        <div className="py-8 text-center text-slate-400 space-y-2">
                          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <span className="font-semibold block">Grading against public &amp; hidden edge test cases...</span>
                        </div>
                      ) : submissionResult ? (
                        <div className="space-y-4">
                          <div className={\`p-4 rounded-2xl border flex items-center justify-between \${submissionResult.verdict === 'ACCEPTED'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                            }\`}>
                            <div>
                              <h4 className="font-black text-sm">{submissionResult.verdictTitle}</h4>
                              <p className="text-[11px] mt-0.5">
                                Passed <strong>{submissionResult.passedCount}</strong> of <strong>{submissionResult.totalTestCases}</strong> test cases • Avg Runtime: {submissionResult.averageTimeMs}ms
                              </p>
                            </div>
                            <span className={\`text-xs font-black px-3 py-1 rounded-full uppercase \${submissionResult.verdict === 'ACCEPTED'
                              ? 'bg-emerald-200 text-emerald-900'
                              : 'bg-rose-200 text-rose-900'
                              }\`}>
                              {submissionResult.verdict}
                            </span>
                          </div>

                          {/* Testcase Result Chips */}
                          <div className="space-y-2">
                            {(submissionResult.testResults || []).map(tr => (
                              <div
                                key={tr.testCaseIndex}
                                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={\`w-2 h-2 rounded-full \${tr.passed ? 'bg-emerald-500' : 'bg-rose-500'}\`}></span>
                                  <span className="font-bold text-slate-800">
                                    Test Case #{tr.testCaseIndex} {tr.isHidden && '(Hidden Edge Case)'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-[11px] font-mono text-slate-500">{tr.executionTimeMs}ms</span>
                                  <span className={\`px-2 py-0.5 rounded text-[11px] font-black \${tr.passed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                    }\`}>
                                    {tr.passed ? 'Passed' : (tr.timedOut ? 'TLE' : 'Failed')}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-400">
                          Click <strong>"Submit Solution"</strong> to run your algorithm against all public and hidden test cases.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 11. AI-POWERED RESUME VS. JOB DESCRIPTION (JD) MATCHER COMPONENT
    // =========================================================================
    function ResumeJobMatcher({ onBack, currentUser }) {
      const [roleId, setRoleId] = useState('sde-graduate');
      const [customJD, setCustomJD] = useState('');
      const [useCustomJD, setUseCustomJD] = useState(false);
      const [resumeText, setResumeText] = useState('');
      const [analysis, setAnalysis] = useState(null);
      const [loading, setLoading] = useState(false);
      const [pdfLoading, setPdfLoading] = useState(false);

      const handleSampleResume = () => {
        setResumeText(\`Harsha Sri Reddy
Email: candidate@placement.edu | Phone: +91 9876543210 | GitHub: github.com/harshasri

EDUCATION
B.Tech in Computer Science and Engineering (2022 - 2026) | CGPA: 8.85 / 10.0

TECHNICAL SKILLS
Languages: Python, Java, C++, JavaScript, SQL
Core Competencies: Data Structures and Algorithms, Object-Oriented Programming (OOPs), DBMS, Operating Systems, Computer Networks
Frameworks & Tools: React, Node.js, Express, MongoDB, Git, GitHub, REST APIs, Postman

ACADEMIC PROJECTS
1. Hospital Patient Management Portal
- Engineered a full-stack portal managing medical appointments and records for 1,000+ active mock patients.
- Designed normalized relational database schemas in SQL and implemented JWT authentication reducing login latency by 25%.
- Built RESTful APIs using Node.js and Express; deployed frontend on Vercel with responsive TailwindCSS layout.

2. Algorithmic Pathfinding Visualizer
- Implemented Dijkstra and A* search algorithms in Python and JavaScript to visualize shortest path routing.
- Optimized graph traversal time complexity and handled obstacle grids with interactive UI.

ACHIEVEMENTS & CERTIFICATIONS
- Solved 250+ problems across LeetCode and GeeksforGeeks in Data Structures and Algorithms.
- Certified in Database Management Systems (NPTEL - Elite Silver).\`);
      };

      const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          setPdfLoading(true);
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfjs = window['pdfjs-dist/build/pdf'];
            if (pdfjs) {
              pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
              const pdf = await loadingTask.promise;
              let fullText = '';
              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\\n';
              }
              setResumeText(fullText.trim());
            } else {
              alert('PDF.js parser initializing. You can also paste your resume text directly below.');
            }
          } catch (err) {
            alert('Could not parse PDF text: ' + err.message + '. Please copy & paste the text directly into the box.');
          } finally {
            setPdfLoading(false);
          }
        } else {
          // Read plain text
          const reader = new FileReader();
          reader.onload = (event) => {
            setResumeText(event.target.result);
          };
          reader.readAsText(file);
        }
      };

      const handleAnalyze = async () => {
        if (!resumeText || resumeText.trim().length < 50) {
          alert('Please enter or upload at least 50 characters of resume content to analyze.');
          return;
        }

        setLoading(true);
        try {
          const res = await fetch('/api/resume/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              resumeText,
              roleId,
              customJobDescription: useCustomJD ? customJD : ''
            })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setAnalysis(data);
        } catch (err) {
          alert('Error analyzing resume: ' + err.message);
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="space-y-6 font-sans animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <button onClick={onBack} className="hover:text-indigo-600 transition cursor-pointer">Home</button>
                <span>/</span>
                <span className="text-slate-900 font-extrabold">Resume vs. JD Matcher</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>📄</span> AI-Powered Resume vs. Job Description Matcher
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Optimize your CV before campus hiring drives with ATS keyword gap analysis, impact verb audits, and compatibility rating.
              </p>
            </div>

            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            >
              ← Back to Home
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Input Form (Col 1-6) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                  <span>📝</span> Candidate Resume Input
                </h3>
                <button
                  onClick={handleSampleResume}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  ⚡ Load Sample SDE Resume
                </button>
              </div>

              {/* Upload Zone */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-center space-y-2 transition">
                <span className="text-3xl block">📎</span>
                <div className="text-xs font-bold text-slate-700">
                  {pdfLoading ? 'Extracting text from PDF...' : 'Upload PDF or TXT Resume'}
                </div>
                <p className="text-[11px] text-slate-400">
                  Text will be parsed automatically inside your browser.
                </p>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              {/* Direct Paste Textarea */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-extrabold text-slate-700">Resume Content (Editable):</label>
                  <span className="text-slate-400 text-[11px]">{resumeText.length} characters</span>
                </div>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={8}
                  placeholder="Paste your complete resume text here (Education, Skills, Projects, Achievements)..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>

              {/* Job Target Selection */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">Target Role / Job Description:</label>
                  <button
                    onClick={() => setUseCustomJD(!useCustomJD)}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    {useCustomJD ? 'Use Preset Campus Roles' : 'Paste Custom JD Instead'}
                  </button>
                </div>

                {!useCustomJD ? (
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-extrabold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="sde-graduate">Software Development Engineer (Graduate / Entry-Level)</option>
                    <option value="fullstack-web">Full-Stack Web Developer (MERN / Java Spring)</option>
                    <option value="data-analyst">Data Analyst / Associate BI Engineer</option>
                    <option value="cloud-devops">Cloud &amp; Infrastructure Associate</option>
                  </select>
                ) : (
                  <textarea
                    value={customJD}
                    onChange={(e) => setCustomJD(e.target.value)}
                    rows={4}
                    placeholder="Paste job description keywords, technical stack requirements, or JD description..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>🔍 Run AI ATS Gap Analysis</span>
                )}
              </button>
            </div>

            {/* Right: ATS Diagnostic Report (Col 7-12) */}
            <div className="lg:col-span-6 space-y-4">
              {analysis ? (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 animate-fade-in">
                  {/* Big Score Card */}
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                        {analysis.roleTitle}
                      </span>
                      <h4 className="text-lg font-black mt-2">ATS Compatibility Rating</h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Evaluated against {analysis.targetCompanies.join(', ')} standards.
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-4xl font-black font-mono text-emerald-400">
                        {analysis.overallScore}%
                      </div>
                      <span className={\`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md inline-block mt-1 border \${analysis.ratingColor}\`}>
                        {analysis.atsRating}
                      </span>
                    </div>
                  </div>

                  {/* Keyword Gap Matrix */}
                  <div className="space-y-3">
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <span>🏷️</span> Keyword Gap Analysis Matrix:
                    </h4>

                    {/* Matched Keywords */}
                    <div>
                      <span className="text-[11px] font-bold text-emerald-700 block mb-1.5">
                        ✓ Matched Skills in Your Resume ({analysis.matchedKeywords.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.matchedKeywords.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-extrabold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Keywords */}
                    {analysis.missingKeywords.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-rose-700 block mb-1.5">
                          ⚠️ Missing High-Priority Keywords ({analysis.missingKeywords.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.missingKeywords.map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-xs font-extrabold bg-rose-50 text-rose-800 px-2.5 py-1 rounded-lg border border-rose-200"
                            >
                              + {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Impact Verbs & Section Structure */}
                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] font-bold">Action Verbs Found</span>
                      <span className="text-lg font-black font-mono text-slate-800">
                        {analysis.matchedVerbsCount}
                      </span>
                      <span className="text-[10px] text-slate-500 block">STAR Action Words</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] font-bold">Quantified Impact</span>
                      <span className={\`text-lg font-black font-mono \${analysis.hasQuantifiedImpact ? 'text-emerald-600' : 'text-amber-600'}\`}>
                        {analysis.hasQuantifiedImpact ? 'DETECTED' : 'LOW'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Metrics &amp; percentages</span>
                    </div>
                  </div>

                  {/* Actionable Recommendations */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                      🎯 Targeted Enhancements for 90%+ ATS Score:
                    </h4>
                    {analysis.suggestions.map((s, idx) => (
                      <div key={idx} className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-slate-800 space-y-0.5">
                        <strong className="text-indigo-800 block">{s.title}</strong>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{s.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mx-auto">
                    📄
                  </div>
                  <h4 className="font-black text-slate-800 text-base">No Analysis Performed Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Upload your resume or click <strong>"Load Sample SDE Resume"</strong> on the left, select your target job role, and click <strong>"Run AI ATS Gap Analysis"</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 12. AI MOCK HR & TECHNICAL INTERVIEW SIMULATOR COMPONENT
    // =========================================================================
    function MockInterviewSimulator({ onBack, currentUser }) {
      const [questions, setQuestions] = useState([]);
      const [selectedCategory, setSelectedCategory] = useState('all');
      const [currentIndex, setCurrentIndex] = useState(0);
      const [candidateAnswer, setCandidateAnswer] = useState('');
      const [isRecording, setIsRecording] = useState(false);
      const [evaluation, setEvaluation] = useState(null);
      const [loadingEval, setLoadingEval] = useState(false);
      const [showModelAnswer, setShowModelAnswer] = useState(false);
      const recognitionRef = useRef(null);

      useEffect(() => {
        fetch('/api/interview/questions')
          .then(r => r.json())
          .then(data => {
            if (data.questions) setQuestions(data.questions);
          })
          .catch(err => console.error(err));
      }, []);

      const filteredQuestions = selectedCategory === 'all'
        ? questions
        : questions.filter(q => q.category.toLowerCase().includes(selectedCategory.toLowerCase()));

      const activeQ = filteredQuestions[currentIndex] || questions[0];

      // Web Speech API Voice Recognition setup
      const toggleVoiceRecording = () => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
          alert('Speech Recognition API is not supported in this browser. You can type your answer directly in the text box.');
          return;
        }

        if (isRecording) {
          if (recognitionRef.current) recognitionRef.current.stop();
          setIsRecording(false);
        } else {
          try {
            const recog = new SpeechRec();
            recog.continuous = true;
            recog.interimResults = true;
            recog.lang = 'en-US';

            recog.onresult = (event) => {
              let transcript = '';
              for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
              }
              setCandidateAnswer(prev => prev + (prev ? ' ' : '') + transcript);
            };

            recog.onerror = (e) => {
              console.warn('Speech Recognition error:', e.error);
              setIsRecording(false);
            };

            recog.onend = () => {
              setIsRecording(false);
            };

            recog.start();
            recognitionRef.current = recog;
            setIsRecording(true);
          } catch (err) {
            alert('Microphone initialization error: ' + err.message);
          }
        }
      };

      const handleEvaluateAnswer = async () => {
        if (!activeQ || !candidateAnswer || candidateAnswer.trim().length < 20) {
          alert('Please speak or type a response of at least 20 words.');
          return;
        }

        setLoadingEval(true);
        setEvaluation(null);
        try {
          const res = await fetch('/api/interview/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionId: activeQ.id,
              candidateAnswer
            })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setEvaluation(data);
        } catch (err) {
          alert('Evaluation error: ' + err.message);
        } finally {
          setLoadingEval(false);
        }
      };

      return (
        <div className="space-y-6 font-sans animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <button onClick={onBack} className="hover:text-indigo-600 transition cursor-pointer">Home</button>
                <span>/</span>
                <span className="text-slate-900 font-extrabold">AI Mock Interview Simulator</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>🎙️</span> AI Mock HR &amp; Technical Interview Simulator
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Simulate one-on-one recruiter interview rounds with speech-to-text transcription, STAR evaluation, and ideal model answers.
              </p>
            </div>

            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            >
              ← Back to Home
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setSelectedCategory('all'); setCurrentIndex(0); }}
              className={\`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer \${selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }\`}
            >
              All Tracks ({questions.length})
            </button>
            <button
              onClick={() => { setSelectedCategory('HR'); setCurrentIndex(0); }}
              className={\`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer \${selectedCategory === 'HR'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }\`}
            >
              👔 HR &amp; Behavioral
            </button>
            <button
              onClick={() => { setSelectedCategory('Technical'); setCurrentIndex(0); }}
              className={\`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer \${selectedCategory === 'Technical'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }\`}
            >
              💻 Technical (Core CS)
            </button>
          </div>

          {/* Main Interview Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Question & Voice Input Panel (Col 1-7) */}
            <div className="lg:col-span-7 space-y-4">
              {activeQ ? (
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-black uppercase text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                      {activeQ.category} • {activeQ.companyTag}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Question {currentIndex + 1} of {filteredQuestions.length}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900 leading-snug">
                      "{activeQ.question}"
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 italic">
                      Context: {activeQ.context}
                    </p>
                  </div>

                  {/* Speech Recognition Box */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-extrabold text-slate-800">Your Spoken / Written Response:</label>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {candidateAnswer.split(/\s+/).filter(Boolean).length} Words
                      </span>
                    </div>

                    <div className="relative">
                      <textarea
                        value={candidateAnswer}
                        onChange={(e) => setCandidateAnswer(e.target.value)}
                        rows={7}
                        placeholder="Click the microphone below to speak your response, or type your answer directly..."
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans leading-relaxed"
                      />
                      {isRecording && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-rose-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-white"></span>
                          <span>RECORDING &amp; TRANSCRIBING</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      onClick={toggleVoiceRecording}
                      className={\`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer \${isRecording
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md'
                        : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                        }\`}
                    >
                      <span>{isRecording ? '⏹️' : '🎙️'}</span>
                      <span>{isRecording ? 'Stop Recording' : 'Start Speaking Answer'}</span>
                    </button>

                    <button
                      onClick={handleEvaluateAnswer}
                      disabled={loadingEval}
                      className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {loadingEval ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span>🤖</span>
                      )}
                      <span>Evaluate Answer</span>
                    </button>
                  </div>

                  {/* Next / Prev Navigation */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => {
                        setCurrentIndex(p => Math.max(0, p - 1));
                        setCandidateAnswer('');
                        setEvaluation(null);
                      }}
                      disabled={currentIndex === 0}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold disabled:opacity-40 cursor-pointer"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => {
                        setCurrentIndex(p => Math.min(filteredQuestions.length - 1, p + 1));
                        setCandidateAnswer('');
                        setEvaluation(null);
                      }}
                      disabled={currentIndex === filteredQuestions.length - 1}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Next Question →
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Evaluation & Model STAR Answer (Col 8-12) */}
            <div className="lg:col-span-5 space-y-4">
              {evaluation ? (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-black text-slate-800 text-sm">Response Evaluation</h4>
                    <span className={\`text-xs font-black px-2.5 py-0.5 rounded-md \${evaluation.tierColor}\`}>
                      {evaluation.performanceTier}
                    </span>
                  </div>

                  {/* Score Gauge */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold">Overall Interview Score</span>
                      <div className="text-3xl font-black font-mono text-purple-700 mt-0.5">
                        {evaluation.totalScore}%
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold text-right">
                      {evaluation.wordCount} Words • {evaluation.matchedKeywords.length} Concepts Matched
                    </span>
                  </div>

                  {/* Feedback Bullets */}
                  <div className="space-y-1.5">
                    <strong className="text-xs font-black text-slate-800 block">AI Recruiter Feedback:</strong>
                    {evaluation.feedback.map((f, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                        {f}
                      </div>
                    ))}
                  </div>

                  {/* Model Answer Drawer Toggle */}
                  <div className="pt-2">
                    <button
                      onClick={() => setShowModelAnswer(!showModelAnswer)}
                      className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-extrabold text-xs transition border border-purple-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🌟</span>
                      <span>{showModelAnswer ? 'Hide Ideal STAR Model Answer' : 'View Ideal STAR Model Answer'}</span>
                    </button>
                  </div>

                  {showModelAnswer && evaluation.modelAnswerSTAR && (
                    <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs space-y-3 animate-fade-in">
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                        Ideal STAR-Method Benchmark Response:
                      </span>

                      <div>
                        <strong className="text-indigo-300 block mb-0.5">📍 Situation:</strong>
                        <p className="text-slate-300 leading-relaxed">{evaluation.modelAnswerSTAR.situation}</p>
                      </div>

                      <div>
                        <strong className="text-sky-300 block mb-0.5">🎯 Task:</strong>
                        <p className="text-slate-300 leading-relaxed">{evaluation.modelAnswerSTAR.task}</p>
                      </div>

                      <div>
                        <strong className="text-emerald-300 block mb-0.5">⚡ Action:</strong>
                        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{evaluation.modelAnswerSTAR.action}</p>
                      </div>

                      <div>
                        <strong className="text-amber-300 block mb-0.5">🏆 Result:</strong>
                        <p className="text-slate-300 leading-relaxed">{evaluation.modelAnswerSTAR.result}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
                  <span className="text-4xl block">🎙️</span>
                  <h4 className="font-black text-slate-800 text-sm">Oral Interview Stage</h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                    Speak your answer aloud into the microphone. Our AI engine evaluates response structure, vocabulary keywords, and STAR method compliance.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 13. INTERACTIVE FORMULA SHEETS & ACTIVE-RECALL FLASHCARDS COMPONENT
    // =========================================================================
    function FormulaCheatSheets({ onBack, currentUser }) {
      const [sheets, setSheets] = useState([]);
      const [flashcards, setFlashcards] = useState([]);
      const [activeMode, setActiveMode] = useState('sheets'); // 'sheets' | 'flashcards'
      const [searchQuery, setSearchQuery] = useState('');
      const [cardIndex, setCardIndex] = useState(0);
      const [isFlipped, setIsFlipped] = useState(false);
      const [masteredCards, setMasteredCards] = useState({});
      const [toastMsg, setToastMsg] = useState('');

      const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 2500);
      };

      useEffect(() => {
        fetch('/api/study-aids/formula-sheets')
          .then(r => r.json())
          .then(d => { if (d.sheets) setSheets(d.sheets); })
          .catch(err => console.error(err));

        fetch('/api/study-aids/flashcards')
          .then(r => r.json())
          .then(d => { if (d.flashcards) setFlashcards(d.flashcards); })
          .catch(err => console.error(err));
      }, []);

      const filteredSheets = sheets.filter(s => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return s.topicName.toLowerCase().includes(q) ||
          s.formulas.some(f => f.name.toLowerCase().includes(q) || f.formula.toLowerCase().includes(q));
      });

      const currentCard = flashcards[cardIndex] || flashcards[0];

      return (
        <div className="space-y-6 font-sans animate-fade-in">
          {toastMsg && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold border border-slate-700 animate-fade-in flex items-center gap-2">
              <span>🔔</span>
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <button onClick={onBack} className="hover:text-indigo-600 transition cursor-pointer">Home</button>
                <span>/</span>
                <span className="text-slate-900 font-extrabold">Formula Sheets &amp; Flashcards</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>⚡</span> Interactive Formula Sheets &amp; Active Recall Flashcards
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Quick-revision memory aids, speed math shortcuts, and active recall study widgets right before your campus test.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                ← Back to Home
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveMode('sheets')}
              className={\`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer \${activeMode === 'sheets'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }\`}
            >
              <span>📑</span>
              <span>Topic Formula Drawers ({sheets.length})</span>
            </button>
            <button
              onClick={() => setActiveMode('flashcards')}
              className={\`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer \${activeMode === 'flashcards'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }\`}
            >
              <span>🃏</span>
              <span>Active Recall Flashcards ({flashcards.length})</span>
            </button>
          </div>

          {/* MODE 1: Topic Formula Drawers */}
          {activeMode === 'sheets' && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Search formulas (e.g. Relative speed, LCM, ACID)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                />
                <span className="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSheets.map((sheet) => (
                  <div key={sheet.topicId} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 bg-amber-50 rounded-2xl border border-amber-200">
                          {sheet.icon}
                        </span>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            {sheet.category}
                          </span>
                          <h3 className="text-base font-black text-slate-900 mt-1">{sheet.topicName}</h3>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        {sheet.formulas.length} Formulas
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium">{sheet.summary}</p>

                    <div className="space-y-3 pt-2">
                      {sheet.formulas.map((f, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900">{f.name}</strong>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(f.formula);
                                showToast('Copied: ' + f.formula);
                              }}
                              className="text-[10px] font-extrabold text-amber-700 hover:underline cursor-pointer"
                            >
                              📋 Copy
                            </button>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-indigo-700 font-bold">
                            {f.formula}
                          </div>
                          <p className="text-[11px] text-slate-500 italic">
                            💡 Shortcut: {f.shortcut}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODE 2: Active Recall Flashcards */}
          {activeMode === 'flashcards' && currentCard && (
            <div className="max-w-xl mx-auto space-y-6 pt-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-black uppercase text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  {currentCard.category} • {currentCard.tag}
                </span>
                <p className="text-xs text-slate-500 mt-2">
                  Card {cardIndex + 1} of {flashcards.length} • Mastered: {Object.keys(masteredCards).length}
                </p>
              </div>

              {/* 3D Flip Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[260px] bg-white rounded-3xl p-8 border-2 border-amber-300 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between text-center select-none transform hover:-translate-y-1"
              >
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  {isFlipped ? '💡 Answer & Explanation (Click to flip)' : '❓ Question (Click to flip)'}
                </div>

                <div className="py-6">
                  {!isFlipped ? (
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      {currentCard.front}
                    </h3>
                  ) : (
                    <div className="text-xs md:text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-line text-left bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                      {currentCard.back}
                    </div>
                  )}
                </div>

                <span className="text-[11px] text-amber-600 font-bold">
                  {isFlipped ? 'Click card to show prompt' : 'Click anywhere on card to reveal answer →'}
                </span>
              </div>

              {/* Flashcard Action Buttons */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setCardIndex(p => Math.max(0, p - 1));
                  }}
                  disabled={cardIndex === 0}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-40 cursor-pointer hover:bg-slate-50"
                >
                  ← Previous
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setMasteredCards(prev => ({ ...prev, [currentCard.id]: true }));
                      showToast('Marked as Mastered!');
                      setIsFlipped(false);
                      setCardIndex(p => Math.min(flashcards.length - 1, p + 1));
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                  >
                    ✓ Mastered
                  </button>
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setCardIndex(p => Math.min(flashcards.length - 1, p + 1));
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs transition cursor-pointer"
                  >
                    Review Later →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // =========================================================================
    // 14. MULTI-USER COLLEGE LEADERBOARD & EXPORTABLE PDF REPORT COMPONENT
    // =========================================================================
    function CampusLeaderboard({ onBack, currentUser }) {
      const [leaderboard, setLeaderboard] = useState([]);
      const [candidateRank, setCandidateRank] = useState(null);
      const [batchStats, setBatchStats] = useState(null);
      const [loading, setLoading] = useState(true);
      const [showReportCardModal, setShowReportCardModal] = useState(false);
      const [reportCardData, setReportCardData] = useState(null);

      useEffect(() => {
        const userId = currentUser ? currentUser.id : '';
        fetch(\`/api/leaderboard?userId=\${userId}\`)
          .then(r => r.json())
          .then(data => {
            if (data.leaderboard) setLeaderboard(data.leaderboard);
            if (data.candidateRankInfo) setCandidateRank(data.candidateRankInfo);
            if (data.batchStats) setBatchStats(data.batchStats);
          })
          .catch(err => console.error(err))
          .finally(() => setLoading(false));

        fetch('/api/leaderboard/report-card')
          .then(r => r.json())
          .then(data => setReportCardData(data))
          .catch(err => console.error(err));
      }, [currentUser]);

      return (
        <div className="space-y-8 font-sans animate-fade-in">
          {/* Printable Official Report Card Modal */}
          {showReportCardModal && reportCardData && (
            <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl p-6 md:p-10 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-6 my-8">
                {/* Official Institutional Header */}
                <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                      {reportCardData.accreditation}
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900">
                      {reportCardData.institution}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verified Placement Readiness &amp; Mock Diagnostic Report
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">{reportCardData.issuedDate}</span>
                    <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      VERIFIED
                    </span>
                  </div>
                </div>

                {/* Candidate Info Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">Candidate Name</span>
                    <strong className="text-slate-900 text-sm">{currentUser?.fullName || reportCardData.candidate.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">Student Roll / ID</span>
                    <strong className="text-slate-900 text-sm font-mono">{reportCardData.candidate.studentId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">Degree &amp; Branch</span>
                    <span className="text-slate-700">{reportCardData.candidate.degree}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">Graduation Cohort</span>
                    <span className="text-slate-700">{reportCardData.candidate.batch}</span>
                  </div>
                </div>

                {/* Key Status & Benchmark */}
                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-indigo-950">Campus Employability Index:</span>
                    <span className="font-black text-indigo-700 text-sm">{reportCardData.performanceMetrics.overallPlacementReadiness}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-indigo-950">Peer Group Standing:</span>
                    <span className="font-bold text-emerald-700">{reportCardData.performanceMetrics.percentileRank}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-indigo-950">TCS NQT Benchmark:</span>
                    <span className="font-bold text-slate-800">{reportCardData.performanceMetrics.tcsNqtStatus}</span>
                  </div>
                </div>

                {/* Sectional Performance Table */}
                <div className="space-y-2">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                    Assessed Sectional Breakdown:
                  </h4>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                      <tr>
                        <th className="p-2.5">Recruitment Section</th>
                        <th className="p-2.5">Score %</th>
                        <th className="p-2.5 text-right">Proficiency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportCardData.sectionalScores.map((sec, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-800">{sec.section}</td>
                          <td className="p-2.5 font-mono text-indigo-700 font-bold">{sec.score}</td>
                          <td className="p-2.5 text-right">
                            <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded text-[10px]">
                              {sec.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Verification Footer */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">Verification Hash: {reportCardData.verifiedHash}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🖨️</span>
                      <span>Print / Save PDF</span>
                    </button>
                    <button
                      onClick={() => setShowReportCardModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <button onClick={onBack} className="hover:text-indigo-600 transition cursor-pointer">Home</button>
                <span>/</span>
                <span className="text-slate-900 font-extrabold">Campus Leaderboard</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>🏆</span> Multi-User College Leaderboard &amp; Batch Analytics
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time cohort ranking, peer percentiles, and verified official placement report card generation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReportCardModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>📄</span>
                <span>Export PDF Report Card</span>
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Candidate Benchmark Hero Banner */}
          {candidateRank && (
            <div className="relative overflow-hidden bg-gradient-to-r from-rose-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-rose-500/30">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black uppercase tracking-wider bg-white/20 text-yellow-300 px-3 py-1 rounded-full">
                      🌟 Peer Cohort Standing
                    </span>
                    <span className="text-xs font-extrabold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-md">
                      {candidateRank.targetCompanyBadge}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black mt-1">
                    {candidateRank.percentileMessage}
                  </h3>
                  <p className="text-slate-300 text-xs md:text-sm mt-1">
                    Current Campus Rank: <strong>#{candidateRank.rank}</strong> out of {candidateRank.totalStudents} active placement aspirants.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
                    <span className="text-xs text-rose-200 block font-semibold">Your Rank</span>
                    <span className="text-3xl font-black text-white font-mono mt-0.5 block">#{candidateRank.rank}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/10">
                    <span className="text-xs text-rose-200 block font-semibold">Top Percentile</span>
                    <span className="text-3xl font-black text-amber-300 font-mono mt-0.5 block">Top {candidateRank.topPercentile}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Batch Analytics Cards */}
          {batchStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-bold block">Batch Enrolled</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{batchStats.totalEnrolled} Students</span>
                <span className="text-[11px] text-slate-500 font-semibold">2026 Campus Drive</span>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-bold block">Batch Avg Accuracy</span>
                <span className="text-2xl font-black text-indigo-600 font-mono mt-1 block">{batchStats.batchAverageAccuracy}%</span>
                <span className="text-[11px] text-slate-500 font-semibold">Across All Mocks</span>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-bold block">Highest Accuracy</span>
                <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">{batchStats.batchHighestScore}%</span>
                <span className="text-[11px] text-slate-500 font-semibold">Campus Benchmark</span>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-bold block">Questions Solved</span>
                <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">{batchStats.totalQuestionsSolvedCollege}</span>
                <span className="text-[11px] text-slate-500 font-semibold">Total Campus Practice</span>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-black text-slate-900 text-base">Campus Leaderboard Rankings</h4>
                <p className="text-xs text-slate-500">Live sorting based on accuracy, completed recruiter mocks, and streak days.</p>
              </div>
              <span className="text-xs font-bold text-slate-400">Top 20 Cohort</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Rank</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Branch / Cohort</th>
                    <th className="p-4">Accuracy %</th>
                    <th className="p-4">Mocks Completed</th>
                    <th className="p-4">Streak</th>
                    <th className="p-4 text-right">Badge Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {leaderboard.map((item) => {
                    const isCandidate = item.isCurrentCandidate || (currentUser && item.fullName.includes(currentUser.fullName));

                    return (
                      <tr key={item.userId} className={\`transition \${isCandidate ? 'bg-indigo-50/70 font-bold' : 'hover:bg-slate-50/70'}\`}>
                        <td className="p-4 font-mono font-black text-slate-900">
                          {item.rank === 1 ? '🥇 #1' : item.rank === 2 ? '🥈 #2' : item.rank === 3 ? '🥉 #3' : \`#\${item.rank}\`}
                        </td>
                        <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                            {item.fullName[0]}
                          </div>
                          <span>{item.fullName}</span>
                          {isCandidate && (
                            <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full ml-1">
                              YOU
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600">
                          {item.branch}
                        </td>
                        <td className="p-4 font-mono font-black text-indigo-700">
                          {item.averageAccuracy}%
                        </td>
                        <td className="p-4 text-slate-700 font-mono">
                          {item.mocksCompleted} Mocks
                        </td>
                        <td className="p-4 text-slate-700 font-mono">
                          🔥 {item.streakDays}d
                        </td>
                        <td className="p-4 text-right">
                          <span className={\`text-[11px] font-black px-2.5 py-0.5 rounded-lg border \${item.tierColor}\`}>
                            {item.tier}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }
`;

html = html.replace(targetStr, newComponentsCode + '\n' + targetStr);
fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ Successfully injected 5 new components into index.html');
