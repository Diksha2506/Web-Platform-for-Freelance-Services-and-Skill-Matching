import axios from 'axios';

const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get CSRF token from cookies
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Add CSRF token to requests
api.interceptors.request.use(async (config) => {
  // For non-GET requests, ensure we have a CSRF token
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    let csrfToken = getCookie('csrftoken');
    if (!csrfToken) {
      // Fetch CSRF token from the server
      try {
        const resp = await axios.get('/api/csrf/', { withCredentials: true });
        csrfToken = getCookie('csrftoken') || resp.data?.csrfToken;
      } catch (e) {
        console.warn('Could not fetch CSRF token');
      }
    }
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  getCurrentUser: () => api.get('/auth/user/'),
  updateProfile: (data) => api.put('/auth/profile/', data),
};

// Jobs API
export const jobsAPI = {
  getAll: (params) => api.get('/jobs/', { params }),
  getOne: (id) => api.get(`/jobs/${id}/`),
  create: (data) => api.post('/jobs/create/', data),
  update: (id, data) => api.put(`/jobs/${id}/update/`, data),
  delete: (id) => api.delete(`/jobs/${id}/delete/`),
  getMyJobs: () => api.get('/jobs/my/'),
};

// Applications API
export const applicationsAPI = {
  apply: (jobId, data) => api.post(`/jobs/${jobId}/apply/`, data),
  getMyApplications: () => api.get('/applications/my/'),
  getJobApplications: (jobId) => api.get(`/jobs/${jobId}/applications/`),
  updateStatus: (id, data) => api.put(`/applications/${id}/status/`, data),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications/'),
  markRead: (id) => api.put(`/notifications/${id}/read/`),
  markAllRead: () => api.put('/notifications/read-all/'),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats/'),
};

// Chat / Messages API
export const chatAPI = {
  getConversations: () => api.get('/conversations/'),
  startConversation: (applicationId) => api.post(`/conversations/start/${applicationId}/`),
  getMessages: (conversationId) => api.get(`/conversations/${conversationId}/messages/`),
  sendMessage: (conversationId, content) => api.post(`/conversations/${conversationId}/send/`, { content }),
};

// Earnings / Payments API (Freelancer)
export const earningsAPI = {
  getAll: () => api.get('/earnings/'),
  getStats: () => api.get('/earnings/stats/'),
  requestPayment: (data) => api.post('/earnings/request/', data),
};

// Projects API (Recruiter)
export const projectsAPI = {
  getAll: () => api.get('/projects/'),
  getOne: (id) => api.get(`/projects/${id}/`),
  create: (data) => api.post('/projects/', data),
  update: (id, data) => api.put(`/projects/${id}/`, data),
  delete: (id) => api.delete(`/projects/${id}/`),
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks/`, data),
  toggleTask: (taskId) => api.put(`/tasks/${taskId}/toggle/`),
  createMeeting: (projectId, data) => api.post(`/projects/${projectId}/meetings/`, data),
};

// Freelancer Projects API
export const freelancerProjectsAPI = {
  getAll: () => api.get('/freelancer/projects/'),
  getOne: (id) => api.get(`/freelancer/projects/${id}/`),
  toggleTask: (taskId) => api.put(`/tasks/${taskId}/toggle/`),
};

// Recruiter Payments API
export const recruiterPaymentsAPI = {
  getSummary: () => api.get('/payments/summary/'),
  getTransactions: () => api.get('/payments/transactions/'),
  getRequests: () => api.get('/payments/requests/'),
  approveRequest: (id) => api.post(`/payments/requests/${id}/approve/`),
  rejectRequest: (id) => api.post(`/payments/requests/${id}/reject/`),
};

// Support API
export const supportAPI = {
  create: (data) => api.post('/support/', data),
};

// Freelancers API
export const freelancersAPI = {
  getAll: () => api.get('/freelancers/'),
};

// Interviews API
export const interviewsAPI = {
  getAll: () => api.get('/interviews/'),
  schedule: (data) => api.post('/interviews/schedule/', data),
  update: (id, data) => api.put(`/interviews/${id}/`, data),
  delete: (id) => api.delete(`/interviews/${id}/delete/`),
};

export default api;
