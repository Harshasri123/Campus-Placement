// scripts/inject_redesigned_ui.js
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

console.log('Original index.html length:', content.length);

// 1. Prepare CareerPathNavbar, CareerPathDashboard, UserProfileModal, UserSettingsModal
const componentsCode = `
    // =========================================================================
    // 1.5 REDESIGNED MODERN NAVIGATION BAR (5 MAIN CATEGORIES + MORE MENU)
    // =========================================================================
    function CareerPathNavbar({
      currentView,
      setCurrentView,
      dashboardTab,
      setDashboardTab,
      setSelectedTopicSlug,
      currentUser,
      onSignOut,
      onStartDailyQuiz,
      onOpenPlacementPapers,
      onOpenTimedArena,
      onOpenExamCategory,
      onOpenExamSubView,
      onOpenUserProfile,
      onOpenSettings
    }) {
      const [activeDropdown, setActiveDropdown] = useState(null); // 'dashboard' | 'practice' | 'career' | 'interview' | 'exam_hub' | 'more' | 'user' | null
      const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
      const [mobileExpandedSection, setMobileExpandedSection] = useState('dashboard');
      const navRef = useRef(null);

      // Close dropdown when clicking outside or pressing Escape
      useEffect(() => {
        const handleClickOutside = (e) => {
          if (navRef.current && !navRef.current.contains(e.target)) {
            setActiveDropdown(null);
          }
        };
        const handleKeyDown = (e) => {
          if (e.key === 'Escape') {
            setActiveDropdown(null);
            setMobileMenuOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
          document.removeEventListener('keydown', handleKeyDown);
        };
      }, []);

      // Determine active top-level category
      const getActiveCategory = () => {
        if ((currentView === 'home' && dashboardTab === 'dashboard') || currentView === 'landing' || currentView === 'campus_leaderboard') {
          return 'dashboard';
        }
        if ((currentView === 'home' && dashboardTab === 'tracks') || currentView === 'topic_folder' || currentView === 'formula_sheets' || currentView === 'bookmarks') {
          return 'practice';
        }
        if (['jobs_portal', 'student_applications', 'recruiter_console'].includes(currentView)) {
          return 'career';
        }
        if (['resume_matcher', 'mock_interview', 'interview_center', 'company_mock_arena', 'company_mock_test', 'company_mock_result', 'timed_arena'].includes(currentView)) {
          return 'interview';
        }
        if (currentView === 'competitive_exams') {
          return 'exam_hub';
        }
        if (['live_coding', 'coding_sandbox', 'ai_prep_suite'].includes(currentView)) {
          return 'more';
        }
        return 'dashboard';
      };

      const activeCategory = getActiveCategory();

      // Navigation Structure Specification
      const NAV_CATEGORIES = [
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: '📊',
          badge: null,
          items: [
            {
              id: 'overview',
              title: 'Overview',
              desc: 'Platform roadmap, tracks & curriculum guide',
              icon: '🌐',
              isActive: currentView === 'landing',
              action: () => {
                setCurrentView('landing');
                setSelectedTopicSlug(null);
                setActiveDropdown(null);
                setMobileMenuOpen(false);
              }
            },
            {
              id: 'daily_test',
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
          title: 'Practice & Learn',
          icon: '🎯',
          badge: null,
          items: [
            {
              id: 'practice_tracks',
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
          title: 'Career & Jobs',
          icon: '💼',
          badge: 'Live',
          items: [
            {
              id: 'drives',
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
          title: 'Interview Prep',
          icon: '🎙️',
          badge: null,
          items: [
            {
              id: 'resume_ats',
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
          title: 'Exam Hub',
          icon: '🏛️',
          badge: null,
          items: [
            {
              id: 'gate',
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
          title: 'More',
          icon: '⋯',
          badge: null,
          items: [
            {
              id: 'compiler',
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
      ];

      return (
        <header ref={navRef} className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            {/* 1. Left: Brand Logo & Tagline */}
            <div
              onClick={() => {
                setCurrentView('home');
                setDashboardTab('dashboard');
                setSelectedTopicSlug(null);
              }}
              className="cursor-pointer select-none flex-shrink-0"
              title="CareerPath - Campus to Career"
            >
              <CareerPathLogo size="md" showTagline={true} />
            </div>

            {/* 2. Center: Desktop 5 Main Navigation Categories + More Menu */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-xs font-bold">
              {NAV_CATEGORIES.map((category) => {
                const isCatActive = activeCategory === category.id;
                const isDropdownOpen = activeDropdown === category.id;

                return (
                  <div key={category.id} className="relative">
                    <button
                      onClick={() => {
                        setActiveDropdown(isDropdownOpen ? null : category.id);
                      }}
                      className={\`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none \${
                        isCatActive
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                      }\`}
                      title={\`\${category.title} options\`}
                    >
                      <span className="text-sm">{category.icon}</span>
                      <span>{category.title}</span>
                      {category.badge && (
                        <span className="text-[9px] font-extrabold uppercase bg-emerald-500 text-white px-1.5 py-0.2 rounded-full">
                          {category.badge}
                        </span>
                      )}
                      <span
                        className={\`text-[10px] text-slate-400 transform transition-transform duration-200 ml-0.5 \${
                          isDropdownOpen ? 'rotate-180 text-indigo-600' : ''
                        }\`}
                      >
                        ▼
                      </span>
                    </button>

                    {/* Smooth Dropdown Panel */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2.5 z-50 animate-fade-in divide-y divide-slate-100">
                        <div className="px-3.5 py-1.5 flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                          <span>{category.title} Features</span>
                          <span className="text-[10px] lowercase font-normal text-slate-400">esc to close</span>
                        </div>
                        <div className="pt-1.5 space-y-1">
                          {category.items.map((item) => (
                            <div
                              key={item.id}
                              onClick={item.action}
                              className={\`px-3 py-2 mx-1.5 rounded-xl cursor-pointer transition flex items-start gap-2.5 group \${
                                item.isActive
                                  ? 'bg-indigo-50/90 text-indigo-900 font-extrabold border-l-4 border-indigo-600'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }\`}
                            >
                              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-700 flex items-center justify-center text-sm shrink-0 transition">
                                {item.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition leading-tight">
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span
                                      className={\`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md \${
                                        item.badgeColor || 'bg-indigo-100 text-indigo-800'
                                      }\`}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-1 leading-normal mt-0.5">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* 3. Right: Notifications, User Profile & Mobile Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Real-time Recruitment Notification Bell Drawer */}
              <NotificationBellDrawer
                currentUser={currentUser}
                onNavigate={(type) => {
                  if (type === 'INTERVIEW_INVITED' || type === 'INTERVIEW_CONFIRMED' || type === 'INTERVIEW_RESCHEDULE_REQ') {
                    setCurrentView('interview_center');
                  } else if (type === 'OFFER_ISSUED' || type === 'APPLICATION_STATUS_UPDATED') {
                    setCurrentView('student_applications');
                  }
                }}
              />

              {/* User Profile Menu Dropdown (Desktop & Tablet) */}
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
                  className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 text-left cursor-pointer group focus:outline-none"
                  title="My Account"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-black text-xs shadow-xs group-hover:shadow-md transition">
                    {(currentUser.fullName || currentUser.emailOrMobile || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left text-xs">
                    <span className="font-extrabold text-slate-800 block leading-tight max-w-[130px] truncate group-hover:text-indigo-600 transition">
                      {currentUser.fullName || currentUser.emailOrMobile || currentUser.email || 'Candidate'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Batch 2026</span>
                  </div>
                  <span className="hidden sm:inline text-[10px] text-slate-400 group-hover:text-indigo-600 transition">
                    ▼
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {activeDropdown === 'user' && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2.5 z-50 animate-fade-in divide-y divide-slate-100">
                    <div className="px-4 py-2">
                      <p className="text-xs font-black text-slate-900 leading-tight">
                        {currentUser.fullName || 'Campus Candidate'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        {currentUser.emailOrMobile || currentUser.email || 'student@careerpath.edu'}
                      </p>
                      <span className="inline-block mt-1.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Verified Student
                      </span>
                    </div>

                    <div className="py-1.5">
                      <button
                        onClick={() => {
                          onOpenUserProfile();
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition flex items-center gap-2.5 cursor-pointer"
                      >
                        <span>👤</span>
                        <span>View Profile & History</span>
                      </button>
                      <button
                        onClick={() => {
                          onOpenSettings();
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition flex items-center gap-2.5 cursor-pointer"
                      >
                        <span>⚙️</span>
                        <span>Account Settings & Security</span>
                      </button>
                    </div>

                    <div className="pt-1.5">
                      <button
                        onClick={() => {
                          setActiveDropdown(null);
                          onSignOut();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2.5 cursor-pointer"
                      >
                        <span>🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? (
                  <span className="text-lg font-black leading-none block">✕</span>
                ) : (
                  <span className="text-lg font-black leading-none block">☰</span>
                )}
              </button>
            </div>
          </div>

          {/* 4. Mobile Navigation Drawer (Full Responsive Collapsible Drawer) */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 py-3 max-h-[85vh] overflow-y-auto space-y-3 animate-fade-in">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">
                Navigation Categories
              </div>

              {NAV_CATEGORIES.map((category) => {
                const isCatActive = activeCategory === category.id;
                const isExpanded = mobileExpandedSection === category.id;

                return (
                  <div key={category.id} className="border border-slate-200/80 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setMobileExpandedSection(isExpanded ? null : category.id)}
                      className={\`w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs font-extrabold transition cursor-pointer \${
                        isCatActive ? 'bg-indigo-50/90 text-indigo-700' : 'bg-slate-50/70 text-slate-800'
                      }\`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{category.icon}</span>
                        <span>{category.title}</span>
                      </div>
                      <span className="text-xs text-slate-400">{isExpanded ? '▲' : '▼'}</span>
                    </button>

                    {isExpanded && (
                      <div className="p-2 space-y-1 bg-white border-t border-slate-100">
                        {category.items.map((item) => (
                          <div
                            key={item.id}
                            onClick={item.action}
                            className={\`p-2 rounded-xl flex items-center justify-between cursor-pointer text-xs transition \${
                              item.isActive ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                            }\`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span>{item.icon}</span>
                              <div>
                                <span className="font-bold block leading-tight">{item.title}</span>
                                <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                              </div>
                            </div>
                            {item.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Mobile Quick Account Actions */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenUserProfile();
                  }}
                  className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                >
                  👤 My Profile & History
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut();
                  }}
                  className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          )}
        </header>
      );
    }

    // =========================================================================
    // 1.6 REDESIGNED MODERN DASHBOARD UI COMPONENT
    // =========================================================================
    function CareerPathDashboard({
      currentUser,
      stats,
      dashboardTab,
      setDashboardTab,
      onStartDailyQuiz,
      onOpenPlacementPapers,
      onOpenCompanyArena,
      onOpenResumeMatcher,
      onOpenMockInterview,
      onOpenExamHub,
      onOpenCompiler,
      onOpenLeaderboard,
      onOpenJobsPortal,
      onOpenInterviewCenter,
      onSelectTopicFolder,
      sectionsData,
      searchQuery,
      setSearchQuery,
      activeSectionFilter,
      setActiveSectionFilter,
      TRACKS,
      handleStartTrackPractice
    }) {
      // Dynamic greeting based on current local hour
      const currentHour = new Date().getHours();
      const timeOfDayGreeting =
        currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

      const userName = currentUser.fullName || currentUser.emailOrMobile || currentUser.email || 'Candidate';

      return (
        <div className="space-y-8 animate-fade-in">
          {/* 1. Welcome Persona Hero Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-800">
            <div className="relative z-10 max-w-4xl">
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-400/30">
                  Career Readiness Command Center
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  Campus to Career 2026
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                {timeOfDayGreeting}, {userName}! 👋
              </h2>

              <p className="text-slate-300 text-xs md:text-sm mt-1.5 leading-relaxed max-w-2xl">
                Track your real-time placement progress, master 100+ recurring previous-year questions per topic, and target tier-1 campus recruitment drives and national competitive exams.
              </p>

              {/* Persona Status & Key Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                {/* 1. Learning Streak */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <div className="flex items-center justify-between text-xs text-amber-300 font-bold mb-1">
                    <span>🔥 Active Streak</span>
                    <span>5 Days</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-2 text-[10px] font-bold text-slate-300">
                    <span className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center font-black">M</span>
                    <span className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center font-black">T</span>
                    <span className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center font-black">W</span>
                    <span className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center font-black">T</span>
                    <span className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center font-black">F</span>
                    <span className="w-5 h-5 rounded-md bg-white/20 text-slate-400 flex items-center justify-center">S</span>
                    <span className="w-5 h-5 rounded-md bg-white/20 text-slate-400 flex items-center justify-center">S</span>
                  </div>
                </div>

                {/* 2. Overall Preparation Readiness */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                  <span className="text-xs text-indigo-200 block font-semibold">Readiness Score</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-white font-mono">84%</span>
                    <span className="text-[10px] text-emerald-400 font-bold">● High</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                    <div className="bg-gradient-to-r from-emerald-400 to-indigo-400 h-1.5 rounded-full" style={{ width: '84%' }}></div>
                  </div>
                </div>

                {/* 3. Curated Question Bank */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
                  <span className="text-xs text-indigo-200 block font-semibold">Curated PYQ Bank</span>
                  <span className="text-2xl font-black text-amber-300 font-mono mt-0.5 block">3,600+</span>
                  <span className="text-[10px] text-slate-300 block mt-0.5">36 Sub-Topic Folders</span>
                </div>

                {/* 4. Questions Practiced */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
                  <span className="text-xs text-indigo-200 block font-semibold">Questions Practiced</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
                    {stats.completedQuestions || 142}
                  </span>
                  <span className="text-[10px] text-blue-200 block mt-0.5">
                    {stats.bookmarkedCount || 18} Bookmarked
                  </span>
                </div>
              </div>
            </div>

            {/* Glowing background decorations */}
            <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute right-1/3 -top-10 w-48 h-48 bg-blue-600/15 rounded-full blur-2xl pointer-events-none"></div>
          </div>

          {/* 2. Interactive Navigation Mode Selector Pills */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1.5 rounded-2xl text-xs font-bold shadow-2xs">
              <button
                onClick={() => setDashboardTab('dashboard')}
                className={\`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 \${
                  dashboardTab === 'dashboard'
                    ? 'bg-white text-indigo-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
              >
                <span>📊</span>
                <span>Dashboard Overview</span>
              </button>
              <button
                onClick={() => setDashboardTab('tracks')}
                className={\`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 \${
                  dashboardTab === 'tracks'
                    ? 'bg-white text-indigo-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
              >
                <span>🎯</span>
                <span>Practice Tracks (36 Folders)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onStartDailyQuiz}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>⚡</span>
                <span>Launch Today's Quiz</span>
              </button>
              <button
                onClick={onOpenCompanyArena}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>🏢</span>
                <span>Mock Arena</span>
              </button>
            </div>
          </div>

          {/* 3. VIEW MODE A: DASHBOARD OVERVIEW */}
          {dashboardTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              {/* Quick-Access Cards Grid (The 4 Core Pillars Requested) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <span>⚡</span> Quick-Access Preparation Centers
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">1-Click Launch</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Resume ATS */}
                  <div
                    onClick={onOpenResumeMatcher}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition">
                        📄
                      </div>
                      <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider block">
                        AI Keyword Optimizer
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">Resume vs. JD Matcher</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        In-browser PDF parser comparing your CV against campus JDs with ATS compatibility score.
                      </p>
                    </div>
                    <span className="mt-4 text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                      Analyze Resume →
                    </span>
                  </div>

                  {/* Card 2: AI Voice Interview */}
                  <div
                    onClick={onOpenMockInterview}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition">
                        🎙️
                      </div>
                      <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider block">
                        Speech STT & TTS
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">AI Interview Simulator</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Split-screen voice oral interview simulator with dynamic follow-up probing & STAR rubric scoring.
                      </p>
                    </div>
                    <span className="mt-4 text-xs font-bold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                      Start Mock Interview →
                    </span>
                  </div>

                  {/* Card 3: Practice Tracks */}
                  <div
                    onClick={() => setDashboardTab('tracks')}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition">
                        🎯
                      </div>
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider block">
                        3,600+ PYQs & Formulas
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">Practice Tracks & PYQs</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        36 curated sub-topic folders across Quantitative, Logical, Verbal & Tech coding with solutions.
                      </p>
                    </div>
                    <span className="mt-4 text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                      Browse 36 Folders →
                    </span>
                  </div>

                  {/* Card 4: Exam Hub */}
                  <div
                    onClick={onOpenExamHub}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition">
                        🏛️
                      </div>
                      <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block">
                        TCS-iON / NTA Pattern
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">Competitive Exam Hub</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Real-time timed arenas with KaTeX math rendering and time-loss analytics for GATE, CAT, UPSC, Banking.
                      </p>
                    </div>
                    <span className="mt-4 text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                      Enter Exam Hub →
                    </span>
                  </div>
                </div>
              </div>

              {/* Two-Column Core Activity & Progress Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column A (7 Cols): Overall Preparation Progress & Recent Scores & Recommendations */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Card 1: Overall Preparation Progress */}
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <h4 className="font-black text-slate-900 text-base">Overall Preparation Progress</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Skill mastery & syllabus coverage index</p>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        84% Overall Index
                      </span>
                    </div>

                    <div className="space-y-4 mt-5">
                      {/* Metric 1: Quantitative Aptitude */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <span>📊</span> Quantitative Aptitude (Arithmetic & DI)
                          </span>
                          <span className="text-indigo-600 font-mono">78% • Proficient</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                      </div>

                      {/* Metric 2: Logical Reasoning */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <span>🧩</span> Logical Reasoning & Analytical Puzzles
                          </span>
                          <span className="text-emerald-600 font-mono">88% • Mastered</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                        </div>
                      </div>

                      {/* Metric 3: Verbal Ability */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <span>📖</span> Verbal Ability & Reading Comprehension
                          </span>
                          <span className="text-purple-600 font-mono">92% • Mastered</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-gradient-to-r from-purple-500 to-violet-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                      </div>

                      {/* Metric 4: Core Computer Science */}
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <span>💻</span> Core Computer Science (OS, DBMS, DSA)
                          </span>
                          <span className="text-amber-600 font-mono">70% • Active Practice</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Recent Test Scores */}
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-black text-slate-900 text-base">Recent Test Scores & Diagnostics</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Evaluated with automatic weak area detection</p>
                      </div>
                      <span className="text-xs font-bold text-slate-400">Last 3 Attempts</span>
                    </div>

                    <div className="space-y-3 mt-4">
                      {/* Attempt 1 */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition border border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                            88%
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                              TCS NQT National Mock #1
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>⏱️ 58m</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold">Mastered</span>
                              <span>•</span>
                              <span className="text-slate-400">Weak: Permutations</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={onOpenCompanyArena}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                        >
                          Review →
                        </button>
                      </div>

                      {/* Attempt 2 */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition border border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                            90%
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                              Daily Placement Challenge
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>⏱️ 8m</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold">10/10 Correct</span>
                              <span>•</span>
                              <span className="text-slate-400">Yesterday</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={onStartDailyQuiz}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                        >
                          Retake →
                        </button>
                      </div>

                      {/* Attempt 3 */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition border border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center shrink-0">
                            75%
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                              Quantitative Diagnostic Test
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>⏱️ 22m</span>
                              <span>•</span>
                              <span className="text-amber-700 font-semibold">Needs Revision</span>
                              <span>•</span>
                              <span className="text-slate-400">Weak: Speed & Distance</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setDashboardTab('tracks')}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                        >
                          Practice →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Recommended Practice Activities */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-3xl border border-indigo-100 p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-indigo-100/80">
                      <div>
                        <h4 className="font-black text-indigo-950 text-base flex items-center gap-1.5">
                          <span>🎯</span> Recommended Practice Activities
                        </h4>
                        <p className="text-xs text-indigo-700 mt-0.5">
                          Personalized drills targeting your identified weak areas
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-200/60 text-indigo-900 px-2.5 py-1 rounded-full">
                        AI Targeted
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                      {/* Rec 1 */}
                      <div
                        onClick={() => setDashboardTab('tracks')}
                        className="p-3.5 bg-white rounded-2xl border border-indigo-100 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-lg block mb-1">⚡</span>
                          <span className="text-xs font-bold text-slate-900 block leading-snug">
                            Time, Speed & Distance Shortcuts
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1">
                            High probability in TCS NQT & Cognizant.
                          </p>
                        </div>
                        <span className="mt-3 text-[11px] font-bold text-indigo-600">Solve 10 PYQs →</span>
                      </div>

                      {/* Rec 2 */}
                      <div
                        onClick={() => setDashboardTab('tracks')}
                        className="p-3.5 bg-white rounded-2xl border border-indigo-100 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-lg block mb-1">🧩</span>
                          <span className="text-xs font-bold text-slate-900 block leading-snug">
                            Syllogisms & Seating Arrangements
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Critical for Infosys DSE & Wipro NTH.
                          </p>
                        </div>
                        <span className="mt-3 text-[11px] font-bold text-indigo-600">Practice Drills →</span>
                      </div>

                      {/* Rec 3 */}
                      <div
                        onClick={onOpenCompiler}
                        className="p-3.5 bg-white rounded-2xl border border-indigo-100 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-lg block mb-1">💻</span>
                          <span className="text-xs font-bold text-slate-900 block leading-snug">
                            BST Traversal & Edge Cases
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Live compiler code verification.
                          </p>
                        </div>
                        <span className="mt-3 text-[11px] font-bold text-indigo-600">Open Sandbox →</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column B (5 Cols): Daily Challenge, Upcoming Activities & Leaderboard */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Daily Placement Challenge Card */}
                  <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl border border-indigo-400/30 relative overflow-hidden">
                    <span className="bg-white/20 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full border border-white/20 text-yellow-300">
                      ⚡ Daily Placement Challenge
                    </span>
                    <h3 className="text-xl font-black mt-2.5 tracking-tight">Today's Placement Test</h3>
                    <p className="text-indigo-100 text-xs mt-1.5 leading-relaxed">
                      10 fresh questions curated daily across Quantitative Aptitude, Logical Reasoning & Coding.
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs font-semibold text-indigo-200">
                      <span>⏱️ 10 Minutes</span>
                      <span>•</span>
                      <span>🎯 10 Qs</span>
                      <span>•</span>
                      <span>🛡️ Monitored</span>
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                      <button
                        onClick={onStartDailyQuiz}
                        className="w-full bg-white text-indigo-700 font-black px-5 py-3 rounded-2xl hover:bg-yellow-300 hover:text-slate-900 shadow-md transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>⚡ Start Daily Test</span>
                      </button>
                      <button
                        onClick={onOpenPlacementPapers}
                        className="w-full bg-indigo-900/60 hover:bg-indigo-900 text-white font-bold px-4 py-3 rounded-2xl border border-indigo-400/40 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>📑 Papers</span>
                      </button>
                    </div>
                  </div>

                  {/* Upcoming Tests & Scheduled Activities Card */}
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-black text-slate-900 text-base">Upcoming Activities</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Scheduled tests & drive deadlines</p>
                      </div>
                      <span className="text-xs font-bold text-slate-400">📅 Calendar</span>
                    </div>

                    <div className="space-y-3 mt-4">
                      {/* Activity 1 */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="text-lg">🏢</span>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                              TCS NQT National Mock Simulation
                            </span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              Sectional Timed Arena • 75 Mins
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={onOpenCompanyArena}
                          className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition whitespace-nowrap cursor-pointer"
                        >
                          Launch
                        </button>
                      </div>

                      {/* Activity 2 */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="text-lg">💼</span>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                              Infosys DSE Campus Drive
                            </span>
                            <span className="text-[11px] text-rose-500 font-semibold block mt-0.5">
                              Application Closes in 2 Days
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={onOpenJobsPortal}
                          className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition whitespace-nowrap cursor-pointer"
                        >
                          View
                        </button>
                      </div>

                      {/* Activity 3 */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="text-lg">🎯</span>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                              Technical Round 1 (Cognizant)
                            </span>
                            <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                              Slot RSVP Confirmed
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={onOpenInterviewCenter}
                          className="px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition whitespace-nowrap cursor-pointer"
                        >
                          Prep
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Campus Leaderboard Cohort Standing */}
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-black text-slate-900 text-base">Campus Leaderboard Standing</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Percentile rank vs 1,280 college peers</p>
                      </div>
                      <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                        🏆 Top 2%
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white font-black text-sm flex items-center justify-center">
                          #14
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block leading-tight">
                            {userName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            2,840 XP • 86.4% Accuracy
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={onOpenLeaderboard}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                      >
                        View Board →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. VIEW MODE B: PRACTICE TRACKS & 36 SUB-TOPIC FOLDERS */}
          {dashboardTab === 'tracks' && (
            <div className="space-y-8 animate-fade-in">
              {/* Multi-Tier Practice Tracks & Syllabus */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Choose Your Practice Track</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Multi-tier preparation tracks aligned with IT campus recruitment and competitive exam patterns.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {TRACKS.map((track) => (
                    <div
                      key={track.title}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-200 p-5 flex flex-col justify-between hover:border-indigo-300"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">{track.icon}</span>
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-base">{track.title}</h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{track.categoryKey}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {track.subCategories.map((sub) => (
                            <button
                              key={sub}
                              onClick={() => handleStartTrackPractice(track, sub)}
                              className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-md transition text-left"
                              title={\`Practice \${sub}\`}
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
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-2"
                          >
                            📑 View Placement Papers
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartTrackPractice(track)}
                            className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-2"
                          >
                            🚀 Start Practice
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
                      className={\`px-3 py-1.5 rounded-lg transition \${activeSectionFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }\`}
                    >
                      All (36)
                    </button>
                    <button
                      onClick={() => setActiveSectionFilter('Arithmetic Aptitude')}
                      className={\`px-3 py-1.5 rounded-lg transition \${activeSectionFilter === 'Arithmetic Aptitude' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }\`}
                    >
                      Arithmetic (11)
                    </button>
                    <button
                      onClick={() => setActiveSectionFilter('Data Interpretation')}
                      className={\`px-3 py-1.5 rounded-lg transition \${activeSectionFilter === 'Data Interpretation' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }\`}
                    >
                      DI (5)
                    </button>
                    <button
                      onClick={() => setActiveSectionFilter('Verbal Ability')}
                      className={\`px-3 py-1.5 rounded-lg transition \${activeSectionFilter === 'Verbal Ability' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }\`}
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
                        <span className={\`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border \${sectionBadgeColor}\`}>
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
                            onClick={() => onSelectTopicFolder(t.slug)}
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
                                  style={{ width: \`\${pct}%\` }}
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
        </div>
      );
    }

    // =========================================================================
    // 1.7 USER PROFILE & ASSESSMENT HISTORY MODAL
    // =========================================================================
    function UserProfileModal({ isOpen, onClose, user, onSignOut }) {
      if (!isOpen || !user) return null;

      const userName = user.fullName || user.emailOrMobile || user.email || 'Candidate';
      const userEmail = user.emailOrMobile || user.email || 'student@careerpath.edu';

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-black text-xl flex items-center justify-center shadow-md">
                  {userName[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{userName}</h3>
                  <p className="text-xs text-slate-500 font-medium">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto my-4 space-y-5 pr-1 flex-1">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase block">Tests Taken</span>
                  <span className="text-2xl font-black text-indigo-600">8 Completed</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase block">Average Score</span>
                  <span className="text-2xl font-black text-emerald-600">84.5%</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center col-span-2 sm:col-span-1">
                  <span className="text-xs font-bold text-slate-500 uppercase block">Security Setup</span>
                  <span className="text-xs font-bold text-slate-700 mt-1 inline-block bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    🛡️ Verified
                  </span>
                </div>
              </div>

              {/* Assessment History Table */}
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm mb-2.5">Recent Assessment Attempts</h4>
                <div className="space-y-2.5">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">TCS NQT National Mock #1</span>
                      <span className="text-[11px] text-slate-400">Sectional Lockout Arena • 58 Mins</span>
                    </div>
                    <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl">88% (22/25)</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">Daily Placement Challenge</span>
                      <span className="text-[11px] text-slate-400">10 Questions Refreshed Daily • 8 Mins</span>
                    </div>
                    <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">90% (9/10)</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">Quantitative Diagnostic Test</span>
                      <span className="text-[11px] text-slate-400">Arithmetic & DI • 22 Mins</span>
                    </div>
                    <span className="font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl">75% (15/20)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition cursor-pointer"
              >
                🚪 Sign Out
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-indigo-600 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    // =========================================================================
    // 1.8 USER SETTINGS & AUDIO SYNTHESIS PREFERENCES MODAL
    // =========================================================================
    function UserSettingsModal({ isOpen, onClose }) {
      const [ttsRate, setTtsRate] = useState(1.0);
      const [aiVoiceGender, setAiVoiceGender] = useState('female');
      const [notificationAlerts, setNotificationAlerts] = useState(true);
      const [proctoringCamCheck, setProctoringCamCheck] = useState(true);

      if (!isOpen) return null;

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⚙️</span>
                <h3 className="text-lg font-black text-slate-900">Platform Settings & Security</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Setting 1: Speech rate */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>🎙️ AI Mock Interview Speech Rate</span>
                  <span className="font-mono text-indigo-600">{ttsRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.4"
                  step="0.1"
                  value={ttsRate}
                  onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0.8x (Slower)</span>
                  <span>1.0x (Normal)</span>
                  <span>1.4x (Faster)</span>
                </div>
              </div>

              {/* Setting 2: AI Voice persona */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">AI Interviewer Voice</span>
                  <span className="text-[10px] text-slate-400">Web Speech API Voice Persona</span>
                </div>
                <select
                  value={aiVoiceGender}
                  onChange={(e) => setAiVoiceGender(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="female">Natural Female</option>
                  <option value="male">Natural Male</option>
                </select>
              </div>

              {/* Setting 3: Camera check */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Proctoring Pre-Flight Check</span>
                  <span className="text-[10px] text-slate-400">Auto-verify camera/mic before timed tests</span>
                </div>
                <input
                  type="checkbox"
                  checked={proctoringCamCheck}
                  onChange={(e) => setProctoringCamCheck(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Setting 4: Drive notifications */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Recruitment Alerts</span>
                  <span className="text-[10px] text-slate-400">Real-time interview and offer notifications</span>
                </div>
                <input
                  type="checkbox"
                  checked={notificationAlerts}
                  onChange={(e) => setNotificationAlerts(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      );
    }
`;

