const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

// KAYIT OL
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Tum alanlar zorunludur' });
  }

  if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: 'Kullanici adi 3-50 karakter olmalidir' });
  }

  if (typeof email !== 'string' || email.length > 255 || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Gecersiz email adresi' });
  }

  if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
    return res.status(400).json({ error: 'Sifre 6-128 karakter olmalidir' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const stmt = db.prepare(
      'INSERT INTO Users (UserName, Email, Password) VALUES (?, ?, ?)'
    );
    const result = stmt.run(username, email, hashedPassword);
    res.json({ message: 'Kayit basarili', userID: result.lastInsertRowid });
  } catch {
    res.status(400).json({ error: 'Bu kullanici adi veya email zaten kayitli' });
  }
});

// GİRİŞ YAP
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email ve sifre zorunludur' });
  }

  if (typeof email !== 'string' || email.length > 255) {
    return res.status(400).json({ error: 'Gecersiz email' });
  }

  if (typeof password !== 'string' || password.length > 128) {
    return res.status(400).json({ error: 'Gecersiz sifre' });
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

// ŞİFREMİ UNUTTUM
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || email.length > 255) {
    return res.status(400).json({ error: 'Geçerli bir email adresi giriniz' });
  }

  const user = db.prepare('SELECT UserID FROM Users WHERE Email = ?').get(email);

  if (!user) {
    return res.status(404).json({ error: 'Bu email adresi bulunamadı' });
  }

  res.json({ message: 'Şifre sıfırlama bağlantısı email adresinize gönderildi' });
});

module.exports = router;