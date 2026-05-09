const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { getUnlockedLevels } = require('../utils/levels');

const REVIEW_INTERVALS = [1, 7, 30, 90, 180, 365];

function computeNextReview(correct, newStreak, isLearned) {
  const now = Date.now();
  let ms;
  if (isLearned) {
    ms = 365 * 24 * 60 * 60 * 1000;
  } else if (correct && newStreak > 0) {
    const days = REVIEW_INTERVALS[newStreak - 1] || 1;
    ms = days * 24 * 60 * 60 * 1000;
  } else {
    ms = 3 * 60 * 1000;
  }
  return new Date(now + ms).toISOString().slice(0, 19).replace('T', ' ');
}

function getTodayCount(userID) {
  return db.prepare(`
    SELECT COUNT(DISTINCT SystemWordID) as count FROM UserWordProgress
    WHERE UserID = ?
    AND date(LastSeen) = date('now')
    AND LastSeen IS NOT NULL
  `).get(userID).count;
}

// Quiz sorusu getir
router.get('/next', authMiddleware, (req, res) => {
  const userID = req.user.userID;

  const user = db.prepare('SELECT DailyWordCount FROM Users WHERE UserID = ?').get(userID);
  const dailyGoal = user?.DailyWordCount || 10;

  const todayCount = getTodayCount(userID);

  if (todayCount >= dailyGoal) {
    return res.json({ finished: true, reason: 'daily_goal', dailyGoal, todayCount });
  }

  const validLevels = new Set(['A1', 'A2', 'B1']);
  const requestedLevels = (typeof req.query.levels === 'string' && req.query.levels)
    ? req.query.levels.split(',').filter(l => validLevels.has(l))
    : null;

  const unlockedLevels = (requestedLevels && requestedLevels.length > 0)
    ? requestedLevels
    : getUnlockedLevels(userID);

  const placeholders = unlockedLevels.map(() => '?').join(',');

  const skippedIDs = (typeof req.query.skipped === 'string' && req.query.skipped)
    ? req.query.skipped.split(',').map(Number).filter(Boolean)
    : [];

  const skippedPlaceholders = skippedIDs.length > 0
    ? `AND uwp.SystemWordID NOT IN (${skippedIDs.map(() => '?').join(',')})`
    : '';

  let word = db.prepare(`
    SELECT sw.*, uwp.CorrectStreak, uwp.ProgressID, uwp.TotalCorrect, uwp.TotalWrong
    FROM UserWordProgress uwp
    JOIN SystemWords sw ON uwp.SystemWordID = sw.SystemWordID
    WHERE uwp.UserID = ?
      AND uwp.IsLearned = 0
      AND sw.Level IN (${placeholders})
      AND datetime(uwp.NextReview) <= datetime('now')
      ${skippedPlaceholders}
    ORDER BY uwp.NextReview ASC
    LIMIT 1
  `).get(userID, ...unlockedLevels, ...skippedIDs);

  if (!word) {
    const newSkippedPlaceholders = skippedIDs.length > 0
      ? `AND sw.SystemWordID NOT IN (${skippedIDs.map(() => '?').join(',')})`
      : '';

    const newWord = db.prepare(`
      SELECT sw.* FROM SystemWords sw
      WHERE sw.Level IN (${placeholders})
        AND sw.SystemWordID NOT IN (
          SELECT SystemWordID FROM UserWordProgress WHERE UserID = ?
        )
        ${newSkippedPlaceholders}
      ORDER BY RANDOM()
      LIMIT 1
    `).get(...unlockedLevels, userID, ...skippedIDs);

    if (!newWord) {
      return res.json({ finished: true, reason: 'all_learned', dailyGoal, todayCount });
    }

    db.prepare(`
      INSERT INTO UserWordProgress (UserID, WordID, SystemWordID, CorrectStreak, NextReview)
      VALUES (?, NULL, ?, 0, datetime('now'))
    `).run(userID, newWord.SystemWordID);

    word = { ...newWord, CorrectStreak: 0, TotalCorrect: 0, TotalWrong: 0 };
  }

  const wrongOptions = db.prepare(`
    SELECT TurWordName FROM SystemWords
    WHERE SystemWordID != ? AND Level IN (${placeholders})
    ORDER BY RANDOM()
    LIMIT 3
  `).all(word.SystemWordID, ...unlockedLevels);

  const options = [
    { text: word.TurWordName, correct: true },
    ...wrongOptions.map(w => ({ text: w.TurWordName, correct: false }))
  ].sort(() => Math.random() - 0.5);

  res.json({
    finished: false,
    dailyGoal,
    todayCount,
    word: {
      systemWordID: word.SystemWordID,
      engWord: word.EngWordName,
      turWord: word.TurWordName,
      level: word.Level,
      correctStreak: word.CorrectStreak || 0,
      totalCorrect: word.TotalCorrect || 0,
      totalWrong: word.TotalWrong || 0,
    },
    options
  });
});

// Cevabı işle
router.post('/answer', authMiddleware, (req, res) => {
  const userID = req.user.userID;
  const { systemWordID, correct } = req.body;

  const progress = db.prepare(`
    SELECT * FROM UserWordProgress WHERE UserID = ? AND SystemWordID = ?
  `).get(userID, systemWordID);

  if (!progress) return res.status(404).json({ error: 'Progress bulunamadı' });

  let newStreak = correct ? progress.CorrectStreak + 1 : 0;
  const isLearned = newStreak >= 6 ? 1 : 0;

  const nextReview = computeNextReview(correct, newStreak, isLearned);

  db.prepare(`
    UPDATE UserWordProgress SET
      CorrectStreak = ?,
      TotalCorrect = TotalCorrect + ?,
      TotalWrong = TotalWrong + ?,
      LastSeen = datetime('now'),
      NextReview = ?,
      IsLearned = ?
    WHERE UserID = ? AND SystemWordID = ?
  `).run(newStreak, correct ? 1 : 0, correct ? 0 : 1, nextReview, isLearned, userID, systemWordID);

  const user = db.prepare('SELECT DailyWordCount FROM Users WHERE UserID = ?').get(userID);
  const dailyGoal = user?.DailyWordCount || 10;
  const todayCount = getTodayCount(userID);

  let message;
  if (isLearned) {
    message = '🎉 Kelime öğrenildi!';
  } else if (correct) {
    message = `✓ Doğru! Seri: ${newStreak}/6`;
  } else {
    message = '✗ Yanlış, seri sıfırlandı';
  }

  res.json({
    correct,
    newStreak,
    isLearned: isLearned === 1,
    dailyGoal,
    todayCount,
    dailyGoalReached: todayCount >= dailyGoal,
    message,
  });
});

// İstatistikler
router.get('/stats', authMiddleware, (req, res) => {
  const userID = req.user.userID;
  const user = db.prepare('SELECT DailyWordCount FROM Users WHERE UserID = ?').get(userID);
  const dailyGoal = user?.DailyWordCount || 10;

  const todayCount = getTodayCount(userID);

  const stats = db.prepare(`
    SELECT
      COUNT(*) as totalInProgress,
      SUM(IsLearned) as totalLearned,
      SUM(TotalCorrect) as totalCorrect,
      SUM(TotalWrong) as totalWrong
    FROM UserWordProgress WHERE UserID = ?
  `).get(userID);

  res.json({ ...stats, dailyGoal, todayCount });
});

module.exports = router;