// scripts/update_navigation_ids.js
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let rawContent = fs.readFileSync(indexPath, 'utf8');

// Normalize to \n for consistent replacement
const isCRLF = rawContent.includes('\r\n');
let content = rawContent.replace(/\r\n/g, '\n');

console.log('Original index.html normalized length:', content.length);

const oldNavCategoriesStart = '      // Navigation Structure Specification\n      const NAV_CATEGORIES = [';
const oldNavCategoriesEnd = '\n      ];\n\n      return (\n        <header ref={navRef}';

const navStartIndex = content.indexOf(oldNavCategoriesStart);
const navEndIndex = content.indexOf(oldNavCategoriesEnd, navStartIndex);

if (navStartIndex === -1 || navEndIndex === -1) {
  console.error('Could not find NAV_CATEGORIES boundaries in index.html');
  console.log('navStartIndex:', navStartIndex, 'navEndIndex:', navEndIndex);
  process.exit(1);
}

const updatedNavCategories = `      // Navigation Structure Specification
      const NAV_CATEGORIES = [
        {
          id: 'dashboard',
          buttonId: 'btn-nav-cat-dashboard',
          title: 'Dashboard',
          icon: '📊',
          badge: null,
          items: [
            {
              id: 'overview',
              buttonId: 'btn-nav-overview',
              title: 'Overview',
              desc: 'Candidate progress, diagnostics & activity command center',
              icon: '📊',
              isActive: currentView === 'home' && dashboardTab === 'dashboard',
              action: () => {
                setCurrentView('home');
                setDashboardTab('dashboard');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'daily_test',
              buttonId: 'btn-nav-daily-test',
              title: 'Daily Test',
              desc: '10-minute placement challenge with instant scoring',
              icon: '⚡',
              badge: 'Refreshed',
              badgeColor: 'bg-amber-100 text-amber-800',
              isActive: false,
              action: () => {
                onStartDailyQuiz();
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'rankings',
              buttonId: 'btn-nav-leaderboard',
              title: 'Rankings',
              desc: 'Campus leaderboard & peer cohort percentiles',
              icon: '🏆',
              isActive: currentView === 'campus_leaderboard',
              action: () => {
                setCurrentView('campus_leaderboard');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            }
          ]
        },
        {
          id: 'practice',
          buttonId: 'btn-nav-cat-practice',
          title: 'Practice & Learn',
          icon: '🎯',
          badge: null,
          items: [
            {
              id: 'practice_tracks',
              buttonId: 'btn-nav-practice-tracks',
              title: 'Practice Tracks',
              desc: '36 sub-topic folders & 100 top recurring PYQs each',
              icon: '🎯',
              isActive: currentView === 'home' && dashboardTab === 'tracks',
              action: () => {
                setCurrentView('home');
                setDashboardTab('tracks');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'formulas',
              buttonId: 'btn-nav-formula-sheets',
              title: 'Formulas',
              desc: 'Slide-out formula cheat sheets & active flashcards',
              icon: '⚡',
              isActive: currentView === 'formula_sheets',
              action: () => {
                setCurrentView('formula_sheets');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'mock_papers',
              buttonId: 'btn-nav-placement-papers',
              title: 'Mock Papers',
              desc: 'Authentic company placement test papers',
              icon: '📑',
              isActive: false,
              action: () => {
                onOpenPlacementPapers();
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'bookmarks',
              buttonId: 'btn-nav-bookmarks',
              title: 'Bookmarks',
              desc: 'Saved tricky questions & revision notes vault',
              icon: '🔖',
              isActive: currentView === 'bookmarks',
              action: () => {
                setCurrentView('bookmarks');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            }
          ]
        },
        {
          id: 'career',
          buttonId: 'btn-nav-cat-career',
          title: 'Career & Jobs',
          icon: '💼',
          badge: 'Live',
          items: [
            {
              id: 'drives',
              buttonId: 'btn-nav-campus-drives',
              title: 'Drives',
              desc: 'Explore active verified campus placement drives',
              icon: '🏢',
              badge: 'Hiring',
              badgeColor: 'bg-emerald-100 text-emerald-800',
              isActive: currentView === 'jobs_portal',
              action: () => {
                setCurrentView('jobs_portal');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'applications',
              buttonId: 'btn-nav-my-applications',
              title: 'Applications',
              desc: 'Track multi-round visual progression & status',
              icon: '📋',
              isActive: currentView === 'student_applications',
              action: () => {
                setCurrentView('student_applications');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'recruiter',
              buttonId: 'btn-nav-recruiter-console',
              title: 'Recruiter',
              desc: 'Recruiter portal & candidate management console',
              icon: '👔',
              isActive: currentView === 'recruiter_console',
              action: () => {
                setCurrentView('recruiter_console');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            }
          ]
        },
        {
          id: 'interview',
          buttonId: 'btn-nav-cat-interview',
          title: 'Interview Prep',
          icon: '🎙️',
          badge: null,
          items: [
            {
              id: 'resume_ats',
              buttonId: 'btn-nav-resume-matcher',
              title: 'Resume ATS',
              desc: 'In-browser PDF parser & ATS keyword gap matcher',
              icon: '📄',
              isActive: currentView === 'resume_matcher',
              action: () => {
                setCurrentView('resume_matcher');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'ai_interview',
              buttonId: 'btn-nav-mock-interview',
              title: 'AI Interview',
              desc: 'Voice speech simulator with STAR rubric scoring',
              icon: '🎙️',
              badge: 'AI Speech',
              badgeColor: 'bg-purple-100 text-purple-800',
              isActive: currentView === 'mock_interview',
              action: () => {
                setCurrentView('mock_interview');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'interviews',
              buttonId: 'btn-nav-interview-center',
              title: 'Interviews',
              desc: 'Student interview schedule, RSVPs & slot negotiation',
              icon: '🎯',
              isActive: currentView === 'interview_center',
              action: () => {
                setCurrentView('interview_center');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'company_arena',
              buttonId: 'btn-nav-company-arena',
              title: 'Company Mock Arena',
              desc: 'TCS NQT, Infosys, Cognizant, Wipro, Accenture',
              icon: '🏢',
              badge: 'Timed',
              badgeColor: 'bg-indigo-100 text-indigo-800',
              isActive: currentView === 'company_mock_arena',
              action: () => {
                setCurrentView('company_mock_arena');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'timed_arena',
              buttonId: 'btn-nav-timed-arena',
              title: 'Timed Test Arena',
              desc: 'Anti-cheat proctored custom timed assessment arena',
              icon: '🛡️',
              isActive: false,
              action: () => {
                onOpenTimedArena();
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            }
          ]
        },
        {
          id: 'exam_hub',
          buttonId: 'btn-nav-competitive-exams',
          title: 'Exam Hub',
          icon: '🏛️',
          badge: null,
          items: [
            {
              id: 'gate',
              buttonId: 'btn-nav-exam-gate',
              title: 'GATE',
              desc: 'Computer Science & IT mock arena (MCQ, MSQ, NAT)',
              icon: '⚙️',
              isActive: currentView === 'competitive_exams',
              action: () => {
                onOpenExamCategory('engineering-entrance');
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'cat',
              buttonId: 'btn-nav-exam-cat',
              title: 'CAT',
              desc: 'Management entrance quantitative & DILR simulation',
              icon: '📈',
              isActive: currentView === 'competitive_exams',
              action: () => {
                onOpenExamCategory('management-entrance');
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'upsc',
              buttonId: 'btn-nav-exam-upsc',
              title: 'UPSC',
              desc: 'Civil Services preliminary & mains stage preparation',
              icon: '⚖️',
              isActive: currentView === 'competitive_exams',
              action: () => {
                onOpenExamCategory('civil-services');
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'banking',
              buttonId: 'btn-nav-exam-banking',
              title: 'Banking Exams (SBI/IBPS)',
              desc: 'Bank PO & Clerk quantitative practice & tests',
              icon: '🏦',
              isActive: currentView === 'competitive_exams',
              action: () => {
                onOpenExamCategory('banking-insurance');
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'planner',
              buttonId: 'btn-nav-study-planner',
              title: 'Study Planner',
              desc: 'Adaptive weekly study schedule & revision engine',
              icon: '📅',
              isActive: false,
              action: () => {
                onOpenExamSubView('planner');
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'tracker',
              buttonId: 'btn-nav-progress-tracker',
              title: 'Progress Tracker',
              desc: 'Multi-exam syllabus completion & time analytics',
              icon: '📊',
              isActive: false,
              action: () => {
                onOpenExamSubView('tracker');
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            }
          ]
        },
        {
          id: 'more',
          buttonId: 'btn-nav-cat-more',
          title: 'More',
          icon: '⋯',
          badge: null,
          items: [
            {
              id: 'compiler',
              buttonId: 'btn-nav-coding-sandbox',
              title: 'In-Browser Compiler',
              desc: 'Live Python, Java, C, C++ code sandbox with tests',
              icon: '💻',
              isActive: currentView === 'live_coding' || currentView === 'coding_sandbox',
              action: () => {
                setCurrentView('live_coding');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'ai_prep_suite',
              buttonId: 'btn-nav-ai-prep-suite',
              title: 'AI Prep Suite',
              desc: 'Round-specific targeted interview drills & rubric builder',
              icon: '🧠',
              isActive: currentView === 'ai_prep_suite',
              action: () => {
                setCurrentView('ai_prep_suite');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'profile_history',
              buttonId: 'btn-nav-user-profile',
              title: 'Profile & History',
              desc: 'Assessment attempt history & candidate profile',
              icon: '👤',
              isActive: false,
              action: () => {
                onOpenUserProfile();
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'settings',
              buttonId: 'btn-nav-user-settings',
              title: 'Settings',
              desc: 'Audio synthesis preferences, camera test & security',
              icon: '⚙️',
              isActive: false,
              action: () => {
                onOpenSettings();
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            }
          ]
        }
      ];`;

