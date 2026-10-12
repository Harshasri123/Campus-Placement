/**
 * Online Quiz Application - Client API Service
 * Handles HTTP requests, JWT authentication tokens, session persistence,
 * and communication with the Express + SQLite backend.
 */

const API = (() => {
  const BASE_URL = window.location.origin.includes('http') ? window.location.origin : 'http://localhost:3000';
  const TOKEN_KEY = 'quiz_auth_token';
  const USER_KEY = 'quiz_auth_user';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const user = getCurrentUser();
    if (user && user.email) {
      headers['x-user-email'] = user.email;
    }

    const url = `${BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If 401/403 and token expired, clear session
        if (response.status === 401 || response.status === 403) {
          if (token && endpoint.startsWith('/api/auth/me')) {
            clearSession();
          }
        }
        throw new Error(data.error || `HTTP ${response.status}: Request failed`);
      }

      return data;
    } catch (err) {
      console.warn(`[API] Error on ${endpoint}:`, err.message);
      throw err;
    }
  }

  return {
    getToken,
    getCurrentUser,
    clearSession,

    // Auth
    async register(payloadOrFullName, email, grade, password, confirmPassword, securityQ1, securityA1, securityQ2, securityA2) {
      let body;
      if (typeof payloadOrFullName === 'object' && payloadOrFullName !== null) {
        body = payloadOrFullName;
      } else {
        body = {
          fullName: payloadOrFullName,
          email,
          grade,
          password,
          confirmPassword,
          securityQ1,
          securityA1,
          securityQ2,
          securityA2
        };
      }

      const data = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      if (data.token && data.user) {
        setSession(data.token, data.user);
      }
      return data;
    },

    async login(email, password) {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data.token && data.user) {
        setSession(data.token, data.user);
      }
      return data;
    },

    async getProfile() {
      return await request('/api/auth/me');
    },

    logout() {
      clearSession();
    },

    // Self-Contained Password Recovery
    async getRecoveryChallenge(identifier) {
      return await request('/api/auth/forgot-password/challenge', {
        method: 'POST',
        body: JSON.stringify({ identifier })
      });
    },

    async verifySecurityAnswers(identifier, answer1, answer2) {
      return await request('/api/auth/forgot-password/verify', {
        method: 'POST',
        body: JSON.stringify({ identifier, answer1, answer2 })
      });
    },

    async resetPassword(resetToken, newPassword, confirmPassword) {
      return await request('/api/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify({ resetToken, newPassword, confirmPassword })
      });
    },

    // Questions & Assessment
    async getQuestions(subject, limit = 10) {
      return await request(`/api/questions?subject=${encodeURIComponent(subject)}&limit=${limit}`);
    },

    async startQuiz(subject, durationMinutes = 10, limit = 10) {
      return await request('/api/quizzes/start', {
        method: 'POST',
        body: JSON.stringify({ subject, durationMinutes, limit })
      });
    },

    async submitQuiz(payload) {
      return await request('/api/quizzes/submit', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    // Historical Records
    async getHistory() {
      return await request('/api/quizzes/history');
    },

    async getAttemptDetails(attemptId) {
      return await request(`/api/quizzes/attempt/${attemptId}`);
    },

    // Admin & Teacher Question Management
    async addAdminQuestion(questionData) {
      return await request('/api/admin/questions', {
        method: 'POST',
        body: JSON.stringify(questionData)
      });
    },

    async getAdminQuestions() {
      return await request('/api/admin/questions');
    }
  };
})();

// Attach to window
window.API = API;