// Insert the new components right before function App() {
const appAnchor = '// =========================================================================\n    // 2. MAIN APP COMPONENT\n    // =========================================================================\n    function App() {';
if (!content.includes(appAnchor)) {
  console.error('Could not locate App component anchor!');
  process.exit(1);
}

content = content.replace(appAnchor, componentsCode + '\n' + appAnchor);

// Now in App(): add dashboardTab, showUserProfileModal, showSettingsModal, activeExamCategory, activeExamSubView states
const stateAnchor = "const [currentView, setCurrentView] = useState('landing');\n      const [selectedTopicSlug, setSelectedTopicSlug] = useState(null);";
const newStates = `const [currentView, setCurrentView] = useState('landing');
      const [selectedTopicSlug, setSelectedTopicSlug] = useState(null);
      const [dashboardTab, setDashboardTab] = useState('dashboard'); // 'dashboard' | 'tracks'
      const [showUserProfileModal, setShowUserProfileModal] = useState(false);
      const [showSettingsModal, setShowSettingsModal] = useState(false);
      const [activeExamCategory, setActiveExamCategory] = useState('ALL');
      const [activeExamSubView, setActiveExamSubView] = useState('hub');`;

content = content.replace(stateAnchor, newStates);

// Replace header block with CareerPathNavbar
const oldHeaderStart = '<header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">';
const oldHeaderEnd = '</header>';
const headerStartIndex = content.indexOf(oldHeaderStart);
const headerEndIndex = content.indexOf(oldHeaderEnd, headerStartIndex);

