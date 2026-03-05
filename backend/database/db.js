const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'wordmaster.db'));

// Tabloları oluştur
db.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserName TEXT NOT NULL UNIQUE,
    Email TEXT NOT NULL UNIQUE,
    Password TEXT NOT NULL,
    DailyWordCount INTEGER DEFAULT 10,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Words (
    WordID INTEGER PRIMARY KEY AUTOINCREMENT,
    EngWordName TEXT NOT NULL,
    TurWordName TEXT NOT NULL,
    Picture TEXT,
    CreatedBy INTEGER,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
  );

  CREATE TABLE IF NOT EXISTS WordSamples (
    WordSamplesID INTEGER PRIMARY KEY AUTOINCREMENT,
    WordID INTEGER NOT NULL,
    Sample TEXT NOT NULL,
    FOREIGN KEY (WordID) REFERENCES Words(WordID)
  );

  CREATE TABLE IF NOT EXISTS UserWordProgress (
    ProgressID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    WordID INTEGER NOT NULL,
    CorrectStreak INTEGER DEFAULT 0,
    TotalCorrect INTEGER DEFAULT 0,
    TotalWrong INTEGER DEFAULT 0,
    LastSeen DATETIME,
    NextReview DATETIME,
    IsLearned INTEGER DEFAULT 0,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (WordID) REFERENCES Words(WordID)
  );
`);

console.log('Veritabani baglantisi kuruldu');
module.exports = db;