content = content.slice(0, navStartIndex) + updatedNavCategories + content.slice(navEndIndex + '\n      ];'.length);

// 2. Add id and data-testid to category buttons and dropdown items in CareerPathNavbar
content = content.replace(
  `<button\n                      onClick={() => {\n                        setActiveDropdown(isDropdownOpen ? null : category.id);\n                      }}\n                      className={\`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none \${`,
  `<button
                      id={category.buttonId || \`btn-nav-cat-\${category.id}\`}
                      data-testid={\`nav-cat-\${category.id}\`}
                      onClick={() => {
                        setActiveDropdown(isDropdownOpen ? null : category.id);
                      }}
                      className={\`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none \${`
);

content = content.replace(
  `<div\n                              key={item.id}\n                              onClick={item.action}\n                              className={\`px-3 py-2 mx-1.5 rounded-xl cursor-pointer transition flex items-start gap-2.5 group \${`,
  `<div
                              key={item.id}
                              id={item.buttonId || \`btn-nav-\${item.id}\`}
                              data-testid={\`nav-item-\${item.id}\`}
                              onClick={item.action}
                              className={\`px-3 py-2 mx-1.5 rounded-xl cursor-pointer transition flex items-start gap-2.5 group \${`
);

content = content.replace(
  `<div\n                            key={item.id}\n                            onClick={item.action}\n                            className={\`p-2 rounded-xl flex items-center justify-between cursor-pointer text-xs transition \${`,
  `<div
                            key={item.id}
                            id={\`mobile-\${item.buttonId || \`btn-nav-\${item.id}\`}\`}
                            data-testid={\`mobile-nav-item-\${item.id}\`}
                            onClick={item.action}
                            className={\`p-2 rounded-xl flex items-center justify-between cursor-pointer text-xs transition \${`
);

