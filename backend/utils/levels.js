const db = require('../database/db');

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

module.exports = { getUnlockedLevels };
