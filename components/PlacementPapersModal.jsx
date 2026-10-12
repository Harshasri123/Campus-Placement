import React, { useState, useEffect } from 'react';

export default function PlacementPapersModal({ isOpen, onClose, onSelectPaper }) {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/placement/placement-papers')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load placement papers');
        return res.json();
      })
      .then((data) => {
        setPapers(data.papers || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching papers:', err);
        // Fallback demo papers if offline
        setPapers([
          {
            id: 'mock-tcs-1',
            company_name: 'TCS NQT',
            paper_title: 'TCS NQT Cognitive Practice Test 1',
            duration_minutes: 45,
            total_marks: 30,
            pass_marks: 15,
            total_questions: 10,
            instructions: 'Contains Quantitative Aptitude, Logical Reasoning, and Verbal Ability.'
          },
          {
            id: 'mock-infosys-1',
            company_name: 'Infosys',
            paper_title: 'Infosys Springboard Assessment Model Paper',
            duration_minutes: 50,
            total_marks: 40,
            pass_marks: 20,
            total_questions: 10,
            instructions: 'Covers Mathematical Thinking, Reasoning Ability, and Verbal English.'
          },
          {
            id: 'mock-cognizant-1',
            company_name: 'Cognizant',
            paper_title: 'Cognizant GenC Analytical & Technical Test',
            duration_minutes: 40,
            total_marks: 30,
            pass_marks: 18,
            total_questions: 10,
            instructions: 'Covers Quants, Code Analysis, and Logical Problem Solving.'
          },
          {
            id: 'mock-wipro-1',
            company_name: 'Wipro',
            paper_title: 'Wipro Elite National Talent Hunt (NTH) Paper',
            duration_minutes: 45,
            total_marks: 30,
            pass_marks: 16,
            total_questions: 10,
            instructions: 'Aptitude, Logical Reasoning, and Foundational Programming concepts.'
          },
          {
            id: 'mock-accenture-1',
            company_name: 'Accenture',
            paper_title: 'Accenture Cognitive & Technical Assessment 2026',
            duration_minutes: 60,
            total_marks: 50,
            pass_marks: 25,
            total_questions: 10,
            instructions: 'Critical Thinking, Abstract Reasoning, and Technical fundamentals.'
          }
        ]);
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              Placement Mock Tests
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">Company Placement Papers</h3>
            <p className="text-sm text-slate-500">Practice with official test patterns from top hiring companies.</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Papers List */}
        <div className="overflow-y-auto my-4 space-y-4 pr-1">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-slate-500 font-semibold">Loading Placement Papers...</p>
            </div>
          ) : papers.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No mock papers available at this time.</p>
          ) : (
            papers.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-md">
                      {p.company_name}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      ⏱️ {p.duration_minutes} Mins • 🎯 {p.total_questions || 10} Questions
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base">{p.paper_title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.instructions}</p>
                </div>

                <button
                  onClick={() => onSelectPaper(p)}
                  className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-sm hover:shadow whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <span>🚀</span> Start Test
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
