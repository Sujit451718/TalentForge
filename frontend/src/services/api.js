import axios from 'axios';

const browserHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(browserHost);
const productionApiUrl = 'https://talentforge-backend.onrender.com/api';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isLocalHost ? `http://${browserHost || 'localhost'}:5000/api` : productionApiUrl);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiError(error) {
  if (error?.code === 'ERR_NETWORK') {
    return `Cannot reach the Flask API at ${API_BASE_URL}. Make sure the backend server is running.`;
  }
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Something went wrong'
  );
}

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const userApi = {
  dashboard: () => api.get('/user/dashboard'),
  upgradePlan: () => api.post('/user/upgrade-plan'),
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/user/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  chatbot: (message) => api.post('/user/chatbot', { message }),
  analytics: () => api.get('/user/analytics'),
  adminStats: () => api.get('/user/admin/stats'),
  submitFeedback: (payload) => api.post('/user/platform-feedback', payload),
  atsScore: (payload) => {
    if (payload.file) {
      const formData = new FormData();
      formData.append('resume', payload.file);
      if (payload.target_role) {
        formData.append('target_role', payload.target_role);
      }
      return api.post('/user/check-ats', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/user/check-ats', payload);
  },
  updateProfile: (payload) => api.post('/user/update-profile', payload),
  leaderboard: () => api.get('/user/leaderboard'),
};

export const interviewApi = {
  start: (payload) => api.post('/interview/start-interview', payload),
  submit: (payload) => api.post('/interview/submit-answer', payload),
  quizGenerate: (payload) => api.post('/interview/quiz/generate', payload),
  quizSubmit: (payload) => api.post('/interview/quiz/submit', payload),
  quizHistory: () => api.get('/interview/quiz/history'),
  feedback: (interviewId) =>
    api.get('/interview/feedback', {
      params: interviewId ? { interview_id: interviewId } : {},
    }),
};

export const paymentApi = {
  simulate: () => api.post('/payment/simulate-payment'),
  submitProof: (file) => {
    const formData = new FormData();
    formData.append('proof', file);
    return api.post('/payment/submit-proof', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  myRequest: () => api.get('/payment/my-request'),
  adminPending: () => api.get('/payment/admin/pending'),
  adminVerify: (payload) => api.post('/payment/admin/verify', payload),
};
