import React, { useState, useEffect, useRef, useCallback } from 'react';

const SECURITY_QUESTIONS_LIST = [
  "What is your primary school name?",
  "What city were you born in?",
  "What is your mother's middle name?",
  "What was the name of your first pet?",
  "What is your favorite book or movie?"
];

// =========================================================================
// 1. STRICT AUTHENTICATION GATE (SIGN IN, REGISTER, FORGOT PASSWORD)
// =========================================================================
export function AuthGate({ onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form States (Strictly EMPTY - no pre-filled or demo credentials)
  const [formData, setFormData] = useState({
    fullName: '',
    emailOrMobile: '',
    password: '',
    confirmPassword: '',
    securityQuestion1: SECURITY_QUESTIONS_LIST[0],
    securityAnswer1: '',
    securityQuestion2: SECURITY_QUESTIONS_LIST[1],
    securityAnswer2: ''
  });

  // Forgot Password State Wizard
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [challengeQuestions, setChallengeQuestions] = useState([]);
  const [challengeAnswers, setChallengeAnswers] = useState({ answer1: '', answer2: '' });
  const [resetToken, setResetToken] = useState('');
  const [newPasswordData, setNewPasswordData] = useState({ newPassword: '', confirmPassword: '' });

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        email: formData.emailOrMobile,
        emailOrMobile: formData.emailOrMobile,
        securityQ1: formData.securityQuestion1,
        securityQuestion1: formData.securityQuestion1,
        securityA1: formData.securityAnswer1 || 'school',
        securityAnswer1: formData.securityAnswer1 || 'school',
        securityQ2: formData.securityQuestion2,
        securityQuestion2: formData.securityQuestion2,
        securityA2: formData.securityAnswer2 || 'city',
        securityAnswer2: formData.securityAnswer2 || 'city'
      };
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      localStorage.setItem('portal_auth_token', data.token);
      localStorage.setItem('portal_user_profile', JSON.stringify(data.user));
      onAuthSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.emailOrMobile,
          emailOrMobile: formData.emailOrMobile,
          identifier: formData.emailOrMobile,
          password: formData.password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('portal_auth_token', data.token);
      localStorage.setItem('portal_user_profile', JSON.stringify(data.user));
      onAuthSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep1 = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrMobile: forgotIdentifier })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Account not found');

      setChallengeQuestions(data.questions);
      setForgotStep(2);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep2 = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrMobile: forgotIdentifier,
          answer1: challengeAnswers.answer1,
          answer2: challengeAnswers.answer2
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      setResetToken(data.resetToken);
      setForgotStep(3);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep3 = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (newPasswordData.newPassword !== newPasswordData.confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          newPassword: newPasswordData.newPassword,
          confirmPassword: newPasswordData.confirmPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');

      setSuccessMsg('Password reset successful! Please sign in with your new password.');
      setAuthMode('login');
      setForgotStep(1);
      setForgotIdentifier('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-800/10 overflow-hidden animate-fade-in font-sans">
        {/* Top Branding Banner */}
        <div className="bg-slate-900 text-white p-7 text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-3xl mx-auto shadow-lg mb-3">
            🎯
          </div>
          <h1 className="text-xl font-black tracking-tight">Campus Placement Portal</h1>
          <p className="text-xs text-indigo-300 font-medium mt-1">General Aptitude &amp; Competitive Exam Engine</p>
          <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-extrabold bg-indigo-500/20 text-indigo-300 px-3 py-0.5 rounded-full border border-indigo-400/30">
            🔒 Strict Authentication Required
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        {authMode !== 'forgot' && (
          <div className="flex border-b border-slate-100 bg-slate-50/80">
            <button
              onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-3.5 text-xs font-black transition border-b-2 ${
                authMode === 'login'
                  ? 'border-indigo-600 text-indigo-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Candidate Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-3.5 text-xs font-black transition border-b-2 ${
                authMode === 'register'
                  ? 'border-indigo-600 text-indigo-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              New Registration
            </button>
          </div>
        )}

        <div className="p-7">
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address or Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. name@gmail.com or 9876543210"
                  value={formData.emailOrMobile}
                  onChange={(e) => setFormData({ ...formData, emailOrMobile: e.target.value })}
                  required
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition transform active:scale-98 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>🚀 Sign In to Practice Portal</span>
                )}
              </button>
            </form>
          )}

          {/* 2. REGISTRATION FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Candidate Full Name
                </label>
                <input
                  type="text"
                  placeholder="Your official name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Email (Gmail) or 10-Digit Mobile
                </label>
                <input
                  type="text"
                  placeholder="student@gmail.com or 9876543210"
                  value={formData.emailOrMobile}
                  onChange={(e) => setFormData({ ...formData, emailOrMobile: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Min 6 chars"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Security Questions Setup (Optional with defaults) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="block text-xs font-black text-indigo-900">
                    🛡️ Recovery Security Questions
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Optional
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="relative">
                      <select
                        value={formData.securityQuestion1}
                        onChange={(e) => setFormData({ ...formData, securityQuestion1: e.target.value })}
                        className="w-full px-3 py-2 pr-7 bg-slate-100 border border-slate-200 rounded-xl font-medium focus:outline-none cursor-pointer appearance-none text-slate-800"
                      >
                        {SECURITY_QUESTIONS_LIST.map((q, idx) => (
                          <option key={idx} value={q}>{q}</option>
                        ))}
                      </select>
                      <span className="absolute right-2.5 top-2.5 pointer-events-none text-slate-500 text-[10px]">▼</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Your answer (optional - default: school)"
                      value={formData.securityAnswer1}
                      onChange={(e) => setFormData({ ...formData, securityAnswer1: e.target.value })}
                      className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="relative">
                      <select
                        value={formData.securityQuestion2}
                        onChange={(e) => setFormData({ ...formData, securityQuestion2: e.target.value })}
                        className="w-full px-3 py-2 pr-7 bg-slate-100 border border-slate-200 rounded-xl font-medium focus:outline-none cursor-pointer appearance-none text-slate-800"
                      >
                        {SECURITY_QUESTIONS_LIST.slice(1).map((q, idx) => (
                          <option key={idx} value={q}>{q}</option>
                        ))}
                      </select>
                      <span className="absolute right-2.5 top-2.5 pointer-events-none text-slate-500 text-[10px]">▼</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Your answer (optional - default: city)"
                      value={formData.securityAnswer2}
                      onChange={(e) => setFormData({ ...formData, securityAnswer2: e.target.value })}
                      className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>🚀 Register &amp; Open Questions Portal →</span>
                )}
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD FLOW */}
          {authMode === 'forgot' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-extrabold text-sm text-slate-800">Self-Contained Password Recovery</h3>
                <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Step {forgotStep} of 3
                </span>
              </div>

              {forgotStep === 1 && (
                <form onSubmit={handleForgotStep1} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Registered Email or Mobile Number
                    </label>
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="Enter your registered email or phone"
                      required
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                      className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-2/3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
                    >
                      {loading ? 'Checking...' : 'Next: Answer Questions →'}
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleForgotStep2} className="space-y-3.5">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        1. {challengeQuestions[0]}
                      </label>
                      <input
                        type="text"
                        placeholder="Your answer"
                        value={challengeAnswers.answer1}
                        onChange={(e) => setChallengeAnswers({ ...challengeAnswers, answer1: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        2. {challengeQuestions[1]}
                      </label>
                      <input
                        type="text"
                        placeholder="Your answer"
                        value={challengeAnswers.answer2}
                        onChange={(e) => setChallengeAnswers({ ...challengeAnswers, answer2: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-2/3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
                    >
                      {loading ? 'Verifying...' : 'Verify Answers →'}
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleForgotStep3} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPasswordData.newPassword}
                      onChange={(e) => setNewPasswordData({ ...newPasswordData, newPassword: e.target.value })}
                      placeholder="Min 6 characters"
                      required
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={newPasswordData.confirmPassword}
                      onChange={(e) => setNewPasswordData({ ...newPasswordData, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      required
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
                  >
                    {loading ? 'Updating...' : 'Save New Password & Sign In'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 2. MAIN APP COMPONENT
// =========================================================================
export default function App() {
  // User Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Routing / Views: 'home' | 'topic_folder' | 'bookmarks'
  const [currentView, setCurrentView] = useState('home');
  const [selectedTopicSlug, setSelectedTopicSlug] = useState(null);

  // Section Data State
  const [sectionsData, setSectionsData] = useState({
    'Arithmetic Aptitude': [],
    'Data Interpretation': [],
    'Verbal Ability': []
  });
  const [activeSectionFilter, setActiveSectionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ totalTopics: 36, completedQuestions: 0, bookmarkedCount: 0 });

  // Session Verification
  useEffect(() => {
    const token = localStorage.getItem('portal_auth_token');
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
          if (data.stats) {
            setStats(prev => ({
              ...prev,
              bookmarkedCount: data.stats.bookmarkedCount || 0
            }));
          }
        }
      })
      .catch(() => {
        localStorage.removeItem('portal_auth_token');
        localStorage.removeItem('portal_user_profile');
        setCurrentUser(null);
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  // Load Topics
  const loadTopics = useCallback(() => {
    const token = localStorage.getItem('portal_auth_token');
    fetch('/api/topics', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.sections) {
          setSectionsData(data.sections);
          let completed = 0;
          Object.values(data.sections).forEach(topicList => {
            topicList.forEach(t => {
              completed += (t.completed_questions_count || 0);
            });
          });
          setStats(prev => ({
            ...prev,
            totalTopics: data.totalTopics || 36,
            completedQuestions: completed
          }));
        }
      })
      .catch(err => console.warn('Topics load warning:', err));
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadTopics();
    }
  }, [currentUser, loadTopics]);

  const handleSignOut = () => {
    localStorage.removeItem('portal_auth_token');
    localStorage.removeItem('portal_user_profile');
    setCurrentUser(null);
    setCurrentView('home');
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // STRICT AUTHENTICATION GATE: Block until signed in
  if (!currentUser) {
    return <AuthGate onAuthSuccess={(user) => { setCurrentUser(user); loadTopics(); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Brand */}
          <div 
            onClick={() => { setCurrentView('home'); setSelectedTopicSlug(null); }}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base md:text-lg text-slate-900 tracking-tight">
                  Campus Placement &amp; Competitive Exam Portal
                </h1>
                <span className="hidden sm:inline-block text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  2026 Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Standardized Recurring Question Banks • 100 Qs per Folder</p>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setCurrentView('home'); setSelectedTopicSlug(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                currentView === 'home' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              General Aptitude
            </button>

            <button
              onClick={() => setCurrentView('bookmarks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentView === 'bookmarks' ? 'bg-amber-50 text-amber-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>🔖</span>
              <span>Bookmarks</span>
            </button>

            {/* Candidate Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left text-xs">
                <span className="font-extrabold text-slate-800 block leading-tight">{currentUser.fullName}</span>
                <span className="text-[10px] text-slate-400 font-medium">{currentUser.emailOrMobile}</span>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition text-xs font-bold"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {/* VIEW 1: HOME PAGE (TOPICS GRID) */}
        {currentView === 'home' && (
          <div className="space-y-8 animate-fade-in">
            {/* Dynamic Welcome Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-800">
              <div className="relative z-10 max-w-3xl">
                <span className="text-xs uppercase font-extrabold tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-400/30">
                  Standardized Preparation Engine
                </span>
                <h2 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">
                  Welcome back, {currentUser.fullName}!
                </h2>
                <p className="text-slate-300 text-xs md:text-sm mt-1.5 leading-relaxed">
                  Choose a practice topic below to begin preparing. Every sub-topic folder is populated with a curated bank of <strong>100 top recurring questions</strong>, complete with step-by-step mathematical calculations and shortcut formulas.
                </p>

                {/* Stats Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
                    <span className="text-xs text-indigo-200 block font-semibold">Total Practice Folders</span>
                    <span className="text-2xl font-black text-white font-mono mt-0.5 block">{stats.totalTopics}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
                    <span className="text-xs text-indigo-200 block font-semibold">Curated Question Bank</span>
                    <span className="text-2xl font-black text-amber-300 font-mono mt-0.5 block">3,600+</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
                    <span className="text-xs text-indigo-200 block font-semibold">Questions Practiced</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">{stats.completedQuestions}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
                    <span className="text-xs text-indigo-200 block font-semibold">Bookmarked Tricky Qs</span>
                    <span className="text-2xl font-black text-blue-300 font-mono mt-0.5 block">{stats.bookmarkedCount}</span>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {/* Section Navigation & Search Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>📁</span> General Aptitude
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select any sub-topic folder to launch Practice Mode (untimed with immediate solutions) or Timed Test Mode.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search 36 topics (e.g. Trains, Cloze)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setActiveSectionFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeSectionFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All (36)
                  </button>
                  <button
                    onClick={() => setActiveSectionFilter('Arithmetic Aptitude')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeSectionFilter === 'Arithmetic Aptitude' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Arithmetic (11)
                  </button>
                  <button
                    onClick={() => setActiveSectionFilter('Data Interpretation')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeSectionFilter === 'Data Interpretation' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    DI (5)
                  </button>
                  <button
                    onClick={() => setActiveSectionFilter('Verbal Ability')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeSectionFilter === 'Verbal Ability' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Verbal (20)
                  </button>
                </div>
              </div>
            </div>

            {/* Section Folders Loop */}
            {Object.entries(sectionsData).map(([sectionName, topics]) => {
              if (activeSectionFilter !== 'all' && activeSectionFilter !== sectionName) return null;

              const filtered = topics.filter(t => 
                !searchQuery.trim() || 
                t.topic_name.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (filtered.length === 0) return null;

              let sectionBadgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
              let sectionIcon = '📊';
              if (sectionName.includes('Data Interpretation')) {
                sectionBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                sectionIcon = '🥧';
              } else if (sectionName.includes('Verbal')) {
                sectionBadgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
                sectionIcon = '📖';
              }

              return (
                <div key={sectionName} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{sectionIcon}</span>
                      <h4 className="text-lg font-black text-slate-900">{sectionName}</h4>
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${sectionBadgeColor}`}>
                        {filtered.length} Sub-Topic Folders
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(t => {
                      const pct = Math.min(100, Math.round(((t.completed_questions_count || 0) / 100) * 100));

                      return (
                        <div
                          key={t.slug}
                          onClick={() => {
                            setSelectedTopicSlug(t.slug);
                            setCurrentView('topic_folder');
                          }}
                          className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-2xl flex items-center justify-center group-hover:scale-110 transition transform">
                                {t.icon || '📁'}
                              </div>
                              <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                                100 Top Qs
                              </span>
                            </div>

                            <h5 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition leading-snug">
                              {t.topic_name}
                            </h5>
                            <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                              {t.section_name}
                            </span>
                          </div>

                          <div className="mt-5 pt-3 border-t border-slate-100">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                              <span>Progress</span>
                              <span>{t.completed_questions_count || 0} / 100 Qs</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: TOPIC FOLDER (PRACTICE & ASSESSMENT ARENA) */}
        {currentView === 'topic_folder' && selectedTopicSlug && (
          <TopicArena
            slug={selectedTopicSlug}
            onBack={() => {
              setCurrentView('home');
              loadTopics();
            }}
            onBookmarkUpdated={() => {
              loadTopics();
            }}
          />
        )}

        {/* VIEW 3: BOOKMARKS VAULT */}
        {currentView === 'bookmarks' && (
          <BookmarksVault 
            onBack={() => {
              setCurrentView('home');
              loadTopics();
            }}
            onOpenTopic={(slug) => {
              setSelectedTopicSlug(slug);
              setCurrentView('topic_folder');
            }}
          />
        )}
      </main>
    </div>
  );
}

// =========================================================================
// 3. PROCTORING HELPERS & PRE-FLIGHT HARDWARE VERIFICATION GATE
// =========================================================================
export function createVirtualProctorStream() {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  let y = 0;
  let dir = 1.5;

  function renderFrame() {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tech grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let py = 0; py < canvas.height; py += 20) {
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(canvas.width, py);
      ctx.stroke();
    }

    // Candidate Silhouette
    ctx.strokeStyle = '#6366f1';
    ctx.fillStyle = '#1e1b4b';
    ctx.lineWidth = 2;
    // Head
    ctx.beginPath();
    ctx.arc(160, 95, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Shoulders
    ctx.beginPath();
    ctx.arc(160, 225, 75, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Biometric Face Tracking Box
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(110, 50, 100, 95);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(108, 48, 8, 3);
    ctx.fillRect(108, 48, 3, 8);
    ctx.fillRect(204, 48, 8, 3);
    ctx.fillRect(209, 48, 3, 8);
    ctx.fillRect(108, 142, 8, 3);
    ctx.fillRect(108, 137, 3, 8);
    ctx.fillRect(204, 142, 8, 3);
    ctx.fillRect(209, 137, 3, 8);

    // Horizontal laser scanning line
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    y += dir;
    if (y > canvas.height || y < 0) dir *= -1;

    // Overlay text
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText('LIVE AI PROCTOR • STREAM ACTIVE', 12, 22);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText('FACE DETECTED • 30 FPS • 720p', 12, 36);

    requestAnimationFrame(renderFrame);
  }
  renderFrame();
  return canvas.captureStream(30);
}

// Automated Pre-Flight Security Checklist Modal
export function PreFlightModal({ topicName, durationMinutes, questionCount, onCancel, onProceed }) {
  const [cameraStatus, setCameraStatus] = useState('checking'); // 'checking' | 'granted' | 'denied'
  const [errorMessage, setErrorMessage] = useState('');
  const [stream, setStream] = useState(null);
  const [acknowledgedRules, setAcknowledgedRules] = useState(false);
  const [simulatedMode, setSimulatedMode] = useState(false);
  const previewVideoRef = useRef(null);

  const requestRealCamera = async () => {
    setCameraStatus('checking');
    setErrorMessage('');
    setSimulatedMode(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam hardware API is not accessible in this environment.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false
      });
      setStream(mediaStream);
      setCameraStatus('granted');
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Webcam permission error:', err);
      setCameraStatus('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was blocked by your browser. Please click the camera or lock icon in your address bar, allow camera access, and click "Retry Permission Check".');
      } else {
        setErrorMessage(err.message || 'No video device found or camera access failed.');
      }
    }
  };

  const handleUseSimulation = () => {
    const simStream = createVirtualProctorStream();
    setStream(simStream);
    setSimulatedMode(true);
    setCameraStatus('granted');
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = simStream;
    }
  };

  useEffect(() => {
    requestRealCamera();
  }, []);

  const handleStartProctoredAssessment = async () => {
    if (!acknowledgedRules) {
      alert('Please review and check the Proctoring Integrity Acknowledgment before proceeding.');
      return;
    }
    if (cameraStatus !== 'granted' || !stream) {
      alert('Camera verification is mandatory before launching the proctored arena.');
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request fallback:', e);
    }

    onProceed(stream);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-xl">
              🛡️
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">Timed Test Arena Pre-Flight Check</h3>
              <p className="text-xs text-indigo-300">Automated Hardware &amp; Anti-Cheating Verification</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-xs font-bold"
          >
            ✕ Cancel
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {/* Target Test Meta */}
          <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block font-semibold">Assessment Track:</span>
              <span className="font-extrabold text-white text-sm">{topicName} Proctored Arena</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block font-semibold">Parameters:</span>
              <span className="font-bold text-amber-300 font-mono">{questionCount} Qs • {durationMinutes} Mins</span>
            </div>
          </div>

          {/* Step 1: Webcam Hardware Gate */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>📷</span> 1. Hardware Check &amp; Live WebCam
              </span>
              {cameraStatus === 'checking' && (
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Requesting...
                </span>
              )}
              {cameraStatus === 'granted' && (
                <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  ✓ {simulatedMode ? 'Virtual Cam Connected' : 'Camera Feed Active'}
                </span>
              )}
              {cameraStatus === 'denied' && (
                <span className="text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
                  ✕ Access Blocked
                </span>
              )}
            </div>

            {cameraStatus === 'granted' ? (
              <div className="relative w-48 h-36 mx-auto rounded-xl overflow-hidden border-2 border-indigo-500 shadow-lg mt-3 bg-black">
                <video
                  ref={previewVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-black text-rose-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> PREVIEW OK
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-rose-300 leading-relaxed font-medium bg-rose-950/40 p-3 rounded-xl border border-rose-800/40">
                  ⚠️ {errorMessage || 'Browser camera permissions are required to proctor this timed competitive examination.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={requestRealCamera}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    🔄 Retry Camera Permission
                  </button>
                  <button
                    onClick={handleUseSimulation}
                    className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-indigo-200 font-bold text-xs border border-slate-600 transition"
                    title="Simulate a proctoring webcam stream if physical hardware camera is unavailable"
                  >
                    🛡️ Use Simulated Proctor Camera (Test Mode)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Fullscreen & Anti-Cheating Guidelines */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2.5 text-xs text-slate-300">
            <span className="font-black uppercase tracking-wider text-slate-200 block mb-1">
              🖥️ 2. Mandatory Fullscreen &amp; 3-Strike System
            </span>
            <ul className="space-y-1.5 text-slate-400 text-[11px] list-disc pl-4 leading-relaxed">
              <li><strong>Fullscreen Lock:</strong> Native fullscreen is enforced. Exiting fullscreen freezes the test and counts as 1 strike.</li>
              <li><strong>Tab Switches &amp; Window Blur:</strong> Navigating away from this tab or minimizing the window triggers an automatic violation.</li>
              <li><strong>3-Strike Rule:</strong> Violations 1 &amp; 2 display a mandatory warning. Strike 3 triggers <strong>immediate disqualification and auto-submission</strong>.</li>
              <li><strong>Clipboard &amp; Shortcuts:</strong> Right-click, Copy/Paste, DevTools (F12, Inspect), and text selection are disabled.</li>
            </ul>

            <label className="flex items-start gap-2.5 pt-2 border-t border-slate-700/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledgedRules}
                onChange={(e) => setAcknowledgedRules(e.target.checked)}
                className="mt-0.5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-900 cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-200">
                I acknowledge that I am in a quiet environment, consent to continuous webcam monitoring, and accept the 3-strike integrity policy.
              </span>
            </label>
          </div>
        </div>

        {/* Launch Action */}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onCancel}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            Exit to Modules
          </button>
          <button
            onClick={handleStartProctoredAssessment}
            disabled={cameraStatus !== 'granted' || !acknowledgedRules}
            className={`px-6 py-3 rounded-xl font-black text-xs shadow-lg transition flex items-center gap-2 ${
              cameraStatus === 'granted' && acknowledgedRules
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white cursor-pointer transform active:scale-98'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <span>🔒 Enable Fullscreen &amp; Enter Arena →</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 4. TOPIC ARENA: PRACTICE MODE (UNTIMED) & PROCTORED TIMED TEST ARENA
// =========================================================================
export function TopicArena({ slug, onBack, onBookmarkUpdated }) {
  const [topicInfo, setTopicInfo] = useState(null);
  const [mode, setMode] = useState('practice');
  const [loading, setLoading] = useState(true);

  // Practice Mode State
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [openExplanations, setOpenExplanations] = useState({});

  // Timed Test Mode State
  const [testSetup, setTestSetup] = useState({ questionCount: 20, durationMinutes: 30 });
  const [showPreFlightModal, setShowPreFlightModal] = useState(false);
  const [activeMediaStream, setActiveMediaStream] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [timedQuestions, setTimedQuestions] = useState([]);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testResults, setTestResults] = useState(null);

  // Load Topic Questions
  const fetchQuestions = useCallback(async (targetMode = 'practice', targetPage = 1, targetCount = 20) => {
    setLoading(true);
    const token = localStorage.getItem('portal_auth_token');

    try {
      const url = `/api/topics/${slug}/questions?mode=${targetMode}&page=${targetPage}&limit=${targetCount}`;
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();

      if (data.topic) setTopicInfo(data.topic);

      if (targetMode === 'practice') {
        setPracticeQuestions(data.questions || []);
        setTotalPages(data.totalPages || 5);
      } else {
        setTimedQuestions(data.questions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchQuestions('practice', page, 10);
  }, [fetchQuestions, page]);

  // Handle Option Click in Practice Mode
  const handleSelectPracticeOption = async (qId, optionIdx, correctOpt) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    setOpenExplanations(prev => ({ ...prev, [qId]: true }));

    const token = localStorage.getItem('portal_auth_token');
    if (token) {
      fetch(`/api/topics/${slug}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ completedCount: 1 })
      }).catch(() => {});
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = async (q) => {
    const token = localStorage.getItem('portal_auth_token');
    if (!token) return;

    try {
      const res = await fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          questionId: q.id,
          questionText: q.question_text,
          topicSlug: slug,
          options: q.options,
          correctOption: q.correct_option,
          explanation: q.explanation
        })
      });
      const data = await res.json();
      setPracticeQuestions(prev => prev.map(item => 
        item.id === q.id ? { ...item, is_bookmarked: data.isBookmarked } : item
      ));
      if (onBookmarkUpdated) onBookmarkUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  // Initiate Timed Test (Opens Pre-Flight Checklist)
  const handleInitiateTimedArena = async () => {
    await fetchQuestions('timed', 1, testSetup.questionCount);
    setShowPreFlightModal(true);
  };

  // Pre-Flight passed callback
  const handlePreFlightPassed = (stream) => {
    setActiveMediaStream(stream);
    setShowPreFlightModal(false);
    setTestStarted(true);
    setTestSubmitted(false);
    setTestResults(null);
  };

  // Handle Submit Timed Test to /api/assessment/submit
  const handleSubmitTimedTest = async ({ answers, timeTakenSeconds, integrityReport }) => {
    const token = localStorage.getItem('portal_auth_token');
    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topicSlug: slug,
          testId: slug,
          userAnswers: answers,
          timeTakenSeconds,
          questionsList: timedQuestions,
          integrityReport
        })
      });
      const data = await res.json();
      setTestResults(data);
      setTestSubmitted(true);
      setTestStarted(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <button onClick={onBack} className="hover:text-indigo-600 transition">
            General Aptitude
          </button>
          <span>/</span>
          <span className="text-slate-700">{topicInfo?.section_name || 'Section'}</span>
          <span>/</span>
          <span className="text-indigo-600 font-extrabold">{topicInfo?.topic_name || 'Topic'}</span>
        </div>

        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition shadow-xs flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Back to All Folders</span>
        </button>
      </div>

      {/* Folder Header Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-3xl flex items-center justify-center shadow-xs">
            {topicInfo?.icon || '📁'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {topicInfo?.section_name}
              </span>
              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                ⭐ 100 Recurring Questions
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">{topicInfo?.topic_name}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              High-frequency campus placement test bank with shortcut formulas and explanations.
            </p>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 w-full md:w-auto">
          <button
            onClick={() => { setMode('practice'); setTestStarted(false); setShowPreFlightModal(false); }}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
              mode === 'practice'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📖</span>
            <span>Practice Mode (Untimed)</span>
          </button>
          <button
            onClick={() => { setMode('timed'); setTestStarted(false); }}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
              mode === 'timed'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>⏱️</span>
            <span>Timed Test Arena (Proctored)</span>
          </button>
        </div>
      </div>

      {/* MODE 1: PRACTICE MODE (UNTIMED WITH STEP-BY-STEP SOLUTIONS) */}
      {mode === 'practice' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-bold text-slate-500">Loading Practice Questions...</p>
            </div>
          ) : (
            <>
              <div className="space-y-5">
                {practiceQuestions.map((q, idx) => {
                  const userChoice = selectedAnswers[q.id];
                  const isAnswered = userChoice !== undefined;
                  const isAccordionOpen = openExplanations[q.id];

                  return (
                    <div
                      key={q.id}
                      className="bg-white rounded-3xl border border-slate-200 p-6 md:p-7 shadow-xs hover:border-indigo-200 transition"
                    >
                      {/* Top Question Meta */}
                      <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                            Question {((page - 1) * 10) + idx + 1} of 100
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            🔥 Top Recurring
                          </span>
                        </div>

                        <button
                          onClick={() => handleToggleBookmark(q)}
                          className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            q.is_bookmarked
                              ? 'bg-amber-100 text-amber-800'
                              : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100'
                          }`}
                          title={q.is_bookmarked ? 'Bookmarked for revision' : 'Bookmark this question'}
                        >
                          <span>{q.is_bookmarked ? '★' : '☆'}</span>
                          <span className="hidden sm:inline">{q.is_bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                        </button>
                      </div>

                      {/* Question Text */}
                      <p className="text-base font-extrabold text-slate-900 leading-relaxed mb-5 whitespace-pre-line">
                        {q.question_text}
                      </p>

                      {/* 4 Multiple Choice Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userChoice === optIdx;
                          const isCorrectOpt = q.correct_option === optIdx;

                          let btnClasses = 'bg-slate-50 border-slate-200 hover:border-indigo-300 text-slate-800';
                          if (isAnswered) {
                            if (isCorrectOpt) {
                              btnClasses = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                            } else if (isSelected && !isCorrectOpt) {
                              btnClasses = 'bg-rose-50 border-rose-500 text-rose-900 font-bold';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectPracticeOption(q.id, optIdx, q.correct_option)}
                              className={`p-4 rounded-2xl border text-left text-xs md:text-sm font-semibold transition flex items-center justify-between gap-3 ${btnClasses}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-black text-xs flex items-center justify-center shadow-2xs">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isAnswered && isCorrectOpt && (
                                <span className="text-emerald-600 font-black text-xs">✓ Correct</span>
                              )}
                              {isAnswered && isSelected && !isCorrectOpt && (
                                <span className="text-rose-600 font-black text-xs">✕ Your Choice</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* View Explanation / Formula Accordion */}
                      <div className="pt-3 border-t border-slate-100">
                        <button
                          onClick={() => setOpenExplanations(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                          className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition"
                        >
                          <span>{isAccordionOpen ? '▼ Hide Solution' : '▶ View Explanation / Shortcut Formula'}</span>
                        </button>

                        {isAccordionOpen && (
                          <div className="mt-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs text-slate-800 animate-fade-in leading-relaxed">
                            <strong className="text-indigo-950 font-black block mb-1">
                              💡 Step-by-Step Calculation &amp; Shortcut Formula:
                            </strong>
                            <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700">
                              {q.explanation}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Bar */}
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500">
                  Page {page} of {totalPages} (10 Qs per page)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                      page === 1
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    ← Previous 10 Qs
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                      page === totalPages
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-xs'
                    }`}
                  >
                    Next 10 Qs →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* MODE 2: TIMED TEST CONFIGURATION */}
      {mode === 'timed' && !testStarted && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 text-3xl flex items-center justify-center mx-auto mb-4">
            ⏱️
          </div>
          <h3 className="text-xl font-black text-slate-900">Configure Timed Test Arena</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Test yourself under realistic placement exam conditions with live webcam proctoring, countdown timer, interactive question palette, and strict anti-cheating audit.
          </p>

          <div className="grid grid-cols-2 gap-4 my-6 text-left">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Questions Count
              </label>
              <select
                value={testSetup.questionCount}
                onChange={(e) => setTestSetup({ ...testSetup, questionCount: parseInt(e.target.value, 10) })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
              >
                <option value={10}>10 Questions</option>
                <option value={20}>20 Questions</option>
                <option value={30}>30 Questions</option>
              </select>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Duration Limit
              </label>
              <select
                value={testSetup.durationMinutes}
                onChange={(e) => setTestSetup({ ...testSetup, durationMinutes: parseInt(e.target.value, 10) })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
              </select>
            </div>
          </div>

          <div className="mb-6 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-left text-xs text-indigo-950 space-y-1.5">
            <span className="font-extrabold flex items-center gap-1.5 text-indigo-900">
              <span>🛡️</span> Timed Test Arena Proctoring Protocol:
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Clicking below will initiate the <strong>Hardware Check &amp; Webcam Gate</strong>. The test runs in mandatory full-screen with continuous webcam picture-in-picture monitoring and a 3-strike tab switch detection engine.
            </p>
          </div>

          <button
            onClick={handleInitiateTimedArena}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🚀 Launch Timed Test Arena</span>
          </button>
        </div>
      )}

      {/* PRE-FLIGHT CHECKLIST MODAL */}
      {showPreFlightModal && (
        <PreFlightModal
          topicName={topicInfo?.topic_name || 'Quantitative Aptitude'}
          durationMinutes={testSetup.durationMinutes}
          questionCount={testSetup.questionCount}
          onCancel={() => setShowPreFlightModal(false)}
          onProceed={handlePreFlightPassed}
        />
      )}

      {/* ACTIVE PROCTORED TIMED TEST ARENA */}
      {mode === 'timed' && testStarted && !testSubmitted && (
        <TimedTestArena
          questions={timedQuestions}
          durationMinutes={testSetup.durationMinutes}
          topicName={topicInfo?.topic_name}
          topicSlug={slug}
          mediaStream={activeMediaStream}
          onSubmit={handleSubmitTimedTest}
          onCancel={() => {
            if (confirm('Cancel assessment and return to practice modules?')) {
              if (activeMediaStream) activeMediaStream.getTracks().forEach(t => t.stop());
              if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
              setTestStarted(false);
            }
          }}
        />
      )}

      {/* TIMED TEST RESULTS REPORT CARD */}
      {mode === 'timed' && testSubmitted && testResults && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6 animate-fade-in">
          {/* Disqualification or Success Alert */}
          {testResults.integrityStatus === 'DISQUALIFIED_CHEATING' ? (
            <div className="p-5 bg-rose-50 border-2 border-rose-300 rounded-3xl text-rose-900 flex items-start gap-4">
              <div className="text-3xl">🚨</div>
              <div>
                <h4 className="text-base font-black tracking-tight text-rose-800">
                  Candidate Disqualified: Proctored Test Policy Breached
                </h4>
                <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                  Your test was automatically force-submitted because the proctoring engine detected <strong>3 or more infractions</strong> (such as tab switches, window minimizations, or exiting mandatory fullscreen). Your final score has been recorded as <strong>0 / {testResults.totalQuestions}</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">✅</span>
                <div>
                  <span className="font-black text-xs text-emerald-800 block">Assessment Completed with Full Integrity</span>
                  <span className="text-[11px] text-emerald-700 font-medium">Candidate followed all proctoring guidelines and maintained full-screen test lock.</span>
                </div>
              </div>
              <span className="text-xs font-black bg-emerald-200/60 text-emerald-900 px-3 py-1 rounded-full">
                Verified Clean Attempt
              </span>
            </div>
          )}

          {/* Main Score & Parameters Summary */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                Assessment Performance Report
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{testResults.topicName} Timed Assessment</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Time Taken: {Math.floor(testResults.timeTakenSeconds / 60)}m {testResults.timeTakenSeconds % 60}s • Proctored Arena
              </p>
            </div>

            <div className="text-center md:text-right">
              <div className={`text-4xl font-black ${testResults.integrityStatus === 'DISQUALIFIED_CHEATING' ? 'text-rose-600' : 'text-indigo-600'}`}>
                {testResults.percentage}%
              </div>
              <span className="text-xs font-extrabold text-slate-500 uppercase">
                Score: {testResults.score} / {testResults.totalQuestions}
              </span>
            </div>
          </div>

          {/* Integrity Audit Summary Box */}
          {testResults.integrityReport && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <span className="font-extrabold text-slate-800 block mb-2 flex items-center gap-1.5">
                <span>🛡️</span> Proctoring &amp; Integrity Audit Trail:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold">Tab Switches</span>
                  <span className="text-sm font-black font-mono text-slate-800">
                    {testResults.integrityReport.tabSwitchCount || 0}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold">Fullscreen Exits</span>
                  <span className="text-sm font-black font-mono text-slate-800">
                    {testResults.integrityReport.fullscreenExitCount || 0}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold">Force Submitted</span>
                  <span className={`text-sm font-black font-mono ${testResults.integrityReport.forcedAutoSubmit ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {testResults.integrityReport.forcedAutoSubmit ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold">Integrity Status</span>
                  <span className={`text-xs font-black uppercase ${testResults.integrityStatus === 'DISQUALIFIED_CHEATING' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {testResults.integrityStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Weak Areas Feedback */}
          {testResults.weakAreas?.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <h4 className="font-black flex items-center gap-1.5">
                <span>🎯</span> Diagnostic Skill Feedback:
              </h4>
              {testResults.weakAreas.map((w, idx) => (
                <p key={idx} className="text-amber-800">
                  • <strong>{w.topic}</strong>: {w.advice} (Result: {w.score})
                </p>
              ))}
            </div>
          )}

          {/* Questions Review */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-slate-900 text-base">Step-by-Step Question Review</h4>
            {testResults.review.map((item, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border ${
                  item.isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Question {idx + 1}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    item.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {item.isCorrect ? '✓ Correct' : '✕ Incorrect'}
                  </span>
                </div>
                <p className="font-bold text-slate-900 text-sm mb-3">{item.questionText}</p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                  <strong>💡 Solution:</strong> {item.explanation}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setMode('practice')}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Return to Practice Mode
            </button>
            <button
              onClick={handleInitiateTimedArena}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm"
            >
              ⚡ Retake Timed Arena
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 5. SECURE BROWSER-BASED PROCTORED TEST ARENA COMPONENT
// =========================================================================
export function TimedTestArena({ questions = [], durationMinutes = 30, topicName, topicSlug, mediaStream, onSubmit, onCancel }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [submitted, setSubmitted] = useState(false);

  // Proctoring Integrity States
  const [strikes, setStrikes] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [violationLogs, setViolationLogs] = useState([]);
  const [showStrikeWarningModal, setShowStrikeWarningModal] = useState(false);
  const [currentStrikeInfo, setCurrentStrikeInfo] = useState({ strike: 0, reason: '' });
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [cameraInterrupted, setCameraInterrupted] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isDisqualified, setIsDisqualified] = useState(false);

  const videoRef = useRef(null);
  const strikesRef = useRef(0);
  const submittedRef = useRef(false);
  const toastTimeoutRef = useRef(null);

  const currentQ = questions[currentIndex] || {};

  // Connect video stream
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(e => console.warn('Video autoPlay fallback:', e));
    }

    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setCameraInterrupted(true);
        };
      }
    }
  }, [mediaStream]);

  const showSecurityToast = (msg) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(''), 2500);
  };

  // Force submission on strike 3 or normal completion
  const handleExecuteSubmission = useCallback((forceDisqualified = false, customStrikes = null) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);

    const finalStrikes = customStrikes !== null ? customStrikes : strikesRef.current;
    const finalStatus = forceDisqualified || finalStrikes >= 3 ? 'DISQUALIFIED_CHEATING' : 'COMPLETED_NORMALLY';

    // Clean up stream tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
    }

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    onSubmit({
      answers,
      timeTakenSeconds: (durationMinutes * 60) - timeLeft,
      integrityReport: {
        tabSwitchCount,
        fullscreenExitCount,
        forcedAutoSubmit: forceDisqualified || finalStrikes >= 3,
        status: finalStatus,
        violationLogs
      }
    });
  }, [answers, durationMinutes, timeLeft, mediaStream, tabSwitchCount, fullscreenExitCount, violationLogs, onSubmit]);

  // Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0 && !submittedRef.current) {
      handleExecuteSubmission(false);
      return;
    }
    // If fullscreen exit modal or disqualification occurs, freeze timer
    if (showFullscreenModal || isDisqualified) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showFullscreenModal, isDisqualified, handleExecuteSubmission]);

  // Record an integrity violation
  const recordViolation = useCallback((type, reason) => {
    if (submittedRef.current) return;

    const nextStrikes = strikesRef.current + 1;
    strikesRef.current = nextStrikes;
    setStrikes(nextStrikes);

    const newLog = {
      type,
      reason,
      timestamp: new Date().toLocaleTimeString(),
      strikeNumber: nextStrikes
    };
    setViolationLogs(prev => [...prev, newLog]);

    if (nextStrikes >= 3) {
      setIsDisqualified(true);
      handleExecuteSubmission(true, nextStrikes);
    } else {
      setCurrentStrikeInfo({ strike: nextStrikes, reason });
      setShowStrikeWarningModal(true);
    }
  }, [handleExecuteSubmission]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !submittedRef.current) {
        setFullscreenExitCount(c => c + 1);
        recordViolation('FULLSCREEN_EXIT', 'Exited mandatory full-screen mode.');
        setShowFullscreenModal(true);
      } else if (document.fullscreenElement) {
        setShowFullscreenModal(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [recordViolation]);

  // Visibility & Tab Switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !submittedRef.current) {
        setTabSwitchCount(c => c + 1);
        recordViolation('TAB_SWITCH', 'Switched browser tab or minimized application window.');
      }
    };

    const handleBlur = () => {
      if (!submittedRef.current && !document.hidden && !showStrikeWarningModal && !showFullscreenModal) {
        setTabSwitchCount(c => c + 1);
        recordViolation('WINDOW_BLUR', 'Window focus lost to external application.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [recordViolation, showStrikeWarningModal, showFullscreenModal]);

  // Keyboard & Clipboard blockers
  useEffect(() => {
    const preventAction = (e) => {
      e.preventDefault();
      showSecurityToast('🔒 Action blocked: Clipboard operations are restricted in timed arena.');
    };

    const handleKeyDown = (e) => {
      // DevTools F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        showSecurityToast('🔒 DevTools shortcut (F12) blocked by proctoring engine.');
        return false;
      }
      // Ctrl+Shift+I / J / C
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) {
        e.preventDefault();
        showSecurityToast('🔒 Inspect element shortcut blocked by proctoring engine.');
        return false;
      }
      // Ctrl+U
      if (e.ctrlKey && ['u', 'U'].includes(e.key)) {
        e.preventDefault();
        showSecurityToast('🔒 View Source shortcut blocked by proctoring engine.');
        return false;
      }
      // Ctrl+C, Ctrl+V, Ctrl+A
      if (e.ctrlKey && ['c', 'v', 'a', 'C', 'V', 'A'].includes(e.key)) {
        e.preventDefault();
        showSecurityToast('🔒 Copy, Paste, and Select-All shortcuts disabled.');
        return false;
      }
    };

    window.addEventListener('contextmenu', preventAction);
    window.addEventListener('copy', preventAction);
    window.addEventListener('cut', preventAction);
    window.addEventListener('paste', preventAction);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', preventAction);
      window.removeEventListener('copy', preventAction);
      window.removeEventListener('cut', preventAction);
      window.removeEventListener('paste', preventAction);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Timer style threshold
  let timerBadgeStyle = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  if (timeLeft <= 60) {
    timerBadgeStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse font-black';
  } else if (timeLeft <= 300) {
    timerBadgeStyle = 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold';
  }

  // Strike Badge style
  let strikeBadgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let strikeLabel = 'Infractions: 0/3 (Clean)';
  if (strikes === 1) {
    strikeBadgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    strikeLabel = 'Infractions: 1/3 (Warning)';
  } else if (strikes === 2) {
    strikeBadgeStyle = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    strikeLabel = 'Infractions: 2/3 (Final Warning)';
  } else if (strikes >= 3) {
    strikeBadgeStyle = 'bg-rose-600/30 text-rose-200 border-rose-500';
    strikeLabel = 'Infractions: 3/3 (Disqualified)';
  }

  return (
    <div className="proctored-canvas min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none relative -m-4 md:-m-6 p-4 md:p-6">
      {/* Security Alert Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-rose-600/95 text-white px-5 py-2.5 rounded-2xl shadow-2xl text-xs font-black animate-fade-in border border-rose-400/50">
          {toastMessage}
        </div>
      )}

      {/* Fullscreen Exit Mandatory Freeze Overlay */}
      {showFullscreenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border-2 border-rose-500 rounded-3xl p-7 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500 text-rose-400 text-3xl flex items-center justify-center mx-auto">
              🖥️
            </div>
            <h3 className="text-xl font-black text-white">Fullscreen Mode Mandatory</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              You have exited full-screen mode. The examination timer is frozen. This incident has been logged towards your 3-strike integrity audit.
            </p>
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-xs font-mono text-amber-300">
              Current Infraction Count: {strikes} of 3 Strikes
            </div>
            <button
              onClick={async () => {
                try {
                  if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                  }
                  setShowFullscreenModal(false);
                } catch (e) {
                  setShowFullscreenModal(false);
                }
              }}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg transition"
            >
              🔒 Resume Fullscreen Assessment
            </button>
          </div>
        </div>
      )}

      {/* Strike 1 & 2 Warning Modal */}
      {showStrikeWarningModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500 rounded-3xl p-7 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500 text-amber-400 text-3xl flex items-center justify-center mx-auto">
              ⚠️
            </div>
            <h3 className="text-xl font-black text-white">Proctoring Policy Violation Detected!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Warning: <strong>{currentStrikeInfo.reason}</strong> detected!
            </p>
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-xs font-mono font-bold text-rose-400">
              Strike {currentStrikeInfo.strike} of 3. Repeated attempts will auto-submit your test.
            </div>
            <button
              onClick={() => setShowStrikeWarningModal(false)}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg transition"
            >
              I Acknowledge &amp; Return to Assessment
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-lg">
            🎯
          </div>
          <div>
            <h3 className="font-black text-sm md:text-base text-white tracking-tight">
              {topicName || 'Quantitative Aptitude'} Proctored Arena
            </h3>
            <span className="text-[10px] text-indigo-300 font-mono">Standardized Timed Assessment • Anti-Cheating Active</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time strike badge */}
          <div className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 ${strikeBadgeStyle}`}>
            <span>{strikeLabel}</span>
          </div>

          {/* Countdown timer with color thresholds */}
          <div className={`px-4 py-2 rounded-xl text-sm font-black font-mono border flex items-center gap-2 ${timerBadgeStyle}`}>
            <span>⏱️</span>
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Main Layout Grid (Canvas Left + Panel Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Center Canvas: Question Card (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col justify-between min-h-[500px]">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <span className="text-xs font-black uppercase text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
                  Question {currentIndex + 1} of {questions.length}
                </span>

                <button
                  onClick={() => setFlagged(f => ({ ...f, [currentIndex]: !f[currentIndex] }))}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                    flagged[currentIndex]
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span>🚩</span>
                  <span>{flagged[currentIndex] ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>
              </div>

              <p className="text-base md:text-lg font-bold text-white leading-relaxed mb-6 whitespace-pre-line">
                {currentQ.question_text}
              </p>

              {/* 4 Radio-card options */}
              <div className="space-y-3">
                {currentQ.options?.map((opt, optIdx) => {
                  const isSelected = answers[currentIndex] === optIdx;

                  return (
                    <div
                      key={optIdx}
                      onClick={() => setAnswers(a => ({ ...a, [currentIndex]: optIdx }))}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                          : 'bg-slate-850/60 bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 border border-slate-700 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className="text-xs md:text-sm font-semibold">{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-5 border-t border-slate-800">
              <button
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition border ${
                  currentIndex === 0
                    ? 'bg-slate-800 text-slate-600 border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                ← Previous
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const next = { ...answers };
                    delete next[currentIndex];
                    setAnswers(next);
                  }}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                >
                  Clear Response
                </button>

                <button
                  onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black transition border ${
                    currentIndex === questions.length - 1
                      ? 'bg-slate-800 text-slate-600 border-slate-800 cursor-not-allowed'
                      : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500 shadow-md'
                  }`}
                >
                  Next Question →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Live WebCam Feed + Question Status Palette (1 col) */}
        <div className="space-y-4">
          {/* Persistent Live Webcam PiP Overlay */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Live Proctor Feed
              </span>
              <div className="bg-rose-500/20 border border-rose-500/40 text-rose-400 px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>LIVE PROCTORING</span>
              </div>
            </div>

            <div className="relative w-full h-[135px] rounded-2xl overflow-hidden bg-black border border-slate-700">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {cameraInterrupted && (
                <div className="absolute inset-0 bg-rose-950/90 text-rose-300 p-2 flex flex-col items-center justify-center text-center text-[10px] font-bold">
                  <span>⚠️ Camera Disconnected</span>
                  <span className="text-[9px] text-slate-400 mt-1">Video track lost</span>
                </div>
              )}
            </div>
          </div>

          {/* Question Status Palette */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">Question Palette</h4>
              <span className="text-[10px] font-bold text-slate-400">
                {Object.keys(answers).length} / {questions.length} Answered
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 mb-4">
              {questions.map((_, qIdx) => {
                const isAns = answers[qIdx] !== undefined;
                const isFlg = flagged[qIdx];
                const isCur = currentIndex === qIdx;

                let btnStyle = 'bg-slate-800 text-slate-400 border border-slate-700/60';
                if (isCur) {
                  btnStyle = 'ring-2 ring-indigo-400 bg-indigo-900/60 text-white font-black';
                } else if (isFlg) {
                  btnStyle = 'bg-amber-500 text-slate-950 font-black';
                } else if (isAns) {
                  btnStyle = 'bg-emerald-600 text-white font-bold';
                }

                return (
                  <button
                    key={qIdx}
                    onClick={() => setCurrentIndex(qIdx)}
                    className={`w-9 h-9 rounded-xl text-xs flex items-center justify-center transition shadow-xs ${btnStyle}`}
                  >
                    {qIdx + 1}
                  </button>
                );
              })}
            </div>

            {/* Status Legend */}
            <div className="space-y-1.5 text-[10px] font-semibold text-slate-400 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Answered
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Flagged for Review
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span> Unvisited
              </div>
            </div>

            {/* Submit Assessment Button */}
            <button
              onClick={() => {
                if (confirm('Are you sure you want to finish and submit your assessment now?')) {
                  handleExecuteSubmission(false);
                }
              }}
              className="w-full mt-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg transition"
            >
              Submit Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 5. BOOKMARKS VAULT COMPONENT
// =========================================================================
export function BookmarksVault({ onBack, onOpenTopic }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('portal_auth_token');
    fetch('/api/bookmarks', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBookmarks(data.bookmarks || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleRemoveBookmark = async (qId) => {
    const token = localStorage.getItem('portal_auth_token');
    try {
      await fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ questionId: qId })
      });
      setBookmarks(prev => prev.filter(b => b.question_id !== qId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🔖</span> Bookmarked Revision Vault
          </h2>
          <p className="text-xs text-slate-500 font-medium">Tricky and recurring questions saved for quick review.</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
        >
          ← Back to Folders
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Retrieving bookmarks...</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
          <span className="text-4xl block mb-2">📑</span>
          <h3 className="font-extrabold text-slate-800 text-sm">No Questions Bookmarked Yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            While practicing any topic, click "Bookmark" on challenging problems to save them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((b) => (
            <div key={b.bookmark_id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => onOpenTopic(b.topic_slug)}
                  className="font-extrabold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <span>📁 {b.topic_name}</span>
                  <span className="text-slate-400">({b.section_name})</span>
                </button>
                <button
                  onClick={() => handleRemoveBookmark(b.question_id)}
                  className="text-xs text-rose-500 hover:underline font-bold"
                >
                  Remove
                </button>
              </div>
              <p className="font-bold text-slate-900 text-sm">{b.question_text}</p>
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-slate-800">
                <strong>💡 Solution:</strong> {b.explanation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
