const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

// KAYIT OL
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Tum alanlar zorunludur' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const stmt = db.prepare(
      'INSERT INTO Users (UserName, Email, Password) VALUES (?, ?, ?)'
    );
    const result = stmt.run(username, email, hashedPassword);
    res.json({ message: 'Kayit basarili', userID: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: 'Bu kullanici adi veya email zaten kayitli' });
  }
});

// GİRİŞ YAP
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email ve sifre zorunludur' });
  }

  const user = db.prepare('SELECT * FROM Users WHERE Email = ?').get(email);

  if (!user || !bcrypt.compareSync(password, user.Password)) {
    return res.status(401).json({ error: 'Email veya sifre yanlis' });
  }

  const token = jwt.sign(
    { userID: user.UserID, username: user.UserName },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, username: user.UserName, userID: user.UserID });
});

module.exports = router;