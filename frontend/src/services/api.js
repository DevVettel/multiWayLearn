import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const forgotPassword = (email) => API.post('/auth/forgot-password', { email });

const VALID_LEVELS = new Set(['A1', 'A2', 'B1']);

// Kelimeler
export const getWords = () => API.get('/words');
export const addWord = (data) => API.post('/words', data);
export const deleteWord = (id) => {
  if (!Number.isInteger(id) || id <= 0) throw new Error('Geçersiz kelime ID');
  const safeId = Number(id);
  return API.delete(`/words/${safeId}`);
};

// Seviye sistemi
export const getLevelProgress = () => API.get('/levels/progress');
export const getLevelWords = (level) => {
  if (!VALID_LEVELS.has(level)) throw new Error('Geçersiz seviye');
  return API.get(`/levels/words/${level}`);
};

// Ayarlar
export const getSettings = () => API.get('/settings');
export const updateDailyGoal = (dailyWordCount) => API.put('/settings/daily-goal', { dailyWordCount });

// Analiz
export const getAnalysis = () => API.get('/analysis');