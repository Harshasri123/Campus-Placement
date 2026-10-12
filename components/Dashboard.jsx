import React, { useState, useEffect } from 'react';

const TRACKS = [
  {
    title: 'Quantitative Aptitude',
    icon: '📊',
    color: 'from-blue-600 to-indigo-600',
    categoryKey: 'Aptitude',
    subCategories: ['Arithmetic', 'Data Interpretation']
  },
  {
    title: 'Verbal (English)',
    icon: '📖',
    color: 'from-emerald-600 to-teal-600',
    categoryKey: 'Verbal',
    subCategories: ['Verbal Ability', 'Verbal Test']
  },
  {
    title: 'Logical & Verbal Reasoning',
    icon: '🧩',
    color: 'from-purple-600 to-indigo-700',
    categoryKey: 'Reasoning',
    subCategories: ['Logical Reasoning', 'Verbal Reasoning', 'Non-Verbal Reasoning']
  },
  {
    title: 'Programming & Coding',
    icon: '💻',
    color: 'from-amber-500 to-orange-600',
    categoryKey: 'Programming',
    subCategories: ['Python Programming', 'C Programming', 'C++', 'C#', 'Java']
  },
  {
    title: 'Interview Preparation',
    icon: '👔',
    color: 'from-rose-500 to-pink-600',
    categoryKey: 'Interview',
    subCategories: ['HR Interview', 'Technical Interview', 'Group Discussion (GD)']
  },
  {
    title: 'Company Placement Papers',
    icon: '📑',
    color: 'from-cyan-600 to-blue-700',
    categoryKey: 'PlacementPaper',
    subCategories: ['TCS NQT', 'Infosys', 'Cognizant', 'Wipro', 'Accenture']
  }
];

export default function Dashboard({ onStartQuiz, onStartDailyQuiz, onOpenPlacementPapers }) {
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTracks = TRACKS.map(track => {
    if (!searchQuery.trim()) return track;
    const query = searchQuery.toLowerCase();
    const matchesTitle = track.title.toLowerCase().includes(query);
    const matchedSubs = track.subCategories.filter(s => s.toLowerCase().includes(query));
    if (matchesTitle || matchedSubs.length > 0) {
      return {
        ...track,
        subCategories: matchesTitle ? track.subCategories : matchedSubs
      };
    }
    return null;
  }).filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 font-sans">
      {/* Daily Challenge Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-700 rounded-3xl p-6 md:p-8 text-white mb-8 shadow-xl border border-indigo-400/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 backdrop-blur-md text-xs uppercase tracking-wider font-extrabold px-3 py-1 rounded-full border border-white/20 text-yellow-300 flex items-center gap-1">
              <span>⚡</span> Daily Practice Challenge
            </span>
            <span className="text-xs text-indigo-200">Refreshed Today</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Today's Campus Placement Challenge
          </h2>
          <p className="text-indigo-100 text-sm md:text-base mt-2 leading-relaxed">
            10 fresh questions curated daily across Quantitative Aptitude, Logical Reasoning, Verbal Ability &amp; Tech Coding with in-depth explanations.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-semibold text-indigo-200">
            <span className="flex items-center gap-1">⏱️ 10 Minutes</span>
            <span>•</span>
            <span className="flex items-center gap-1">🎯 10 Questions</span>
            <span>•</span>
            <span className="flex items-center gap-1">🛡️ Anti-Cheat Monitored</span>
          </div>
        </div>

        <div className="z-10 flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
          <button
            onClick={onStartDailyQuiz}
            className="w-full md:w-auto bg-white text-indigo-700 font-extrabold px-7 py-3.5 rounded-2xl hover:bg-yellow-300 hover:text-slate-900 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2"
          >
            <span>⚡</span> Start Daily Test
          </button>
          <button
            onClick={onOpenPlacementPapers}
            className="w-full md:w-auto bg-indigo-900/60 hover:bg-indigo-900 text-white font-bold px-6 py-3 rounded-2xl border border-indigo-400/40 transition text-center text-sm flex items-center justify-center gap-2"
          >
            <span>📑</span> Company Mock Papers
          </button>
        </div>

        {/* Decorative background glow circle */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Practice Tracks &amp; Syllabus</h3>
          <p className="text-sm text-slate-500 mt-0.5">Select a category or company paper to practice questions.</p>
        </div>
        
        {/* Topic search box */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search topics (e.g. Python, TCS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
          <span className="absolute left-3 top-3 text-slate-400 text-sm">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Categories Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTracks.map((track) => (
          <div
            key={track.title}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col justify-between group hover:border-indigo-300"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {track.icon}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                      {track.title}
                    </h4>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {track.categoryKey}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subcategories tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {track.subCategories.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => onStartQuiz(track, sub)}
                    className="text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-indigo-200 text-left"
                    title={`Practice ${sub}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
              {track.title === 'Company Placement Papers' ? (
                <button
                  onClick={onOpenPlacementPapers}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm hover:shadow flex items-center justify-center gap-2"
                >
                  <span>📑</span> View Placement Papers
                </button>
              ) : (
                <button
                  onClick={() => onStartQuiz(track)}
                  className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm hover:shadow flex items-center justify-center gap-2 group-hover:bg-indigo-600"
                >
                  <span>🚀</span> Start Practice
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
