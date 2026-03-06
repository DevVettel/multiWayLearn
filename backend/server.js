require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Güvenlik başlıkları

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'MultiWayLearn API çalışıyor!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ${PORT} portunda calisiyor`);
});