// 3. User menu button IDs
content = content.replace(
  `<button\n                  onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}\n                  className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 text-left cursor-pointer group focus:outline-none"`,
  `<button
                  id="btn-nav-user-menu"
                  onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
                  className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 text-left cursor-pointer group focus:outline-none"`
);

content = content.replace(
  `<button\n                        onClick={() => {\n                          onOpenUserProfile();\n                          setActiveDropdown(null);\n                        }}\n                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition flex items-center gap-2.5 cursor-pointer"`,
  `<button
                        id="btn-user-menu-profile"
                        onClick={() => {
                          onOpenUserProfile();
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition flex items-center gap-2.5 cursor-pointer"`
);

content = content.replace(
  `<button\n                        onClick={() => {\n                          onOpenSettings();\n                          setActiveDropdown(null);\n                        }}\n                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition flex items-center gap-2.5 cursor-pointer"`,
  `<button
                        id="btn-user-menu-settings"
                        onClick={() => {
                          onOpenSettings();
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition flex items-center gap-2.5 cursor-pointer"`
);

content = content.replace(
  `<button\n                        onClick={() => {\n                          setActiveDropdown(null);\n                          onSignOut();\n                        }}\n                        className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2.5 cursor-pointer"`,
  `<button
                        id="btn-user-menu-signout"
                        onClick={() => {
                          setActiveDropdown(null);
                          onSignOut();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2.5 cursor-pointer"`
);

