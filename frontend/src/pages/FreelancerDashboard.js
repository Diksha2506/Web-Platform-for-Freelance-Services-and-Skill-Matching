import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBriefcase, FiFileText, FiBell, FiMapPin, FiClock, FiDollarSign, FiSend, FiMessageCircle, FiCheck, FiChevronDown } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi';
import { LuLayoutDashboard, LuBriefcase, LuClipboardList, LuWallet, LuFolderKanban, LuMessageSquare, LuBell, LuCircleUser, LuCircleHelp, LuVideo, LuStar } from 'react-icons/lu';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import ChatPanel from '../components/ChatPanel';
import { useAuth } from '../context/AuthContext';
import { jobsAPI, applicationsAPI, notificationsAPI, dashboardAPI, authAPI, chatAPI, earningsAPI, freelancerProjectsAPI, supportAPI, interviewsAPI } from '../services/api';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const FreelancerDashboard = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyModal, setApplyModal] = useState(null);
  const [applyData, setApplyData] = useState({ cover_letter: '', proposed_rate: '' });
  const [earnings, setEarnings] = useState([]);
  const [earningsStats, setEarningsStats] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentData, setPaymentData] = useState({ hours_worked: '', description: '' });
  const [freelancerProjects, setFreelancerProjects] = useState([]);
  const [selectedFreelancerProject, setSelectedFreelancerProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [interviews, setInterviews] = useState([]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LuLayoutDashboard /> },
    { id: 'jobs', label: 'Browse Jobs', icon: <LuBriefcase /> },
    { id: 'applications', label: 'My Applications', icon: <LuClipboardList />, badge: myApplications.filter(a => a.status === 'pending').length },
    { id: 'earnings', label: 'Earnings', icon: <LuWallet /> },
    { id: 'interviews', label: 'Interviews', icon: <LuVideo /> },
    { id: 'projects', label: 'Projects', icon: <LuFolderKanban /> },
    { id: 'messages', label: 'Messages', icon: <LuMessageSquare /> },
    { id: 'notifications', label: 'Notifications', icon: <LuBell />, badge: notifications.filter(n => !n.is_read).length },
    { id: 'profile', label: 'My Profile', icon: <LuCircleUser /> },
    { id: 'help', label: 'Help Center', icon: <LuCircleHelp /> },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const promises = [
        dashboardAPI.getStats(),
        jobsAPI.getAll(),
        applicationsAPI.getMyApplications(),
        notificationsAPI.getAll(),
        earningsAPI.getAll(),
        earningsAPI.getStats(),
      ];
      const [statsRes, jobsRes, appsRes, notifsRes, earningsRes, earningsStatsRes] = await Promise.all(promises);
      setStats(statsRes.data);
      setJobs(jobsRes.data);
      setMyApplications(appsRes.data);
      setNotifications(notifsRes.data);
      setEarnings(earningsRes.data);
      setEarningsStats(earningsStatsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  const handleApply = async (jobId) => {
    try {
      await applicationsAPI.apply(jobId, applyData);
      toast.success('Application submitted! 🎉');
      setApplyModal(null);
      setApplyData({ cover_letter: '', proposed_rate: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) { /* ignore */ }
  };

  const handleRequestPayment = async (applicationId) => {
    try {
      await earningsAPI.requestPayment({
        application_id: applicationId,
        hours_worked: paymentData.hours_worked,
        description: paymentData.description,
      });
      toast.success('Payment request submitted!');
      setPaymentModal(null);
      setPaymentData({ hours_worked: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to request payment');
    }
  };

  const handleProfileUpdate = async (profileData) => {
    try {
      const res = await authAPI.updateProfile(profileData);
      updateUser(res.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchFreelancerProjects = useCallback(async () => {
    try {
      const res = await freelancerProjectsAPI.getAll();
      setFreelancerProjects(res.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }, []);

  const fetchInterviews = useCallback(async () => {
    try {
      const res = await interviewsAPI.getAll();
      setInterviews(res.data);
    } catch (err) {
      console.error('Error fetching interviews:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'projects') {
      fetchFreelancerProjects();
    }
    if (activeTab === 'interviews') {
      fetchInterviews();
    }
  }, [activeTab, fetchFreelancerProjects, fetchInterviews]);

  const handleToggleTask = async (taskId) => {
    try {
      await freelancerProjectsAPI.toggleTask(taskId);
      if (selectedFreelancerProject) {
        const res = await freelancerProjectsAPI.getOne(selectedFreelancerProject.id);
        setSelectedFreelancerProject(res.data);
      }
      fetchFreelancerProjects();
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20 },
  };

  const renderOverview = () => (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="stats-grid">
        <motion.div className="stat-card" whileHover={{ y: -4 }}>
          <div className="stat-card-header">
            <div className="stat-icon purple"><FiBriefcase /></div>
            <span className="stat-trend up">Available</span>
          </div>
          <h3>{stats?.available_jobs || 0}</h3>
          <p>Available Jobs</p>
        </motion.div>
        <motion.div className="stat-card" whileHover={{ y: -4 }}>
          <div className="stat-card-header">
            <div className="stat-icon green"><FiSend /></div>
          </div>
          <h3>{stats?.total_applications || 0}</h3>
          <p>Total Applications</p>
        </motion.div>
        <motion.div className="stat-card" whileHover={{ y: -4 }}>
          <div className="stat-card-header">
            <div className="stat-icon blue"><FiClock /></div>
          </div>
          <h3>{stats?.pending_applications || 0}</h3>
          <p>Pending Reviews</p>
        </motion.div>
        <motion.div className="stat-card" whileHover={{ y: -4 }}>
          <div className="stat-card-header">
            <div className="stat-icon green"><HiOutlineSparkles /></div>
          </div>
          <h3>{stats?.accepted_applications || 0}</h3>
          <p>Accepted</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Earnings Trend</h3>
          <div style={{ height: 250 }}>
            <Line
              data={{
                labels: earningsStats?.monthly_earnings?.map(m => m.month?.split(' ')[0]) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                  label: 'Earnings ($)',
                  data: earningsStats?.monthly_earnings?.map(m => m.amount) || [0, 0, 0, 0, 0, 0],
                  borderColor: '#2EC4B6',
                  backgroundColor: 'rgba(46,196,182,0.1)',
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#2EC4B6',
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { color: '#F0F0F0' } }, x: { grid: { display: false } } },
              }}
            />
          </div>
        </div>
        <div className="chart-card">
          <h3>Applications Overview</h3>
          <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut
              data={{
                labels: ['Pending', 'Accepted', 'Rejected', 'Reviewed'],
                datasets: [{
                  data: [
                    stats?.pending_applications || 0,
                    stats?.accepted_applications || 0,
                    stats?.rejected_applications || 0,
                    (stats?.total_applications || 0) - (stats?.pending_applications || 0) - (stats?.accepted_applications || 0) - (stats?.rejected_applications || 0),
                  ],
                  backgroundColor: ['#F59E0B', '#10B981', '#EF4444', '#3B82F6'],
                  borderWidth: 0,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } },
                },
                cutout: '65%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Profile Completion */}
      <div className="card" style={{ marginBottom: 24, marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: '1rem' }}>Profile Completion</h3>
          <span style={{ color: '#2EC4B6', fontWeight: 700 }}>{stats?.profile_completion || 0}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${stats?.profile_completion || 0}%` }}></div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="section-header">
        <h2>Latest Jobs For You</h2>
        <span className="view-all" onClick={() => setActiveTab('jobs')}>View All →</span>
      </div>
      <div className="jobs-grid">
        {jobs.slice(0, 4).map((job) => (
          <JobCard key={job.id} job={job} onApply={() => setApplyModal(job)} />
        ))}
        {jobs.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💼</div>
            <h3>No jobs available yet</h3>
            <p>Check back later for new opportunities!</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderJobs = () => {
    const q = searchQuery.toLowerCase();
    const filtered = q ? jobs.filter(j =>
      j.title?.toLowerCase().includes(q) ||
      j.description?.toLowerCase().includes(q) ||
      j.company_name?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q) ||
      (j.required_skills || []).some(s => s.toLowerCase().includes(q))
    ) : jobs;
    return (
      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="section-header">
          <h2>All Available Jobs ({filtered.length})</h2>
        </div>
        <div className="jobs-grid">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} onApply={() => setApplyModal(job)} />
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No jobs found</h3>
              <p>Try adjusting your search filters</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderApplications = () => {
    const q = searchQuery.toLowerCase();
    const filtered = q ? myApplications.filter(a =>
      a.job_title?.toLowerCase().includes(q) ||
      a.status?.toLowerCase().includes(q)
    ) : myApplications;
    return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="section-header">
        <h2>My Applications ({filtered.length})</h2>
      </div>
      {filtered.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Applied On</th>
                <th>Proposed Rate</th>
                <th>Status</th>
                <th>Chat</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 600 }}>{app.job_title}</td>
                  <td style={{ color: '#6B7280' }}>{new Date(app.created_at).toLocaleDateString()}</td>
                  <td style={{ color: '#2EC4B6', fontWeight: 600 }}>${app.proposed_rate}/hr</td>
                  <td>
                    <span className={`job-status-badge badge-${app.status}`}>
                      {app.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      onClick={async () => {
                        try {
                          await chatAPI.startConversation(app.id);
                          setActiveTab('messages');
                        } catch (err) {
                          toast.error('Could not start conversation');
                        }
                      }}
                    >
                      <FiMessageCircle /> Message
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No applications yet</h3>
          <p>Browse available jobs and submit your first application!</p>
        </div>
      )}
    </motion.div>
    );
  };

  const renderNotifications = () => {
    const q = searchQuery.toLowerCase();
    const filtered = q ? notifications.filter(n =>
      n.title?.toLowerCase().includes(q) ||
      n.message?.toLowerCase().includes(q)
    ) : notifications;
    return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="section-header">
        <h2>Notifications</h2>
        {filtered.some(n => !n.is_read) && (
          <button className="btn-secondary" onClick={async () => {
            await notificationsAPI.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
          }}>
            Mark all read
          </button>
        )}
      </div>
      <div className="notifications-list">
        {filtered.map((notif) => (
          <motion.div
            key={notif.id}
            className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
            onClick={() => handleMarkRead(notif.id)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="notification-icon" style={{
              background: notif.notification_type === 'application_accepted' ? 'rgba(16,185,129,0.12)' :
                         notif.notification_type === 'application_rejected' ? 'rgba(239,68,68,0.12)' :
                         'rgba(46,196,182,0.12)',
              color: notif.notification_type === 'application_accepted' ? '#10B981' :
                     notif.notification_type === 'application_rejected' ? '#EF4444' : '#2EC4B6',
            }}>
              <FiBell />
            </div>
            <div className="notification-content">
              <h4>{notif.title}</h4>
              <p>{notif.message}</p>
              <span className="notification-time">
                {new Date(notif.created_at).toLocaleString()}
              </span>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        )}
      </div>
    </motion.div>
    );
  };

  const renderProfile = () => {
    const profile = user?.freelancer_profile || {};
    return (
      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.first_name?.[0]?.toUpperCase()}{user?.last_name?.[0]?.toUpperCase()}
          </div>
          <div className="profile-info">
            <h2>{user?.first_name} {user?.last_name}</h2>
            <p>{profile.title || 'Freelancer'} · {user?.location || 'No location set'}</p>
            <p style={{ color: '#2EC4B6', fontWeight: 600, marginTop: 4 }}>
              ${profile.hourly_rate || 0}/hr · {profile.experience_level || 'Entry'} Level
            </p>
          </div>
        </div>

        <ProfileForm user={user} profile={profile} onSave={handleProfileUpdate} />
      </motion.div>
    );
  };

  // ─── Projects (Freelancer View) ─────────────────────────
  const renderProjects = () => {
    const q = searchQuery.toLowerCase();
    const filteredProjects = q ? freelancerProjects.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.status?.toLowerCase().includes(q)
    ) : freelancerProjects;

    if (selectedFreelancerProject) {
      const proj = selectedFreelancerProject;
      const myTasks = (proj.tasks || []).filter(t => t.assigned_to === user?.id);
      const otherTasks = (proj.tasks || []).filter(t => t.assigned_to !== user?.id);

      return (
        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <button className="btn-secondary" style={{ marginBottom: 20, padding: '8px 16px' }}
            onClick={() => { setSelectedFreelancerProject(null); fetchFreelancerProjects(); }}>
            ← Back to Projects
          </button>

          {/* Project Header */}
          <div className="project-detail-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', marginBottom: 4 }}>{proj.title}</h2>
                <p style={{ color: '#6B7280' }}>{proj.description || 'No description'}</p>
              </div>
              <span className={`project-status-badge ${proj.status}`} style={{ textTransform: 'capitalize' }}>
                {proj.status?.replace('_', ' ')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: '0.9rem', color: '#9CA3AF' }}>
              <span>📅 Deadline: {proj.deadline || 'None'}</span>
              <span>⏱ {proj.planned_hours || 0}h planned</span>
              <span>📊 {proj.progress || 0}% complete</span>
            </div>
            <div className="progress-bar-container" style={{ marginTop: 12 }}>
              <div className="progress-bar-fill" style={{ width: `${proj.progress || 0}%` }}></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* My Tasks */}
            <div className="project-detail-panel">
              <h3>My Tasks ({myTasks.length})</h3>
              {myTasks.length > 0 ? myTasks.map(task => (
                <div key={task.id} className="task-item">
                  <button
                    className={`task-checkbox ${task.is_completed ? 'done' : ''}`}
                    onClick={() => handleToggleTask(task.id)}
                  >
                    {task.is_completed && <FiCheck size={14} />}
                  </button>
                  <div className="task-info">
                    <div className={`task-title ${task.is_completed ? 'done' : ''}`}>{task.title}</div>
                    <div className="task-meta">
                      {task.due_date || 'No date'} · {task.hours || 0}h
                    </div>
                  </div>
                </div>
              )) : (
                <p style={{ color: '#9CA3AF', padding: '12px 0' }}>No tasks assigned to you</p>
              )}
            </div>

            {/* All Tasks Overview */}
            <div className="project-detail-panel">
              <h3>All Tasks ({(proj.tasks || []).length})</h3>
              {(proj.tasks || []).map(task => (
                <div key={task.id} className="task-item" style={{ opacity: task.assigned_to === user?.id ? 1 : 0.7 }}>
                  <div className={`task-checkbox ${task.is_completed ? 'done' : ''}`} style={{ cursor: 'default' }}>
                    {task.is_completed && <FiCheck size={14} />}
                  </div>
                  <div className="task-info">
                    <div className={`task-title ${task.is_completed ? 'done' : ''}`}>{task.title}</div>
                    <div className="task-meta">
                      {task.assigned_to_name || 'Unassigned'} · {task.due_date || 'No date'} · {task.hours || 0}h
                    </div>
                  </div>
                </div>
              ))}
              {(proj.tasks || []).length === 0 && (
                <p style={{ color: '#9CA3AF', padding: '12px 0' }}>No tasks yet</p>
              )}
            </div>
          </div>

          {/* Meetings */}
          {(proj.meetings || []).length > 0 && (
            <div className="project-detail-panel" style={{ marginTop: 24 }}>
              <h3>Meetings ({proj.meetings.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {proj.meetings.map(meeting => (
                  <div key={meeting.id} className="meeting-item">
                    <h4>{meeting.topic}</h4>
                    <p>📅 {new Date(meeting.timing).toLocaleString()}</p>
                    {meeting.description && <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>{meeting.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      );
    }

    return (
      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="section-header">
          <h2>My Projects ({filteredProjects.length})</h2>
        </div>
        <div className="project-list">
          {filteredProjects.map(project => {
            const myTaskCount = (project.tasks || []).filter(t => t.assigned_to === user?.id).length;
            const myCompletedCount = (project.tasks || []).filter(t => t.assigned_to === user?.id && t.is_completed).length;
            return (
              <motion.div
                key={project.id}
                className="project-item"
                onClick={async () => {
                  try {
                    const res = await freelancerProjectsAPI.getOne(project.id);
                    setSelectedFreelancerProject(res.data);
                  } catch (err) {
                    toast.error('Failed to load project');
                  }
                }}
                whileHover={{ y: -2 }}
              >
                <div className="project-item-header">
                  <h3>{project.title}</h3>
                  <span className={`project-status-badge ${project.status}`}>{project.status?.replace('_', ' ')}</span>
                </div>
                <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: 8 }}>{project.description || 'No description'}</p>
                <div style={{ display: 'flex', gap: 24, fontSize: '0.85rem', color: '#9CA3AF' }}>
                  <span>📅 {project.deadline || 'No deadline'}</span>
                  <span>✅ {project.completed_task_count || 0}/{project.task_count || 0} tasks</span>
                  <span>🎯 {myCompletedCount}/{myTaskCount} my tasks</span>
                  <span>⏱ {project.planned_hours || 0}h planned</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${project.progress || 0}%` }}></div>
                </div>
              </motion.div>
            );
          })}
          {filteredProjects.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No projects yet</h3>
              <p>Projects assigned to you by recruiters will appear here</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderEarnings = () => {
    const acceptedApps = myApplications.filter(a => a.status === 'accepted');
    const q = searchQuery.toLowerCase();
    const filteredEarnings = q ? earnings.filter(e =>
      e.job_title?.toLowerCase().includes(q) ||
      e.recruiter_name?.toLowerCase().includes(q) ||
      e.status?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q)
    ) : earnings;
    return (
      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
        {/* Earnings Stats Cards */}
        <div className="stats-grid">
          <motion.div className="stat-card" whileHover={{ y: -4 }}>
            <div className="stat-card-header">
              <div className="stat-icon green"><FiDollarSign /></div>
              <span className="stat-trend up">Total</span>
            </div>
            <h3>${earningsStats?.total_earned?.toFixed(2) || '0.00'}</h3>
            <p>Total Earned</p>
          </motion.div>
          <motion.div className="stat-card" whileHover={{ y: -4 }}>
            <div className="stat-card-header">
              <div className="stat-icon blue"><FiClock /></div>
            </div>
            <h3>${earningsStats?.pending_amount?.toFixed(2) || '0.00'}</h3>
            <p>Pending</p>
          </motion.div>
          <motion.div className="stat-card" whileHover={{ y: -4 }}>
            <div className="stat-card-header">
              <div className="stat-icon purple"><FiSend /></div>
            </div>
            <h3>${earningsStats?.processing_amount?.toFixed(2) || '0.00'}</h3>
            <p>Processing</p>
          </motion.div>
          <motion.div className="stat-card" whileHover={{ y: -4 }}>
            <div className="stat-card-header">
              <div className="stat-icon green"><FiClock /></div>
            </div>
            <h3>{earningsStats?.total_hours?.toFixed(1) || '0'} hrs</h3>
            <p>Hours Worked</p>
          </motion.div>
        </div>

        {/* Request Payment Section */}
        {acceptedApps.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Request Payment</h3>
            <p style={{ color: '#6B7280', marginBottom: 16, fontSize: '0.9rem' }}>
              Select an accepted job to log hours and request payment.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {acceptedApps.map((app) => (
                <motion.button
                  key={app.id}
                  className="btn-secondary"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 18px', fontSize: '0.85rem',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentModal(app)}
                >
                  <FiDollarSign /> {app.job_title}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Earnings History Table */}
        <div className="section-header">
          <h2>Transaction History ({filteredEarnings.length})</h2>
        </div>
        {filteredEarnings.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Hours</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
              {filteredEarnings.map((earning) => (
                  <tr key={earning.id}>
                    <td style={{ fontWeight: 600 }}>{earning.job_title}</td>
                    <td style={{ color: '#6B7280' }}>{earning.recruiter_name}</td>
                    <td style={{ color: '#6B7280' }}>{earning.hours_worked} hrs</td>
                    <td style={{ color: '#2EC4B6', fontWeight: 600 }}>${earning.amount}</td>
                    <td>
                      <span className={`job-status-badge badge-${earning.status === 'paid' ? 'accepted' : earning.status === 'pending' ? 'pending' : earning.status === 'processing' ? 'reviewed' : 'rejected'}`}>
                        {earning.status}
                      </span>
                    </td>
                    <td style={{ color: '#6B7280' }}>{new Date(earning.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3>No earnings yet</h3>
            <p>Once your applications are accepted, you can log hours and request payments here.</p>
          </div>
        )}

        {/* Monthly Earnings Chart */}
        <div className="charts-grid" style={{ marginTop: 24 }}>
          <div className="chart-card">
            <h3>Monthly Earnings</h3>
            <div style={{ height: 250 }}>
              <Bar
                data={{
                  labels: earningsStats?.monthly_earnings?.map(m => m.month?.split(' ')[0]) || [],
                  datasets: [{
                    label: 'Earnings ($)',
                    data: earningsStats?.monthly_earnings?.map(m => m.amount) || [],
                    backgroundColor: 'rgba(46,196,182,0.7)',
                    borderColor: '#2EC4B6',
                    borderWidth: 1,
                    borderRadius: 8,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, grid: { color: '#F0F0F0' } }, x: { grid: { display: false } } },
                }}
              />
            </div>
          </div>
          <div className="chart-card">
            <h3>Earnings by Status</h3>
            <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut
                data={{
                  labels: ['Paid', 'Pending', 'Processing'],
                  datasets: [{
                    data: [
                      earningsStats?.total_earned || 0,
                      earningsStats?.pending_amount || 0,
                      earningsStats?.processing_amount || 0,
                    ],
                    backgroundColor: ['#10B981', '#F59E0B', '#3B82F6'],
                    borderWidth: 0,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } },
                  },
                  cutout: '65%',
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // ─── Interviews ───────────────────────────
  const renderInterviews = () => {
    const filtered = interviews.filter(iv =>
      !searchQuery ||
      iv.recruiter_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iv.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iv.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const upcoming = filtered.filter(iv => iv.status === 'scheduled');
    const completed = filtered.filter(iv => iv.status === 'completed');
    const cancelled = filtered.filter(iv => iv.status === 'cancelled');

    const statusColor = { scheduled: '#3B82F6', completed: '#10B981', cancelled: '#EF4444' };
    const typeLabel = { video: 'Video Call', phone: 'Phone Call', in_person: 'In Person' };

    const pageVariants = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      exit: { opacity: 0, y: -20 },
    };

    return (
      <motion.div key="interviews" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Upcoming', value: upcoming.length, color: '#3B82F6' },
            { label: 'Completed', value: completed.length, color: '#10B981' },
            { label: 'Cancelled', value: cancelled.length, color: '#EF4444' },
            { label: 'Total', value: interviews.length, color: '#2EC4B6' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>{s.label}</p>
              <h3 style={{ color: s.color }}>{s.value}</h3>
            </div>
          ))}
        </div>

        {upcoming.length > 0 && (
          <>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Upcoming Interviews</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {upcoming.map(iv => (
                <div key={iv.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h4 style={{ fontWeight: 600, margin: 0, fontSize: '1.05rem' }}>{iv.job_title}</h4>
                    <span style={{
                      padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                      background: `${statusColor[iv.status]}15`, color: statusColor[iv.status],
                    }}>
                      {iv.status}
                    </span>
                  </div>
                  <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: '4px 0' }}>
                    Recruiter: {iv.recruiter_name}
                  </p>
                  <p style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, fontSize: '0.85rem', color: '#6B7280', alignItems: 'center' }}>
                    <FiClock size={14} style={{ flexShrink: 0 }} />
                    <span>{new Date(iv.scheduled_at).toLocaleDateString()} at {new Date(iv.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span> · {iv.duration_minutes} min · {typeLabel[iv.interview_type] || iv.interview_type}</span>
                  </p>
                  {iv.notes && (
                    <p style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: 8, fontStyle: 'italic' }}>
                      {iv.notes}
                    </p>
                  )}
                  {iv.meeting_link && (
                    <a href={iv.meeting_link} target="_blank" rel="noopener noreferrer"
                      style={{
                        marginTop: 10, padding: '8px 18px', fontSize: '0.85rem', textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content',
                        background: 'var(--gradient-primary)', color: '#fff', borderRadius: 8, fontWeight: 600,
                      }}>
                      <LuVideo size={15} /> Join Meeting
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {completed.length > 0 && (
          <>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Completed Interviews</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {completed.map(iv => (
                <div key={iv.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h4 style={{ fontWeight: 600, margin: 0, fontSize: '1.05rem' }}>{iv.job_title}</h4>
                    <span style={{
                      padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                      background: '#10B98115', color: '#10B981',
                    }}>
                      completed
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.85rem', color: '#6B7280', alignItems: 'center', margin: '4px 0' }}>
                    <span>Recruiter: {iv.recruiter_name}</span>
                    <span>&middot; {new Date(iv.scheduled_at).toLocaleDateString()}</span>
                  </div>
                  {iv.feedback && (
                    <div style={{ marginTop: 10, padding: 12, background: '#F0FDF4', borderRadius: 8 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#065F46', marginBottom: 4 }}>Feedback</p>
                      <p style={{ fontSize: '0.85rem', color: '#065F46', margin: 0 }}>{iv.feedback}</p>
                      {iv.rating && (
                        <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <LuStar key={s} size={14} style={{ color: s <= iv.rating ? '#F59E0B' : '#D1D5DB', fill: s <= iv.rating ? '#F59E0B' : 'none' }} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {cancelled.length > 0 && (
          <>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Cancelled Interviews</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {cancelled.map(iv => (
                <div key={iv.id} className="card" style={{ padding: 20, opacity: 0.7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h4 style={{ fontWeight: 600, margin: 0, fontSize: '1.05rem' }}>{iv.job_title}</h4>
                    <span style={{
                      padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                      background: '#EF444415', color: '#EF4444',
                    }}>
                      cancelled
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.85rem', color: '#6B7280', alignItems: 'center' }}>
                    <span>Recruiter: {iv.recruiter_name}</span>
                    <span>&middot; Was scheduled for {new Date(iv.scheduled_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {interviews.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><LuVideo size={40} /></div>
            <h3>No Interviews Yet</h3>
            <p>Your scheduled interviews will appear here when recruiters schedule them</p>
          </div>
        )}
      </motion.div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'jobs': return renderJobs();
      case 'applications': return renderApplications();
      case 'earnings': return renderEarnings();
      case 'interviews': return renderInterviews();
      case 'projects': return renderProjects();
      case 'messages': return <ChatPanel />;
      case 'notifications': return renderNotifications();
      case 'profile': return renderProfile();
      case 'help': return <FreelancerHelpCenter />;
      default: return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar navItems={navItems} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="main-content">
          <div className="loading-spinner" style={{ minHeight: '100vh' }}>
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar navItems={navItems} activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Topbar
          title={activeTab === 'overview' ? `Welcome, ${user?.first_name || 'Freelancer'}!` : navItems.find(n => n.id === activeTab)?.label}
          subtitle={activeTab === 'overview' ? 'Here\'s what\'s happening with your career' : undefined}
          unreadCount={unreadCount}
          onNotificationClick={() => setActiveTab('notifications')}
          onProfileClick={() => setActiveTab('profile')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <div className="page-content">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {applyModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setApplyModal(null)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Apply for: {applyModal.title}</h2>
              <p style={{ color: '#6B7280', marginBottom: 20, marginTop: -16 }}>
                at {applyModal.company_name} · ${applyModal.pay_per_hour}/hr
              </p>

              <div className="form-group">
                <label>Proposed Rate ($/hr)</label>
                <input
                  type="number"
                  placeholder={`Suggested: $${applyModal.pay_per_hour}/hr`}
                  value={applyData.proposed_rate}
                  onChange={(e) => setApplyData({ ...applyData, proposed_rate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Cover Letter</label>
                <textarea
                  rows={5}
                  placeholder="Tell the recruiter why you're the perfect fit..."
                  value={applyData.cover_letter}
                  onChange={(e) => setApplyData({ ...applyData, cover_letter: e.target.value })}
                  style={{
                    width: '100%', padding: '14px 16px', background: '#F5F7FA',
                    border: '1.5px solid #E5E7EB', borderRadius: '12px', color: '#1A1A2E',
                    fontSize: '0.95rem', resize: 'vertical',
                  }}
                />
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setApplyModal(null)}>Cancel</button>
                <button className="btn-primary" style={{ width: 'auto', padding: '12px 32px' }} onClick={() => handleApply(applyModal.id)}>
                  Submit Application
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Request Modal */}
      <AnimatePresence>
        {paymentModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPaymentModal(null)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Request Payment</h2>
              <p style={{ color: '#6B7280', marginBottom: 20, marginTop: -16 }}>
                {paymentModal.job_title} · Rate: ${paymentModal.proposed_rate}/hr
              </p>

              <div className="form-group">
                <label>Hours Worked</label>
                <input
                  type="number"
                  placeholder="Enter hours worked"
                  value={paymentData.hours_worked}
                  onChange={(e) => setPaymentData({ ...paymentData, hours_worked: e.target.value })}
                />
                {paymentData.hours_worked && (
                  <p style={{ color: '#2EC4B6', fontWeight: 600, marginTop: 8, fontSize: '0.9rem' }}>
                    Estimated amount: ${(parseFloat(paymentData.hours_worked || 0) * parseFloat(paymentModal.proposed_rate || 0)).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of work completed..."
                  value={paymentData.description}
                  onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                  style={{
                    width: '100%', padding: '14px 16px', background: '#F5F7FA',
                    border: '1.5px solid #E5E7EB', borderRadius: '12px', color: '#1A1A2E',
                    fontSize: '0.95rem', resize: 'vertical',
                  }}
                />
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setPaymentModal(null)}>Cancel</button>
                <button
                  className="btn-primary"
                  style={{ width: 'auto', padding: '12px 32px' }}
                  onClick={() => handleRequestPayment(paymentModal.id)}
                  disabled={!paymentData.hours_worked || parseFloat(paymentData.hours_worked) <= 0}
                >
                  Submit Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Job Card Component ─────────
const JobCard = ({ job, onApply }) => (
  <motion.div
    className="job-card"
    whileHover={{ y: -4 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="job-card-header">
      <div className="job-card-company">
        <div className="company-avatar">
          {job.company_name?.[0] || 'C'}
        </div>
        <div>
          <h4>{job.company_name || 'Company'}</h4>
          <span><FiMapPin style={{ marginRight: 4 }} />{job.location || 'Remote'}</span>
        </div>
      </div>
      <span className={`job-status-badge badge-${job.status}`}>{job.status}</span>
    </div>

    <h3>{job.title}</h3>
    <p className="job-card-description">{job.description}</p>

    <div className="job-card-skills">
      {(job.required_skills || []).slice(0, 4).map((skill, i) => (
        <span key={i} className="skill-tag">{skill}</span>
      ))}
      {(job.required_skills || []).length > 4 && (
        <span className="skill-tag">+{job.required_skills.length - 4}</span>
      )}
    </div>

    <div className="job-card-footer">
      <div className="job-pay">
        <FiDollarSign />{job.pay_per_hour}<span>/hr</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
          <FiFileText style={{ marginRight: 4 }} />{job.applicants_count} applied
        </span>
        {job.has_applied ? (
          <span className="job-status-badge badge-pending">Applied</span>
        ) : (
          <button className="btn-primary" style={{ width: 'auto', padding: '8px 20px', fontSize: '0.85rem' }} onClick={onApply}>
            Apply Now
          </button>
        )}
      </div>
    </div>
  </motion.div>
);

// ─── Profile Form Component ─────────
const ProfileForm = ({ user, profile, onSave }) => {
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    title: profile?.title || '',
    skills: profile?.skills || [],
    tech_stack: profile?.tech_stack || [],
    experience_level: profile?.experience_level || 'entry',
    years_of_experience: profile?.years_of_experience || 0,
    hourly_rate: profile?.hourly_rate || 0,
    education: profile?.education || '',
    portfolio_url: profile?.portfolio_url || '',
    github_url: profile?.github_url || '',
    linkedin_url: profile?.linkedin_url || '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [techInput, setTechInput] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!form.skills.includes(skillInput.trim())) {
        setForm({ ...form, skills: [...form.skills, skillInput.trim()] });
      }
      setSkillInput('');
    }
  };

  const addTech = (e) => {
    if (e.key === 'Enter' && techInput.trim()) {
      e.preventDefault();
      if (!form.tech_stack.includes(techInput.trim())) {
        setForm({ ...form, tech_stack: [...form.tech_stack, techInput.trim()] });
      }
      setTechInput('');
    }
  };

  return (
    <div className="profile-grid">
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: 20 }}>Personal Info</h3>
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input name="first_name" value={form.first_name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input name="last_name" value={form.last_name} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label>Professional Title</label>
          <input name="title" placeholder="e.g. Full Stack Developer" value={form.title} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Location</label>
          <input name="location" placeholder="City, Country" value={form.location} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea name="bio" rows={3} value={form.bio} onChange={handleChange}
            style={{ width: '100%', padding: '14px 16px', background: '#F5F7FA', border: '1.5px solid #E5E7EB', borderRadius: '12px', color: '#1A1A2E', fontSize: '0.95rem', resize: 'vertical' }}
          />
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: 20 }}>Professional Details</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Experience Level</label>
            <select name="experience_level" value={form.experience_level} onChange={handleChange}>
              <option value="entry">Entry Level</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div className="form-group">
            <label>Hourly Rate ($)</label>
            <input type="number" name="hourly_rate" value={form.hourly_rate} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label>Skills (press Enter to add)</label>
          <div className="tags-input">
            {form.skills.map((s, i) => (
              <span key={i} className="tag">{s} <button onClick={() => setForm({ ...form, skills: form.skills.filter((_, j) => j !== i) })}>×</button></span>
            ))}
            <input placeholder="Add skill..." value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={addSkill} />
          </div>
        </div>
        <div className="form-group">
          <label>Tech Stack (press Enter to add)</label>
          <div className="tags-input">
            {form.tech_stack.map((t, i) => (
              <span key={i} className="tag">{t} <button onClick={() => setForm({ ...form, tech_stack: form.tech_stack.filter((_, j) => j !== i) })}>×</button></span>
            ))}
            <input placeholder="Add technology..." value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={addTech} />
          </div>
        </div>
        <div className="form-group">
          <label>Education</label>
          <textarea name="education" rows={2} value={form.education} onChange={handleChange}
            style={{ width: '100%', padding: '14px 16px', background: '#F5F7FA', border: '1.5px solid #E5E7EB', borderRadius: '12px', color: '#1A1A2E', fontSize: '0.95rem', resize: 'vertical' }}
          />
        </div>
        <div className="form-group">
          <label>Portfolio URL</label>
          <input name="portfolio_url" value={form.portfolio_url} onChange={handleChange} placeholder="https://" />
        </div>
        <div className="form-group">
          <label>GitHub URL</label>
          <input name="github_url" value={form.github_url} onChange={handleChange} placeholder="https://github.com/" />
        </div>

        <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => onSave(form)}>
          Save Profile
        </button>
      </div>
    </div>
  );
};

// ─── Help Center Component (Freelancer) ─────────
const FreelancerHelpCenter = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const faqs = [
    { q: 'How do I find and apply for jobs?', a: 'Go to "Browse Jobs" in the sidebar to see all available jobs. Click "Apply Now" on any job, enter your proposed rate and cover letter, then submit.' },
    { q: 'How do I track my applications?', a: 'Navigate to "My Applications" to see all your submitted applications along with their current status (pending, accepted, or rejected).' },
    { q: 'How do payments work?', a: 'Once your application is accepted, go to "Earnings" to log hours worked and request payment. The recruiter will review and approve your payment request.' },
    { q: 'How do I view my projects?', a: 'Go to the "Projects" tab to see all projects assigned to you. Click on a project to view tasks, meetings, and progress details.' },
    { q: 'How can I contact support?', a: 'Use the support form below to submit a request. Our team typically responds within 24 hours.' },
  ];

  const handleSubmitSupport = async (e) => {
    e.preventDefault();
    if (!supportForm.subject || !supportForm.message) { toast.error('Please fill all fields'); return; }
    setSending(true);
    try {
      await supportAPI.create(supportForm);
      toast.success('Support request submitted!');
      setSupportForm({ subject: '', message: '' });
    } catch (err) {
      toast.error('Failed to submit');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 style={{ marginBottom: 24 }}>Help Center</h2>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Frequently Asked Questions</h3>
        <div className="faq-list">
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item">
              <div className="faq-header" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{faq.q}</span>
                <span className={`faq-arrow ${openFaq === i ? 'open' : ''}`}><FiChevronDown /></span>
              </div>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    className="faq-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 24, width: '100%' }}>
        <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Contact Support</h3>
        <form onSubmit={handleSubmitSupport}>
          <div className="form-group">
            <label>Subject</label>
            <input value={supportForm.subject} onChange={e => setSupportForm({ ...supportForm, subject: e.target.value })} placeholder="Brief description of your issue" />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea rows={4} value={supportForm.message} onChange={e => setSupportForm({ ...supportForm, message: e.target.value })} placeholder="Describe your issue in detail..."
              style={{ width: '100%', padding: '14px 16px', background: '#F5F7FA', border: '1.5px solid #E5E7EB', borderRadius: '12px', color: '#1A1A2E', fontSize: '0.95rem', resize: 'vertical' }}
            />
          </div>
          <motion.button type="submit" className="btn-primary" disabled={sending} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: 'auto', padding: '10px 24px' }}>
            {sending ? 'Sending...' : 'Submit Request'}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};

export default FreelancerDashboard;
