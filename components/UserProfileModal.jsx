import React, { useState, useEffect } from 'react';

export default function UserProfileModal({ isOpen, onClose, user, onSignOut }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    const token = localStorage.getItem('placement_auth_token');

    fetch('/api/auth/me', {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.attempts) setHistory(data.attempts);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Could not load history:', err);
        setLoading(false);
      });
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-black text-xl flex items-center justify-center shadow-md">
              {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">{user.fullName}</h3>
              <p className="text-xs text-slate-500 font-medium">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto my-4 space-y-5 pr-1 flex-1">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs font-bold text-slate-500 uppercase block">Tests Taken</span>
              <span className="text-2xl font-black text-indigo-600">{history.length}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs font-bold text-slate-500 uppercase block">Average Score</span>
              <span className="text-2xl font-black text-emerald-600">
                {history.length > 0
                  ? Math.round(history.reduce((a, b) => a + (b.score / (b.total_questions || 1)) * 100, 0) / history.length) + '%'
                  : 'N/A'}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center col-span-2 sm:col-span-1">
              <span className="text-xs font-bold text-slate-500 uppercase block">Security Setup</span>
              <span className="text-xs font-bold text-slate-700 mt-1 inline-block bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                🛡️ 2 Questions Active
              </span>
            </div>
          </div>

          {/* Assessment History Table */}
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm mb-2">Recent Assessment Attempts</h4>
            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs">Loading history from PostgreSQL...</div>
            ) : history.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs font-medium">
                No assessments completed yet. Take today's daily challenge or a company mock paper!
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.map((att) => {
                  const pct = Math.round((att.score / (att.total_questions || 1)) * 100);
                  const weakCount = Array.isArray(att.weak_areas) ? att.weak_areas.length : 0;

                  return (
                    <div
                      key={att.id}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 flex items-center justify-between transition text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{att.category || 'Practice Assessment'}</span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded">
                            {att.test_type}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          {new Date(att.submitted_at).toLocaleDateString()} • Time: {Math.floor(att.time_taken_seconds / 60)}m {att.time_taken_seconds % 60}s
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`font-black text-sm block ${pct >= 60 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {att.score} / {att.total_questions} ({pct}%)
                        </span>
                        {weakCount > 0 && (
                          <span className="text-[10px] text-rose-600 font-bold">
                            ⚠️ {weakCount} Weak Area(s)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onSignOut();
              onClose();
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded-xl transition"
          >
            Sign Out
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
