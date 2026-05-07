const db = require('./database/db');       // bu satır tabloları oluşturur
const path = require('node:path');
const ExcelJS = require('exceljs');

async function seed() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM SystemWords').get();
  if (existing.count > 0) {
    console.log('Kelimeler halihazirda yuklu, isleme gerek yok.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(__dirname, 'data/english-words-first1k.xlsx'));
  const ws = workbook.worksheets[0];

  const stmt = db.prepare('INSERT INTO SystemWords (EngWordName, TurWordName, Level) VALUES (?, ?, ?)');

  let count = 0;
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const eng = row.getCell(2).value?.toString().trim();
    const tur = row.getCell(3).value?.toString().trim();
    const level = row.getCell(4).value?.toString().trim();
    if (eng && tur && level) {
      stmt.run(eng, tur, level);
      count++;
    }
  });

  console.log(`${count} kelime basariyla yuklendi.`);
}

seed().catch(console.error);