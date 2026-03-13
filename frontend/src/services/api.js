import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

// Kelimeler
export const getWords = () => API.get('/words');
export const addWord = (data) => API.post('/words', data);
export const deleteWord = (id) => API.delete(`/words/${id}`);


// Seviye sistemi
export const getLevelProgress = () => API.get('/levels/progress');
export const getLevelWords = (level) => API.get(`/levels/words/${level}`);

// Ayarlar
export const getSettings = () => API.get('/settings');
export const updateDailyGoal = (dailyWordCount) => API.put('/settings/daily-goal', { dailyWordCount });