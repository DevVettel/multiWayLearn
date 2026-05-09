const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getUnlockedLevels } = require('../utils/levels');

// Yeni kelime getir
router.get('/word', authMiddleware, (req, res) => {
  const userID = req.user.userID;

  const validLevels = new Set(['A1', 'A2', 'B1']);
  const requestedLevels = (typeof req.query.levels === 'string' && req.query.levels)
    ? req.query.levels.split(',').filter(l => validLevels.has(l))
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

function markGreens(guessArr, targetArr, result, targetUsed, guessUsed) {
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = 'correct';
      targetUsed[i] = true;
      guessUsed[i] = true;
    }
  }
}

function markYellows(guessArr, targetArr, result, targetUsed, guessUsed) {
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
}

// Tahmin kontrolü
router.post('/guess', authMiddleware, (req, res) => {
  const { guess, target } = req.body;

  if (!guess || typeof guess !== 'string' || guess.length !== 5) {
    return res.status(400).json({ error: 'Tahmin 5 harf olmalı' });
  }

  if (!target || typeof target !== 'string' || target.length !== 5) {
    return res.status(400).json({ error: 'Hedef kelime eksik' });
  }

  const guessUpper = String(guess).toUpperCase();
  const targetUpper = String(target).toUpperCase();

  // Wordle algoritması
  const result = new Array(5).fill('absent');
  const targetArr = targetUpper.split('');
  const guessArr = guessUpper.split('');
  const targetUsed = new Array(5).fill(false);
  const guessUsed = new Array(5).fill(false);

  markGreens(guessArr, targetArr, result, targetUsed, guessUsed);
  markYellows(guessArr, targetArr, result, targetUsed, guessUsed);

  const isWon = guessUpper === targetUpper;

  res.json({
    guess: guessUpper,
    result,
    isWon,
  });
});

module.exports = router;