import React, { useState } from 'react';

export default function TestInstructions({ 
  user,
  testTitle = "National Qualifier Model Assessment",
  totalQuestions = 30,
  durationMinutes = 45,
  totalMarks = 60,
  passPercentage = 60,
  onStartAssessment,
  onBack
}) {
  const [confirmedGuidelines, setConfirmedGuidelines] = useState(false);
  const [errorPrompt, setErrorPrompt] = useState('');

  const handleLaunch = () => {
    if (!confirmedGuidelines) {
      setErrorPrompt('Please read and accept the assessment guidelines before starting.');
      return;
    }
    setErrorPrompt('');
    onStartAssessment();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 font-sans animate-fade-in">
      {/* Top Banner / Welcome */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 mb-6 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black tracking-wider uppercase text-blue-400 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-800/60">
              Live Assessment Portal
            </span>
            <span className="text-xs text-slate-400 font-semibold">Campus Recruitment 2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">{testTitle}</h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">
            Candidate: <span className="text-white font-bold">{user?.fullName || "Registered Candidate"}</span> | {user?.email || "candidate@portal.com"}
          </p>
        </div>
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl px-6 py-4 text-center min-w-[160px] shadow-inner">
          <span className="text-xs text-slate-400 block uppercase tracking-wider font-extrabold">Allocated Time</span>
          <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">{durationMinutes} Mins</span>
        </div>
      </div>

      {/* Test Specifications Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Questions</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{totalQuestions}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Maximum Marks</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{totalMarks}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Negative Marking</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">None (0)</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Cut-Off Criteria</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{passPercentage}%</p>
        </div>
      </div>

      {/* Assessment Guidelines & Instructions Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs mb-6">
        <h2 className="text-lg font-black text-slate-900 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2.5">
          <span className="text-xl">📋</span> General Instructions &amp; Examination Guidelines
        </h2>

        <div className="space-y-5 text-sm text-slate-700 leading-relaxed">
          <section>
            <h3 className="font-bold text-slate-900 mb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-xs flex items-center justify-center font-black">1</span>
              Assessment Duration &amp; Auto-Submission
            </h3>
            <p className="text-slate-600 pl-7">
              The test timer begins the moment you click <strong>"Launch Timed Assessment"</strong>. The countdown clock at the top right cannot be paused. When the timer reaches <code className="bg-slate-100 text-rose-600 font-bold px-1.5 py-0.5 rounded font-mono">00:00</code>, your answers will submit automatically.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 mb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-xs flex items-center justify-center font-black">2</span>
              Proctoring &amp; Anti-Cheating Protocol
            </h3>
            <ul className="list-disc pl-12 space-y-1.5 text-slate-600">
              <li>The test operates in <strong>mandatory full-screen mode</strong>.</li>
              <li>Switching tabs, minimizing the browser, or opening secondary windows is strictly monitored.</li>
              <li>A maximum of <strong>3 violation strikes</strong> are allowed. On the 3rd infraction, the assessment will terminate and submit your partial responses immediately with a cheater flag.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 mb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-xs flex items-center justify-center font-black">3</span>
              Question Palette &amp; Navigation
            </h3>
            <p className="text-slate-600 pl-7 mb-2.5">
              Use the question palette on the right to navigate between problems:
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold pl-7">
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-500"></span> Answered</span>
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-amber-400"></span> Flagged for Review</span>
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-slate-200 border"></span> Unanswered</span>
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded ring-2 ring-indigo-600 bg-white"></span> Current Question</span>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 mb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-xs flex items-center justify-center font-black">4</span>
              Scoring &amp; Diagnostic Feedback Report
            </h3>
            <p className="text-slate-600 pl-7">
              Upon submission, you will receive an in-depth diagnostic breakdown highlighting your overall percentage, cut-off qualification status, sub-topic weakness tags (&lt; 50% score), and step-by-step solutions.
            </p>
          </section>
        </div>

        {/* Declaration Checkbox */}
        <div className="mt-8 pt-5 border-t border-slate-100">
          <label className="flex items-start gap-3 cursor-pointer select-none bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition">
            <input 
              type="checkbox" 
              checked={confirmedGuidelines} 
              onChange={(e) => {
                setConfirmedGuidelines(e.target.checked);
                if (e.target.checked) setErrorPrompt('');
              }}
              className="mt-1 h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" 
            />
            <span className="text-xs md:text-sm font-semibold text-slate-800 leading-snug">
              I have read, understood, and agree to abide by all the examination rules, duration constraints, and anti-cheating regulations outlined above.
            </span>
          </label>
        </div>

        {errorPrompt && (
          <div className="mt-3.5 p-3.5 bg-rose-50 text-rose-700 text-xs rounded-xl font-bold border border-rose-200 flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorPrompt}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {onBack ? (
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
          >
            ← Select Different Paper
          </button>
        ) : <div />}

        <button
          onClick={handleLaunch}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm text-white transition shadow-md flex items-center justify-center gap-2 ${
            confirmedGuidelines 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5' 
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>🚀 Launch Timed Assessment</span>
        </button>
      </div>
    </div>
  );
}
