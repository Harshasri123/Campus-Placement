import React, { useState } from 'react';

const SECURITY_QUESTIONS_LIST = [
  "What is your primary school name?",
  "What city were you born in?",
  "What is your mother's middle name?",
  "What was the name of your first pet?",
  "What is your favorite book or movie?"
];

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    securityQuestion1: SECURITY_QUESTIONS_LIST[0],
    securityAnswer1: '',
    securityQuestion2: SECURITY_QUESTIONS_LIST[1],
    securityAnswer2: ''
  });

  // Forgot password 3-step state
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Challenge Questions, 3: Set New Password
  const [challengeQuestions, setChallengeQuestions] = useState([]);
  const [challengeAnswers, setChallengeAnswers] = useState({ answer1: '', answer2: '' });
  const [resetToken, setResetToken] = useState('');
  const [newPasswordData, setNewPasswordData] = useState({ newPassword: '', confirmPassword: '' });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1. Submit Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('placement_auth_token', data.token);
      localStorage.setItem('placement_user_profile', JSON.stringify(data.user));
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      localStorage.setItem('placement_auth_token', data.token);
      localStorage.setItem('placement_user_profile', JSON.stringify(data.user));
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 3. Forgot Password Flow
  const handleForgotStep1 = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Email not found');

      setChallengeQuestions(data.questions);
      setForgotStep(2);
      setStatus({ type: 'info', message: 'Please answer your registered security questions.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep2 = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          answer1: challengeAnswers.answer1,
          answer2: challengeAnswers.answer2
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Incorrect security answers');

      setResetToken(data.resetToken);
      setForgotStep(3);
      setStatus({ type: 'success', message: 'Identity verified! Now set a new password.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep3 = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (newPasswordData.newPassword !== newPasswordData.confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match.' });
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
      if (!res.ok) throw new Error(data.error || 'Password reset failed');

      setStatus({ type: 'success', message: data.message });
      setTimeout(() => {
        setMode('login');
        setForgotStep(1);
        setStatus({ type: 'success', message: 'Password updated. Please sign in with your new password.' });
      }, 1500);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        {/* Header Tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900">
              {mode === 'login' && 'Student Sign In'}
              {mode === 'register' && 'Student Registration'}
              {mode === 'forgot' && 'Self-Contained Password Recovery'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'login' && 'Access timed practice tracks and company mock papers.'}
              {mode === 'register' && 'Create your official placement preparation account.'}
              {mode === 'forgot' && 'Reset your password via encrypted security questions.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Status Message */}
        {status.message && (
          <div
            className={`p-3.5 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
              status.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : status.type === 'info'
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{status.type === 'success' ? '✅' : status.type === 'info' ? 'ℹ️' : '⚠️'}</span>
            <span>{status.message}</span>
          </div>
        )}

        {/* 1. LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                College / Personal Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. aditya@placement.edu"
                required
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setForgotStep(1); setStatus({ type: '', message: '' }); }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Sign In to Portal'}
            </button>

            <div className="pt-4 text-center border-t border-slate-100 text-xs text-slate-500">
              New to PlacementPrep Pro?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setStatus({ type: '', message: '' }); }}
                className="font-bold text-indigo-600 hover:underline"
              >
                Register Here
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTER MODE */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Priya Sharma"
                required
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. priya@campus.edu"
                required
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 chars"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Security Questions (Required for email-less recovery) */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
              <span className="text-xs font-extrabold text-indigo-900 block">
                🛡️ Self-Contained Recovery Setup (2 Questions Required)
              </span>

              <div>
                <select
                  name="securityQuestion1"
                  value={formData.securityQuestion1}
                  onChange={handleChange}
                  className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {SECURITY_QUESTIONS_LIST.map((q, idx) => (
                    <option key={idx} value={q}>{q}</option>
                  ))}
                </select>
                <input
                  type="text"
                  name="securityAnswer1"
                  value={formData.securityAnswer1}
                  onChange={handleChange}
                  placeholder="Your Answer (Answer 1)"
                  required
                  className="w-full mt-1.5 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <select
                  name="securityQuestion2"
                  value={formData.securityQuestion2}
                  onChange={handleChange}
                  className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {SECURITY_QUESTIONS_LIST.slice(1).concat(SECURITY_QUESTIONS_LIST[0]).map((q, idx) => (
                    <option key={idx} value={q}>{q}</option>
                  ))}
                </select>
                <input
                  type="text"
                  name="securityAnswer2"
                  value={formData.securityAnswer2}
                  onChange={handleChange}
                  placeholder="Your Answer (Answer 2)"
                  required
                  className="w-full mt-1.5 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Create Placement Account'}
            </button>

            <div className="pt-4 text-center border-t border-slate-100 text-xs text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setStatus({ type: '', message: '' }); }}
                className="font-bold text-indigo-600 hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD MODE (3-STEP CHALLENGE) */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            {/* Stepper Header */}
            <div className="flex items-center justify-between text-xs font-bold mb-4">
              <span className={`px-2 py-1 rounded ${forgotStep === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                1. Email
              </span>
              <span className="text-slate-300">➔</span>
              <span className={`px-2 py-1 rounded ${forgotStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                2. Security Challenge
              </span>
              <span className="text-slate-300">➔</span>
              <span className={`px-2 py-1 rounded ${forgotStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                3. Reset Password
              </span>
            </div>

            {/* Step 1: Input Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotStep1} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Enter Your Registered Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. aditya@placement.edu"
                    required
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition"
                >
                  {loading ? 'Finding Account...' : 'Continue to Security Challenge →'}
                </button>
              </form>
            )}

            {/* Step 2: Answer Security Questions */}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotStep2} className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      1. {challengeQuestions[0]}
                    </label>
                    <input
                      type="text"
                      value={challengeAnswers.answer1}
                      onChange={(e) => setChallengeAnswers({ ...challengeAnswers, answer1: e.target.value })}
                      placeholder="Enter Answer 1"
                      required
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      2. {challengeQuestions[1]}
                    </label>
                    <input
                      type="text"
                      value={challengeAnswers.answer2}
                      onChange={(e) => setChallengeAnswers({ ...challengeAnswers, answer2: e.target.value })}
                      placeholder="Enter Answer 2"
                      required
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

            {/* Step 3: Set New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleForgotStep3} className="space-y-4">
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
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    placeholder="Re-enter new password"
                    required
                    className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition"
                >
                  {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
                </button>
              </form>
            )}

            <div className="pt-4 text-center border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => { setMode('login'); setStatus({ type: '', message: '' }); }}
                className="font-bold text-indigo-600 hover:underline"
              >
                ← Return to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