if (headerStartIndex === -1 || headerEndIndex === -1) {
  console.error('Could not find header boundaries in index.html!');
  process.exit(1);
}

const newNavbarCall = `<CareerPathNavbar
            currentView={currentView}
            setCurrentView={setCurrentView}
            dashboardTab={dashboardTab}
            setDashboardTab={setDashboardTab}
            setSelectedTopicSlug={setSelectedTopicSlug}
            currentUser={currentUser}
            onSignOut={handleSignOut}
            onStartDailyQuiz={handleStartDailyQuiz}
            onOpenPlacementPapers={() => setShowPlacementModal(true)}
            onOpenTimedArena={() => setShowDirectArenaModal(true)}
            onOpenExamCategory={(categorySlug) => {
              setActiveExamCategory(categorySlug);
              setActiveExamSubView('hub');
              setCurrentView('competitive_exams');
              setSelectedTopicSlug(null);
            }}
            onOpenExamSubView={(subView) => {
              setActiveExamSubView(subView);
              setCurrentView('competitive_exams');
              setSelectedTopicSlug(null);
            }}
            onOpenUserProfile={() => setShowUserProfileModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
          />`;

content = content.slice(0, headerStartIndex) + newNavbarCall + content.slice(headerEndIndex + oldHeaderEnd.length);

