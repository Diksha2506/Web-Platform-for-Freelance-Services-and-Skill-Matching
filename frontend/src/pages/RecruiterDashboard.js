import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBriefcase, FiUsers, FiBell, FiPlus, FiTrash2, FiCheck, FiX, FiEye, FiMessageCircle, FiChevronDown, FiClock } from 'react-icons/fi';
import { LuLayoutDashboard, LuBriefcase, LuCirclePlus, LuFolderKanban, LuMessageSquare, LuCreditCard, LuBell, LuBuilding2, LuCircleHelp, LuVideo, LuCalendarClock, LuStar } from 'react-icons/lu';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import ChatPanel from '../components/ChatPanel';
import { useAuth } from '../context/AuthContext';
import {
  jobsAPI, applicationsAPI, notificationsAPI, dashboardAPI, authAPI, chatAPI,
  projectsAPI, recruiterPaymentsAPI, supportAPI, freelancersAPI, interviewsAPI
} from '../services/api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const RecruiterDashboard = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [myJobs, setMyJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewAppsModal, setViewAppsModal] = useState(null);
  const [jobApplications, setJobApplications] = useState([]);

  // Projects state
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [freelancers, setFreelancers] = useState([]);

  // Payments state
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Interviews state
  const [interviews, setInterviews] = useState([]);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_at: '', duration_minutes: 30, interview_type: 'video', meeting_link: '', notes: ''
  });
  const [interviewLoading, setInterviewLoading] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: <LuLayoutDashboard /> },
    { id: 'my-jobs', label: 'Job Listings', icon: <LuBriefcase /> },
    { id: 'create-job', label: 'Post a Job', icon: <LuCirclePlus /> },
    { id: 'interviews', label: 'Interviews', icon: <LuVideo /> },
    { id: 'projects', label: 'Projects', icon: <LuFolderKanban /> },
    { id: 'messages', label: 'Messages', icon: <LuMessageSquare /> },
    { id: 'payments', label: 'Payments', icon: <LuCreditCard /> },
    { id: 'notifications', label: 'Notifications', icon: <LuBell />, badge: notifications.filter(n => !n.is_read).length },
    { id: 'profile', label: 'Company Profile', icon: <LuBuilding2 /> },
    { id: 'help', label: 'Help Center', icon: <LuCircleHelp /> },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, jobsRes, notifsRes] = await Promise.all([
        dashboardAPI.getStats(),
        jobsAPI.getMyJobs(),
        notificationsAPI.getAll(),
      ]);
      setStats(statsRes.data);
      setMyJobs(jobsRes.data);
      setNotifications(notifsRes.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const [projRes, freelancerRes] = await Promise.all([
        projectsAPI.getAll(),
        freelancersAPI.getAll(),
      ]);
      setProjects(projRes.data);
      setFreelancers(freelancerRes.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const [summaryRes, txRes, reqRes] = await Promise.all([
        recruiterPaymentsAPI.getSummary(),
        recruiterPaymentsAPI.getTransactions(),
        recruiterPaymentsAPI.getRequests(),
      ]);
      setPaymentSummary(summaryRes.data);
      setTransactions(txRes.data);
      setPaymentRequests(reqRes.data);
    } catch (err) {
      console.error('Error fetching payments:', err);
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
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'projects' || activeTab === 'overview') fetchProjects();
    if (activeTab === 'payments' || activeTab === 'overview') fetchPayments();
    if (activeTab === 'interviews') fetchInterviews();
  }, [activeTab, fetchProjects, fetchPayments, fetchInterviews]);

  const handleViewApplications = async (jobId) => {
    try {
      const res = await applicationsAPI.getJobApplications(jobId);
      setJobApplications(res.data);
      setViewAppsModal(jobId);
    } catch (err) {
      toast.error('Failed to fetch applications');
    }
  };

  const handleUpdateAppStatus = async (appId, status) => {
    try {
      await applicationsAPI.updateStatus(appId, { status });
      toast.success(`Application ${status}!`);
      if (viewAppsModal) {
        const res = await applicationsAPI.getJobApplications(viewAppsModal);
        setJobApplications(res.data);
      }
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await jobsAPI.delete(jobId);
      toast.success('Job deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete job');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) { /* ignore */ }
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

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!scheduleForm.scheduled_at) { toast.error('Please select date and time'); return; }
    setInterviewLoading(true);
    try {
      await interviewsAPI.schedule({
        application_id: scheduleModal.id,
        scheduled_at: scheduleForm.scheduled_at,
        duration_minutes: scheduleForm.duration_minutes,
        interview_type: scheduleForm.interview_type,
        meeting_link: scheduleForm.meeting_link,
        notes: scheduleForm.notes,
      });
      toast.success('Interview scheduled!');
      setScheduleModal(null);
      setScheduleForm({ scheduled_at: '', duration_minutes: 30, interview_type: 'video', meeting_link: '', notes: '' });
      fetchInterviews();
      if (viewAppsModal) {
        const res = await applicationsAPI.getJobApplications(viewAppsModal);
        setJobApplications(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to schedule interview');
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleUpdateInterview = async (id, data) => {
    console.log('handleUpdateInterview called:', { id, data });
    try {
      const res = await interviewsAPI.update(id, data);
      console.log('Update interview success:', res.data);
      toast.success('Interview updated!');
      fetchInterviews();
    } catch (err) {
      console.error('Update interview error:', err.response?.status, err.response?.data, err.message);
      toast.error(err.response?.data?.error || 'Failed to update interview');
    }
  };

  const handleDeleteInterview = async (id) => {
    console.log('handleDeleteInterview called:', { id });
    if (!window.confirm('Delete this interview?')) return;
    try {
      const res = await interviewsAPI.delete(id);
      console.log('Delete interview success:', res.data);
      toast.success('Interview deleted');
      fetchInterviews();
    } catch (err) {
      console.error('Delete interview error:', err.response?.status, err.response?.data, err.message);
      toast.error(err.response?.data?.error || 'Failed to delete interview');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20 },
  };

  // ─── Overview ─────────────────────────────
  const renderOverview = () => {
    const spendingData = {
      labels: paymentSummary?.monthly_spending?.map(m => m.month?.split(' ')[0]) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Spending ($)',
        data: paymentSummary?.monthly_spending?.map(m => m.amount) || [0, 0, 0, 0, 0, 0],
        borderColor: '#2EC4B6',
        backgroundColor: 'rgba(46,196,182,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2EC4B6',
      }],
    };
    const projectsData = {
      labels: ['Active', 'Completed', 'On Hold'],
      datasets: [{
        label: 'Projects',
        data: [
          projects.filter(p => p.status === 'active').length || (stats?.open_jobs || 0),
          projects.filter(p => p.status === 'completed').length || (stats?.total_hires || 0),
          projects.filter(p => p.status === 'on_hold').length || 0,
        ],
        backgroundColor: ['#2EC4B6', '#3B82F6', '#F59E0B'],
        borderRadius: 8,
      }],
    };
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: '#F0F0F0' } }, x: { grid: { display: false } } },
    };

    return (
      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="stats-grid">
          <motion.div className="stat-card" whileHover={{ y: -4 }}>
            <div className="stat-card-header">
              <div className="stat-icon purple"><FiBriefcase /></div>
            </div>
            <h3>{stats?.total_jobs_posted || 0}</h3>
            <p>Active Projects</p>
          </motion.div>
          <motion.div className="stat-card" whileHover={{ y: -4 }}>
            <div className="stat-card-header">
              <div className="stat-icon blue"><FiUsers /></div>
            </div>
            <h3>{stats?.pending_applications || 0}</h3>
            <p>Pending Proposals</p>
          </motion.div>
          <motion.div className="stat-card" whileHover={{ y: -4 }}>
            <div className="stat-card-header">
              <div className="stat-icon green"><FiBriefcase /></div>
              <span className="stat-trend up">Active</span>
            </div>
            <h3>${paymentSummary?.total_spent || 0}</h3>
            <p>Total Spent</p>
          </motion.div>
          <motion.div className="stat-card" whileHover={{ y: -4 }}>
            <div className="stat-card-header">
              <div className="stat-icon orange"><FiCheck /></div>
            </div>
            <h3>{stats?.total_hires || 0}</h3>
            <p>Hired Freelancers</p>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Spending Trend</h3>
            <div style={{ height: 250 }}>
              <Line data={spendingData} options={chartOptions} />
            </div>
          </div>
          <div className="chart-card">
            <h3>Projects Overview</h3>
            <div style={{ height: 250 }}>
              <Bar data={projectsData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Recent Jobs & Messages */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>My Jobs</h3>
              <span className="view-all" onClick={() => setActiveTab('my-jobs')}>View All →</span>
            </div>
            {myJobs.slice(0, 3).map(job => (
              <div key={job.id} style={{ padding: '12px 0', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{job.title}</p>
                  <p style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{job.applicants_count} applicants · {job.job_type?.replace('_', ' ')}</p>
                </div>
                <span className={`job-status-badge badge-${job.status}`}>{job.status}</span>
              </div>
            ))}
            {myJobs.length === 0 && <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 20 }}>No jobs posted yet</p>}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Recent Messages</h3>
              <span className="view-all" onClick={() => setActiveTab('messages')}>View All →</span>
            </div>
            <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 20 }}>Click to open messages</p>
          </div>
        </div>
      </motion.div>
    );
  };

  // ─── My Jobs ───────────────────────────────
  const renderMyJobs = () => {
    const q = searchQuery.toLowerCase();
    const filtered = q ? myJobs.filter(j =>
      j.title?.toLowerCase().includes(q) ||
      j.job_type?.toLowerCase().includes(q) ||
      j.status?.toLowerCase().includes(q)
    ) : myJobs;
    return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="section-header">
        <h2>My Job Posts ({filtered.length})</h2>
        <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px', fontSize: '0.9rem' }} onClick={() => setActiveTab('create-job')}>
          <FiPlus style={{ marginRight: 6 }} /> New Job
        </button>
      </div>
      {filtered.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Type</th>
                <th>Pay/hr</th>
                <th>Applications</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 600 }}>{job.title}</td>
                  <td style={{ color: '#6B7280', textTransform: 'capitalize' }}>{job.job_type?.replace('_', ' ')}</td>
                  <td style={{ color: '#2EC4B6', fontWeight: 600 }}>${job.pay_per_hour}</td>
                  <td>{job.applicants_count}</td>
                  <td><span className={`job-status-badge badge-${job.status}`}>{job.status}</span></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-secondary" style={{ padding: '6px 12px' }} onClick={() => handleViewApplications(job.id)}>
                        <FiEye style={{ marginRight: 4 }} /> View
                      </button>
                      <button className="btn-danger" style={{ padding: '6px 12px' }} onClick={() => handleDeleteJob(job.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">💼</div>
          <h3>No jobs posted</h3>
          <p>Start hiring by creating your first job post</p>
        </div>
      )}
    </motion.div>
    );
  };

  const renderCreateJob = () => <CreateJobForm onSuccess={() => { fetchData(); setActiveTab('my-jobs'); }} />;

  // ─── Projects ──────────────────────────────
  const renderProjects = () => {
    const q = searchQuery.toLowerCase();
    const filteredProjects = q ? projects.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.status?.toLowerCase().includes(q)
    ) : projects;

    if (selectedProject) {
      return <ProjectDetailView project={selectedProject} freelancers={freelancers} onBack={() => { setSelectedProject(null); fetchProjects(); }} />;
    }

    return (
      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="section-header">
          <h2>Projects ({filteredProjects.length})</h2>
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px', fontSize: '0.9rem' }} onClick={() => setSelectedProject('new')}>
            <FiPlus style={{ marginRight: 6 }} /> New Project
          </button>
        </div>
        <div className="project-list">
          {filteredProjects.map(project => (
            <motion.div
              key={project.id}
              className="project-item"
              onClick={() => setSelectedProject(project)}
              whileHover={{ y: -2 }}
            >
              <div className="project-item-header">
                <h3>{project.title}</h3>
                <span className={`project-status-badge ${project.status}`}>{project.status.replace('_', ' ')}</span>
              </div>
              <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: 8 }}>{project.description || 'No description'}</p>
              <div style={{ display: 'flex', gap: 24, fontSize: '0.85rem', color: '#9CA3AF' }}>
                <span>📅 {project.deadline || 'No deadline'}</span>
                <span>✅ {project.completed_task_count || 0}/{project.task_count || 0} tasks</span>
                <span>⏱ {project.planned_hours || 0}h planned</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${project.progress || 0}%` }}></div>
              </div>
            </motion.div>
          ))}
          {filteredProjects.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No projects yet</h3>
              <p>Create your first project to start tracking work</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ─── Payments ──────────────────────────────
  const handleApprovePayment = async (id) => {
    try {
      await recruiterPaymentsAPI.approveRequest(id);
      toast.success('Payment approved!');
      fetchPayments();
    } catch (err) {
      toast.error('Failed to approve payment');
    }
  };

  const handleRejectPayment = async (id) => {
    try {
      await recruiterPaymentsAPI.rejectRequest(id);
      toast.success('Payment request rejected');
      fetchPayments();
    } catch (err) {
      toast.error('Failed to reject payment');
    }
  };

  const renderPayments = () => {
    const q = searchQuery.toLowerCase();
    const filteredRequests = q ? paymentRequests.filter(r =>
      r.freelancer_name?.toLowerCase().includes(q) ||
      r.job_title?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    ) : paymentRequests;
    const filteredTransactions = q ? transactions.filter(t =>
      t.description?.toLowerCase().includes(q) ||
      t.status?.toLowerCase().includes(q)
    ) : transactions;
    return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="payment-cards">
        <div className="payment-card">
          <div className="payment-icon" style={{ background: 'rgba(46,196,182,0.12)', color: '#2EC4B6' }}>💰</div>
          <h3>${paymentSummary?.total_spent?.toLocaleString() || '0'}</h3>
          <p>Total Spent</p>
        </div>
        <div className="payment-card">
          <div className="payment-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>🔒</div>
          <h3>${paymentSummary?.in_escrow?.toLocaleString() || '0'}</h3>
          <p>In Escrow</p>
        </div>
        <div className="payment-card">
          <div className="payment-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>⏳</div>
          <h3>${paymentSummary?.pending?.toLocaleString() || '0'}</h3>
          <p>Pending</p>
        </div>
      </div>

      {/* Payment Requests Section */}
      <div className="transaction-panel" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Payment Requests {filteredRequests.length > 0 && <span style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', marginLeft: 8 }}>{filteredRequests.length} pending</span>}</h3>
        {filteredRequests.length > 0 ? (
          <div className="transaction-list">
            {filteredRequests.map(req => (
              <div key={req.id} className="transaction-item" style={{ alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div className="tx-desc" style={{ fontWeight: 600 }}>{req.freelancer_name}</div>
                  <div className="tx-date">{req.job_title} · {req.hours_worked}h · {req.description}</div>
                  <div className="tx-date">{new Date(req.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1F2937', marginRight: 8 }}>${parseFloat(req.amount).toLocaleString()}</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleApprovePayment(req.id)}
                    style={{ padding: '6px 16px', background: '#2EC4B6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <FiCheck /> Approve
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRejectPayment(req.id)}
                    style={{ padding: '6px 16px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <FiX /> Reject
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 30 }}>
            <div className="empty-icon">✅</div>
            <h3>No pending requests</h3>
            <p>All payment requests have been handled</p>
          </div>
        )}
      </div>

      <div className="transaction-panel">
        <h3>Transaction History</h3>
        {filteredTransactions.length > 0 ? (
          <div className="transaction-list">
            {filteredTransactions.map(tx => (
              <div key={tx.id} className="transaction-item">
                <div>
                  <div className="tx-desc">{tx.description || 'Payment'}</div>
                  <div className="tx-date">{new Date(tx.created_at).toLocaleDateString()}</div>
                </div>
                <div className={`tx-amount ${tx.status}`}>
                  ${parseFloat(tx.amount).toLocaleString()} · <span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 30 }}>
            <div className="empty-icon">💳</div>
            <h3>No transactions</h3>
            <p>Payment transactions will appear here</p>
          </div>
        )}
      </div>
    </motion.div>
    );
  };

  // ─── Notifications ─────────────────────────
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
            <div className="notification-icon" style={{ background: 'rgba(46,196,182,0.12)', color: '#2EC4B6' }}>
              <FiBell />
            </div>
            <div className="notification-content">
              <h4>{notif.title}</h4>
              <p>{notif.message}</p>
              <span className="notification-time">{new Date(notif.created_at).toLocaleString()}</span>
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

  // ─── Profile ───────────────────────────────
  const renderProfile = () => {
    const profile = user?.recruiter_profile || {};
    return (
      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.first_name?.[0]?.toUpperCase()}{user?.last_name?.[0]?.toUpperCase()}
          </div>
          <div className="profile-info">
            <h2>{user?.first_name} {user?.last_name}</h2>
            <p>{profile.company_name || 'Company'} · {profile.industry || 'Industry'}</p>
            <p style={{ color: '#2EC4B6', fontWeight: 600, marginTop: 4 }}>
              {profile.total_jobs_posted || 0} Jobs Posted · {profile.total_hires || 0} Hires
            </p>
          </div>
        </div>
        <RecruiterProfileForm user={user} profile={profile} onSave={handleProfileUpdate} />
      </motion.div>
    );
  };

  // ─── Interviews ───────────────────────────
  const renderInterviews = () => {
    const filtered = interviews.filter(iv =>
      !searchQuery || 
      iv.freelancer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iv.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iv.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const upcoming = filtered.filter(iv => iv.status === 'scheduled');
    const completed = filtered.filter(iv => iv.status === 'completed');
    const cancelled = filtered.filter(iv => iv.status === 'cancelled');

    const statusColor = { scheduled: '#3B82F6', completed: '#10B981', cancelled: '#EF4444' };
    const typeLabel = { video: 'Video Call', phone: 'Phone Call', in_person: 'In Person' };

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
                <InterviewCard
                  key={iv.id}
                  interview={iv}
                  statusColor={statusColor}
                  typeLabel={typeLabel}
                  onUpdate={handleUpdateInterview}
                  onDelete={handleDeleteInterview}
                  isRecruiter
                />
              ))}
            </div>
          </>
        )}

        {completed.length > 0 && (
          <>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Completed Interviews</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {completed.map(iv => (
                <InterviewCard
                  key={iv.id}
                  interview={iv}
                  statusColor={statusColor}
                  typeLabel={typeLabel}
                  onUpdate={handleUpdateInterview}
                  onDelete={handleDeleteInterview}
                  isRecruiter
                />
              ))}
            </div>
          </>
        )}

        {cancelled.length > 0 && (
          <>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Cancelled Interviews</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {cancelled.map(iv => (
                <InterviewCard
                  key={iv.id}
                  interview={iv}
                  statusColor={statusColor}
                  typeLabel={typeLabel}
                  onUpdate={handleUpdateInterview}
                  onDelete={handleDeleteInterview}
                  isRecruiter
                />
              ))}
            </div>
          </>
        )}

        {interviews.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><LuVideo size={40} /></div>
            <h3>No Interviews Yet</h3>
            <p>Schedule interviews from the Job Listings tab by viewing applications</p>
          </div>
        )}
      </motion.div>
    );
  };

  // ─── Help Center ───────────────────────────
  const renderHelp = () => <HelpCenter />;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'my-jobs': return renderMyJobs();
      case 'create-job': return renderCreateJob();
      case 'interviews': return renderInterviews();
      case 'projects': return renderProjects();
      case 'messages': return <ChatPanel />;
      case 'payments': return renderPayments();
      case 'notifications': return renderNotifications();
      case 'profile': return renderProfile();
      case 'help': return renderHelp();
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
          title={activeTab === 'overview' ? `Welcome, ${user?.first_name || 'Recruiter'}!` : navItems.find(n => n.id === activeTab)?.label}
          subtitle={activeTab === 'overview' ? 'Manage your projects and proposals' : undefined}
          unreadCount={unreadCount}
          onNotificationClick={() => setActiveTab('notifications')}
          actionLabel="Post New Job"
          onActionClick={() => setActiveTab('create-job')}
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

      {/* View Applications Modal */}
      <AnimatePresence>
        {viewAppsModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewAppsModal(null)}
          >
            <motion.div
              className="modal"
              style={{ maxWidth: 700 }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Applications ({jobApplications.length})</h2>

              {jobApplications.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {jobApplications.map((app) => (
                    <div key={app.id} className="card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontWeight: 600, marginBottom: 4 }}>{app.freelancer_name}</h4>
                          <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>{app.freelancer_email}</p>
                          {app.freelancer_skills?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                              {app.freelancer_skills.map((s, i) => (
                                <span key={i} className="skill-tag">{s}</span>
                              ))}
                            </div>
                          )}
                          {app.cover_letter && (
                            <p style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: 8 }}>
                              "{app.cover_letter}"
                            </p>
                          )}
                          <p style={{ color: '#2EC4B6', fontWeight: 600, marginTop: 8, fontSize: '0.9rem' }}>
                            ${app.proposed_rate}/hr
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                          <span className={`job-status-badge badge-${app.status}`}>{app.status}</span>
                          {(app.status === 'pending' || app.status === 'reviewed') && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                              <button className="btn-success" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => handleUpdateAppStatus(app.id, 'accepted')}>
                                <FiCheck style={{ marginRight: 4 }} /> Accept
                              </button>
                              <button className="btn-danger" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => handleUpdateAppStatus(app.id, 'rejected')}>
                                <FiX style={{ marginRight: 4 }} /> Reject
                              </button>
                            </div>
                          )}
                          <button
                            className="btn-primary"
                            style={{ padding: '6px 14px', fontSize: '0.8rem', marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => setScheduleModal(app)}
                          >
                            <LuCalendarClock /> Schedule Interview
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '0.8rem', marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={async () => {
                              try {
                                await chatAPI.startConversation(app.id);
                                setViewAppsModal(null);
                                setActiveTab('messages');
                              } catch (err) {
                                toast.error('Could not start conversation');
                              }
                            }}
                          >
                            <FiMessageCircle /> Message
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '30px 0' }}>
                  <div className="empty-icon">📋</div>
                  <h3>No applications yet</h3>
                  <p>Applications will appear here when freelancers apply</p>
                </div>
              )}

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setViewAppsModal(null)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Interview Modal */}
      <AnimatePresence>
        {scheduleModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setScheduleModal(null)}
          >
            <motion.div
              className="modal"
              style={{ maxWidth: 500 }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: 4 }}>Schedule Interview</h2>
              <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: 20 }}>
                with <strong>{scheduleModal.freelancer_name}</strong>
              </p>
              <form onSubmit={handleScheduleInterview}>
                <div className="form-group">
                  <label>Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.scheduled_at}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Duration (minutes)</label>
                    <select value={scheduleForm.duration_minutes} onChange={(e) => setScheduleForm({ ...scheduleForm, duration_minutes: parseInt(e.target.value) })}>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Interview Type</label>
                    <select value={scheduleForm.interview_type} onChange={(e) => setScheduleForm({ ...scheduleForm, interview_type: e.target.value })}>
                      <option value="video">Video Call</option>
                      <option value="phone">Phone Call</option>
                      <option value="in_person">In Person</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Meeting Link</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={scheduleForm.meeting_link}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meeting_link: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Topics to discuss, preparation instructions..."
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '14px 16px', background: '#F5F7FA', border: '1.5px solid #E5E7EB', borderRadius: '12px', color: '#1A1A2E', fontSize: '0.95rem', resize: 'vertical' }}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setScheduleModal(null)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={interviewLoading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {interviewLoading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> : <><LuCalendarClock /> Schedule</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ─── Project Detail View ─────────
const ProjectDetailView = ({ project, freelancers, onBack }) => {
  const [proj, setProj] = useState(project === 'new' ? null : project);
  const isNew = project === 'new';
  const [form, setForm] = useState({
    title: '', description: '', deadline: '', planned_hours: '', status: 'active'
  });
  const [taskForm, setTaskForm] = useState({ title: '', assigned_to: '', due_date: '', hours: '' });
  const [meetingForm, setMeetingForm] = useState({ topic: '', description: '', timing: '' });
  const [saving, setSaving] = useState(false);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const res = await projectsAPI.create(form);
      setProj(res.data);
      toast.success('Project created!');
    } catch (err) {
      toast.error('Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title) { toast.error('Task title required'); return; }
    try {
      await projectsAPI.createTask(proj.id, taskForm);
      toast.success('Task added');
      const res = await projectsAPI.getOne(proj.id);
      setProj(res.data);
      setTaskForm({ title: '', assigned_to: '', due_date: '', hours: '' });
    } catch (err) {
      toast.error('Failed to add task');
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      await projectsAPI.toggleTask(taskId);
      const res = await projectsAPI.getOne(proj.id);
      setProj(res.data);
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleAddMeeting = async (e) => {
    e.preventDefault();
    if (!meetingForm.topic || !meetingForm.timing) { toast.error('Topic and time required'); return; }
    try {
      await projectsAPI.createMeeting(proj.id, meetingForm);
      toast.success('Meeting scheduled');
      const res = await projectsAPI.getOne(proj.id);
      setProj(res.data);
      setMeetingForm({ topic: '', description: '', timing: '' });
    } catch (err) {
      toast.error('Failed to schedule meeting');
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await projectsAPI.update(proj.id, { status: newStatus });
      const res = await projectsAPI.getOne(proj.id);
      setProj(res.data);
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (isNew && !proj) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button className="btn-secondary" style={{ marginBottom: 20, padding: '8px 16px' }} onClick={onBack}>← Back</button>
        <div className="card" style={{ width: '100%', padding: 24 }}>
          <h2 style={{ marginBottom: 20 }}>Create New Project</h2>
          <form onSubmit={handleCreateProject}>
            <div className="form-group">
              <label>Project Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Project name" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What is this project about?"
                style={{ width: '100%', padding: '14px 16px', background: '#F5F7FA', border: '1.5px solid #E5E7EB', borderRadius: '12px', color: '#1A1A2E', fontSize: '0.95rem', resize: 'vertical' }}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Deadline</label>
                <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Planned Hours</label>
                <input type="number" value={form.planned_hours} onChange={e => setForm({ ...form, planned_hours: e.target.value })} placeholder="0" />
              </div>
            </div>
            <motion.button type="submit" className="btn-primary" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ marginTop: 8 }}>
              {saving ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div> : <><FiPlus style={{ marginRight: 6 }} /> Create Project</>}
            </motion.button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <button className="btn-secondary" style={{ marginBottom: 20, padding: '8px 16px' }} onClick={onBack}>← Back to Projects</button>

      {/* Project Header */}
      <div className="project-detail-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: 4 }}>{proj.title}</h2>
            <p style={{ color: '#6B7280' }}>{proj.description || 'No description'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['active', 'on_hold', 'completed'].map(s => (
              <button
                key={s}
                className={`btn-secondary ${proj.status === s ? 'active' : ''}`}
                style={{
                  padding: '6px 14px', fontSize: '0.8rem', textTransform: 'capitalize',
                  ...(proj.status === s ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : {})
                }}
                onClick={() => handleUpdateStatus(s)}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
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
        {/* Tasks */}
        <div className="project-detail-panel">
          <h3>Tasks ({proj.tasks?.length || 0})</h3>
          {(proj.tasks || []).map(task => (
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
                  {task.assigned_to_name || 'Unassigned'} · {task.due_date || 'No date'} · {task.hours || 0}h
                </div>
              </div>
            </div>
          ))}

          <form onSubmit={handleAddTask} className="inline-add-form" style={{ flexWrap: 'wrap' }}>
            <input placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} style={{ minWidth: 150 }} />
            <select value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
              <option value="">Assign to...</option>
              {freelancers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
            <input type="number" placeholder="Hours" value={taskForm.hours} onChange={e => setTaskForm({ ...taskForm, hours: e.target.value })} style={{ width: 80 }} />
            <button type="submit" className="btn-primary" style={{ padding: '10px 16px', width: 'auto' }}>
              <FiPlus />
            </button>
          </form>
        </div>

        {/* Meetings */}
        <div className="project-detail-panel">
          <h3>Meetings ({proj.meetings?.length || 0})</h3>
          {(proj.meetings || []).map(meeting => (
            <div key={meeting.id} className="meeting-item">
              <h4>{meeting.topic}</h4>
              <p>📅 {new Date(meeting.timing).toLocaleString()}</p>
              {meeting.description && <p>{meeting.description}</p>}
            </div>
          ))}

          <form onSubmit={handleAddMeeting} className="inline-add-form" style={{ flexWrap: 'wrap' }}>
            <input placeholder="Meeting topic" value={meetingForm.topic} onChange={e => setMeetingForm({ ...meetingForm, topic: e.target.value })} style={{ minWidth: 150 }} />
            <input type="datetime-local" value={meetingForm.timing} onChange={e => setMeetingForm({ ...meetingForm, timing: e.target.value })} />
            <input placeholder="Description (optional)" value={meetingForm.description} onChange={e => setMeetingForm({ ...meetingForm, description: e.target.value })} />
            <button type="submit" className="btn-primary" style={{ padding: '10px 16px', width: 'auto' }}>
              <FiPlus />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};


// ─── Help Center ─────────
const HelpCenter = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const faqs = [
    { q: 'How do I post a job?', a: 'Navigate to "Post a Job" in the sidebar, fill in the details like title, description, skills required, and budget, then click "Post Job".' },
    { q: 'How do I manage applications?', a: 'Go to "Job Listings" and click "View" on any job to see applications. You can accept, reject, or message applicants directly.' },
    { q: 'How do payments work?', a: 'Payments are managed through the Payments section. You can track spending, escrow amounts, and view full transaction history.' },
    { q: 'How do I create a project?', a: 'Go to the "Projects" tab and click "New Project". You can then add tasks, assign freelancers, and schedule meetings.' },
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


// ─── Recruiter Job Card ─────────
const RecruiterJobCard = ({ job, onViewApps, onDelete }) => (
  <motion.div
    className="job-card"
    whileHover={{ y: -4 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="job-card-header">
      <div>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>{job.title}</h3>
        <span style={{ fontSize: '0.8rem', color: '#9CA3AF', textTransform: 'capitalize' }}>
          {job.job_type?.replace('_', ' ')} · {job.location || 'Remote'}
        </span>
      </div>
      <span className={`job-status-badge badge-${job.status}`}>{job.status}</span>
    </div>
    <p className="job-card-description">{job.description}</p>
    <div className="job-card-skills">
      {(job.required_skills || []).slice(0, 3).map((skill, i) => (
        <span key={i} className="skill-tag">{skill}</span>
      ))}
    </div>
    <div className="job-card-footer">
      <div className="job-pay">${job.pay_per_hour}<span>/hr</span></div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 500 }}>
          {job.applicants_count} applicants
        </span>
        <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => onViewApps(job.id)}>
          <FiEye style={{ marginRight: 4 }} /> Review
        </button>
        <button className="btn-danger" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => onDelete(job.id)}>
          <FiTrash2 />
        </button>
      </div>
    </div>
  </motion.div>
);


// ─── Create Job Form ─────────
const CreateJobForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    title: '', description: '', pay_per_hour: '',
    experience_level: 'entry', job_type: 'freelance',
    location: 'Remote', duration: '', required_skills: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!form.required_skills.includes(skillInput.trim())) {
        setForm({ ...form, required_skills: [...form.required_skills, skillInput.trim()] });
      }
      setSkillInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.pay_per_hour) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await jobsAPI.create(form);
      toast.success('Job posted successfully! 🎉');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="card" style={{ width: '100%' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: 24 }}>Create New Job Post</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Job Title *</label>
            <input name="title" placeholder="e.g. Senior React Developer" value={form.title} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea name="description" rows={5} placeholder="Describe the role, responsibilities, and requirements..."
              value={form.description} onChange={handleChange}
              style={{ width: '100%', padding: '14px 16px', background: '#F5F7FA', border: '1.5px solid #E5E7EB', borderRadius: '12px', color: '#1A1A2E', fontSize: '0.95rem', resize: 'vertical' }}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Pay Per Hour ($) *</label>
              <input type="number" name="pay_per_hour" placeholder="50" value={form.pay_per_hour} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Experience Level</label>
              <select name="experience_level" value={form.experience_level} onChange={handleChange}>
                <option value="entry">Entry Level</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Job Type</label>
              <select name="job_type" value={form.job_type} onChange={handleChange}>
                <option value="freelance">Freelance</option>
                <option value="contract">Contract</option>
                <option value="part_time">Part Time</option>
                <option value="full_time">Full Time</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input name="location" placeholder="Remote" value={form.location} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Duration</label>
            <input name="duration" placeholder="e.g. 3 months, Ongoing" value={form.duration} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Required Skills (press Enter to add)</label>
            <div className="tags-input">
              {form.required_skills.map((s, i) => (
                <span key={i} className="tag">{s} <button type="button" onClick={() => setForm({ ...form, required_skills: form.required_skills.filter((_, j) => j !== i) })}>×</button></span>
              ))}
              <input placeholder="Add skill..." value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={addSkill} />
            </div>
          </div>
          <motion.button type="submit" className="btn-primary" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div> : <><FiPlus /> Post Job</>}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};


// ─── Recruiter Profile Form ─────────
const RecruiterProfileForm = ({ user, profile, onSave }) => {
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    company_name: profile?.company_name || '',
    company_website: profile?.company_website || '',
    company_description: profile?.company_description || '',
    industry: profile?.industry || '',
    company_size: profile?.company_size || '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
        <h3 style={{ fontSize: '1.1rem', marginBottom: 20 }}>Company Details</h3>
        <div className="form-group">
          <label>Company Name</label>
          <input name="company_name" value={form.company_name} onChange={handleChange} placeholder="Acme Corp" />
        </div>
        <div className="form-group">
          <label>Industry</label>
          <input name="industry" value={form.industry} onChange={handleChange} placeholder="Technology, Finance, etc." />
        </div>
        <div className="form-group">
          <label>Company Size</label>
          <select name="company_size" value={form.company_size} onChange={handleChange}>
            <option value="">Select size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="500+">500+ employees</option>
          </select>
        </div>
        <div className="form-group">
          <label>Company Website</label>
          <input name="company_website" value={form.company_website} onChange={handleChange} placeholder="https://" />
        </div>
        <div className="form-group">
          <label>Company Description</label>
          <textarea name="company_description" rows={3} value={form.company_description} onChange={handleChange}
            style={{ width: '100%', padding: '14px 16px', background: '#F5F7FA', border: '1.5px solid #E5E7EB', borderRadius: '12px', color: '#1A1A2E', fontSize: '0.95rem', resize: 'vertical' }}
          />
        </div>
        <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => onSave(form)}>
          Save Profile
        </button>
      </div>
    </div>
  );
};

// ─── Interview Card ─────────
const InterviewCard = ({ interview, statusColor, typeLabel, onUpdate, onDelete, isRecruiter }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);

  const scheduledDate = new Date(interview.scheduled_at);
  const isPast = scheduledDate < new Date();

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <h4 style={{ fontWeight: 600, margin: 0, fontSize: '1.05rem' }}>{interview.job_title}</h4>
            <span style={{
              padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
              background: `${statusColor[interview.status]}15`, color: statusColor[interview.status],
            }}>
              {interview.status}
            </span>
          </div>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: '4px 0' }}>
            {isRecruiter ? `Candidate: ${interview.freelancer_name}` : `Recruiter: ${interview.recruiter_name}`}
          </p>
          <p style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, fontSize: '0.85rem', color: '#6B7280', alignItems: 'center' }}>
            <FiClock size={14} style={{ flexShrink: 0 }} />
            <span>{scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span> · {interview.duration_minutes} min · {typeLabel[interview.interview_type] || interview.interview_type}</span>
          </p>
          {interview.meeting_link && (
            <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, color: '#2EC4B6', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>
              <LuVideo size={14} /> Join Meeting
            </a>
          )}
          {interview.notes && (
            <p style={{ color: '#6B7280', fontSize: '0.85rem', marginTop: 8, fontStyle: 'italic' }}>
              {interview.notes}
            </p>
          )}
          {interview.feedback && (
            <div style={{ marginTop: 10, padding: 12, background: '#F0FDF4', borderRadius: 8 }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#065F46', marginBottom: 4 }}>Feedback</p>
              <p style={{ fontSize: '0.85rem', color: '#065F46', margin: 0 }}>{interview.feedback}</p>
              {interview.rating && (
                <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <LuStar key={s} size={14} style={{ color: s <= interview.rating ? '#F59E0B' : '#D1D5DB', fill: s <= interview.rating ? '#F59E0B' : 'none' }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {isRecruiter && interview.status === 'scheduled' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 20, flexShrink: 0 }}>
            {isPast && (
              <button type="button" className="btn-success" style={{ padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                onClick={() => setShowFeedback(!showFeedback)}>
                <FiCheck style={{ marginRight: 4 }} /> Complete
              </button>
            )}
            <button type="button" className="btn-danger" style={{ padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              onClick={() => onUpdate(interview.id, { status: 'cancelled' })}>
              <FiX style={{ marginRight: 4 }} /> Cancel
            </button>
            <button type="button" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              onClick={() => onDelete(interview.id)}>
              <FiTrash2 style={{ marginRight: 4 }} /> Delete
            </button>
          </div>
        )}
      </div>

      {showFeedback && (
        <div style={{ marginTop: 16, padding: 16, background: '#F5F7FA', borderRadius: 12 }}>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Rating</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <LuStar size={24} style={{ color: s <= rating ? '#F59E0B' : '#D1D5DB', fill: s <= rating ? '#F59E0B' : 'none' }} />
                </button>
              ))}
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Feedback</label>
            <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)}
              placeholder="How did the interview go?"
              style={{ width: '100%', padding: '14px 16px', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: '12px', color: '#1A1A2E', fontSize: '0.95rem', resize: 'vertical' }}
            />
          </div>
          <button type="button" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}
            onClick={() => {
              onUpdate(interview.id, { status: 'completed', feedback, rating });
              setShowFeedback(false);
            }}>
            Submit & Complete
          </button>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
