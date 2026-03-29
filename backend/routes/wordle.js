const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

function getUnlockedLevels(userID) {
  const unlocked = ['A1'];
  const a1Learned = db.prepare(`
    SELECT COUNT(*) as count FROM UserWordProgress uwp
    JOIN SystemWords sw ON uwp.SystemWordID = sw.SystemWordID
    WHERE uwp.UserID = ? AND sw.Level = 'A1' AND uwp.IsLearned = 1
  `).get(userID).count;
  if (a1Learned >= 350) {
    unlocked.push('A2');
    const a2Learned = db.prepare(`
      SELECT COUNT(*) as count FROM UserWordProgress uwp
      JOIN SystemWords sw ON uwp.SystemWordID = sw.SystemWordID
      WHERE uwp.UserID = ? AND sw.Level = 'A2' AND uwp.IsLearned = 1
    `).get(userID).count;
    if (a2Learned >= 250) unlocked.push('B1');
  }
  return unlocked;
}

// Yeni kelime getir
router.get('/word', authMiddleware, (req, res) => {
  const userID = req.user.userID;

  const validLevels = ['A1', 'A2', 'B1'];
  const requestedLevels = (typeof req.query.levels === 'string' && req.query.levels)
    ? req.query.levels.split(',').filter(l => validLevels.includes(l))
    : null;

  const activeLevels = (requestedLevels && requestedLevels.length > 0)
    ? requestedLevels
    : getUnlockedLevels(userID);

  const placeholders = activeLevels.map(() => '?').join(',');

  const words = db.prepare(`
    SELECT EngWordName FROM SystemWords
    WHERE Level IN (${placeholders})
    AND length(EngWordName) = 5
    ORDER BY SystemWordID ASC
  `).all(...activeLevels);

  if (words.length === 0) {
    return res.status(404).json({ error: 'Uygun kelime bulunamadı' });
  }

  // Her istekte rastgele kelime seç
  const randomIndex = Math.floor(Math.random() * words.length);
  const word = words[randomIndex].EngWordName.toUpperCase();

  res.json({
    word,
    wordLength: 5,
    activeLevels,
    totalWords: words.length,
  });
});

// Tahmin kontrolü
router.post('/guess', authMiddleware, (req, res) => {
  const { guess, target } = req.body;

  if (!guess || guess.length !== 5) {
    return res.status(400).json({ error: 'Tahmin 5 harf olmalı' });
  }

  if (!target || target.length !== 5) {
    return res.status(400).json({ error: 'Hedef kelime eksik' });
  }

  const guessUpper = guess.toUpperCase();
  const targetUpper = target.toUpperCase();

  // Wordle algoritması
  const result = Array(5).fill('absent');
  const targetArr = targetUpper.split('');
  const guessArr = guessUpper.split('');
  const targetUsed = Array(5).fill(false);
  const guessUsed = Array(5).fill(false);

  // Önce yeşilleri bul
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = 'correct';
      targetUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  // Sonra sarıları bul
  for (let i = 0; i < 5; i++) {
    if (guessUsed[i]) continue;
    for (let j = 0; j < 5; j++) {
      if (targetUsed[j]) continue;
      if (guessArr[i] === targetArr[j]) {
        result[i] = 'present';
        targetUsed[j] = true;
        break;
      }
    }
  }

  const isWon = guessUpper === targetUpper;

  res.json({
    guess: guessUpper,
    result,
    isWon,
  });
});

module.exports = router;