// Replace home view content with CareerPathDashboard
const homeViewMarker = "{currentView === 'home' && (";
const topicFolderMarker = "{/* VIEW 2: TOPIC FOLDER (PRACTICE & ASSESSMENT ARENA) */}";

const homeStartIndex = content.indexOf(homeViewMarker);
const homeEndIndex = content.indexOf(topicFolderMarker, homeStartIndex);

if (homeStartIndex === -1 || homeEndIndex === -1) {
  console.error('Could not find home view boundaries in index.html!');
  process.exit(1);
}

const newHomeView = `{currentView === 'home' && (
              <CareerPathDashboard
                currentUser={currentUser}
                stats={stats}
                dashboardTab={dashboardTab}
                setDashboardTab={setDashboardTab}
                onStartDailyQuiz={handleStartDailyQuiz}
                onOpenPlacementPapers={() => setShowPlacementModal(true)}
                onOpenCompanyArena={() => { setCurrentView('company_mock_arena'); setSelectedTopicSlug(null); }}
                onOpenResumeMatcher={() => { setCurrentView('resume_matcher'); setSelectedTopicSlug(null); }}
                onOpenMockInterview={() => { setCurrentView('mock_interview'); setSelectedTopicSlug(null); }}
                onOpenExamHub={() => { setCurrentView('competitive_exams'); setSelectedTopicSlug(null); }}
                onOpenCompiler={() => { setCurrentView('live_coding'); setSelectedTopicSlug(null); }}
                onOpenLeaderboard={() => { setCurrentView('campus_leaderboard'); setSelectedTopicSlug(null); }}
                onOpenJobsPortal={() => { setCurrentView('jobs_portal'); setSelectedTopicSlug(null); }}
                onOpenInterviewCenter={() => { setCurrentView('interview_center'); setSelectedTopicSlug(null); }}
                onSelectTopicFolder={(slug) => { setSelectedTopicSlug(slug); setCurrentView('topic_folder'); }}
                sectionsData={sectionsData}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeSectionFilter={activeSectionFilter}
                setActiveSectionFilter={setActiveSectionFilter}
                TRACKS={TRACKS}
                handleStartTrackPractice={handleStartTrackPractice}
              />
            )}

            `;