// 4. Hamburger button ID
content = content.replace(
  `<button\n                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}\n                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"`,
  `<button
                id="btn-mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"`
);

// 5. Exam Hub Card and quick access IDs in CareerPathDashboard
content = content.replace(
  `{/* Card 1: Resume ATS */}\n                  <div\n                    onClick={onOpenResumeMatcher}`,
  `{/* Card 1: Resume ATS */}
                  <div
                    id="card-quick-resume-ats"
                    data-testid="card-quick-resume-ats"
                    onClick={onOpenResumeMatcher}`
);

content = content.replace(
  `{/* Card 2: AI Voice Interview */}\n                  <div\n                    onClick={onOpenMockInterview}`,
  `{/* Card 2: AI Voice Interview */}
                  <div
                    id="card-quick-mock-interview"
                    data-testid="card-quick-mock-interview"
                    onClick={onOpenMockInterview}`
);

content = content.replace(
  `{/* Card 3: Practice Tracks */}\n                  <div\n                    onClick={() => setDashboardTab('tracks')}`,
  `{/* Card 3: Practice Tracks */}
                  <div
                    id="card-quick-practice-tracks"
                    data-testid="card-quick-practice-tracks"
                    onClick={() => setDashboardTab('tracks')}`
);

content = content.replace(
  `{/* Card 4: Exam Hub */}\n                  <div\n                    onClick={onOpenExamHub}`,
  `{/* Card 4: Exam Hub */}
                  <div
                    id="btn-home-launch-exam-hub"
                    data-testid="card-quick-exam-hub"
                    onClick={onOpenExamHub}`
);

// Pre-write Balance Check:
const scriptMatch = content.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('Babel script not found!');
  process.exit(1);
}
const code = scriptMatch[1];
let b = 0, p = 0, k = 0;
for (let i = 0; i < code.length; i++) {
  const ch = code[i];
  if (ch === '{') b++;
  else if (ch === '}') b--;
  else if (ch === '(') p++;
  else if (ch === ')') p--;
  else if (ch === '[') k++;
  else if (ch === ']') k--;
  if (b < 0 || p < 0 || k < 0) {
    console.error('Negative depth at char ' + i + ': b=' + b + ', p=' + p + ', k=' + k);
    process.exit(1);
  }
}

if (b !== 0 || p !== 0 || k !== 0) {
  console.error('Non-zero balance: b=' + b + ', p=' + p + ', k=' + k);
  process.exit(1);
}

// Convert back to CRLF if file was CRLF originally
const output = isCRLF ? content.replace(/\n/g, '\r\n') : content;
fs.writeFileSync(indexPath, output, 'utf8');
console.log('Balance check passed! Successfully updated index.html! New length:', output.length);
