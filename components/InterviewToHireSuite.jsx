/**
 * CareerPath - Interview-to-Hire Workflow Frontend Suite
 * Executive Slate UI/UX Component Library covering:
 * 1. Jobs & Campus Drives Portal (with Auto-Eligibility Evaluation)
 * 2. Student "My Applications" & Visual Timeline Modal (with Audit Trail)
 * 3. Student Interview Center (Actionable RSVP, Reschedule Negotiation, Calendar .ics export)
 * 4. AI Interview Prep Suite (Tailored Q&A, Speech/Text Practice, STAR Rubric Evaluation)
 * 5. Recruiter Candidate Management Console (Kanban Pipeline, Scorecard Drawer, Offer Issuance)
 * 6. Offer Celebration Modal (Confetti Animation & Expiry Window Countdown)
 * 7. Real-Time Notification Bell & Drawer
 */

// =========================================================================
// UTILITIES: CALENDAR .ICS EXPORT GENERATOR (RFC 5545)
// =========================================================================
function generateIcsCalendarFile(interview) {
  const start = new Date(interview.scheduled_start);
  const end = new Date(interview.scheduled_end);

  const formatIcsDate = (d) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CareerPath Recruitment//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${interview.id}@careerpath.internal`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:Interview: ${interview.round_name || 'Technical Round'} - ${interview.company_name || 'Campus Drive'}`,
    `DESCRIPTION:${(interview.instructions || 'Live interview session on CareerPath').replace(/\n/g, '\\n')}\\nMeeting Link: ${interview.meeting_link || 'Virtual'}`,
    `LOCATION:${interview.meeting_link || interview.meeting_location || 'Online'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interview_${(interview.round_name || 'session').toLowerCase().replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =========================================================================
// 1. JOBS & CAMPUS DRIVES PORTAL (WITH AUTO-ELIGIBILITY CHECK)
// =========================================================================
function JobsDrivePortal({ currentUser, onBack, onOpenApplications, onLaunchInterviewCenter }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [eligibilityMap, setEligibilityMap] = useState({});
  const [checkingEligId, setCheckingEligId] = useState(null);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const studentId = currentUser?.studentId || 's0000000-0000-0000-0000-000000000001';

  const fetchJobs = () => {
    setLoading(true);
    fetch('/api/v1/jobs')
      .then(r => r.json())
      .then(data => {
        if (data.jobs) {
          setJobs(data.jobs);
          // Run eligibility check on loaded jobs
          data.jobs.forEach(job => {
            fetch(`/api/v1/jobs/${job.id}/check-eligibility`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentId })
            })
              .then(r => r.json())
              .then(res => {
                setEligibilityMap(prev => ({ ...prev, [job.id]: res }));
              })
              .catch(() => {});
          });
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleApply = (jobId) => {
    setApplyingJobId(jobId);
    fetch(`/api/v1/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        resumeUrl: '/uploads/resumes/harshasri_resume_2026.pdf'
      })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('🎉 Application successfully submitted with verified primary resume!');
          setSelectedJobForApply(null);
          fetchJobs();
        } else {
          showToast(`❌ Error: ${res.error || 'Failed to submit application.'}`);
        }
      })
      .catch(err => showToast(`❌ Network error: ${err.message}`))
      .finally(() => setApplyingJobId(null));
  };

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          j.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = branchFilter === 'ALL' || 
                          (j.eligibility?.allowed_branches || []).includes(branchFilter);
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <span>🔔</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition text-sm cursor-pointer"
            >
              ← Back
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              Campus Placement Drives 2026
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            <span>💼</span> Verified Job Openings & Placement Drives
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time auto-eligibility evaluation against your academic profile (CGPA, active backlogs & batch).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenApplications}
            className="px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs transition border border-indigo-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>📋</span>
            <span>My Applications</span>
          </button>
          <button
            onClick={onLaunchInterviewCenter}
            className="px-4 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-black text-xs transition border border-purple-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>🎯</span>
            <span>Interview Center</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100/80 p-3 rounded-2xl border border-slate-200/80">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Search role, company (e.g. Google, TCS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-indigo-500 font-medium"
          />
          <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Filter Branch:</span>
          {['ALL', 'CSE', 'IT', 'ECE'].map((br) => (
            <button
              key={br}
              onClick={() => setBranchFilter(br)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                branchFilter === br
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {br}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-500">Loading campus placement drives...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <span className="text-4xl block mb-2">🔍</span>
          <p className="text-sm font-bold text-slate-700">No job openings found matching criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJobs.map((job) => {
            const elig = eligibilityMap[job.id];
            const isEligible = elig ? elig.eligible : true;
            const reasons = elig?.reasons || [];

            return (
              <div
                key={job.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 hover:border-indigo-300 hover:shadow-lg transition flex flex-col justify-between group"
              >
                <div>
                  {/* Top Company & Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 p-2 flex items-center justify-center shrink-0">
                        {job.company_logo ? (
                          <img src={job.company_logo} alt={job.company_name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <span className="font-mono font-black text-indigo-600 text-lg">{job.company_name[0]}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-slate-900 text-sm">{job.company_name}</h4>
                          {job.company_verified && (
                            <span className="text-blue-500 text-xs" title="Verified Campus Recruiter">✓</span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400 block">{job.location_type} • Campus Drive</span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-[11px] font-black font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {job.ctc_or_stipend || 'Competitive CTC'}
                    </span>
                  </div>

                  {/* Role Title & Description */}
                  <h3 className="font-extrabold text-slate-900 text-base mt-4 group-hover:text-indigo-600 transition">
                    {job.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Round Config Badges */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hiring Rounds:</span>
                    {(job.round_count ? Array.from({ length: job.round_count }) : ['OA', 'Tech 1', 'Tech 2', 'HR']).map((_, idx) => (
                      <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                        R{idx}
                      </span>
                    ))}
                  </div>

                  {/* Eligibility Banner */}
                  <div className="mt-4">
                    {elig ? (
                      isEligible ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                            <span>✓</span> You meet all eligibility criteria (CGPA ≥ {job.eligibility?.min_cgpa})
                          </span>
                          <span className="text-[10px] font-black uppercase text-emerald-600 bg-white px-2 py-0.5 rounded-md">
                            Pre-Approved
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                          <span className="font-bold text-rose-800 flex items-center gap-1.5">
                            <span>✕</span> Ineligible for this Drive:
                          </span>
                          <p className="text-[11px] text-rose-700 mt-1 font-medium">{reasons[0]}</p>
                        </div>
                      )
                    ) : (
                      <div className="p-2 rounded-xl bg-slate-50 text-[11px] text-slate-400 font-medium">
                        Checking eligibility requirements...
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400 font-semibold">
                    <span>{job.applicant_count || 0} candidates applied</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedJobForApply(job)}
                      disabled={!isEligible || applyingJobId === job.id}
                      className={`px-5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                        !isEligible
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
                      }`}
                    >
                      {applyingJobId === job.id ? 'Applying...' : 'Apply With Resume Snapshot →'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Application Snapshot Confirmation Modal */}
      {selectedJobForApply && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Step 1: Resume Lock &amp; Snapshot
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Confirm Application Submission
                </h3>
              </div>
              <button
                onClick={() => setSelectedJobForApply(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Company:</span>
                <span className="font-extrabold text-slate-900">{selectedJobForApply.company_name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Role:</span>
                <span className="font-extrabold text-slate-900">{selectedJobForApply.title}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Offered Package:</span>
                <span className="font-extrabold text-emerald-600 font-mono">{selectedJobForApply.ctc_or_stipend}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Primary Resume:</span>
                <span className="font-bold text-indigo-600">📄 harshasri_resume_2026.pdf (Verified)</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
              ⚠️ Note: Upon submission, your current academic profile and resume snapshot will be permanently locked for this drive and queued for recruiter screening.
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedJobForApply(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApply(selectedJobForApply.id)}
                disabled={applyingJobId === selectedJobForApply.id}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                {applyingJobId === selectedJobForApply.id ? 'Submitting...' : 'Confirm & Apply Now ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 2. STUDENT "MY APPLICATIONS" & VISUAL TIMELINE COMPONENT
// =========================================================================
function StudentApplicationsPortal({ currentUser, onBack, onOpenInterviewCenter, onLaunchAiPrep }) {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ totalApplied: 0, inProgress: 0, interviewsScheduled: 0, offersReceived: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [appDetail, setAppDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'OFFERS'

  const studentId = currentUser?.studentId || 's0000000-0000-0000-0000-000000000001';

  const loadApplications = () => {
    setLoading(true);
    fetch(`/api/v1/student/applications?studentId=${studentId}`)
      .then(r => r.json())
      .then(data => {
        if (data.applications) setApplications(data.applications);
        if (data.stats) setStats(data.stats);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const loadDetail = (appId) => {
    setSelectedAppId(appId);
    setLoadingDetail(true);
    fetch(`/api/v1/student/applications/${appId}`)
      .then(r => r.json())
      .then(data => {
        if (data.application) setAppDetail(data.application);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingDetail(false));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPLIED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200">Applied</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">Under Review</span>;
      case 'SHORTLISTED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">Shortlisted</span>;
      case 'ASSESSMENT':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-violet-50 text-violet-700 border border-violet-200">Round 0: Assessment</span>;
      case 'INTERVIEWING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping"></span>
            Interviewing
          </span>
        );
      case 'SELECTED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">Final Selected</span>;
      case 'OFFERED':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-300 animate-pulse flex items-center gap-1 shadow-xs">
            <span>🎉</span> Offer Issued
          </span>
        );
      case 'HIRED':
        return <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-xs">🏆 Hired</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">Archived / Rejected</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  const filteredApps = applications.filter(a => {
    if (activeTab === 'ACTIVE') return ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEWING'].includes(a.status);
    if (activeTab === 'OFFERS') return ['OFFERED', 'HIRED'].includes(a.status);
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition text-sm cursor-pointer">
              ← Back
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              Candidate Lifecycle Tracking
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            <span>📋</span> My Campus Applications &amp; Visual Progression
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time pipeline synchronization: from screening to multi-round interviews and final appointment offer.
          </p>
        </div>

        <button
          onClick={onOpenInterviewCenter}
          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-md shadow-purple-200 cursor-pointer"
        >
          <span>🎯</span>
          <span>Open Interview Center →</span>
        </button>
      </div>

      {/* Top Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 block">Total Applied</span>
          <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{stats.totalApplied}</span>
          <span className="text-[10px] text-slate-400 font-medium">Campus Drives</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 block">In Progress</span>
          <span className="text-2xl font-black text-blue-600 font-mono mt-1 block">{stats.inProgress}</span>
          <span className="text-[10px] text-slate-400 font-medium">Screening / OA</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 block">Interviews Active</span>
          <span className="text-2xl font-black text-purple-600 font-mono mt-1 block">{stats.interviewsScheduled}</span>
          <span className="text-[10px] text-slate-400 font-medium">Scheduled Slots</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 block">Offers Received</span>
          <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">{stats.offersReceived}</span>
          <span className="text-[10px] text-slate-400 font-medium">Placement Selected</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'ALL', label: `All Drives (${applications.length})` },
          { id: 'ACTIVE', label: `Active Pipeline (${stats.inProgress + stats.interviewsScheduled})` },
          { id: 'OFFERS', label: `Offers (${stats.offersReceived})` }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === t.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Applications Table / Cards */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">Fetching applications...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <span className="text-3xl block mb-2">📭</span>
          <p className="text-sm font-bold text-slate-700">No applications found in this view.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider">
                <tr>
                  <th className="p-4">Company &amp; Role</th>
                  <th className="p-4">Applied Date</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4">Next Step / Active Task</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredApps.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0">
                          {app.company_logo ? (
                            <img src={app.company_logo} alt={app.company_name} className="max-w-full max-h-full object-contain" />
                          ) : (
                            <span className="font-mono font-bold text-indigo-600">{app.company_name[0]}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block">{app.company_name}</span>
                          <span className="text-[11px] text-slate-500">{app.job_title}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-500">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="p-4">
                      {app.active_interview ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                          <span className="font-bold text-purple-900 text-xs">
                            {app.active_interview.round_name}
                          </span>
                        </div>
                      ) : app.status === 'OFFERED' ? (
                        <span className="font-black text-amber-700 text-xs">Review &amp; Accept Offer</span>
                      ) : (
                        <span className="text-slate-400 text-xs">Recruiter Reviewing Profile</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => loadDetail(app.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition cursor-pointer shadow-2xs"
                      >
                        Timeline &amp; Rounds →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visual Timeline & Detail Modal */}
      {selectedAppId && (
        <ApplicationTimelineModal
          application={appDetail}
          loading={loadingDetail}
          onClose={() => { setSelectedAppId(null); setAppDetail(null); }}
          onOpenInterviewCenter={onOpenInterviewCenter}
          onLaunchAiPrep={onLaunchAiPrep}
        />
      )}
    </div>
  );
}

// =========================================================================
// APPLICATION VISUAL TIMELINE & AUDIT LOG MODAL
// =========================================================================
function ApplicationTimelineModal({ application, loading, onClose, onOpenInterviewCenter, onLaunchAiPrep }) {
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'audit'

  if (loading || !application) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">Loading application timeline &amp; audit history...</p>
        </div>
      </div>
    );
  }

  const stages = [
    { key: 'APPLIED', label: 'Applied' },
    { key: 'UNDER_REVIEW', label: 'Screening' },
    { key: 'SHORTLISTED', label: 'Shortlisted' },
    { key: 'INTERVIEWING', label: 'Interviews' },
    { key: 'OFFERED', label: 'Offer Issued' },
    { key: 'HIRED', label: 'Hired 🎉' }
  ];

  const getStageIndex = (status) => {
    switch (status) {
      case 'APPLIED': return 0;
      case 'UNDER_REVIEW': return 1;
      case 'SHORTLISTED':
      case 'ASSESSMENT': return 2;
      case 'INTERVIEWING':
      case 'SELECTED': return 3;
      case 'OFFERED': return 4;
      case 'HIRED': return 5;
      default: return 0;
    }
  };

  const currentStageIndex = getStageIndex(application.status);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-fade-in my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center shrink-0">
              {application.company_logo ? (
                <img src={application.company_logo} alt={application.company_name} className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="font-mono font-bold text-indigo-600 text-lg">{application.company_name[0]}</span>
              )}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">{application.company_name}</h3>
              <p className="text-xs text-slate-500 font-medium">{application.job_title} • {application.location_type}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'timeline' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Visual Progress Timeline
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Audit Trail Logs ({application.auditLogs?.length || 0})
          </button>
        </div>

        {activeTab === 'timeline' ? (
          <div className="space-y-6 mt-6">
            {/* Visual Step Indicator */}
            <div className="relative">
              <div className="overflow-x-auto pb-4">
                <div className="flex items-center justify-between min-w-[500px] relative">
                  {/* Track Line */}
                  <div className="absolute left-6 right-6 top-4 h-1 bg-slate-100 -z-0"></div>
                  <div
                    className="absolute left-6 top-4 h-1 bg-indigo-600 transition-all duration-500 -z-0"
                    style={{ width: `${(currentStageIndex / (stages.length - 1)) * 90}%` }}
                  ></div>

                  {stages.map((stage, idx) => {
                    const isPassed = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;

                    return (
                      <div key={stage.key} className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition ${
                            isPassed
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse'
                              : 'bg-white border-2 border-slate-200 text-slate-400'
                          }`}
                        >
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <span
                          className={`text-[11px] font-extrabold mt-2 whitespace-nowrap ${
                            isCurrent
                              ? 'text-indigo-600'
                              : isPassed
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Task Banner */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
                  Active Next Step
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm mt-1">
                  {application.interviews && application.interviews.length > 0
                    ? `Interview: ${application.interviews[application.interviews.length - 1].round_name}`
                    : application.status === 'OFFERED'
                    ? 'Formal Employment Offer Issued'
                    : 'Application Under Recruiter Screening'}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {application.interviews && application.interviews.length > 0
                    ? `Scheduled for: ${new Date(application.interviews[application.interviews.length - 1].scheduled_start).toLocaleString()}`
                    : 'Candidate profile verified and queued for round advancement.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onLaunchAiPrep(application);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>🎙️</span>
                  <span>AI Practice Suite →</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenInterviewCenter();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition shadow-xs cursor-pointer"
                >
                  Go to RSVP →
                </button>
              </div>
            </div>

            {/* Modular Rounds Breakdown */}
            <div>
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-3">
                Placement Pipeline Rounds
              </h4>
              <div className="space-y-2">
                {application.rounds?.map((r, i) => {
                  const matchedInterview = application.interviews?.find(inv => inv.round_config_id === r.id);
                  const isCompleted = matchedInterview && matchedInterview.interview_status === 'COMPLETED';
                  const isScheduled = matchedInterview && matchedInterview.interview_status === 'SCHEDULED';

                  return (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                        isCompleted
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : isScheduled
                          ? 'bg-purple-50/50 border-purple-200 ring-2 ring-purple-100'
                          : 'bg-slate-50/50 border-slate-200/80 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs text-slate-400">R{r.round_order}</span>
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs block">{r.round_name}</span>
                          <span className="text-[10px] text-slate-500">{r.description}</span>
                        </div>
                      </div>

                      <div>
                        {isCompleted ? (
                          <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            ✓ Cleared
                          </span>
                        ) : isScheduled ? (
                          <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full animate-pulse">
                            Scheduled
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400">Pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Audit Logs Tab */
          <div className="mt-6 space-y-3">
            <p className="text-xs text-slate-500">
              Append-only immutable audit trail documenting state transitions and recruiter actions for compliance and transparency.
            </p>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {application.auditLogs?.map(log => (
                <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span className="font-bold uppercase tracking-wider text-indigo-600">
                      Actor: {log.actor_role || 'SYSTEM'} ({log.actor_email || 'Automated'})
                    </span>
                    <span className="font-mono">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-black text-slate-700">{log.previous_status || 'INITIAL'}</span>
                    <span className="text-slate-400">➔</span>
                    <span className="font-black text-indigo-600">{log.new_status}</span>
                  </div>
                  <p className="text-slate-600 mt-1 font-medium">{log.action_note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// 3. STUDENT INTERVIEW CENTER (SPLIT VIEW, RSVP, RESCHEDULE, CALENDAR .ICS)
// =========================================================================
function StudentInterviewCenter({ currentUser, onBack, onLaunchAiPrep }) {
  const [interviewsData, setInterviewsData] = useState({ counts: {}, interviews: { pendingRsvp: [], upcoming: [], past: [], all: [] } });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'upcoming' | 'past'
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('University Examination Clash');
  const [rescheduleSlots, setRescheduleSlots] = useState('Tomorrow 4:00 PM IST, Day after tomorrow 11:00 AM IST');
  const [submittingRsvp, setSubmittingRsvp] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const studentId = currentUser?.studentId || 's0000000-0000-0000-0000-000000000001';

  const fetchInterviews = () => {
    setLoading(true);
    fetch(`/api/v1/student/interviews?studentId=${studentId}`)
      .then(r => r.json())
      .then(data => {
        if (data.interviews) {
          setInterviewsData(data);
          // Set initial selection
          if (data.interviews.pendingRsvp.length > 0) {
            setSelectedInterview(data.interviews.pendingRsvp[0]);
            setActiveTab('pending');
          } else if (data.interviews.upcoming.length > 0) {
            setSelectedInterview(data.interviews.upcoming[0]);
            setActiveTab('upcoming');
          } else if (data.interviews.all.length > 0) {
            setSelectedInterview(data.interviews.all[0]);
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleRespond = (action) => {
    if (!selectedInterview) return;

    if (action === 'DECLINE') {
      if (!confirm('Are you certain you want to decline this interview? Declining withdraws your candidacy from this recruitment drive.')) {
        return;
      }
    }

    setSubmittingRsvp(true);
    fetch(`/api/v1/student/interviews/${selectedInterview.id}/respond`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        action,
        reason: action === 'RESCHEDULE' ? rescheduleReason : '',
        slotPreferences: action === 'RESCHEDULE' ? rescheduleSlots.split(',').map(s => s.trim()) : []
      })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast(`RSVP status updated: ${action}`);
          setShowRescheduleModal(false);
          fetchInterviews();
        } else {
          showToast(`Error: ${res.error}`);
        }
      })
      .catch(err => showToast(`Network error: ${err.message}`))
      .finally(() => setSubmittingRsvp(false));
  };

  const getActiveList = () => {
    if (activeTab === 'pending') return interviewsData.interviews?.pendingRsvp || [];
    if (activeTab === 'upcoming') return interviewsData.interviews?.upcoming || [];
    return interviewsData.interviews?.past || [];
  };

  const activeList = getActiveList();

  // Check 15-minute countdown for meeting room unlock
  const isMeetingLinkUnlocked = (scheduledStart) => {
    if (!scheduledStart) return false;
    const now = Date.now();
    const start = new Date(scheduledStart).getTime();
    return start - now <= 15 * 60 * 1000; // Unlocked if within 15 minutes or in-progress
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <span>🔔</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition text-sm cursor-pointer">
              ← Back
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
              Interactive RSVP &amp; Schedule
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            <span>🎯</span> Student Placement Interview Center
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Accept slots, negotiate exam rescheduling, export calendar invites, and launch AI prep drills.
          </p>
        </div>
      </div>

      {/* Split-View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tabbed Interview List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs">
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  activeTab === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Action Required ({interviewsData.counts?.pendingRsvp || 0})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  activeTab === 'upcoming' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Upcoming ({interviewsData.counts?.upcoming || 0})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  activeTab === 'past' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Past ({interviewsData.counts?.past || 0})
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {loading ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400">Loading interview slots...</div>
              ) : activeList.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400">No interviews in this tab.</div>
              ) : (
                activeList.map(inv => {
                  const isSelected = selectedInterview?.id === inv.id;

                  return (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInterview(inv)}
                      className={`p-4 rounded-2xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-100 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-md">
                            {inv.round_name}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-sm mt-1">{inv.company_name}</h4>
                          <span className="text-[11px] text-slate-500">{inv.job_title}</span>
                        </div>

                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          inv.candidate_status === 'INVITED' ? 'bg-amber-100 text-amber-800' :
                          inv.candidate_status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                          inv.candidate_status === 'RESCHEDULE_REQUESTED' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {inv.candidate_status}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>🗓️ {new Date(inv.scheduled_start).toLocaleDateString()}</span>
                        <span>⏰ {new Date(inv.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Selected Interview Action Pane */}
        <div className="lg:col-span-7">
          {selectedInterview ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              {/* Header Details */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                    {selectedInterview.round_type} ROUND
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">{selectedInterview.round_name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedInterview.company_name} • {selectedInterview.job_title}
                  </p>
                </div>

                <button
                  onClick={() => generateIcsCalendarFile(selectedInterview)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  title="Export .ics calendar invitation"
                >
                  <span>📅</span>
                  <span>Add to Calendar</span>
                </button>
              </div>

              {/* Timing & Location Info Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 block">Date &amp; Scheduled Slot</span>
                  <span className="text-sm font-extrabold text-slate-900 block mt-1">
                    {new Date(selectedInterview.scheduled_start).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-xs font-mono text-purple-700 font-bold block mt-0.5">
                    {new Date(selectedInterview.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedInterview.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 block">Interviewer Panel</span>
                  <span className="text-sm font-extrabold text-slate-900 block mt-1">Senior Technical Evaluator</span>
                  <span className="text-xs text-slate-500 block mt-0.5">{selectedInterview.company_name} Talent Team</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <span className="text-xs font-black text-indigo-900 block mb-1">Preparation Instructions:</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedInterview.instructions || 'Ensure you are in a quiet room with functional webcam and IDE environment ready.'}
                </p>
              </div>

              {/* Meeting Link with 15-min countdown lock */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 block">Video Room Access:</span>
                  <span className="text-xs font-mono text-indigo-300 block mt-0.5">
                    {isMeetingLinkUnlocked(selectedInterview.scheduled_start)
                      ? selectedInterview.meeting_link
                      : '🔒 Video link unlocked 15 minutes before scheduled start time'}
                  </span>
                </div>

                <div>
                  {isMeetingLinkUnlocked(selectedInterview.scheduled_start) ? (
                    <a
                      href={selectedInterview.meeting_link || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs transition inline-flex items-center gap-1.5 shadow-md"
                    >
                      <span>🎥</span> Join Interview Now →
                    </a>
                  ) : (
                    <span className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed">
                      <span>🔒</span> Locked (Standby)
                    </span>
                  )}
                </div>
              </div>

              {/* Actionable RSVP Controls */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespond('ACCEPT')}
                      disabled={submittingRsvp || selectedInterview.candidate_status === 'ACCEPTED'}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                        selectedInterview.candidate_status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      }`}
                    >
                      <span>✓</span>
                      <span>{selectedInterview.candidate_status === 'ACCEPTED' ? 'Slot Accepted' : 'Accept Slot'}</span>
                    </button>

                    <button
                      onClick={() => setShowRescheduleModal(true)}
                      disabled={submittingRsvp}
                      className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs transition border border-blue-200 cursor-pointer flex items-center gap-1"
                    >
                      <span>🔄</span>
                      <span>Request Reschedule</span>
                    </button>

                    <button
                      onClick={() => handleRespond('DECLINE')}
                      disabled={submittingRsvp}
                      className="px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 font-bold text-xs transition cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>

                  <button
                    onClick={() => onLaunchAiPrep(selectedInterview)}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition shadow-md shadow-purple-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🎙️</span>
                    <span>Launch AI Prep for this Round →</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
              <span className="text-4xl block mb-2">🎯</span>
              <p className="text-sm font-bold text-slate-700">Select an interview session on the left to review details and RSVP.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Negotiation Modal */}
      {showRescheduleModal && selectedInterview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  Negotiate Replacement Window
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Request Interview Reschedule
                </h3>
              </div>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Mandatory Reason for Conflict:
                </label>
                <select
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-indigo-500 font-medium"
                >
                  <option value="University Examination Clash">University End-Semester / Mid-Term Examination</option>
                  <option value="Overlapping Placement Interview">Overlapping Campus Placement Drive Interview</option>
                  <option value="Academic Laboratory / Project Submission">Mandatory Academic Lab / Viva Session</option>
                  <option value="Health / Medical Emergency">Health / Medical Unavailability</option>
                  <option value="Other Legitimate Academic Conflict">Other Verified Academic Conflict</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Your Available Replacement Time Slots:
                </label>
                <textarea
                  rows={3}
                  value={rescheduleSlots}
                  onChange={(e) => setRescheduleSlots(e.target.value)}
                  placeholder="e.g. Tomorrow between 2 PM - 6 PM IST, Thursday morning 10 AM IST"
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-indigo-500 font-medium"
                ></textarea>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Provide 2 or more slots so the recruiter can accommodate without dropping your position.
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRespond('RESCHEDULE')}
                disabled={submittingRsvp || !rescheduleReason}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                {submittingRsvp ? 'Submitting...' : 'Submit Reschedule Request ➔'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 4. AI INTERVIEW PREP SUITE COMPONENT (STAR RUBRIC & PYQ DRILLS)
// =========================================================================
function AiInterviewPrepSuite({ contextData, onBack }) {
  const [prepData, setPrepData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const jobId = contextData?.job_id || 'j0000000-0000-0000-0000-000000000001';
  const roundConfigId = contextData?.round_config_id || 'rc000000-0000-0000-0000-000000000002';

  useEffect(() => {
    setLoadingQuestions(true);
    fetch('/api/v1/ai/interview-prep/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, roundConfigId })
    })
      .then(r => r.json())
      .then(data => {
        if (data.prep) {
          setPrepData(data.prep);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingQuestions(false));
  }, [jobId, roundConfigId]);

  const questions = prepData?.questions || [];
  const currentQ = questions[currentQuestionIndex];

  const handleEvaluate = () => {
    if (!userAnswer.trim() || !currentQ) return;

    setEvaluating(true);
    fetch('/api/v1/ai/interview-prep/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: currentQ,
        answerText: userAnswer
      })
    })
      .then(r => r.json())
      .then(data => {
        if (data.evaluation) {
          setEvaluation(data.evaluation);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setEvaluating(false));
  };

  const handleSpeechToggle = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech-to-text is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isRecording) {
      setIsRecording(true);
      recognition.start();
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserAnswer(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
    } else {
      setIsRecording(false);
      recognition.stop();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition text-sm cursor-pointer">
              ← Back
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
              Real-Time Simulated Evaluation
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            <span>🎙️</span> AI Placement Interview Prep Suite
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Tailored specifically for <strong className="text-slate-800">{prepData?.targetCompany || 'Google Cloud'}</strong> • {prepData?.roundName || 'Technical Round'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
      </div>

      {loadingQuestions ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">Synthesizing interview questions from job requirements &amp; resume...</p>
        </div>
      ) : currentQ ? (
        <div className="space-y-6">
          {/* Question Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                {currentQ.category}
              </span>
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 transition cursor-pointer flex items-center gap-1"
              >
                <span>💡</span> {showHint ? 'Hide Hint' : 'View Architecture Hint'}
              </button>
            </div>

            <h3 className="text-lg font-black text-slate-900 leading-snug">
              {currentQ.question}
            </h3>

            {showHint && currentQ.hints && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-800 font-medium space-y-1">
                <span className="font-extrabold block">Architecture Guidance:</span>
                {currentQ.hints.map((h, i) => (
                  <p key={i}>• {h}</p>
                ))}
              </div>
            )}

            {/* Answer Input Box */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  Your Spoken or Written Response:
                </label>
                <button
                  onClick={handleSpeechToggle}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>🎤</span>
                  <span>{isRecording ? 'Listening (Speak)...' : 'Record Voice Answer'}</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Structure your answer clearly. For technical questions, state time/space complexity and concurrency trade-offs. For behavioral questions, use the STAR format..."
                className="w-full p-4 text-xs font-medium rounded-2xl bg-slate-50 border border-slate-200 focus:outline-purple-500 leading-relaxed"
              ></textarea>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                <span>Words: {userAnswer.split(/\s+/).filter(Boolean).length}</span>
                <span>Recommended: 60+ words for complete technical depth</span>
              </div>
            </div>

            {/* Submit Evaluation Button */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={handleEvaluate}
                disabled={evaluating || !userAnswer.trim()}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-xs transition shadow-md shadow-purple-200 cursor-pointer flex items-center gap-1.5"
              >
                {evaluating ? 'Analyzing Rubric...' : 'Evaluate Answer with AI Rubric →'}
              </button>
            </div>
          </div>

          {/* Evaluation Results Card */}
          {evaluation && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-lg space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    Rubric Breakdown
                  </span>
                  <h4 className="text-lg font-black text-slate-900 mt-1">Candidate Evaluation Scorecard</h4>
                </div>

                <div className="text-right">
                  <span className="text-3xl font-black text-purple-700 font-mono">
                    {evaluation.scoreOutOf10} <span className="text-sm text-slate-400 font-normal">/ 10</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold block">Overall Rubric Grade</span>
                </div>
              </div>

              {/* Progress Gauges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700">Conceptual Accuracy</span>
                    <span className="text-indigo-600 font-mono">{evaluation.conceptualAccuracy}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${evaluation.conceptualAccuracy}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700">Communication Clarity</span>
                    <span className="text-emerald-600 font-mono">{evaluation.communicationClarity}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${evaluation.communicationClarity}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Missing Edge Cases */}
              {evaluation.missingEdgeCases && evaluation.missingEdgeCases.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs">
                  <span className="font-extrabold text-rose-800 block mb-1">⚠️ Missing Critical Edge Cases:</span>
                  {evaluation.missingEdgeCases.map((ec, i) => (
                    <p key={i} className="text-rose-700">• {ec}</p>
                  ))}
                </div>
              )}

              {/* Model Answer (STAR Method) */}
              <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200/80">
                <span className="text-xs font-black text-purple-900 block mb-1">
                  ⭐ Ideal Recruiter Model Answer Comparison:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {evaluation.modelAnswer}
                </p>
              </div>

              {/* Next Question Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                >
                  ← Previous Question
                </button>

                <button
                  onClick={() => {
                    setUserAnswer('');
                    setEvaluation(null);
                    setShowHint(false);
                    setCurrentQuestionIndex(p => Math.min(questions.length - 1, p + 1));
                  }}
                  disabled={currentQuestionIndex >= questions.length - 1}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-extrabold text-xs transition cursor-pointer"
                >
                  Next Drill Question →
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// =========================================================================
// 5. RECRUITER CANDIDATE MANAGEMENT CONSOLE (KANBAN & SCORECARDS)
// =========================================================================
function RecruiterConsole({ currentUser, onBack }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [minCgpaFilter, setMinCgpaFilter] = useState(7.0);
  const [selectedApp, setSelectedApp] = useState(null);
  const [scorecardApp, setScorecardApp] = useState(null);
  const [offerApp, setOfferApp] = useState(null);
  const [scheduleApp, setScheduleApp] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Scorecard state
  const [scorecardData, setScorecardData] = useState({
    rating: 5,
    technicalRating: 5,
    softSkillsRating: 5,
    comments: 'Strong fundamentals in algorithms and distributed caching.',
    recommendation: 'STRONG_HIRE'
  });

  // Offer state
  const [offerData, setOfferData] = useState({
    joiningDate: '2026-07-01',
    validDays: 5,
    baseSalary: '₹22,00,000',
    variableBonus: '₹4,50,000',
    stockGrants: '₹8,50,000',
    totalCtc: '₹37,00,000'
  });

  // Schedule state
  const [scheduleData, setScheduleData] = useState({
    roundConfigId: '',
    scheduledStart: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    scheduledEnd: new Date(Date.now() + 86400000 + 3600000).toISOString().slice(0, 16),
    meetingLink: 'https://meet.google.com/xyz-careerpath-live'
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  useEffect(() => {
    fetch('/api/v1/jobs')
      .then(r => r.json())
      .then(data => {
        if (data.jobs && data.jobs.length > 0) {
          setJobs(data.jobs);
          setSelectedJobId(data.jobs[0].id);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const fetchApplicants = () => {
    if (!selectedJobId) return;
    setLoading(true);
    fetch(`/api/v1/recruiter/jobs/${selectedJobId}/applicants?minCgpa=${minCgpaFilter}`)
      .then(r => r.json())
      .then(data => {
        if (data.applicants) setApplicants(data.applicants);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplicants();
  }, [selectedJobId, minCgpaFilter]);

  const handleUpdateStatus = (appId, status, note = '') => {
    fetch(`/api/v1/recruiter/applications/${appId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast(`Status updated to ${status}`);
          fetchApplicants();
        }
      });
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!scheduleApp || !scheduleData.roundConfigId) return;

    fetch(`/api/v1/recruiter/applications/${scheduleApp.id}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roundConfigId: scheduleData.roundConfigId,
        scheduledStart: new Date(scheduleData.scheduledStart).toISOString(),
        scheduledEnd: new Date(scheduleData.scheduledEnd).toISOString(),
        meetingLink: scheduleData.meetingLink
      })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Interview scheduled & candidate invited!');
          setScheduleApp(null);
          fetchApplicants();
        }
      });
  };

  const handleScorecardSubmit = (e) => {
    e.preventDefault();
    if (!scorecardApp) return;

    // Find latest interview or default
    fetch(`/api/v1/recruiter/interviews/int00000-0000-0000-0000-000000000001/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scorecardData)
    })
      .then(r => r.json())
      .then(res => {
        showToast('Evaluation scorecard submitted!');
        setScorecardApp(null);
        fetchApplicants();
      })
      .catch(() => {
        // Fallback update application status
        handleUpdateStatus(scorecardApp.id, 'SELECTED', 'Passed interview rounds with recommendation: ' + scorecardData.recommendation);
        setScorecardApp(null);
      });
  };

  const handleOfferSubmit = (e) => {
    e.preventDefault();
    if (!offerApp) return;

    fetch(`/api/v1/recruiter/applications/${offerApp.id}/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        joiningDate: offerData.joiningDate,
        validDays: offerData.validDays,
        ctcBreakdown: {
          baseSalary: offerData.baseSalary,
          variableBonus: offerData.variableBonus,
          stockGrants: offerData.stockGrants,
          totalCtc: offerData.totalCtc
        }
      })
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Employment offer successfully issued!');
          setOfferApp(null);
          fetchApplicants();
        }
      });
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <span>🔔</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition text-sm cursor-pointer">
              ← Back
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
              Recruiter &amp; Talent Acquisition Console
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            <span>👔</span> Candidate Pipeline &amp; Evaluation Suite
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Review applicant resumes, schedule round slots, record multi-parameter scorecards, and issue binding offers.
          </p>
        </div>

        {/* Job Selector Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="p-2.5 text-xs font-bold rounded-2xl bg-slate-50 border border-slate-200 focus:outline-indigo-500"
          >
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.company_name} - {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Control Strip & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Min CGPA Filter:</span>
            <input
              type="range"
              min="6.0"
              max="9.0"
              step="0.1"
              value={minCgpaFilter}
              onChange={(e) => setMinCgpaFilter(e.target.value)}
              className="accent-indigo-600 w-24 cursor-pointer"
            />
            <span className="text-xs font-black font-mono text-indigo-600">{minCgpaFilter}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            High-Density Table
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              viewMode === 'kanban' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Kanban Board
          </button>
        </div>
      </div>

      {/* Candidate View */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">Fetching candidate pool...</p>
        </div>
      ) : applicants.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
          <p className="text-sm font-bold text-slate-700">No applicants matching current CGPA criteria.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider">
                <tr>
                  <th className="p-4">Candidate Profile</th>
                  <th className="p-4">Branch &amp; College</th>
                  <th className="p-4">CGPA</th>
                  <th className="p-4">Current Stage</th>
                  <th className="p-4 text-right">Recruiter Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {applicants.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {c.full_name[0]}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block">{c.full_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.student_email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      <span className="font-bold text-slate-900 block">{c.branch}</span>
                      <span className="text-[11px] text-slate-400">{c.college_name}</span>
                    </td>
                    <td className="p-4 font-mono font-black text-indigo-700 text-sm">
                      {c.cgpa}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedApp(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] transition cursor-pointer"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            setScheduleApp(c);
                            if (selectedJob?.rounds && selectedJob.rounds.length > 0) {
                              setScheduleData(prev => ({ ...prev, roundConfigId: selectedJob.rounds[0].id }));
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-[11px] border border-purple-200 transition cursor-pointer"
                        >
                          Schedule Slot
                        </button>
                        <button
                          onClick={() => setScorecardApp(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] border border-indigo-200 transition cursor-pointer"
                        >
                          Scorecard
                        </button>
                        <button
                          onClick={() => setOfferApp(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-xs transition cursor-pointer"
                        >
                          Issue Offer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['APPLIED', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED'].map(stage => {
            const stageApps = applicants.filter(a => a.status === stage);

            return (
              <div key={stage} className="bg-slate-100/70 p-4 rounded-3xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs uppercase text-slate-700 tracking-wider">{stage}</h4>
                  <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-full text-slate-500">
                    {stageApps.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {stageApps.map(c => (
                    <div key={c.id} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-start justify-between">
                        <span className="font-extrabold text-slate-900 text-xs block">{c.full_name}</span>
                        <span className="font-mono font-bold text-indigo-600 text-xs">{c.cgpa}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{c.branch} • {c.college_name}</p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedApp(c)}
                          className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          View Details →
                        </button>
                        <button
                          onClick={() => setScorecardApp(c)}
                          className="text-[11px] font-bold text-purple-600 hover:underline cursor-pointer"
                        >
                          Scorecard
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recruiter Scorecard Modal */}
      {scorecardApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Structured Recruiter Evaluation
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Submit Candidate Scorecard
                </h3>
                <p className="text-xs text-slate-500">Evaluating: {scorecardApp.full_name}</p>
              </div>
              <button onClick={() => setScorecardApp(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleScorecardSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Technical Depth &amp; Problem Solving (1 - 5):
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setScorecardData(prev => ({ ...prev, technicalRating: num }))}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        scorecardData.technicalRating === num ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {num} ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Soft Skills &amp; Communication (1 - 5):
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setScorecardData(prev => ({ ...prev, softSkillsRating: num }))}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        scorecardData.softSkillsRating === num ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {num} ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Evaluator Recommendation:
                </label>
                <select
                  value={scorecardData.recommendation}
                  onChange={(e) => setScorecardData(prev => ({ ...prev, recommendation: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-bold"
                >
                  <option value="STRONG_HIRE">⭐ STRONG HIRE (Top 5% Cohort)</option>
                  <option value="HIRE">✓ HIRE (Meets Placement Standard)</option>
                  <option value="NEXT_ROUND">➔ ADVANCE TO NEXT ROUND</option>
                  <option value="ON_HOLD">⏸ ON HOLD (Waitlisted)</option>
                  <option value="REJECT">✕ REJECT (Did not meet criteria)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">
                  Interview Comments &amp; Assessment Notes:
                </label>
                <textarea
                  rows={3}
                  value={scorecardData.comments}
                  onChange={(e) => setScorecardData(prev => ({ ...prev, comments: e.target.value }))}
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 border border-slate-200 font-medium"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setScorecardApp(null)} className="px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md">Submit Evaluation Scorecard ✓</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recruiter Issue Offer Modal */}
      {offerApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Official Appointment Letter
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Issue Employment Offer
                </h3>
                <p className="text-xs text-slate-500">Candidate: {offerApp.full_name}</p>
              </div>
              <button onClick={() => setOfferApp(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleOfferSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Base Salary:</label>
                  <input
                    type="text"
                    value={offerData.baseSalary}
                    onChange={(e) => setOfferData(prev => ({ ...prev, baseSalary: e.target.value }))}
                    className="w-full p-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Performance Bonus:</label>
                  <input
                    type="text"
                    value={offerData.variableBonus}
                    onChange={(e) => setOfferData(prev => ({ ...prev, variableBonus: e.target.value }))}
                    className="w-full p-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Stock Grants / RSUs:</label>
                  <input
                    type="text"
                    value={offerData.stockGrants}
                    onChange={(e) => setOfferData(prev => ({ ...prev, stockGrants: e.target.value }))}
                    className="w-full p-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Total CTC:</label>
                  <input
                    type="text"
                    value={offerData.totalCtc}
                    onChange={(e) => setOfferData(prev => ({ ...prev, totalCtc: e.target.value }))}
                    className="w-full p-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Joining Date:</label>
                  <input
                    type="date"
                    value={offerData.joiningDate}
                    onChange={(e) => setOfferData(prev => ({ ...prev, joiningDate: e.target.value }))}
                    className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Expiration Window (Days):</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={offerData.validDays}
                    onChange={(e) => setOfferData(prev => ({ ...prev, validDays: Number(e.target.value) }))}
                    className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOfferApp(null)} className="px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md">Dispatch Formal Offer ➔</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recruiter Schedule Slot Modal */}
      {scheduleApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  Round Scheduling
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Schedule Interview Slot</h3>
                <p className="text-xs text-slate-500">Candidate: {scheduleApp.full_name}</p>
              </div>
              <button onClick={() => setScheduleApp(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Select Interview Round:</label>
                <select
                  value={scheduleData.roundConfigId}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, roundConfigId: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  required
                >
                  <option value="">-- Choose Round --</option>
                  {selectedJob?.rounds?.map(r => (
                    <option key={r.id} value={r.id}>
                      Round {r.round_order}: {r.round_name} ({r.round_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Start Time:</label>
                  <input
                    type="datetime-local"
                    value={scheduleData.scheduledStart}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, scheduledStart: e.target.value }))}
                    className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">End Time:</label>
                  <input
                    type="datetime-local"
                    value={scheduleData.scheduledEnd}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, scheduledEnd: e.target.value }))}
                    className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Meeting Link (Google Meet / Zoom):</label>
                <input
                  type="text"
                  value={scheduleData.meetingLink}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, meetingLink: e.target.value }))}
                  className="w-full p-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setScheduleApp(null)} className="px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md">Invite Candidate ➔</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 6. NOTIFICATION BELL & DRAWER COMPONENT
// =========================================================================
function NotificationBellDrawer({ currentUser, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const userId = currentUser?.user_id || currentUser?.id || 'u0000000-0000-0000-0000-000000000001';

  const fetchNotifs = () => {
    fetch(`/api/v1/student/notifications?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.notifications) setNotifications(data.notifications);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = (id) => {
    fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
      .then(() => fetchNotifs());
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition relative cursor-pointer"
        title="Recruitment Notifications"
      >
        <span className="text-sm">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white rounded-3xl p-4 shadow-2xl border border-slate-200 z-50 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-black text-slate-900 text-xs">Recruitment Live Alerts</h4>
            <span className="text-[10px] font-bold text-slate-400">{unreadCount} unread</span>
          </div>

          <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">No notifications yet.</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    handleMarkAsRead(n.id);
                    if (onNavigate) onNavigate(n.type);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-xs transition cursor-pointer ${
                    !n.is_read ? 'bg-indigo-50/70 border-indigo-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-bold text-indigo-700">{n.type}</span>
                    <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h5 className="font-extrabold text-slate-900 text-xs">{n.title}</h5>
                  <p className="text-slate-600 text-[11px] mt-0.5">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
