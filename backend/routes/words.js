const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');

// Resim yükleme ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyası yüklenebilir'));
    }
  }
});

// TÜM KELİMELERİ GETİR
router.get('/', authMiddleware, (req, res) => {
  const words = db.prepare(`
    SELECT w.*, 
    GROUP_CONCAT(ws.Sample, '||') as Samples
    FROM Words w
    LEFT JOIN WordSamples ws ON w.WordID = ws.WordID
    WHERE w.CreatedBy = ?
    GROUP BY w.WordID
    ORDER BY w.WordID DESC
  `).all(req.user.userID);

  const wordsWithSamples = words.map(w => ({
    ...w,
    Samples: w.Samples ? w.Samples.split('||') : []
  }));

  res.json(wordsWithSamples);
});

// YENİ KELİME EKLE
router.post('/', authMiddleware, upload.single('picture'), (req, res) => {
  const { engWord, turWord, samples } = req.body;

  if (!engWord || !turWord) {
    return res.status(400).json({ error: 'İngilizce ve Türkçe kelime zorunludur' });
  }

  const picturePath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const wordStmt = db.prepare(
      'INSERT INTO Words (EngWordName, TurWordName, Picture, CreatedBy) VALUES (?, ?, ?, ?)'
    );
    const result = wordStmt.run(engWord, turWord, picturePath, req.user.userID);
    const wordID = result.lastInsertRowid;

    // Örnek cümleleri ekle
    if (samples) {
      const sampleList = JSON.parse(samples);
      const sampleStmt = db.prepare(
        'INSERT INTO WordSamples (WordID, Sample) VALUES (?, ?)'
      );
      sampleList.forEach(sample => {
        if (sample.trim()) sampleStmt.run(wordID, sample.trim());
      });
    }

    res.json({ message: 'Kelime eklendi', wordID });
  } catch (err) {
    res.status(500).json({ error: 'Kelime eklenirken hata oluştu' });
  }
});

// KELİME SİL
router.delete('/:id', authMiddleware, (req, res) => {
  const wordID = req.params.id;

  try {
    db.prepare('DELETE FROM WordSamples WHERE WordID = ?').run(wordID);
    db.prepare('DELETE FROM Words WHERE WordID = ? AND CreatedBy = ?')
      .run(wordID, req.user.userID);
    res.json({ message: 'Kelime silindi' });
  } catch (err) {
    res.status(500).json({ error: 'Kelime silinirken hata oluştu' });
  }
});

module.exports = router;