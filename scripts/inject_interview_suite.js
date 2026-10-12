const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const suitePath = path.join(__dirname, '..', 'components', 'InterviewToHireSuite.jsx');

let html = fs.readFileSync(indexPath, 'utf8');
const suiteCode = fs.readFileSync(suitePath, 'utf8');

console.log('🔄 Injecting Interview-to-Hire Workflow Suite into index.html...');

// 1. Inject Components before root render
const rootTarget = `    const root = ReactDOM.createRoot(document.getElementById('root'));`;

if (!html.includes('JobsDrivePortal')) {
  if (!html.includes(rootTarget)) {
    console.error('❌ Root target render not found in index.html');
    process.exit(1);
  }
  const replacementWithComponents = `\n    // =========================================================================\n    // 15. INTERVIEW-TO-HIRE WORKFLOW SUITE COMPONENTS\n    // =========================================================================\n${suiteCode}\n\n${rootTarget}`;
  html = html.replace(rootTarget, replacementWithComponents);
  console.log('✅ Injected InterviewToHireSuite components before root.render');
}

// 2. Inject Navbar buttons
const navCompanyTarget = `                <button
                  id="btn-nav-company-arena"`;

const newNavButtons = `                <button
                  id="btn-nav-campus-drives"
                  onClick={() => { setCurrentView('jobs_portal'); setSelectedTopicSlug(null); }}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer \${currentView === 'jobs_portal'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                    }\`}
                >
                  <span>💼</span>
                  <span>Drives</span>
                </button>

                <button
                  id="btn-nav-my-applications"
                  onClick={() => { setCurrentView('student_applications'); setSelectedTopicSlug(null); }}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer \${currentView === 'student_applications'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
                    }\`}
                >
                  <span>📋</span>
                  <span>Applications</span>
                </button>

                <button
                  id="btn-nav-interview-center"
                  onClick={() => { setCurrentView('interview_center'); setSelectedTopicSlug(null); }}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer \${currentView === 'interview_center'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                    }\`}
                >
                  <span>🎯</span>
                  <span>Interviews</span>
                </button>

                <button
                  id="btn-nav-recruiter-console"
                  onClick={() => { setCurrentView('recruiter_console'); setSelectedTopicSlug(null); }}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer \${currentView === 'recruiter_console'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                    }\`}
                >
                  <span>👔</span>
                  <span>Recruiter</span>
                </button>

                <button
                  id="btn-nav-company-arena"`;

if (!html.includes('btn-nav-campus-drives')) {
  html = html.replace(navCompanyTarget, newNavButtons);
  console.log('✅ Added Navbar buttons for Campus Drives, Applications, Interviews, Recruiter');
}

// 3. Inject Notification Bell Drawer before Candidate Badge
const candidateBadgeTarget = `                {/* Candidate Badge */}`;
const notificationBellReplacement = `                {/* Real-time Recruitment Notification Bell Drawer */}
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

                {/* Candidate Badge */}`;

if (!html.includes('NotificationBellDrawer')) {
  html = html.replace(candidateBadgeTarget, notificationBellReplacement);
  console.log('✅ Added NotificationBellDrawer next to Candidate Badge');
}

// 4. Inject App State for prep context
const appStateTarget = `      // Routing / Views: 'landing' | 'home' | 'topic_folder' | 'bookmarks' | ...`;
const appStateReplacement = `      // Interview-to-Hire Workflow Active Context
      const [selectedPrepContext, setSelectedPrepContext] = useState(null);

      // Routing / Views: 'landing' | 'home' | 'topic_folder' | 'bookmarks' | ...`;

if (!html.includes('selectedPrepContext')) {
  html = html.replace(appStateTarget, appStateReplacement);
  console.log('✅ Added selectedPrepContext state to App');
}

// 5. Inject View Routing in App
const viewRoutingTarget = `            {/* VIEW 13: CAMPUS LEADERBOARD & RECRUITMENT RANKINGS */}`;
const newViewRouters = `            {/* VIEW 14: JOBS & CAMPUS PLACEMENT DRIVES */}
            {currentView === 'jobs_portal' && (
              <JobsDrivePortal
                currentUser={currentUser}
                onBack={() => setCurrentView('home')}
                onOpenApplications={() => setCurrentView('student_applications')}
                onLaunchInterviewCenter={() => setCurrentView('interview_center')}
              />
            )}

            {/* VIEW 15: STUDENT MY APPLICATIONS & VISUAL TIMELINE */}
            {currentView === 'student_applications' && (
              <StudentApplicationsPortal
                currentUser={currentUser}
                onBack={() => setCurrentView('home')}
                onOpenInterviewCenter={() => setCurrentView('interview_center')}
                onLaunchAiPrep={(app) => {
                  setSelectedPrepContext(app);
                  setCurrentView('ai_prep_suite');
                }}
              />
            )}

            {/* VIEW 16: STUDENT INTERVIEW CENTER & ACTIONABLE RSVP */}
            {currentView === 'interview_center' && (
              <StudentInterviewCenter
                currentUser={currentUser}
                onBack={() => setCurrentView('home')}
                onLaunchAiPrep={(inv) => {
                  setSelectedPrepContext(inv);
                  setCurrentView('ai_prep_suite');
                }}
              />
            )}

            {/* VIEW 17: AI INTERVIEW PREPARATION SUITE */}
            {currentView === 'ai_prep_suite' && (
              <AiInterviewPrepSuite
                contextData={selectedPrepContext}
                onBack={() => setCurrentView('interview_center')}
              />
            )}

            {/* VIEW 18: RECRUITER CANDIDATE MANAGEMENT CONSOLE */}
            {currentView === 'recruiter_console' && (
              <RecruiterConsole
                currentUser={currentUser}
                onBack={() => setCurrentView('home')}
              />
            )}

            {/* VIEW 13: CAMPUS LEADERBOARD & RECRUITMENT RANKINGS */}`;

if (!html.includes('jobs_portal')) {
  html = html.replace(viewRoutingTarget, newViewRouters);
  console.log('✅ Added View Routers for jobs_portal, student_applications, interview_center, ai_prep_suite, recruiter_console');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('🎉 Successfully injected full Interview-to-Hire Workflow into index.html!');