content = content.slice(0, homeStartIndex) + newHomeView + content.slice(homeEndIndex);

// Add UserProfileModal and UserSettingsModal right near PlacementPapersModal
const placementModalMarker = "{/* Placement Papers Modal */}";
const newModalsCode = `{/* User Profile & Assessment History Modal */}
            <UserProfileModal
              isOpen={showUserProfileModal}
              onClose={() => setShowUserProfileModal(false)}
              user={currentUser}
              onSignOut={handleSignOut}
            />

            {/* Platform Settings Modal */}
            <UserSettingsModal
              isOpen={showSettingsModal}
              onClose={() => setShowSettingsModal(false)}
            />

            {/* Placement Papers Modal */}`;

content = content.replace(placementModalMarker, newModalsCode);

// Fix live_coding view check so both live_coding and coding_sandbox work
content = content.replace(
  "{currentView === 'live_coding' && (",
  "{(currentView === 'live_coding' || currentView === 'coding_sandbox') && ("
);

// Update CompetitiveExamsManager invocation to pass initialSubView and initialCategory
content = content.replace(
  "<CompetitiveExamsManager\n                onBack={() => setCurrentView('home')}\n              />",
  `<CompetitiveExamsManager
                onBack={() => setCurrentView('home')}
                initialSubView={activeExamSubView}
                initialCategory={activeExamCategory}
              />`
);

