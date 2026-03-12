const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

// Seviye eşikleri
const LEVEL_CONFIG = {
  A1: { total: 500, unlockNext: 350 },
  A2: { total: 350, unlockNext: 250 },
  B1: { total: 150, unlockNext: 150 },
};

// Kullanıcının hangi seviyelere erişimi var + ilerleme bilgisi
router.get('/progress', authMiddleware, (req, res) => {
  const userID = req.user.userID;

  const levels = ['A1', 'A2', 'B1'];
  const result = [];

  let previousUnlocked = true;

  for (const level of levels) {
    const config = LEVEL_CONFIG[level];

    // Bu seviyedeki toplam sistem kelimesi
    const total = db.prepare(
      'SELECT COUNT(*) as count FROM SystemWords WHERE Level = ?'
    ).get(level).count;

    // Kullanıcının bu seviyede öğrendiği kelime sayısı
    const learned = db.prepare(`
      SELECT COUNT(*) as count FROM UserWordProgress uwp
      JOIN SystemWords sw ON uwp.SystemWordID = sw.SystemWordID
      WHERE uwp.UserID = ? AND sw.Level = ? AND uwp.IsLearned = 1
    `).get(userID, level).count;

    // Kullanıcının bu seviyede döngüde olan kelime sayısı
    const inProgress = db.prepare(`
      SELECT COUNT(*) as count FROM UserWordProgress uwp
      JOIN SystemWords sw ON uwp.SystemWordID = sw.SystemWordID
      WHERE uwp.UserID = ? AND sw.Level = ? AND uwp.IsLearned = 0
    `).get(userID, level).count;

    const isUnlocked = previousUnlocked;
    const percentage = Math.round((learned / config.unlockNext) * 100);

    result.push({
      level,
      total,
      learned,
      inProgress,
      isUnlocked,
      unlockThreshold: config.unlockNext,
      percentage: Math.min(percentage, 100),
    });

    // Sonraki seviye bu seviyenin eşiğini geçtiyse açılır
    previousUnlocked = learned >= config.unlockNext;
  }

  res.json(result);
});

// Kullanıcının quiz için kelime al (seviyeye göre)
router.get('/words/:level', authMiddleware, (req, res) => {
  const userID = req.user.userID;
  const level = req.params.level;

  // Bu seviyedeki tüm sistem kelimelerini getir ve kullanıcının ilerleme durumunu da dahil et
  // Kullanıcının henüz döngüye almadıklarını da dahil et
  const words = db.prepare(`
    SELECT sw.*, uwp.CorrectStreak, uwp.IsLearned, uwp.NextReview, uwp.ProgressID
    FROM SystemWords sw
    LEFT JOIN UserWordProgress uwp ON sw.SystemWordID = uwp.SystemWordID AND uwp.UserID = ?
    WHERE sw.Level = ?
    ORDER BY uwp.NextReview ASC NULLS FIRST
    LIMIT 20
  `).all(userID, level);

  res.json(words);
});

module.exports = router;