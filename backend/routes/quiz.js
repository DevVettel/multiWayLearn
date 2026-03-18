const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

const REVIEW_INTERVALS = [1, 7, 30, 90, 180, 365];

function getUnlockedLevels(userID, manualLevels = []) {
  const unlocked = new Set(manualLevels.length > 0 ? manualLevels : ['A1']);

  const a1Learned = db.prepare(`
    SELECT COUNT(*) as count FROM UserWordProgress uwp
    JOIN SystemWords sw ON uwp.SystemWordID = sw.SystemWordID
    WHERE uwp.UserID = ? AND sw.Level = 'A1' AND uwp.IsLearned = 1
  `).get(userID).count;

  if (a1Learned >= 350) {
    unlocked.add('A2');
    const a2Learned = db.prepare(`
      SELECT COUNT(*) as count FROM UserWordProgress uwp
      JOIN SystemWords sw ON uwp.SystemWordID = sw.SystemWordID
      WHERE uwp.UserID = ? AND sw.Level = 'A2' AND uwp.IsLearned = 1
    `).get(userID).count;
    if (a2Learned >= 250) unlocked.add('B1');
  }

  return [...unlocked];
}

router.get('/next', authMiddleware, (req, res) => {
  const userID = req.user.userID;
  const manualLevels = (typeof req.query.levels === 'string')
    ? req.query.levels.split(',').filter(l => ['A1', 'A2', 'B1'].includes(l))
    : [];

  const user = db.prepare('SELECT DailyWordCount FROM Users WHERE UserID = ?').get(userID);
  const dailyGoal = user?.DailyWordCount || 10;

  const todayCount = db.prepare(`
    SELECT COUNT(*) as count FROM UserWordProgress
    WHERE UserID = ? AND date(LastSeen) = date('now')
  `).get(userID).count;

  if (todayCount >= dailyGoal) {
    return res.json({ finished: true, reason: 'daily_goal', dailyGoal, todayCount });
  }

  const unlockedLevels = getUnlockedLevels(userID, manualLevels);
  const placeholders = unlockedLevels.map(() => '?').join(',');

  // Tekrar zamanı gelmiş sistem kelimesi
  let word = db.prepare(`
    SELECT sw.EngWordName, sw.TurWordName, sw.Level, sw.SystemWordID,
           uwp.CorrectStreak, uwp.TotalCorrect, uwp.TotalWrong, 'system' as wordType
    FROM UserWordProgress uwp
    JOIN SystemWords sw ON uwp.SystemWordID = sw.SystemWordID
    WHERE uwp.UserID = ?
      AND uwp.IsLearned = 0
      AND sw.Level IN (${placeholders})
      AND datetime(uwp.NextReview) <= datetime('now')
    ORDER BY uwp.NextReview ASC
    LIMIT 1
  `).get(userID, ...unlockedLevels);

  // Tekrar zamanı gelmiş kullanıcı kelimesi
  if (!word) {
    word = db.prepare(`
      SELECT w.EngWordName, w.TurWordName, 'Kişisel' as Level, NULL as SystemWordID,
             uwp.CorrectStreak, uwp.TotalCorrect, uwp.TotalWrong, 'user' as wordType,
             w.WordID
      FROM UserWordProgress uwp
      JOIN Words w ON uwp.WordID = w.WordID
      WHERE uwp.UserID = ?
        AND uwp.IsLearned = 0
        AND uwp.WordID IS NOT NULL
        AND datetime(uwp.NextReview) <= datetime('now')
      ORDER BY uwp.NextReview ASC
      LIMIT 1
    `).get(userID);
  }

  // Yeni sistem kelimesi
  if (!word) {
    const newSysWord = db.prepare(`
      SELECT sw.* FROM SystemWords sw
      WHERE sw.Level IN (${placeholders})
        AND sw.SystemWordID NOT IN (
          SELECT SystemWordID FROM UserWordProgress 
          WHERE UserID = ? AND SystemWordID IS NOT NULL
        )
      ORDER BY RANDOM()
      LIMIT 1
    `).get(...unlockedLevels, userID);

    if (newSysWord) {
      db.prepare(`
        INSERT INTO UserWordProgress (UserID, WordID, SystemWordID, CorrectStreak, NextReview)
        VALUES (?, NULL, ?, 0, datetime('now'))
      `).run(userID, newSysWord.SystemWordID);
      word = { ...newSysWord, CorrectStreak: 0, TotalCorrect: 0, TotalWrong: 0, wordType: 'system' };
    }
  }

  // Yeni kullanıcı kelimesi
  if (!word) {
    const newUserWord = db.prepare(`
      SELECT w.* FROM Words w
      WHERE w.CreatedBy = ?
        AND w.WordID NOT IN (
          SELECT WordID FROM UserWordProgress 
          WHERE UserID = ? AND WordID IS NOT NULL
        )
      ORDER BY RANDOM()
      LIMIT 1
    `).get(userID, userID);

    if (newUserWord) {
      db.prepare(`
        INSERT INTO UserWordProgress (UserID, WordID, SystemWordID, CorrectStreak, NextReview)
        VALUES (?, ?, NULL, 0, datetime('now'))
      `).run(userID, newUserWord.WordID);
      word = { ...newUserWord, CorrectStreak: 0, TotalCorrect: 0, TotalWrong: 0, wordType: 'user', Level: 'Kişisel' };
    }
  }

  if (!word) {
    return res.json({ finished: true, reason: 'all_learned', dailyGoal, todayCount });
  }

  // Yanlış şıklar
  const wrongOptions = db.prepare(`
    SELECT TurWordName FROM SystemWords
    WHERE TurWordName != ?
    ORDER BY RANDOM()
    LIMIT 3
  `).all(word.TurWordName);

  const options = [
    { text: word.TurWordName, correct: true },
    ...wrongOptions.map(w => ({ text: w.TurWordName, correct: false }))
  ].sort(() => Math.random() - 0.5);

  res.json({
    finished: false,
    dailyGoal,
    todayCount,
    word: {
      systemWordID: word.SystemWordID || null,
      wordID: word.WordID || null,
      wordType: word.wordType,
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

router.post('/answer', authMiddleware, (req, res) => {
  const userID = req.user.userID;
  const { systemWordID, wordID, correct } = req.body;

  let progress;
  if (systemWordID) {
    progress = db.prepare(`
      SELECT * FROM UserWordProgress WHERE UserID = ? AND SystemWordID = ?
    `).get(userID, systemWordID);
  } else {
    progress = db.prepare(`
      SELECT * FROM UserWordProgress WHERE UserID = ? AND WordID = ?
    `).get(userID, wordID);
  }

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
    WHERE ProgressID = ?
  `).run(newStreak, correct ? 1 : 0, correct ? 0 : 1, isLearned, progress.ProgressID);

  res.json({
    correct,
    newStreak,
    isLearned: isLearned === 1,
    message: isLearned
      ? '🎉 Kelime öğrenildi!'
      : correct
        ? `✓ Doğru! Seri: ${newStreak}/6`
        : '✗ Yanlış, seri sıfırlandı'
  });
});

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