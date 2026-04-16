require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ${PORT} portunda calisiyor`);
});