const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'multiWayLearn.db'));

db.pragma('foreign_keys = OFF');

db.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserName TEXT UNIQUE NOT NULL,
    Email TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    DailyWordCount INTEGER DEFAULT 10,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS SystemWords (
    SystemWordID INTEGER PRIMARY KEY AUTOINCREMENT,
    EngWordName TEXT NOT NULL,
    TurWordName TEXT NOT NULL,
    Level TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Words (
    WordID INTEGER PRIMARY KEY AUTOINCREMENT,
    EngWordName TEXT NOT NULL,
    TurWordName TEXT NOT NULL,
    Picture TEXT,
    CreatedBy INTEGER REFERENCES Users(UserID)
  );

  CREATE TABLE IF NOT EXISTS WordSamples (
    WordSamplesID INTEGER PRIMARY KEY AUTOINCREMENT,
    WordID INTEGER REFERENCES Words(WordID),
    Sample TEXT
  );
  
  CREATE TABLE IF NOT EXISTS WordChainStories (
    StoryID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER,
    Words TEXT,
    Story TEXT,
    ImagePath TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS UserWordProgress (
    ProgressID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER REFERENCES Users(UserID),
    WordID INTEGER,
    SystemWordID INTEGER REFERENCES SystemWords(SystemWordID),
    CorrectStreak INTEGER DEFAULT 0,
    TotalCorrect INTEGER DEFAULT 0,
    TotalWrong INTEGER DEFAULT 0,
    LastSeen DATETIME,
    NextReview DATETIME DEFAULT CURRENT_TIMESTAMP,
    IsLearned INTEGER DEFAULT 0
  );
`);

console.log('Veritabani baglantisi kuruldu');
module.exports = db;