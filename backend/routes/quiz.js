const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

const REVIEW_INTERVALS = [1, 7, 30, 90, 180, 365];

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

// Quiz sorusu getir
router.get('/next', authMiddleware, (req, res) => {
  const userID = req.user.userID;

  // Kullanıcının günlük hedefini al
  const user = db.prepare('SELECT DailyWordCount FROM Users WHERE UserID = ?').get(userID);
  const dailyGoal = user?.DailyWordCount || 10;

  // Bugün kaç kelime çalışıldı
  const todayCount = db.prepare(`
    SELECT COUNT(*) as count FROM UserWordProgress
    WHERE UserID = ? AND date(LastSeen) = date('now')
  `).get(userID).count;

  if (todayCount >= dailyGoal) {
    return res.json({ finished: true, reason: 'daily_goal', dailyGoal, todayCount });
  }

  const unlockedLevels = getUnlockedLevels(userID);
  const placeholders = unlockedLevels.map(() => '?').join(',');

  // Tekrar zamanı gelmiş kelimeler
  let word = db.prepare(`
    SELECT sw.*, uwp.CorrectStreak, uwp.ProgressID, uwp.TotalCorrect, uwp.TotalWrong
    FROM UserWordProgress uwp
    JOIN SystemWords sw ON uwp.SystemWordID = sw.SystemWordID
    WHERE uwp.UserID = ?
      AND uwp.IsLearned = 0
      AND sw.Level IN (${placeholders})
      AND datetime(uwp.NextReview) <= datetime('now')
    ORDER BY uwp.NextReview ASC
    LIMIT 1
  `).get(userID, ...unlockedLevels);

  // Yeni kelime
  if (!word) {
    const newWord = db.prepare(`
      SELECT sw.* FROM SystemWords sw
      WHERE sw.Level IN (${placeholders})
        AND sw.SystemWordID NOT IN (
          SELECT SystemWordID FROM UserWordProgress WHERE UserID = ?
        )
      ORDER BY sw.SystemWordID ASC
      LIMIT 1
    `).get(...unlockedLevels, userID);

    if (!newWord) {
      return res.json({ finished: true, reason: 'all_learned', dailyGoal, todayCount });
    }

    db.prepare(`
      INSERT INTO UserWordProgress (UserID, WordID, SystemWordID, CorrectStreak, NextReview)
      VALUES (?, NULL, ?, 0, datetime('now'))
    `).run(userID, newWord.SystemWordID);

    word = { ...newWord, CorrectStreak: 0, TotalCorrect: 0, TotalWrong: 0 };
  }

  // Yanlış şıklar
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

  let nextReviewExpr;
  if (isLearned) {
    nextReviewExpr = `datetime('now', '+365 days')`;
  } else if (correct && newStreak > 0) {
    const days = REVIEW_INTERVALS[newStreak - 1] || 1;
    nextReviewExpr = `datetime('now', '+${days} days')`;
  } else {
    nextReviewExpr = `datetime('now')`;
  }

  db.prepare(`
    UPDATE UserWordProgress SET
      CorrectStreak = ?,
      TotalCorrect = TotalCorrect + ?,
      TotalWrong = TotalWrong + ?,
      LastSeen = datetime('now'),
      NextReview = ${nextReviewExpr},
      IsLearned = ?
    WHERE UserID = ? AND SystemWordID = ?
  `).run(newStreak, correct ? 1 : 0, correct ? 0 : 1, isLearned, userID, systemWordID);

  res.json({
    correct,
    newStreak,
    isLearned: isLearned === 1,
    message: isLearned
      ? '🎉 Kelime öğrenildi!'
      : correct
        ? `✓ Doğru! Seri: ${newStreak}/6`
        : '✗ Maalesef yanlış, seri sıfırlandı'
  });
});

// İstatistikler
router.get('/stats', authMiddleware, (req, res) => {
  const userID = req.user.userID;
  const user = db.prepare('SELECT DailyWordCount FROM Users WHERE UserID = ?').get(userID);
  const dailyGoal = user?.DailyWordCount || 10;

  const todayCount = db.prepare(`
    SELECT COUNT(*) as count FROM UserWordProgress
    WHERE UserID = ? AND date(LastSeen) = date('now')
  `).get(userID).count;

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