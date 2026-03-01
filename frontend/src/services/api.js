import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with base config
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('opsboard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth data on unauthorized
      localStorage.removeItem('opsboard_token');
      localStorage.removeItem('opsboard_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
  resendVerification: (data) => api.post('/auth/resend-verification', data),
};

// ─── Teams API ───────────────────────────────────────────────────────────────
export const teamsAPI = {
  create: (data) => api.post('/teams', data),
  join: (inviteCode) => api.post('/teams/join', { inviteCode }),
  getTeam: (teamId) => api.get(`/teams/${teamId}`),
  getActivity: (teamId) => api.get(`/teams/${teamId}/activity`),
  updateMemberRole: (teamId, userId, role) =>
    api.put(`/teams/${teamId}/members/${userId}/role`, { role }),
  deleteTeam: (teamId) => api.delete(`/teams/${teamId}`),
  deleteAllTeams: () => api.delete('/teams'),
};

// ─── Chat API ────────────────────────────────────────────────────────────────
export const chatAPI = {
  getMessages: (teamId) => api.get(`/chat/${teamId}`),
};

// ─── Tasks API ────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: (teamId) => api.get(`/tasks/${teamId}`),
  create: (teamId, data) => api.post(`/tasks/${teamId}`, data),
  update: (teamId, taskId, data) => api.put(`/tasks/${teamId}/${taskId}`, data),
  unblock: (teamId, taskId) => api.put(`/tasks/${teamId}/${taskId}/unblock`),
  delete: (teamId, taskId) => api.delete(`/tasks/${teamId}/${taskId}`),
};

// ─── Risk Radar API ───────────────────────────────────────────────────────────
export const riskAPI = {
  get: (teamId) => api.get(`/risk/${teamId}`),
  broadcast: (teamId) => api.post(`/risk/${teamId}/broadcast`),
};

// ─── Standup API ──────────────────────────────────────────────────────────────
export const standupAPI = {
  generate: (teamId) => api.get(`/standup/${teamId}`),
};

export default api;
