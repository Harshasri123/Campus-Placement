/**
 * Online Quiz Application - Main Application Controller
 * Handles authentication, session state, countdown timer with warnings & auto-submit,
 * MCQ interaction, question palette, server-backed evaluation,
 * targeted skill diagnostics, actionable study recommendations, and assessment history.
 */

(() => {
  'use strict';

  // =========================================================================
  // Application State
  // =========================================================================
  const state = {
    theme: localStorage.getItem('quiz_theme') || 'dark',
    soundEnabled: localStorage.getItem('quiz_sound') !== 'false',
    currentUser: null,
    selectedSubjectKey: 'mathematics',
    durationMinutes: 10,
    totalDurationSeconds: 600,
    remainingSeconds: 600,
    currentQuestionIndex: 0,
    currentQuestions: [], // Questions loaded for the current quiz
    userAnswers: {}, // { [questionId or index]: chosenOptionIndex }
    flaggedQuestions: new Set(),
    timerInterval: null,
    activeFilter: 'all',
    audioCtx: null,
    lastSubmissionResult: null,
    warnings: 0,
    maxWarnings: 3,
    isQuizActive: false,
    submitted: false,
    recovery: {
      step: 1,
      identifier: '',
      resetToken: '',
      q1: '',
      q2: ''
    }
  };

  // =========================================================================
  // DOM Element References
  // =========================================================================
  const DOM = {
    html: document.documentElement,
    brandHomeLink: document.getElementById('brand-home-link'),
    btnToggleSound: document.getElementById('btn-toggle-sound'),
    soundIcon: document.getElementById('sound-icon'),
    soundLabel: document.getElementById('sound-label'),
    btnToggleTheme: document.getElementById('btn-toggle-theme'),
    themeIcon: document.getElementById('theme-icon'),
    themeLabel: document.getElementById('theme-label'),
    headerSubjectPill: document.getElementById('header-subject-pill'),
    headerSubjectIcon: document.getElementById('header-subject-icon'),
    headerSubjectTitle: document.getElementById('header-subject-title'),

    // Auth & Profile Header Widget
    btnOpenAuthModal: document.getElementById('btn-open-auth-modal'),
    userProfilePill: document.getElementById('user-profile-pill'),
    headerUserAvatar: document.getElementById('header-user-avatar'),
    headerUserName: document.getElementById('header-user-name'),
    headerUserGrade: document.getElementById('header-user-grade'),
    btnOpenProfileModal: document.getElementById('btn-open-profile-modal'),
    btnLogout: document.getElementById('btn-logout'),

    // Views
    viewWelcome: document.getElementById('view-welcome'),
    viewQuiz: document.getElementById('view-quiz'),
    viewResults: document.getElementById('view-results'),

    // Welcome Screen
    subjectCards: document.querySelectorAll('.subject-card'),
    durationPills: document.querySelectorAll('.duration-pill'),
    selectedSummaryText: document.getElementById('selected-summary-text'),
    btnStartQuiz: document.getElementById('btn-start-quiz'),

    // Quiz Screen
    activeBadgeIcon: document.getElementById('active-badge-icon'),
    activeBadgeText: document.getElementById('active-badge-text'),
    currentQNum: document.getElementById('current-q-num'),
    totalQNum: document.getElementById('total-q-num'),
    quizTimerContainer: document.getElementById('quiz-timer-container'),
    quizTimerText: document.getElementById('quiz-timer-text'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    questionConceptText: document.getElementById('question-concept-text'),
    flagStatusPill: document.getElementById('flag-status-pill'),
    questionStatementText: document.getElementById('question-statement-text'),
    optionsContainer: document.getElementById('options-container'),
    btnPrevQuestion: document.getElementById('btn-prev-question'),
    btnNextQuestion: document.getElementById('btn-next-question'),
    btnOpenSubmitModal: document.getElementById('btn-open-submit-modal'),
    btnToggleFlag: document.getElementById('btn-toggle-flag'),
    btnFlagLabel: document.getElementById('btn-flag-label'),
    paletteGrid: document.getElementById('palette-grid'),

    // Confirmation Modal
    modalConfirm: document.getElementById('modal-confirm'),
    modalStatAnswered: document.getElementById('modal-stat-answered'),
    modalStatUnanswered: document.getElementById('modal-stat-unanswered'),
    modalStatFlagged: document.getElementById('modal-stat-flagged'),
    modalWarningAlert: document.getElementById('modal-warning-alert'),
    modalWarningText: document.getElementById('modal-warning-text'),
    btnModalCancel: document.getElementById('btn-modal-cancel'),
    btnModalConfirm: document.getElementById('btn-modal-confirm'),

    // Auth Modal
    modalAuth: document.getElementById('modal-auth'),
    authModalTitle: document.getElementById('auth-modal-title'),
    authModalDesc: document.querySelector('.auth-header .modal-desc'),
    btnCloseAuthModal: document.getElementById('btn-close-auth-modal'),
    authTabsBar: document.getElementById('auth-tabs-bar'),
    demoAccountsCallout: document.querySelector('.demo-accounts-callout'),
    tabBtnLogin: document.getElementById('tab-btn-login'),
    tabBtnRegister: document.getElementById('tab-btn-register'),
    formLogin: document.getElementById('form-login'),
    formRegister: document.getElementById('form-register'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    btnGotoForgot: document.getElementById('btn-goto-forgot'),
    registerName: document.getElementById('register-name'),
    registerEmail: document.getElementById('register-email'),
    registerGrade: document.getElementById('register-grade'),
    registerPassword: document.getElementById('register-password'),
    registerConfirmPassword: document.getElementById('register-confirm-password'),
    registerMatchHint: document.getElementById('register-match-hint'),
    registerSecurityQ1: document.getElementById('register-security-q1'),
    registerSecurityA1: document.getElementById('register-security-a1'),
    registerSecurityQ2: document.getElementById('register-security-q2'),
    registerSecurityA2: document.getElementById('register-security-a2'),
    authAlert: document.getElementById('auth-alert'),
    btnDemoRohan: document.getElementById('btn-demo-rohan'),
    btnDemoPriya: document.getElementById('btn-demo-priya'),

    // Password Recovery Workflow
    containerRecovery: document.getElementById('container-recovery'),
    recoveryAlert: document.getElementById('recovery-alert'),
    recoveryStepPill1: document.getElementById('recovery-step-pill-1'),
    recoveryStepPill2: document.getElementById('recovery-step-pill-2'),
    recoveryStepPill3: document.getElementById('recovery-step-pill-3'),
    recoveryStepLine1: document.getElementById('recovery-step-line-1'),
    recoveryStepLine2: document.getElementById('recovery-step-line-2'),
    formRecoveryStep1: document.getElementById('form-recovery-step1'),
    recoveryIdentifier: document.getElementById('recovery-identifier'),
    btnRecoveryCancel1: document.getElementById('btn-recovery-cancel-1'),
    formRecoveryStep2: document.getElementById('form-recovery-step2'),
    challengeAccountEmail: document.getElementById('challenge-account-email'),
    challengeQ1Text: document.getElementById('challenge-q1-text'),
    challengeQ2Text: document.getElementById('challenge-q2-text'),
    recoveryAnswer1: document.getElementById('recovery-answer-1'),
    recoveryAnswer2: document.getElementById('recovery-answer-2'),
    btnRecoveryBackToStep1: document.getElementById('btn-recovery-back-to-step1'),
    formRecoveryStep3: document.getElementById('form-recovery-step3'),
    recoveryNewPassword: document.getElementById('recovery-new-password'),
    recoveryConfirmPassword: document.getElementById('recovery-confirm-password'),
    recoveryMatchHint: document.getElementById('recovery-match-hint'),
    btnRecoveryCancel3: document.getElementById('btn-recovery-cancel-3'),

    // Profile & History Modal
    modalProfile: document.getElementById('modal-profile'),
    btnCloseProfileModal: document.getElementById('btn-close-profile-modal'),
    profileAvatarLarge: document.getElementById('profile-avatar-large'),
    profileFullName: document.getElementById('profile-full-name'),
    profileEmailTag: document.getElementById('profile-email-tag'),
    profileGradeTag: document.getElementById('profile-grade-tag'),
    statTotalAttempts: document.getElementById('stat-total-attempts'),
    statAvgScore: document.getElementById('stat-avg-score'),
    statHighScore: document.getElementById('stat-high-score'),
    statTotalTime: document.getElementById('stat-total-time'),
    profileWeakTagsList: document.getElementById('profile-weak-tags-list'),
    historyTableBody: document.getElementById('history-table-body'),
    historyTotalCount: document.getElementById('history-total-count'),

    // Past Attempt Modal
    modalAttemptDetail: document.getElementById('modal-attempt-detail'),
    btnCloseAttemptModal: document.getElementById('btn-close-attempt-modal'),
    attemptDetailMeta: document.getElementById('attempt-detail-meta'),
    pastAttemptScore: document.getElementById('past-attempt-score'),
    pastAttemptPercent: document.getElementById('past-attempt-percent'),
    pastAttemptTime: document.getElementById('past-attempt-time'),
    pastRecsList: document.getElementById('past-recs-list'),
    pastAnswersList: document.getElementById('past-answers-list'),

    // Results Screen
    gaugeProgressCircle: document.getElementById('gauge-progress-circle'),
    resultsScoreText: document.getElementById('results-score-text'),
    resultsPercentText: document.getElementById('results-percent-text'),
    resultsBadge: document.getElementById('results-badge'),
    badgeIcon: document.getElementById('badge-icon'),
    badgeText: document.getElementById('badge-text'),
    resultsSubjectTitle: document.getElementById('results-subject-title'),
    resultsFeedbackMsg: document.getElementById('results-feedback-msg'),
    metricAccuracy: document.getElementById('metric-accuracy'),
    metricTime: document.getElementById('metric-time'),
    metricCorrectCount: document.getElementById('metric-correct-count'),
    metricIncorrectCount: document.getElementById('metric-incorrect-count'),
    btnRetakeQuiz: document.getElementById('btn-retake-quiz'),
    btnChooseSubject: document.getElementById('btn-choose-subject'),
    btnViewProfileFromResults: document.getElementById('btn-view-profile-from-results'),
    btnPrintResults: document.getElementById('btn-print-results'),

    // Targeted Feedback & Skill Diagnostics
    diagnosticSummaryBadge: document.getElementById('diagnostic-summary-badge'),
    topicBarsList: document.getElementById('topic-bars-list'),
    recommendationsList: document.getElementById('recommendations-list'),

    // Review Filters & Container
    filterCountAll: document.getElementById('filter-count-all'),
    filterCountIncorrect: document.getElementById('filter-count-incorrect'),
    filterCountCorrect: document.getElementById('filter-count-correct'),
    filterCountFlagged: document.getElementById('filter-count-flagged'),
    filterTabBtns: document.querySelectorAll('.filter-tab-btn'),
    reviewCardsContainer: document.getElementById('review-cards-container'),

    // Anti-Cheating Engine & Fullscreen Controls
    btnEnterFullscreen: document.getElementById('btn-enter-fullscreen'),
    modalTabWarning: document.getElementById('modal-tab-warning'),
    warningStrikeNum: document.getElementById('warning-strike-num'),
    btnWarningUnderstand: document.getElementById('btn-warning-understand'),
    metricViolationsCount: document.getElementById('metric-violations-count'),

    // Teacher / Admin Portal
    btnOpenAdminPortal: document.getElementById('btn-open-admin-portal'),
    btnDemoTeacher: document.getElementById('btn-demo-teacher'),
    modalAdminPortal: document.getElementById('modal-admin-portal'),
    btnCloseAdminModal: document.getElementById('btn-close-admin-modal'),
    tabBtnAddQ: document.getElementById('tab-btn-add-q'),
    tabBtnViewBank: document.getElementById('tab-btn-view-bank'),
    adminStatusAlert: document.getElementById('admin-status-alert'),
    formAdminAddQuestion: document.getElementById('form-admin-add-question'),
    adminQSubject: document.getElementById('admin-q-subject'),
    adminQTopic: document.getElementById('admin-q-topic'),
    adminQText: document.getElementById('admin-q-text'),
    adminQOptA: document.getElementById('admin-q-opt-a'),
    adminQOptB: document.getElementById('admin-q-opt-b'),
    adminQOptC: document.getElementById('admin-q-opt-c'),
    adminQOptD: document.getElementById('admin-q-opt-d'),
    adminQCorrect: document.getElementById('admin-q-correct'),
    adminQDifficulty: document.getElementById('admin-q-difficulty'),
    adminQExplanation: document.getElementById('admin-q-explanation'),
    btnAdminSaveQ: document.getElementById('btn-admin-save-q'),
    adminBankView: document.getElementById('admin-bank-view'),
    adminQCount: document.getElementById('admin-q-count'),
    bankFilterSubject: document.getElementById('bank-filter-subject'),
    btnRefreshBank: document.getElementById('btn-refresh-bank'),
    bankQuestionsList: document.getElementById('bank-questions-list'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  // Subject metadata mappings
  const SUBJECTS = {
    mathematics: { title: 'Mathematics', icon: '📐' },
    physics: { title: 'Physics', icon: '⚡' },
    english: { title: 'English', icon: '📚' }
  };

  // =========================================================================
  // Web Audio Synthesizer
  // =========================================================================
  function getAudioContext() {
    if (!state.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new AudioCtxClass();
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
    return state.audioCtx;
  }

  function playSound(type) {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'select') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'flag') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(659.25, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'warning') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.setValueAtTime(293.66, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'complete') {
        osc.type = 'sine';
        const chord = [523.25, 659.25, 783.99, 1046.50];
        chord.forEach((freq, idx) => {
          const chordOsc = ctx.createOscillator();
          const chordGain = ctx.createGain();
          chordOsc.type = 'triangle';
          chordOsc.frequency.setValueAtTime(freq, now + idx * 0.06);
          chordGain.gain.setValueAtTime(0.05, now + idx * 0.06);
          chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          chordOsc.connect(chordGain);
          chordGain.connect(ctx.destination);
          chordOsc.start(now + idx * 0.06);
          chordOsc.stop(now + 0.6);
        });
      } else {
        // Subtle click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // =========================================================================
  // Toast Notifications
  // =========================================================================
  function showToast(message, type = 'info', duration = 3500) {
    if (!DOM.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠️' : type === 'error' ? '✕' : 'ℹ️';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // =========================================================================
  // Theme & Audio Controls
  // =========================================================================
  function initTheme() {
    DOM.html.setAttribute('data-theme', state.theme);
    updateThemeButton();
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    DOM.html.setAttribute('data-theme', state.theme);
    localStorage.setItem('quiz_theme', state.theme);
    updateThemeButton();
    playSound('click');
  }

  function updateThemeButton() {
    if (state.theme === 'dark') {
      DOM.themeIcon.textContent = '🌙';
      DOM.themeLabel.textContent = 'Dark';
    } else {
      DOM.themeIcon.textContent = '☀️';
      DOM.themeLabel.textContent = 'Light';
    }
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem('quiz_sound', String(state.soundEnabled));
    DOM.soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
    DOM.soundLabel.textContent = state.soundEnabled ? 'Audio On' : 'Audio Off';
    if (state.soundEnabled) playSound('click');
  }

  // =========================================================================
  // Navigation & View Routing
  // =========================================================================
  function switchView(viewName) {
    DOM.viewWelcome.classList.remove('active');
    DOM.viewQuiz.classList.remove('active');
    DOM.viewResults.classList.remove('active');

    if (viewName === 'welcome') {
      DOM.viewWelcome.classList.add('active');
      DOM.headerSubjectPill.classList.remove('visible');
      stopTimer();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'quiz') {
      DOM.viewQuiz.classList.add('active');
      DOM.headerSubjectPill.classList.add('visible');
      const subj = SUBJECTS[state.selectedSubjectKey] || { title: 'Quiz', icon: '📝' };
      DOM.headerSubjectTitle.textContent = subj.title;
      DOM.headerSubjectIcon.textContent = subj.icon;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'results') {
      DOM.viewResults.classList.add('active');
      DOM.headerSubjectPill.classList.remove('visible');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // =========================================================================
  // Authentication & Student Profile Management
  // =========================================================================
  function getInitials(name) {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function updateAuthHeaderUI() {
    if (state.currentUser) {
      DOM.btnOpenAuthModal.style.display = 'none';
      DOM.userProfilePill.style.display = 'inline-flex';
      DOM.headerUserAvatar.textContent = getInitials(state.currentUser.fullName);
      DOM.headerUserName.textContent = state.currentUser.fullName;
      DOM.headerUserGrade.textContent = state.currentUser.grade || 'Student';

      // Toggle Teacher / Admin Portal button
      if (DOM.btnOpenAdminPortal) {
        const isAdmin = state.currentUser.role === 'admin' ||
          state.currentUser.email === 'teacher@school.com' ||
          state.currentUser.email === 'admin@quiz.com';
        DOM.btnOpenAdminPortal.style.display = isAdmin ? 'inline-flex' : 'none';
      }
    } else {
      DOM.btnOpenAuthModal.style.display = 'inline-flex';
      DOM.userProfilePill.style.display = 'none';
      if (DOM.btnOpenAdminPortal) DOM.btnOpenAdminPortal.style.display = 'none';
    }
  }

  async function checkSession() {
    const cachedUser = window.API.getCurrentUser();
    if (cachedUser) {
      state.currentUser = cachedUser;
      updateAuthHeaderUI();
      // Validate with server
      try {
        const profileData = await window.API.getProfile();
        if (profileData && profileData.user) {
          state.currentUser = profileData.user;
          updateAuthHeaderUI();
        }
      } catch {
        // Session token expired or offline
      }
    } else {
      // Default to guest or demo Rohan for immediate rich experience
      try {
        const loginData = await window.API.login('rohan@student.edu', 'student123');
        if (loginData && loginData.user) {
          state.currentUser = loginData.user;
          updateAuthHeaderUI();
        }
      } catch {
        // Server might be starting
      }
    }
  }

  function showAuthAlert(message, type = 'error') {
    DOM.authAlert.className = `auth-alert ${type}`;
    DOM.authAlert.textContent = message;
    DOM.authAlert.style.display = 'block';
  }

  function hideAuthAlert() {
    DOM.authAlert.style.display = 'none';
  }

  function openAuthModal() {
    hideAuthAlert();
    DOM.modalAuth.classList.add('active');
  }

  function closeAuthModal() {
    DOM.modalAuth.classList.remove('active');
  }

  function switchAuthTab(tab) {
    hideAuthAlert();
    hideRecoveryAlert();

    // Ensure recovery container is hidden and standard portal header is visible
    DOM.containerRecovery.style.display = 'none';
    DOM.authTabsBar.style.display = 'flex';
    if (DOM.demoAccountsCallout) DOM.demoAccountsCallout.style.display = 'block';
    DOM.authModalTitle.textContent = 'Student Portal';
    DOM.authModalDesc.textContent = 'Sign in or register to record your assessment history and track topic progress.';

    if (tab === 'login') {
      DOM.tabBtnLogin.classList.add('active');
      DOM.tabBtnRegister.classList.remove('active');
      DOM.formLogin.style.display = 'flex';
      DOM.formRegister.style.display = 'none';
    } else {
      DOM.tabBtnRegister.classList.add('active');
      DOM.tabBtnLogin.classList.remove('active');
      DOM.formRegister.style.display = 'flex';
      DOM.formLogin.style.display = 'none';
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    hideAuthAlert();
    const email = DOM.loginEmail.value.trim();
    const password = DOM.loginPassword.value;

    try {
      const data = await window.API.login(email, password);
      state.currentUser = data.user;
      updateAuthHeaderUI();
      closeAuthModal();
      showToast(`Welcome back, ${data.user.fullName}!`, 'success');
      playSound('complete');
    } catch (err) {
      showAuthAlert(err.message || 'Login failed. Please check your credentials.');
      playSound('warning');
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    hideAuthAlert();
    const fullName = DOM.registerName.value.trim();
    const email = DOM.registerEmail.value.trim();
    const grade = DOM.registerGrade.value;
    const password = DOM.registerPassword.value;
    const confirmPassword = DOM.registerConfirmPassword.value;
    const securityQ1 = DOM.registerSecurityQ1.value;
    const securityA1 = DOM.registerSecurityA1.value.trim();
    const securityQ2 = DOM.registerSecurityQ2.value;
    const securityA2 = DOM.registerSecurityA2.value.trim();

    // Frontend validation
    if (!fullName || !email || !password || !confirmPassword) {
      showAuthAlert('Please fill in all mandatory account fields.');
      playSound('warning');
      return;
    }

    if (password !== confirmPassword) {
      showAuthAlert('Password and Confirm Password do not match. Please verify your passwords.');
      DOM.registerConfirmPassword.focus();
      playSound('warning');
      return;
    }

    if (password.length < 6) {
      showAuthAlert('Password must be at least 6 characters long.');
      DOM.registerPassword.focus();
      playSound('warning');
      return;
    }

    if (!securityQ1 || !securityA1 || !securityQ2 || !securityA2) {
      showAuthAlert('Please select two recovery questions and enter your answers.');
      playSound('warning');
      return;
    }

    if (securityQ1 === securityQ2) {
      showAuthAlert('Please select two different security questions.');
      DOM.registerSecurityQ2.focus();
      playSound('warning');
      return;
    }

    if (securityA1.length < 2 || securityA2.length < 2) {
      showAuthAlert('Security question answers must be at least 2 characters long.');
      playSound('warning');
      return;
    }

    try {
      const data = await window.API.register({
        fullName,
        email,
        grade,
        password,
        confirmPassword,
        securityQ1,
        securityA1,
        securityQ2,
        securityA2
      });
      state.currentUser = data.user;
      updateAuthHeaderUI();
      closeAuthModal();
      showToast(`Registration complete! Welcome, ${data.user.fullName}!`, 'success');
      playSound('complete');
    } catch (err) {
      showAuthAlert(err.message || 'Registration failed.');
      playSound('warning');
    }
  }

  // =========================================================================
  // Self-Contained Password Recovery Handlers
  // =========================================================================
  function showRecoveryAlert(message, type = 'error') {
    DOM.recoveryAlert.className = `auth-alert ${type}`;
    DOM.recoveryAlert.textContent = message;
    DOM.recoveryAlert.style.display = 'block';
  }

  function hideRecoveryAlert() {
    DOM.recoveryAlert.style.display = 'none';
  }

  function openRecoveryWorkflow() {
    hideAuthAlert();
    hideRecoveryAlert();

    // Hide tabs, demo callout, and login/register forms
    DOM.authTabsBar.style.display = 'none';
    if (DOM.demoAccountsCallout) DOM.demoAccountsCallout.style.display = 'none';
    DOM.formLogin.style.display = 'none';
    DOM.formRegister.style.display = 'none';

    // Update modal title
    DOM.authModalTitle.textContent = 'Account Recovery';
    DOM.authModalDesc.textContent = 'Verify your security questions to reset your password without email or SMS.';

    // Show recovery container
    DOM.containerRecovery.style.display = 'flex';

    // Pre-populate identifier from login email if user had typed it
    const typedIdentifier = DOM.loginEmail.value.trim();
    if (typedIdentifier) {
      DOM.recoveryIdentifier.value = typedIdentifier;
    }

    setRecoveryStep(1);
    playSound('click');
  }

  function setRecoveryStep(stepNum) {
    hideRecoveryAlert();
    state.recovery.step = stepNum;

    // Stepper Pills & Lines
    DOM.recoveryStepPill1.className = `stepper-step ${stepNum === 1 ? 'active' : stepNum > 1 ? 'completed' : ''}`;
    DOM.recoveryStepPill2.className = `stepper-step ${stepNum === 2 ? 'active' : stepNum > 2 ? 'completed' : ''}`;
    DOM.recoveryStepPill3.className = `stepper-step ${stepNum === 3 ? 'active' : ''}`;

    DOM.recoveryStepLine1.className = `stepper-line ${stepNum > 1 ? 'active' : ''}`;
    DOM.recoveryStepLine2.className = `stepper-line ${stepNum > 2 ? 'active' : ''}`;

    // Panels
    DOM.formRecoveryStep1.style.display = stepNum === 1 ? 'flex' : 'none';
    DOM.formRecoveryStep2.style.display = stepNum === 2 ? 'flex' : 'none';
    DOM.formRecoveryStep3.style.display = stepNum === 3 ? 'flex' : 'none';

    if (stepNum === 1) {
      setTimeout(() => DOM.recoveryIdentifier && DOM.recoveryIdentifier.focus(), 50);
    } else if (stepNum === 2) {
      setTimeout(() => DOM.recoveryAnswer1 && DOM.recoveryAnswer1.focus(), 50);
    } else if (stepNum === 3) {
      setTimeout(() => DOM.recoveryNewPassword && DOM.recoveryNewPassword.focus(), 50);
    }
  }

  async function handleRecoveryStep1Submit(e) {
    e.preventDefault();
    hideRecoveryAlert();

    const identifier = DOM.recoveryIdentifier.value.trim();
    if (!identifier) {
      showRecoveryAlert('Please enter your email or student roll number.');
      playSound('warning');
      return;
    }

    const btn = document.getElementById('btn-recovery-find');
    const originalText = btn.innerHTML;

    try {
      btn.disabled = true;
      btn.innerHTML = '<span>Retrieving Challenge...</span> ⏳';

      const challenge = await window.API.getRecoveryChallenge(identifier);
      btn.disabled = false;
      btn.innerHTML = originalText;

      state.recovery.identifier = challenge.identifier;
      state.recovery.q1 = challenge.question1;
      state.recovery.q2 = challenge.question2;

      DOM.challengeAccountEmail.textContent = challenge.identifier;
      DOM.challengeQ1Text.textContent = challenge.question1;
      DOM.challengeQ2Text.textContent = challenge.question2;
      DOM.recoveryAnswer1.value = '';
      DOM.recoveryAnswer2.value = '';

      setRecoveryStep(2);
      playSound('select');
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = originalText;
      showRecoveryAlert(err.message || 'Unable to retrieve recovery questions.');
      playSound('warning');
    }
  }

  async function handleRecoveryStep2Submit(e) {
    e.preventDefault();
    hideRecoveryAlert();

    const answer1 = DOM.recoveryAnswer1.value.trim();
    const answer2 = DOM.recoveryAnswer2.value.trim();

    if (!answer1 || !answer2) {
      showRecoveryAlert('Please provide answers to both security questions.');
      playSound('warning');
      return;
    }

    const btn = document.getElementById('btn-recovery-verify');
    const originalText = btn.innerHTML;

    try {
      btn.disabled = true;
      btn.innerHTML = '<span>Verifying Answers...</span> ⏳';

      const result = await window.API.verifySecurityAnswers(state.recovery.identifier, answer1, answer2);
      btn.disabled = false;
      btn.innerHTML = originalText;

      state.recovery.resetToken = result.resetToken;
      DOM.recoveryNewPassword.value = '';
      DOM.recoveryConfirmPassword.value = '';
      DOM.recoveryMatchHint.className = 'password-match-hint';
      DOM.recoveryMatchHint.textContent = '';

      setRecoveryStep(3);
      playSound('complete');
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = originalText;
      showRecoveryAlert(err.message || 'Verification failed. Incorrect answers.');
      playSound('warning');
    }
  }

  async function handleRecoveryStep3Submit(e) {
    e.preventDefault();
    hideRecoveryAlert();

    const newPassword = DOM.recoveryNewPassword.value;
    const confirmPassword = DOM.recoveryConfirmPassword.value;

    if (!newPassword || !confirmPassword) {
      showRecoveryAlert('Please enter and confirm your new password.');
      playSound('warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showRecoveryAlert('New password and confirm password do not match.');
      playSound('warning');
      return;
    }

    if (newPassword.length < 6) {
      showRecoveryAlert('New password must be at least 6 characters long.');
      playSound('warning');
      return;
    }

    const btn = document.getElementById('btn-recovery-submit-reset');
    const originalText = btn.innerHTML;

    try {
      btn.disabled = true;
      btn.innerHTML = '<span>Updating Password...</span> ⏳';

      const result = await window.API.resetPassword(state.recovery.resetToken, newPassword, confirmPassword);
      btn.disabled = false;
      btn.innerHTML = originalText;

      // Switch back to Login view
      switchAuthTab('login');
      DOM.loginEmail.value = result.email || state.recovery.identifier;
      DOM.loginPassword.value = '';
      showAuthAlert('Password updated successfully! Please sign in with your new password.', 'success');
      showToast('Password reset successful! You can now sign in.', 'success');
      playSound('complete');
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = originalText;
      showRecoveryAlert(err.message || 'Password reset failed.');
      playSound('warning');
    }
  }

  function initPasswordMatchWatchers() {
    // Register form parity
    function checkRegisterParity() {
      const p1 = DOM.registerPassword.value;
      const p2 = DOM.registerConfirmPassword.value;

      if (!p2) {
        DOM.registerMatchHint.className = 'password-match-hint';
        DOM.registerMatchHint.textContent = '';
        DOM.registerConfirmPassword.classList.remove('input-error');
        return;
      }

      if (p1 === p2) {
        DOM.registerMatchHint.className = 'password-match-hint visible success';
        DOM.registerMatchHint.textContent = '✓ Passwords match';
        DOM.registerConfirmPassword.classList.remove('input-error');
      } else {
        DOM.registerMatchHint.className = 'password-match-hint visible error';
        DOM.registerMatchHint.textContent = '✕ Passwords do not match';
        DOM.registerConfirmPassword.classList.add('input-error');
      }
    }

    if (DOM.registerPassword && DOM.registerConfirmPassword) {
      DOM.registerPassword.addEventListener('input', checkRegisterParity);
      DOM.registerConfirmPassword.addEventListener('input', checkRegisterParity);
    }

    // Recovery form parity
    function checkRecoveryParity() {
      const p1 = DOM.recoveryNewPassword.value;
      const p2 = DOM.recoveryConfirmPassword.value;

      if (!p2) {
        DOM.recoveryMatchHint.className = 'password-match-hint';
        DOM.recoveryMatchHint.textContent = '';
        DOM.recoveryConfirmPassword.classList.remove('input-error');
        return;
      }

      if (p1 === p2) {
        DOM.recoveryMatchHint.className = 'password-match-hint visible success';
        DOM.recoveryMatchHint.textContent = '✓ Passwords match';
        DOM.recoveryConfirmPassword.classList.remove('input-error');
      } else {
        DOM.recoveryMatchHint.className = 'password-match-hint visible error';
        DOM.recoveryMatchHint.textContent = '✕ Passwords do not match';
        DOM.recoveryConfirmPassword.classList.add('input-error');
      }
    }

    if (DOM.recoveryNewPassword && DOM.recoveryConfirmPassword) {
      DOM.recoveryNewPassword.addEventListener('input', checkRecoveryParity);
      DOM.recoveryConfirmPassword.addEventListener('input', checkRecoveryParity);
    }
  }

  function handleLogout() {
    window.API.logout();
    state.currentUser = null;
    updateAuthHeaderUI();
    showToast('Signed out successfully.', 'info');
    playSound('click');
  }

  async function openProfileModal() {
    if (!state.currentUser) {
      openAuthModal();
      return;
    }

    DOM.profileAvatarLarge.textContent = getInitials(state.currentUser.fullName);
    DOM.profileFullName.textContent = state.currentUser.fullName;
    DOM.profileEmailTag.textContent = state.currentUser.email;
    DOM.profileGradeTag.textContent = state.currentUser.grade || 'Grade 12';

    DOM.modalProfile.classList.add('active');

    // Fetch up-to-date profile & history
    try {
      const [profileData, historyData] = await Promise.all([
        window.API.getProfile().catch(() => null),
        window.API.getHistory().catch(() => ({ attempts: [] }))
      ]);

      if (profileData && profileData.analytics) {
        const a = profileData.analytics;
        DOM.statTotalAttempts.textContent = a.totalAttempts;
        DOM.statAvgScore.textContent = `${a.averageScorePercent}%`;
        DOM.statHighScore.textContent = `${a.highestScore} / 10`;
        const minutes = Math.round((a.totalTimeSeconds || 0) / 60);
        DOM.statTotalTime.textContent = `${minutes}m`;

        // Render recurring weak areas
        DOM.profileWeakTagsList.innerHTML = '';
        if (a.frequentWeakAreas && a.frequentWeakAreas.length > 0) {
          a.frequentWeakAreas.forEach(item => {
            const pill = document.createElement('span');
            pill.className = 'weak-topic-pill';
            pill.textContent = `⚠️ ${item.topic} (${item.count}× flagged)`;
            DOM.profileWeakTagsList.appendChild(pill);
          });
        } else {
          DOM.profileWeakTagsList.innerHTML = `<span class="no-weak-msg">🌟 No recurring weak areas! Consistent intermediate mastery.</span>`;
        }
      }

      // Render History Table
      renderHistoryTable(historyData.attempts || []);
    } catch (err) {
      console.error('Error populating profile modal:', err);
    }
  }

  function closeProfileModal() {
    DOM.modalProfile.classList.remove('active');
  }

  function renderHistoryTable(attempts) {
    DOM.historyTableBody.innerHTML = '';
    DOM.historyTotalCount.textContent = `Showing ${attempts.length} past assessment${attempts.length === 1 ? '' : 's'}`;

    if (attempts.length === 0) {
      DOM.historyTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No assessments recorded yet. Take a quiz to begin tracking your progress!
          </td>
        </tr>
      `;
      return;
    }

    attempts.forEach(att => {
      const tr = document.createElement('tr');
      const subj = SUBJECTS[att.subject] || { title: att.subject, icon: '📝' };
      const accuracy = att.total_questions > 0 ? Math.round((att.score / att.total_questions) * 100) : 0;
      const dateStr = new Date(att.submitted_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const weakAreaCount = att.weak_areas ? att.weak_areas.length : 0;
      const weakBadge = weakAreaCount > 0
        ? `<span class="topic-status-badge status-weak">${weakAreaCount} Weak Area${weakAreaCount > 1 ? 's' : ''}</span>`
        : `<span class="topic-status-badge status-mastered">All Mastered</span>`;

      tr.innerHTML = `
        <td><strong>${subj.icon} ${subj.title}</strong></td>
        <td><strong style="color: var(--primary);">${att.score} / ${att.total_questions}</strong></td>
        <td>${accuracy}%</td>
        <td>${formatTime(att.time_taken_seconds)}</td>
        <td>${weakBadge}</td>
        <td style="color: var(--text-secondary); font-size: 0.8rem;">${dateStr}</td>
        <td>
          <button type="button" class="btn-table-action" data-attempt-id="${att.id}">
            View Report
          </button>
        </td>
      `;
      DOM.historyTableBody.appendChild(tr);
    });

    // Attach View Report clicks
    DOM.historyTableBody.querySelectorAll('.btn-table-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-attempt-id');
        openPastAttemptReport(id);
      });
    });
  }

  async function openPastAttemptReport(attemptId) {
    try {
      const data = await window.API.getAttemptDetails(attemptId);
      const att = data.attempt;
      if (!att) return;

      const subj = SUBJECTS[att.subject] || { title: att.subject, icon: '📝' };
      DOM.attemptDetailMeta.textContent = `Subject: ${subj.title} • Submitted: ${new Date(att.submitted_at).toLocaleString()}`;
      DOM.pastAttemptScore.textContent = `${att.score} / ${att.total_questions}`;
      const accuracy = att.total_questions > 0 ? Math.round((att.score / att.total_questions) * 100) : 0;
      DOM.pastAttemptPercent.textContent = `${accuracy}% Accuracy`;
      DOM.pastAttemptTime.textContent = `Time Taken: ${formatTime(att.time_taken_seconds)}`;

      // Render recommendations
      DOM.pastRecsList.innerHTML = '';
      if (att.recommendations && att.recommendations.length > 0) {
        att.recommendations.forEach(r => {
          const card = document.createElement('div');
          card.className = 'recommendation-card';
          card.innerHTML = `
            <div class="rec-topic"><span>📌</span> <span>${escapeHtml(r.topic)}</span></div>
            <div class="rec-advice">${escapeHtml(r.advice)}</div>
          `;
          DOM.pastRecsList.appendChild(card);
        });
      } else {
        DOM.pastRecsList.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.85rem;">No specific weak areas recorded for this session.</p>`;
      }

      // Render past answers
      DOM.pastAnswersList.innerHTML = '';
      if (att.answers && att.answers.length > 0) {
        att.answers.forEach((ans, idx) => {
          const card = document.createElement('div');
          card.className = `review-card ${ans.isCorrect ? 'correct' : 'incorrect'}`;
          const chosenText = (ans.options && ans.chosenOptionIndex !== null && ans.chosenOptionIndex !== undefined)
            ? ans.options[ans.chosenOptionIndex]
            : 'Unanswered / Skipped';
          const correctText = (ans.options && ans.correctOptionIndex !== null && ans.correctOptionIndex !== undefined)
            ? ans.options[ans.correctOptionIndex]
            : 'N/A';

          card.innerHTML = `
            <div class="review-header">
              <div class="review-q-meta">
                <span class="q-number-pill">Question ${idx + 1}</span>
                <span class="concept-tag">${escapeHtml(ans.topicTag || 'General')}</span>
              </div>
              <span class="review-status-tag ${ans.isCorrect ? 'status-correct' : 'status-incorrect'}">
                ${ans.isCorrect ? '✓ Correct' : '✕ Incorrect'}
              </span>
            </div>
            <h4 class="review-q-text">${escapeHtml(ans.questionText || '')}</h4>
            <div class="review-choices-grid">
              <div class="choice-comparison ${ans.isCorrect ? 'is-correct' : 'is-wrong'}">
                <span class="choice-label">Your Answer:</span>
                <span class="choice-text">${escapeHtml(chosenText)}</span>
              </div>
              ${!ans.isCorrect ? `
                <div class="choice-comparison is-correct">
                  <span class="choice-label">Correct Answer:</span>
                  <span class="choice-text">${escapeHtml(correctText)}</span>
                </div>
              ` : ''}
            </div>
            <div class="explanation-box">
              <div class="exp-title">💡 Step-by-Step Explanation:</div>
              <div class="exp-content">${escapeHtml(ans.explanation || '')}</div>
            </div>
          `;
          DOM.pastAnswersList.appendChild(card);
        });
      }

      DOM.modalAttemptDetail.classList.add('active');
    } catch (err) {
      showToast('Could not load past report: ' + err.message, 'error');
    }
  }

  function closePastAttemptModal() {
    DOM.modalAttemptDetail.classList.remove('active');
  }

  // =========================================================================
  // Countdown Timer Engine with Color Warnings & Auto-Submit
  // =========================================================================
  function formatTime(seconds) {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function startCountdownTimer(totalMinutes) {
    stopTimer();
    state.totalDurationSeconds = totalMinutes * 60;
    state.remainingSeconds = state.totalDurationSeconds;

    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
      state.remainingSeconds--;

      updateTimerDisplay();

      if (state.remainingSeconds <= 0) {
        // Time expired! Auto-submit assessment
        stopTimer();
        playSound('warning');
        showToast("⏱️ Time's Up! Your assessment is being automatically submitted...", 'warning', 4000);
        submitQuiz(true); // true = auto-submitted
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    DOM.quizTimerText.textContent = formatTime(state.remainingSeconds);

    // Color warning classes
    DOM.quizTimerContainer.classList.remove('timer-warning', 'timer-critical');

    if (state.remainingSeconds <= 60) {
      // Under 1 minute: Critical glowing red pulse
      DOM.quizTimerContainer.classList.add('timer-critical');
    } else if (state.remainingSeconds <= 120) {
      // Under 2 minutes: Amber warning
      DOM.quizTimerContainer.classList.add('timer-warning');
    }
  }

  function stopTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    DOM.quizTimerContainer.classList.remove('timer-warning', 'timer-critical');
  }

  // =========================================================================
  // Question & Assessment Setup
  // =========================================================================
  function updateSummaryText() {
    const subj = SUBJECTS[state.selectedSubjectKey] || { title: 'Mathematics' };
    DOM.selectedSummaryText.innerHTML = `
      Selected: <strong>${subj.title}</strong> • 10 Questions • <strong>${state.durationMinutes} Minutes</strong>
    `;
  }

  async function startQuizSession() {
    playSound('select');
    state.currentQuestionIndex = 0;
    state.userAnswers = {};
    state.flaggedQuestions.clear();

    const subjKey = state.selectedSubjectKey;
    const duration = state.durationMinutes;

    try {
      // Request quiz session from server
      const startData = await window.API.startQuiz(subjKey, duration, 10);
      state.currentQuestions = startData.questions;
    } catch {
      // Offline fallback: load from client quizData
      if (typeof quizData !== 'undefined' && quizData[subjKey]) {
        state.currentQuestions = quizData[subjKey].questions.map((q, idx) => ({
          index: idx,
          id: q.id,
          subject: subjKey,
          topic_tag: q.concept,
          question_text: q.question,
          options: q.options
        }));
      }
    }

    if (!state.currentQuestions || state.currentQuestions.length === 0) {
      showToast('Could not load questions for this subject. Please try again.', 'error');
      return;
    }

    // Set Header & Top Bar Badge
    const subjMeta = SUBJECTS[subjKey] || { title: 'Subject', icon: '📝' };
    DOM.activeBadgeText.textContent = subjMeta.title;
    DOM.activeBadgeIcon.textContent = subjMeta.icon;
    DOM.totalQNum.textContent = state.currentQuestions.length;

    // Build Question Navigator Palette
    renderPalette();

    // Render First Question
    renderCurrentQuestion();

    // Switch view
    switchView('quiz');

    // Anti-Cheating Engine State Initialization
    state.warnings = 0;
    state.isQuizActive = true;
    state.submitted = false;
    enterFullscreen();

    // Launch Countdown Timer
    startCountdownTimer(duration);
  }

  function renderPalette() {
    DOM.paletteGrid.innerHTML = '';
    state.currentQuestions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-btn';
      btn.textContent = idx + 1;
      btn.setAttribute('aria-label', `Jump to question ${idx + 1}`);

      btn.addEventListener('click', () => {
        navigateToQuestion(idx);
      });

      DOM.paletteGrid.appendChild(btn);
    });
    updatePaletteStates();
  }

  function updatePaletteStates() {
    const buttons = DOM.paletteGrid.querySelectorAll('.palette-btn');
    buttons.forEach((btn, idx) => {
      btn.className = 'palette-btn';

      const q = state.currentQuestions[idx];
      const qId = q ? q.id : idx;
      const isAnswered = state.userAnswers[qId] !== undefined || state.userAnswers[idx] !== undefined;
      const isFlagged = state.flaggedQuestions.has(idx);
      const isCurrent = idx === state.currentQuestionIndex;

      if (isCurrent) btn.classList.add('current');
      if (isFlagged) btn.classList.add('flagged');
      if (isAnswered) btn.classList.add('answered');
      if (!isCurrent && !isAnswered && !isFlagged) btn.classList.add('unvisited');
    });
  }

  function renderCurrentQuestion() {
    const q = state.currentQuestions[state.currentQuestionIndex];
    if (!q) return;

    const total = state.currentQuestions.length;
    DOM.currentQNum.textContent = state.currentQuestionIndex + 1;
    DOM.questionConceptText.textContent = q.topic_tag || 'Intermediate Concept';
    DOM.questionStatementText.textContent = q.question_text || q.question;

    // Update Progress bar
    const progressPercent = Math.round(((state.currentQuestionIndex + 1) / total) * 100);
    DOM.progressBarFill.style.width = `${progressPercent}%`;
    document.getElementById('progress-container').setAttribute('aria-valuenow', progressPercent);

    // Flag status
    const isFlagged = state.flaggedQuestions.has(state.currentQuestionIndex);
    DOM.flagStatusPill.classList.toggle('visible', isFlagged);
    DOM.btnToggleFlag.classList.toggle('flagged', isFlagged);
    DOM.btnFlagLabel.textContent = isFlagged ? 'Flagged for Review' : 'Mark for Review';

    // Navigation buttons state
    DOM.btnPrevQuestion.disabled = state.currentQuestionIndex === 0;

    const isLastQuestion = state.currentQuestionIndex === total - 1;
    if (isLastQuestion) {
      DOM.btnNextQuestion.style.display = 'none';
      DOM.btnOpenSubmitModal.style.display = 'inline-flex';
    } else {
      DOM.btnNextQuestion.style.display = 'inline-flex';
      DOM.btnOpenSubmitModal.style.display = 'none';
    }

    // Render Options
    DOM.optionsContainer.innerHTML = '';
    const qId = q.id !== undefined ? q.id : state.currentQuestionIndex;
    const selectedOption = state.userAnswers[qId] !== undefined ? state.userAnswers[qId] : state.userAnswers[state.currentQuestionIndex];

    const optionLabels = ['A', 'B', 'C', 'D'];
    q.options.forEach((optText, optIdx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `option-button ${selectedOption === optIdx ? 'selected' : ''}`;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', selectedOption === optIdx ? 'true' : 'false');
      btn.setAttribute('tabindex', '0');

      btn.innerHTML = `
        <span class="option-prefix">${optionLabels[optIdx]}</span>
        <span class="option-label-text">${escapeHtml(optText)}</span>
        <span class="option-check-circle" aria-hidden="true">✓</span>
      `;

      btn.addEventListener('click', () => {
        selectOption(optIdx);
      });

      DOM.optionsContainer.appendChild(btn);
    });

    updatePaletteStates();
  }

  function selectOption(optionIndex) {
    const q = state.currentQuestions[state.currentQuestionIndex];
    const qId = q.id !== undefined ? q.id : state.currentQuestionIndex;

    state.userAnswers[qId] = optionIndex;
    state.userAnswers[state.currentQuestionIndex] = optionIndex; // dual index for reliability

    playSound('select');
    renderCurrentQuestion();
  }

  function toggleFlagCurrentQuestion() {
    const idx = state.currentQuestionIndex;
    if (state.flaggedQuestions.has(idx)) {
      state.flaggedQuestions.delete(idx);
      playSound('click');
    } else {
      state.flaggedQuestions.add(idx);
      playSound('flag');
    }
    renderCurrentQuestion();
  }

  function navigateToQuestion(newIndex) {
    if (newIndex >= 0 && newIndex < state.currentQuestions.length) {
      playSound('click');
      state.currentQuestionIndex = newIndex;
      renderCurrentQuestion();
    }
  }

  // =========================================================================
  // Confirmation Modal
  // =========================================================================
  function openConfirmationModal() {
    playSound('click');
    const total = state.currentQuestions.length;
    let answered = 0;

    for (let i = 0; i < total; i++) {
      const q = state.currentQuestions[i];
      const qId = q ? q.id : i;
      if (state.userAnswers[qId] !== undefined || state.userAnswers[i] !== undefined) {
        answered++;
      }
    }
    const unanswered = total - answered;
    const flagged = state.flaggedQuestions.size;

    DOM.modalStatAnswered.textContent = answered;
    DOM.modalStatUnanswered.textContent = unanswered;
    DOM.modalStatFlagged.textContent = flagged;

    if (unanswered > 0) {
      playSound('warning');
      DOM.modalWarningAlert.style.display = 'flex';
      DOM.modalWarningText.textContent = `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}! Blank questions will receive 0 marks.`;
    } else {
      DOM.modalWarningAlert.style.display = 'none';
    }

    DOM.modalConfirm.classList.add('active');
  }

  function closeConfirmationModal() {
    DOM.modalConfirm.classList.remove('active');
  }

  // =========================================================================
  // Anti-Cheating Engine: Fullscreen & Tab Switch Violation Detector
  // =========================================================================
  function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }

  function exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitFullscreenElement) {
      document.webkitExitFullscreen();
    }
  }

  function handleVisibilityChange() {
    if (state.isQuizActive && !state.submitted && document.hidden) {
      state.warnings += 1;
      playSound('warning');

      if (state.warnings >= state.maxWarnings) {
        if (DOM.modalTabWarning) DOM.modalTabWarning.classList.remove('active');
        alert('Cheating violation limit reached. Your quiz is being submitted automatically.');
        submitQuiz(true);
      } else {
        if (DOM.warningStrikeNum) DOM.warningStrikeNum.textContent = state.warnings;
        if (DOM.modalTabWarning) DOM.modalTabWarning.classList.add('active');
      }
    }
  }

  // =========================================================================
  // Quiz Submission, Evaluation & Targeted Skill Diagnostics
  // =========================================================================
  async function submitQuiz(isAutoSubmit = false) {
    if (state.submitted) return;
    state.submitted = true;
    state.isQuizActive = false;

    // Exit fullscreen if active
    exitFullscreen();

    if (DOM.modalTabWarning) DOM.modalTabWarning.classList.remove('active');
    closeConfirmationModal();
    stopTimer();
    playSound('complete');

    const total = state.currentQuestions.length;
    const timeTaken = state.totalDurationSeconds - state.remainingSeconds;

    // Build answers map
    const answersPayload = {};
    state.currentQuestions.forEach((q, idx) => {
      const qId = q.id !== undefined ? q.id : idx;
      if (state.userAnswers[qId] !== undefined) {
        answersPayload[qId] = state.userAnswers[qId];
      } else if (state.userAnswers[idx] !== undefined) {
        answersPayload[qId] = state.userAnswers[idx];
      }
    });

    let resultsData = null;

    try {
      // Submit to backend API with tab-switch violations
      resultsData = await window.API.submitQuiz({
        subject: state.selectedSubjectKey,
        durationMinutes: state.durationMinutes,
        timeTakenSeconds: timeTaken,
        tabSwitchViolations: state.warnings,
        violations: state.warnings,
        answers: answersPayload
      });
    } catch (err) {
      console.warn('Backend submission failed, falling back to local evaluation:', err);
    }

    // Local evaluation fallback if backend is unreachable
    if (!resultsData) {
      resultsData = localEvaluateQuiz(timeTaken);
    }

    state.lastSubmissionResult = resultsData;

    // Render results view
    renderResultsView(resultsData, isAutoSubmit);
    switchView('results');
  }

  function localEvaluateQuiz(timeTaken) {
    const subjKey = state.selectedSubjectKey;
    const fullQuestions = (typeof quizData !== 'undefined' && quizData[subjKey])
      ? quizData[subjKey].questions
      : [];

    let score = 0;
    const detailedAnswers = [];
    const topicStats = {};

    fullQuestions.forEach((q, idx) => {
      const qId = q.id !== undefined ? q.id : idx;
      const userChoice = state.userAnswers[qId] !== undefined ? state.userAnswers[qId] : state.userAnswers[idx];
      const isCorrect = userChoice === q.correctIndex;
      if (isCorrect) score++;

      const topic = q.concept || 'General';
      if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
      topicStats[topic].total++;
      if (isCorrect) topicStats[topic].correct++;

      detailedAnswers.push({
        questionId: q.id,
        questionText: q.question,
        options: q.options,
        chosenOptionIndex: userChoice,
        correctOptionIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
        topicTag: q.concept
      });
    });

    const weakAreas = [];
    const skillDiagnostics = [];

    for (const [topic, stats] of Object.entries(topicStats)) {
      const acc = Math.round((stats.correct / stats.total) * 100);
      if (acc < 50) weakAreas.push(topic);
      skillDiagnostics.push({
        topic,
        total: stats.total,
        correct: stats.correct,
        accuracyPercent: acc,
        status: acc >= 80 ? 'Mastered' : acc >= 50 ? 'Proficient' : 'Needs Improvement'
      });
    }

    const recs = weakAreas.map(t => ({
      topic: t,
      advice: `Focus on revising key concepts and solving 3-5 standard practice problems for ${t}.`
    }));

    if (weakAreas.length === 0) {
      recs.push({
        topic: 'Comprehensive Mastery',
        advice: '🌟 Outstanding achievement! You demonstrated complete conceptual mastery across all tested sub-skills.'
      });
    }

    return {
      score,
      totalQuestions: fullQuestions.length || 10,
      percentage: Math.round((score / (fullQuestions.length || 10)) * 100),
      timeTakenSeconds: timeTaken,
      durationMinutes: state.durationMinutes,
      weakAreas,
      skillDiagnostics,
      recommendations: recs,
      detailedAnswers
    };
  }

  function renderResultsView(results, isAutoSubmit = false) {
    const subj = SUBJECTS[state.selectedSubjectKey] || { title: 'Assessment' };
    const percentage = results.percentage;

    // Subject Title & Score
    DOM.resultsSubjectTitle.textContent = `${subj.title} Assessment Completed!`;
    DOM.resultsScoreText.textContent = `${results.score} / ${results.totalQuestions}`;
    DOM.resultsPercentText.textContent = `${percentage}%`;

    // Performance Tier Badge & Message
    let badgeTier = 'developing';
    let badgeTextStr = 'Developing';
    let badgeIconStr = '💡';
    let feedbackStr = '';

    if (percentage >= 90) {
      badgeTier = 'mastery';
      badgeTextStr = 'Mastery / Outstanding';
      badgeIconStr = '🏆';
      feedbackStr = 'Exceptional mastery of intermediate concepts! You demonstrate strong analytical thinking and accurate problem-solving skills.';
    } else if (percentage >= 70) {
      badgeTier = 'proficient';
      badgeTextStr = 'Proficient / Good';
      badgeIconStr = '🌟';
      feedbackStr = 'Solid subject knowledge! A few revisions on core formulas and edge cases will elevate your score to full mastery.';
    } else if (percentage >= 50) {
      badgeTier = 'developing';
      badgeTextStr = 'Average / Developing';
      badgeIconStr = '💡';
      feedbackStr = 'Fair attempt! Review the targeted skill diagnostics and step-by-step solutions below to strengthen your conceptual foundation.';
    } else {
      badgeTier = 'needs-practice';
      badgeTextStr = 'Needs Improvement';
      badgeIconStr = '🎯';
      feedbackStr = 'Targeted practice recommended. Follow the actionable study recommendations below to reinforce key concepts before retaking.';
    }

    if (state.warnings >= 3) {
      feedbackStr = '⚠️ Cheating Violation Force-Submission: Maximum tab-switch penalty reached (3 Strikes). Assessment terminated and recorded.';
    } else if (isAutoSubmit) {
      feedbackStr += ' (Assessment was automatically submitted when time expired).';
    }

    DOM.resultsBadge.className = `performance-badge ${badgeTier}`;
    DOM.badgeIcon.textContent = badgeIconStr;
    DOM.badgeText.textContent = badgeTextStr;
    DOM.resultsFeedbackMsg.textContent = feedbackStr;

    // Metric Cards
    const incorrectCount = results.totalQuestions - results.score;
    DOM.metricAccuracy.textContent = `${percentage}%`;
    DOM.metricTime.textContent = formatTime(results.timeTakenSeconds);
    DOM.metricCorrectCount.textContent = results.score;
    DOM.metricIncorrectCount.textContent = incorrectCount;

    if (DOM.metricViolationsCount) {
      const violationsCount = state.warnings || results.tabSwitchViolations || results.violations || 0;
      DOM.metricViolationsCount.textContent = violationsCount;
      if (violationsCount >= 3) {
        DOM.metricViolationsCount.style.color = '#ef4444';
      } else if (violationsCount > 0) {
        DOM.metricViolationsCount.style.color = '#f59e0b';
      } else {
        DOM.metricViolationsCount.style.color = '#10b981';
      }
    }

    // Radial SVG Gauge
    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (percentage / 100) * circumference;
    DOM.gaugeProgressCircle.style.strokeDasharray = `${circumference}`;
    DOM.gaugeProgressCircle.style.strokeDashoffset = `${circumference}`;

    if (percentage >= 90) {
      DOM.gaugeProgressCircle.style.stroke = 'var(--success)';
    } else if (percentage >= 70) {
      DOM.gaugeProgressCircle.style.stroke = 'var(--primary)';
    } else if (percentage >= 50) {
      DOM.gaugeProgressCircle.style.stroke = 'var(--warning)';
    } else {
      DOM.gaugeProgressCircle.style.stroke = 'var(--danger)';
    }

    setTimeout(() => {
      DOM.gaugeProgressCircle.style.strokeDashoffset = `${offset}`;
    }, 100);

    // =======================================================================
    // Render Targeted Skill Diagnostics & Actionable Recommendations
    // =======================================================================
    renderSkillDiagnostics(results.skillDiagnostics || [], results.weakAreas || []);
    renderActionableRecommendations(results.recommendations || []);

    // Filter counts
    DOM.filterCountAll.textContent = results.totalQuestions;
    DOM.filterCountCorrect.textContent = results.score;
    DOM.filterCountIncorrect.textContent = incorrectCount;
    DOM.filterCountFlagged.textContent = state.flaggedQuestions.size;

    // Render Review Section
    renderDetailedReviewCards('all');
  }

  function renderSkillDiagnostics(diagnostics, weakAreas) {
    DOM.topicBarsList.innerHTML = '';
    DOM.diagnosticSummaryBadge.textContent = `${diagnostics.length} Concepts Analyzed`;

    if (diagnostics.length === 0) {
      DOM.topicBarsList.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.85rem;">No diagnostics available.</p>`;
      return;
    }

    diagnostics.forEach(diag => {
      const item = document.createElement('div');
      item.className = 'topic-bar-item';

      const isWeak = diag.accuracyPercent < 50;
      const statusClass = diag.accuracyPercent >= 80
        ? 'status-mastered'
        : diag.accuracyPercent >= 50
          ? 'status-proficient'
          : 'status-weak';
      const fillClass = diag.accuracyPercent >= 80
        ? 'fill-mastered'
        : diag.accuracyPercent >= 50
          ? 'fill-proficient'
          : 'fill-weak';
      const statusText = diag.accuracyPercent >= 80
        ? 'Mastered'
        : diag.accuracyPercent >= 50
          ? 'Proficient'
          : '⚠️ Weak Area (<50%)';

      item.innerHTML = `
        <div class="topic-bar-header">
          <span class="topic-bar-name">${escapeHtml(diag.topic)}</span>
          <div class="topic-bar-badges">
            <span class="topic-status-badge ${statusClass}">${statusText}</span>
            <span style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">
              ${diag.accuracyPercent}%
            </span>
          </div>
        </div>
        <div class="topic-bar-track">
          <div class="topic-bar-fill ${fillClass}" style="width: ${diag.accuracyPercent}%;"></div>
        </div>
      `;
      DOM.topicBarsList.appendChild(item);
    });
  }

  function renderActionableRecommendations(recommendations) {
    DOM.recommendationsList.innerHTML = '';

    if (recommendations.length === 0) {
      DOM.recommendationsList.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.85rem;">No recommendations generated.</p>`;
      return;
    }

    recommendations.forEach(rec => {
      const card = document.createElement('div');
      const isWeak = rec.topic !== 'Comprehensive Mastery';
      card.className = `recommendation-card ${isWeak ? 'is-weak' : ''}`;
      const icon = isWeak ? '⚠️' : '🌟';

      card.innerHTML = `
        <div class="rec-topic">
          <span>${icon}</span>
          <span>${escapeHtml(rec.topic)}</span>
        </div>
        <div class="rec-advice">${escapeHtml(rec.advice)}</div>
      `;
      DOM.recommendationsList.appendChild(card);
    });
  }

  function renderDetailedReviewCards(filter = 'all') {
    state.activeFilter = filter;
    DOM.filterTabBtns.forEach(btn => {
      const isActive = btn.dataset.filter === filter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    const detailedAnswers = state.lastSubmissionResult ? state.lastSubmissionResult.detailedAnswers : [];
    DOM.reviewCardsContainer.innerHTML = '';

    detailedAnswers.forEach((ans, idx) => {
      const isCorrect = ans.isCorrect;
      const isFlagged = state.flaggedQuestions.has(idx);

      if (filter === 'correct' && !isCorrect) return;
      if (filter === 'incorrect' && isCorrect) return;
      if (filter === 'flagged' && !isFlagged) return;

      const card = document.createElement('div');
      card.className = `review-card ${isCorrect ? 'correct' : 'incorrect'}`;

      const chosenText = (ans.options && ans.chosenOptionIndex !== null && ans.chosenOptionIndex !== undefined)
        ? ans.options[ans.chosenOptionIndex]
        : 'Unanswered / Skipped (0 marks)';
      const correctText = (ans.options && ans.correctOptionIndex !== null && ans.correctOptionIndex !== undefined)
        ? ans.options[ans.correctOptionIndex]
        : 'N/A';

      card.innerHTML = `
        <div class="review-header">
          <div class="review-q-meta">
            <span class="q-number-pill">Question ${idx + 1}</span>
            <span class="concept-tag">📌 ${escapeHtml(ans.topicTag || 'General')}</span>
            ${isFlagged ? '<span class="concept-tag" style="background: rgba(245, 158, 11, 0.15); color: var(--warning); border-color: var(--warning-border);">★ Flagged</span>' : ''}
          </div>
          <span class="review-status-tag ${isCorrect ? 'status-correct' : 'status-incorrect'}">
            ${isCorrect ? '✓ Correct' : '✕ Incorrect'}
          </span>
        </div>
        <h4 class="review-q-text">${escapeHtml(ans.questionText || '')}</h4>
        <div class="review-choices-grid">
          <div class="choice-comparison ${isCorrect ? 'is-correct' : 'is-wrong'}">
            <span class="choice-label">Your Response:</span>
            <span class="choice-text">${escapeHtml(chosenText)}</span>
          </div>
          ${!isCorrect ? `
            <div class="choice-comparison is-correct">
              <span class="choice-label">Correct Solution:</span>
              <span class="choice-text">${escapeHtml(correctText)}</span>
            </div>
          ` : ''}
        </div>
        <div class="explanation-box">
          <div class="exp-title">💡 Step-by-Step Explanation:</div>
          <div class="exp-content">${escapeHtml(ans.explanation || '')}</div>
        </div>
      `;
      DOM.reviewCardsContainer.appendChild(card);
    });

    if (DOM.reviewCardsContainer.children.length === 0) {
      DOM.reviewCardsContainer.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
          No questions match the "${filter}" filter.
        </div>
      `;
    }
  }

  // =========================================================================
  // Utilities
  // =========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // Teacher / Admin Portal Handlers
  // =========================================================================
  function openAdminPortal() {
    hideAdminAlert();
    switchAdminTab('add');
    if (DOM.modalAdminPortal) DOM.modalAdminPortal.classList.add('active');
  }

  function closeAdminPortal() {
    if (DOM.modalAdminPortal) DOM.modalAdminPortal.classList.remove('active');
  }

  function showAdminAlert(message, type = 'error') {
    if (!DOM.adminStatusAlert) return;
    DOM.adminStatusAlert.className = `admin-alert ${type}`;
    DOM.adminStatusAlert.textContent = message;
    DOM.adminStatusAlert.style.display = 'block';
  }

  function hideAdminAlert() {
    if (!DOM.adminStatusAlert) return;
    DOM.adminStatusAlert.style.display = 'none';
  }

  function switchAdminTab(tab) {
    hideAdminAlert();
    if (tab === 'add') {
      if (DOM.tabBtnAddQ) DOM.tabBtnAddQ.classList.add('active');
      if (DOM.tabBtnViewBank) DOM.tabBtnViewBank.classList.remove('active');
      if (DOM.formAdminAddQuestion) DOM.formAdminAddQuestion.style.display = 'flex';
      if (DOM.adminBankView) DOM.adminBankView.style.display = 'none';
    } else {
      if (DOM.tabBtnViewBank) DOM.tabBtnViewBank.classList.add('active');
      if (DOM.tabBtnAddQ) DOM.tabBtnAddQ.classList.remove('active');
      if (DOM.formAdminAddQuestion) DOM.formAdminAddQuestion.style.display = 'none';
      if (DOM.adminBankView) DOM.adminBankView.style.display = 'block';
      loadAdminQuestionBank();
    }
  }

  async function handleAdminAddQuestion(e) {
    e.preventDefault();
    hideAdminAlert();

    const subject = DOM.adminQSubject.value;
    const topicTag = DOM.adminQTopic.value.trim();
    const questionText = DOM.adminQText.value.trim();
    const options = [
      DOM.adminQOptA.value.trim(),
      DOM.adminQOptB.value.trim(),
      DOM.adminQOptC.value.trim(),
      DOM.adminQOptD.value.trim()
    ];
    const correctOption = parseInt(DOM.adminQCorrect.value, 10);
    const difficulty = DOM.adminQDifficulty ? DOM.adminQDifficulty.value : 'intermediate';
    const explanation = DOM.adminQExplanation.value.trim();

    if (!topicTag || !questionText || options.some(opt => !opt) || !explanation) {
      showAdminAlert('All question fields are required.');
      return;
    }

    try {
      DOM.btnAdminSaveQ.disabled = true;
      DOM.btnAdminSaveQ.innerHTML = '<span>Saving to Question Bank...</span> ⏳';

      const payload = {
        subject,
        topicTag,
        questionText,
        options,
        correctOption,
        difficulty,
        explanation
      };

      await window.API.addAdminQuestion(payload);

      showAdminAlert('Question successfully added to question bank!', 'success');
      showToast('Question successfully added to question bank!', 'success');
      playSound('complete');

      // Reset fields
      DOM.adminQTopic.value = '';
      DOM.adminQText.value = '';
      DOM.adminQOptA.value = '';
      DOM.adminQOptB.value = '';
      DOM.adminQOptC.value = '';
      DOM.adminQOptD.value = '';
      DOM.adminQExplanation.value = '';

      // Also add to client quizData if present so it immediately participates in quizzes
      const subjKey = subject.toLowerCase();
      if (typeof quizData !== 'undefined' && quizData[subjKey]) {
        quizData[subjKey].questions.push({
          id: Date.now(),
          question: questionText,
          options,
          correctIndex: correctOption,
          explanation,
          concept: topicTag,
          difficulty
        });
      }

      DOM.btnAdminSaveQ.disabled = false;
      DOM.btnAdminSaveQ.innerHTML = '<span>Save Question to Database</span> 💾';
    } catch (err) {
      DOM.btnAdminSaveQ.disabled = false;
      DOM.btnAdminSaveQ.innerHTML = '<span>Save Question to Database</span> 💾';
      showAdminAlert(err.message || 'Failed to insert question.');
      playSound('warning');
    }
  }

  async function loadAdminQuestionBank() {
    if (!DOM.bankQuestionsList) return;
    DOM.bankQuestionsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading questions from database...</div>';

    try {
      const data = await window.API.getAdminQuestions();
      const questions = data.questions || [];
      if (DOM.adminQCount) DOM.adminQCount.textContent = questions.length;

      const selectedSubject = DOM.bankFilterSubject ? DOM.bankFilterSubject.value : 'all';
      const filtered = selectedSubject === 'all'
        ? questions
        : questions.filter(q => q.subject.toLowerCase() === selectedSubject.toLowerCase());

      if (filtered.length === 0) {
        DOM.bankQuestionsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No questions found for this subject filter.</div>';
        return;
      }

      DOM.bankQuestionsList.innerHTML = '';
      filtered.forEach((q, idx) => {
        const item = document.createElement('div');
        item.className = 'bank-q-item';
        const optsHtml = (q.options || []).map((opt, oIdx) => {
          const isCorrect = oIdx === q.correct_option;
          return `<div class="bank-q-opt ${isCorrect ? 'correct' : ''}"><strong>${String.fromCharCode(65 + oIdx)}:</strong> ${escapeHtml(opt)} ${isCorrect ? '✓' : ''}</div>`;
        }).join('');

        item.innerHTML = `
          <div class="bank-q-meta">
            <span class="bank-q-subject">${escapeHtml(q.subject)}</span>
            <span class="bank-q-topic">📌 ${escapeHtml(q.topic_tag)}</span>
          </div>
          <div class="bank-q-text">${idx + 1}. ${escapeHtml(q.question_text)}</div>
          <div class="bank-q-options">${optsHtml}</div>
        `;
        DOM.bankQuestionsList.appendChild(item);
      });
    } catch (err) {
      DOM.bankQuestionsList.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--danger);">Failed to load questions: ${escapeHtml(err.message)}</div>`;
    }
  }

  // =========================================================================
  // Event Listeners & Initialization
  // =========================================================================
  function bindEvents() {
    // Theme & Audio
    DOM.btnToggleTheme.addEventListener('click', toggleTheme);
    DOM.btnToggleSound.addEventListener('click', toggleSound);

    // Brand Home link
    DOM.brandHomeLink.addEventListener('click', () => {
      playSound('click');
      switchView('welcome');
    });
    DOM.brandHomeLink.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        switchView('welcome');
      }
    });

    // Subject selection
    DOM.subjectCards.forEach(card => {
      card.addEventListener('click', () => {
        playSound('select');
        DOM.subjectCards.forEach(c => {
          c.classList.remove('selected');
          c.setAttribute('aria-checked', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');
        state.selectedSubjectKey = card.dataset.subject;
        updateSummaryText();
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Duration selection
    DOM.durationPills.forEach(pill => {
      pill.addEventListener('click', () => {
        playSound('select');
        DOM.durationPills.forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-checked', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-checked', 'true');
        state.durationMinutes = parseInt(pill.dataset.duration, 10) || 10;
        updateSummaryText();
      });
    });

    // Start Quiz button
    DOM.btnStartQuiz.addEventListener('click', startQuizSession);

    // Quiz Controls
    DOM.btnPrevQuestion.addEventListener('click', () => {
      navigateToQuestion(state.currentQuestionIndex - 1);
    });

    DOM.btnNextQuestion.addEventListener('click', () => {
      navigateToQuestion(state.currentQuestionIndex + 1);
    });

    DOM.btnToggleFlag.addEventListener('click', toggleFlagCurrentQuestion);

    DOM.btnOpenSubmitModal.addEventListener('click', openConfirmationModal);
    DOM.btnModalCancel.addEventListener('click', closeConfirmationModal);
    DOM.btnModalConfirm.addEventListener('click', () => submitQuiz(false));

    // Keyboard Shortcuts (1-4 for options, arrows for nav)
    document.addEventListener('keydown', (e) => {
      if (DOM.viewQuiz.classList.contains('active')) {
        if (e.key >= '1' && e.key <= '4') {
          selectOption(parseInt(e.key, 10) - 1);
        } else if (e.key.toLowerCase() === 'a') {
          selectOption(0);
        } else if (e.key.toLowerCase() === 'b') {
          selectOption(1);
        } else if (e.key.toLowerCase() === 'c') {
          selectOption(2);
        } else if (e.key.toLowerCase() === 'd') {
          selectOption(3);
        } else if (e.key === 'ArrowRight') {
          if (state.currentQuestionIndex < state.currentQuestions.length - 1) {
            navigateToQuestion(state.currentQuestionIndex + 1);
          }
        } else if (e.key === 'ArrowLeft') {
          if (state.currentQuestionIndex > 0) {
            navigateToQuestion(state.currentQuestionIndex - 1);
          }
        } else if (e.key.toLowerCase() === 'f') {
          toggleFlagCurrentQuestion();
        }
      }
    });

    // Results Actions
    DOM.btnRetakeQuiz.addEventListener('click', startQuizSession);
    DOM.btnChooseSubject.addEventListener('click', () => {
      playSound('click');
      switchView('welcome');
    });
    DOM.btnViewProfileFromResults.addEventListener('click', openProfileModal);

    DOM.btnPrintResults.addEventListener('click', () => {
      playSound('click');
      window.print();
    });

    // Review Filters
    DOM.filterTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        playSound('click');
        renderDetailedReviewCards(btn.dataset.filter);
      });
    });

    // Auth Modal Triggers
    DOM.btnOpenAuthModal.addEventListener('click', openAuthModal);
    DOM.btnCloseAuthModal.addEventListener('click', closeAuthModal);
    DOM.tabBtnLogin.addEventListener('click', () => switchAuthTab('login'));
    DOM.tabBtnRegister.addEventListener('click', () => switchAuthTab('register'));
    DOM.formLogin.addEventListener('submit', handleLoginSubmit);
    DOM.formRegister.addEventListener('submit', handleRegisterSubmit);

    // Forgot Password & Recovery Flow Triggers
    if (DOM.btnGotoForgot) DOM.btnGotoForgot.addEventListener('click', openRecoveryWorkflow);
    if (DOM.formRecoveryStep1) DOM.formRecoveryStep1.addEventListener('submit', handleRecoveryStep1Submit);
    if (DOM.btnRecoveryCancel1) DOM.btnRecoveryCancel1.addEventListener('click', () => switchAuthTab('login'));
    if (DOM.formRecoveryStep2) DOM.formRecoveryStep2.addEventListener('submit', handleRecoveryStep2Submit);
    if (DOM.btnRecoveryBackToStep1) DOM.btnRecoveryBackToStep1.addEventListener('click', () => setRecoveryStep(1));
    if (DOM.formRecoveryStep3) DOM.formRecoveryStep3.addEventListener('submit', handleRecoveryStep3Submit);
    if (DOM.btnRecoveryCancel3) DOM.btnRecoveryCancel3.addEventListener('click', () => switchAuthTab('login'));

    // 1-Click Demo Buttons
    DOM.btnDemoRohan.addEventListener('click', async () => {
      DOM.loginEmail.value = 'rohan@student.edu';
      DOM.loginPassword.value = 'student123';
      switchAuthTab('login');
      DOM.formLogin.requestSubmit();
    });

    DOM.btnDemoPriya.addEventListener('click', async () => {
      DOM.loginEmail.value = 'priya@student.edu';
      DOM.loginPassword.value = 'student123';
      switchAuthTab('login');
      DOM.formLogin.requestSubmit();
    });

    if (DOM.btnDemoTeacher) {
      DOM.btnDemoTeacher.addEventListener('click', async () => {
        DOM.loginEmail.value = 'teacher@school.com';
        DOM.loginPassword.value = 'teacher123';
        switchAuthTab('login');
        DOM.formLogin.requestSubmit();
      });
    }

    // Profile Modal Triggers
    DOM.btnOpenProfileModal.addEventListener('click', openProfileModal);
    DOM.btnCloseProfileModal.addEventListener('click', closeProfileModal);
    DOM.btnLogout.addEventListener('click', handleLogout);

    // Anti-Cheating & Fullscreen Event Triggers
    if (DOM.btnEnterFullscreen) DOM.btnEnterFullscreen.addEventListener('click', enterFullscreen);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (DOM.btnWarningUnderstand) {
      DOM.btnWarningUnderstand.addEventListener('click', () => {
        if (DOM.modalTabWarning) DOM.modalTabWarning.classList.remove('active');
        enterFullscreen();
      });
    }

    // Teacher / Admin Portal Event Triggers
    if (DOM.btnOpenAdminPortal) DOM.btnOpenAdminPortal.addEventListener('click', openAdminPortal);
    if (DOM.btnCloseAdminModal) DOM.btnCloseAdminModal.addEventListener('click', closeAdminPortal);
    if (DOM.tabBtnAddQ) DOM.tabBtnAddQ.addEventListener('click', () => switchAdminTab('add'));
    if (DOM.tabBtnViewBank) DOM.tabBtnViewBank.addEventListener('click', () => switchAdminTab('bank'));
    if (DOM.formAdminAddQuestion) DOM.formAdminAddQuestion.addEventListener('submit', handleAdminAddQuestion);
    if (DOM.btnRefreshBank) DOM.btnRefreshBank.addEventListener('click', loadAdminQuestionBank);
    if (DOM.bankFilterSubject) DOM.bankFilterSubject.addEventListener('change', loadAdminQuestionBank);

    // Past Attempt Modal Triggers
    DOM.btnCloseAttemptModal.addEventListener('click', closePastAttemptModal);

    // Close Modals on click outside
    [DOM.modalConfirm, DOM.modalAuth, DOM.modalProfile, DOM.modalAttemptDetail, DOM.modalTabWarning, DOM.modalAdminPortal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('active');
          }
        });
      }
    });
  }

  // =========================================================================
  // App Initialization
  // =========================================================================
  function init() {
    initTheme();
    updateSummaryText();
    bindEvents();
    initPasswordMatchWatchers();
    checkSession();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