// Update CompetitiveExamsManager definition to accept and react to initialSubView & initialCategory
content = content.replace(
  "function CompetitiveExamsManager({ onBack }) {\n  const [currentSubView, setCurrentSubView] = useState('hub');",
  `function CompetitiveExamsManager({ onBack, initialSubView = 'hub', initialCategory = 'ALL' }) {
  const [currentSubView, setCurrentSubView] = useState(initialSubView || 'hub');
  useEffect(() => {
    if (initialSubView) setCurrentSubView(initialSubView);
  }, [initialSubView]);`
);

content = content.replace(
  "<ExamHubPage\n          onSelectExam={handleSelectExam}",
  `<ExamHubPage
          initialCategory={initialCategory}
          onSelectExam={handleSelectExam}`
);

content = content.replace(
  "function ExamHubPage({ onSelectExam, onStartTest, onOpenTracker, onOpenStudyPlan }) {\n  const [categories, setCategories] = useState([]);\n  const [loading, setLoading] = useState(true);\n  const [selectedCategory, setSelectedCategory] = useState('ALL');",
  `function ExamHubPage({ onSelectExam, onStartTest, onOpenTracker, onOpenStudyPlan, initialCategory = 'ALL' }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'ALL');
  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);`
);

fs.writeFileSync(indexPath, content, 'utf8');
console.log('Successfully updated index.html! New length:', content.length);
