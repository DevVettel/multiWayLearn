require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('node:path');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const wordRoutes = require('./routes/words');
const levelRoutes = require('./routes/levels');
const quizRoutes = require('./routes/quiz');
const settingsRoutes = require('./routes/settings');
const analysisRoutes = require('./routes/analysis');
const wordleRoutes = require('./routes/wordle');
const wordchainRoutes = require('./routes/wordchain');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
});
app.use('/api/wordchain/generate', generateLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/wordle', wordleRoutes);
app.use('/api/wordchain', wordchainRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'MultiWayLearn API çalışıyor!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadi' });
});

// Merkezi hata yakalayıcı — tüm route'lardaki next(err) buraya düşer
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', req.method, req.path, err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: status === 500 ? 'Sunucu hatasi' : err.message });
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason);
  process.exit(1);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ${PORT} portunda calisiyor`);
});