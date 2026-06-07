const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const nodemailer = require('nodemailer');
const db = require('../database/db');

function createMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

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
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || email.length > 255) {
    return res.status(400).json({ error: 'Geçerli bir email adresi giriniz' });
  }

  const user = db.prepare('SELECT UserID FROM Users WHERE Email = ?').get(email);

  // Kullanıcı yoksa da aynı mesajı döndür (email enumeration önleme)
  if (!user) {
    return res.json({ message: 'Şifre sıfırlama bağlantısı email adresinize gönderildi' });
  }

  // Eski token varsa sil
  db.prepare('DELETE FROM PasswordResets WHERE UserID = ?').run(user.UserID);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 saat

  db.prepare(
    'INSERT INTO PasswordResets (UserID, Token, ExpiresAt) VALUES (?, ?, ?)'
  ).run(user.UserID, token, expiresAt);

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  try {
    const transporter = createMailTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'MultiWayLearn — Şifre Sıfırlama',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2>Şifre Sıfırlama</h2>
          <p>Aşağıdaki bağlantıya tıklayarak şifreni sıfırlayabilirsin.</p>
          <p>Bu bağlantı <strong>1 saat</strong> geçerlidir.</p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
            Şifremi Sıfırla
          </a>
          <p style="margin-top:24px;color:#888;font-size:12px">
            Bu emaili sen istemediysen güvende olabilirsin, hiçbir şey değişmedi.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[EMAIL] Gönderilemedi:', err.message);
    return res.status(500).json({ error: 'Email gönderilemedi, lütfen daha sonra tekrar deneyin' });
  }

  res.json({ message: 'Şifre sıfırlama bağlantısı email adresinize gönderildi' });
});

// ŞİFRE SIFIRLA
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;

  if (!token || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ error: 'Geçersiz token' });
  }

  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 128) {
    return res.status(400).json({ error: 'Şifre 6-128 karakter olmalıdır' });
  }

  const reset = db.prepare(
    'SELECT * FROM PasswordResets WHERE Token = ? AND UsedAt IS NULL AND ExpiresAt > datetime("now")'
  ).get(token);

  if (!reset) {
    return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş link' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.prepare('UPDATE Users SET Password = ? WHERE UserID = ?').run(hashedPassword, reset.UserID);
  db.prepare('UPDATE PasswordResets SET UsedAt = datetime("now") WHERE ResetID = ?').run(reset.ResetID);

  res.json({ message: 'Şifreniz başarıyla güncellendi' });
});

module.exports = router;