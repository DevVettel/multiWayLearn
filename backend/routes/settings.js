const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

// Kullanıcı ayarlarını getir
router.get('/', authMiddleware, (req, res) => {
  const user = db.prepare(
    'SELECT UserName, Email, DailyWordCount FROM Users WHERE UserID = ?'
  ).get(req.user.userID);
  res.json(user);
});

// Günlük kelime sayısını güncelle
router.put('/daily-goal', authMiddleware, (req, res) => {
  const { dailyWordCount } = req.body;

  if (!dailyWordCount || dailyWordCount < 1 || dailyWordCount > 100) {
    return res.status(400).json({ error: 'Geçerli bir sayı girin (1-100)' });
  }

  db.prepare(
    'UPDATE Users SET DailyWordCount = ? WHERE UserID = ?'
  ).run(dailyWordCount, req.user.userID);

  res.json({ message: 'Günlük hedef güncellendi', dailyWordCount });
});

module.exports = router;