import axios from 'axios';

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
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
      globalThis.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const forgotPassword = (email) => API.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => API.post('/auth/reset-password', { token, password });

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

// Quiz
export const getNextQuestion = (levels, skipped) => {
  const params = new URLSearchParams();
  if (skipped?.length > 0) params.append('skipped', skipped.join(','));
  params.append('levels', levels.join(','));
  return API.get(`/quiz/next?${params.toString()}`);
};
export const submitAnswer = (systemWordID, correct) =>
  API.post('/quiz/answer', { systemWordID, correct });

// Word Chain
export const getWordchainWords = (level) => {
  if (!VALID_LEVELS.has(level)) throw new Error('Geçersiz seviye');
  return API.get(`/wordchain/words?level=${level}`);
};
export const getWordchainStories = () => API.get('/wordchain/stories');
export const generateStory = (data) => API.post('/wordchain/generate', data);

// Analiz
export const getAnalysis = () => API.get('/analysis');