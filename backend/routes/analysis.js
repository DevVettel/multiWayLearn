const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, (req, res) => {
  const userID = req.user.userID;

  const general = db.prepare(`
    SELECT
      COUNT(*) as totalInProgress,
      SUM(IsLearned) as totalLearned,
      SUM(TotalCorrect) as totalCorrect,
      SUM(TotalWrong) as totalWrong
    FROM UserWordProgress WHERE UserID = ?
  `).get(userID);

  const levels = db.prepare(`
    SELECT
      sw.Level,
      COUNT(*) as total,
      SUM(uwp.IsLearned) as learned,
      SUM(uwp.TotalCorrect) as correct,
      SUM(uwp.TotalWrong) as wrong
    FROM UserWordProgress uwp
    JOIN SystemWords sw ON uwp.SystemWordID = sw.SystemWordID
    WHERE uwp.UserID = ?
    GROUP BY sw.Level
  `).all(userID);

  const streakDist = db.prepare(`
    SELECT CorrectStreak as streak, COUNT(*) as count
    FROM UserWordProgress
    WHERE UserID = ? AND IsLearned = 0
    GROUP BY CorrectStreak
    ORDER BY CorrectStreak ASC
  `).all(userID);

  const weeklyActivity = db.prepare(`
    SELECT date(LastSeen) as date, COUNT(DISTINCT SystemWordID) as count
    FROM UserWordProgress
    WHERE UserID = ?
      AND LastSeen IS NOT NULL
      AND date(LastSeen) >= date('now', '-6 days')
    GROUP BY date(LastSeen)
    ORDER BY date ASC
  `).all(userID);

  const systemTotals = db.prepare(`
    SELECT Level, COUNT(*) as total FROM SystemWords GROUP BY Level
  `).all();

  res.json({ general, levels, streakDist, weeklyActivity, systemTotals });
});

module.exports = router;