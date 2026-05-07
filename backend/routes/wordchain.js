const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');
const path = require('node:path');
const fs = require('node:fs');
const https = require('node:https');

const generateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { error: 'Çok fazla istek, lütfen bekleyin' }
});


// Replicate API
const Replicate = require('replicate');
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Hikayeyi token'lara ayır
function parseStoryTokens(story, words) {
    const tokens = [];
    let remaining = story;

    while (remaining.length > 0) {
        let matched = false;

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const regex = new RegExp(`^(${escapeRegExp(word)})`, 'i');
            const match = remaining.match(regex);

            if (match) {
                tokens.push({
                    type: 'chain-word',
                    text: match[1],
                    lastChar: word.slice(-1).toUpperCase(),
                    nextFirstChar: words[i + 1] ? words[i + 1][0].toUpperCase() : null,
                    isFirst: i === 0,
                });
                remaining = remaining.slice(match[1].length);
                matched = true;
                break;
            }
        }

        if (!matched) {
            const nextWordPos = words.reduce((min, w) => {
                const idx = remaining.toLowerCase().indexOf(w.toLowerCase());
                return idx !== -1 && idx < min ? idx : min;
            }, remaining.length);

            tokens.push({
                type: 'text',
                text: remaining.slice(0, nextWordPos || 1),
            });
            remaining = remaining.slice(nextWordPos || 1);
        }
    }

    return tokens;
}

// Zincir kuralı kontrolü
function isValidChain(words) {
    for (let i = 0; i < words.length - 1; i++) {
        const lastChar = words[i].slice(-1).toLowerCase();
        const firstChar = words[i + 1][0].toLowerCase();
        if (lastChar !== firstChar) return false;
    }
    return true;
}

// Hikaye oluştur
router.post('/generate', authMiddleware, generateLimiter, async (req, res) => {
    const userID = req.user.userID;
    const { words, generateImage } = req.body;

    if (!words || !Array.isArray(words) || words.length < 2) {
        return res.status(400).json({ error: 'En az 2 kelime gerekli' });
    }

    if (!isValidChain(words)) {
        return res.status(400).json({ error: 'Kelimeler zincir kuralına uymuyor' });
    }

    try {
        // 1. Gemini ile hikaye üret
        const storyModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
        const wordList = words.join(', ');

        const storyPrompt = `
Write a short, creative and meaningful story (2-3 sentences) in English.
Use these words naturally in this exact order: ${wordList}
STRICT RULES:
1. Never repeat a word from the list
2. The story must make logical sense
3. Do not mention the chain connection explicitly
4. Only return the story text, nothing else
`;

        const storyResult = await storyModel.generateContent(storyPrompt);
        const story = storyResult.response.text().trim().replace(/\*\*/g, '');

        // 2. Replicate ile görsel üret (opsiyonel)
        let imagePath = null;
        if (generateImage === true) try {
            const output = await replicate.run(
                "stability-ai/stable-diffusion-3.5-medium",
                {
                    input: {
                        prompt: `A simple colorful cartoon illustration for a story about: ${wordList}. Child-friendly, bright colors.`,
                        width: 512,
                        height: 512,
                    }
                }
            );

            // output URL olarak geliyor, indir ve kaydet
            const imageUrl = Array.isArray(output) ? output[0] : output;

            // SSRF koruması — sadece Replicate domain'ine izin ver
            const allowedDomains = ['replicate.delivery', 'pbxt.replicate.delivery', 'storage.googleapis.com'];
            let parsedUrl;
            try {
                parsedUrl = new URL(imageUrl);
            } catch {
                throw new Error('Geçersiz görsel URL');
            }

            if (!allowedDomains.some(d => parsedUrl.hostname.endsWith(d))) {
                throw new Error('Güvensiz görsel kaynağı');
            }

            await new Promise((resolve, reject) => {
                const fileName = `story_${userID}_${Date.now()}.png`;
                const filePath = path.join(__dirname, '../uploads', fileName);
                const file = fs.createWriteStream(filePath);
                https.get(parsedUrl.toString(), (response) => {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        imagePath = `/uploads/${fileName}`;
                        resolve();
                    });
                }).on('error', reject);
            });
        } catch (imgErr) {
            console.error('Görsel üretilemedi:', imgErr.message);
        }
        // 3. Veritabanına kaydet
        const stmt = db.prepare(`
      INSERT INTO WordChainStories (UserID, Words, Story, ImagePath)
      VALUES (?, ?, ?, ?)
    `);
        const result = stmt.run(userID, JSON.stringify(words), story, imagePath);

        const storyTokens = parseStoryTokens(story, words);

        res.json({
            storyID: result.lastInsertRowid,
            words,
            story,
            storyTokens,
            imagePath,
        });

    } catch (err) {
        console.error('WordChain hata:', err);
        res.status(500).json({ error: 'Hikaye oluşturulamadı' });
    }
});

// Kaydedilen hikayeleri getir
router.get('/stories', authMiddleware, (req, res) => {
    const userID = req.user.userID;
    const stories = db.prepare(`
    SELECT * FROM WordChainStories
    WHERE UserID = ?
    ORDER BY CreatedAt DESC
    LIMIT 20
  `).all(userID);

    const parsed = stories.map(s => {
        const words = JSON.parse(s.Words);
        return {
            ...s,
            words,
            storyTokens: parseStoryTokens(s.Story, words),
        };
    });

    res.json(parsed);
});

// Tüm sistem kelimelerini getir (seviyeye göre)
router.get('/words', authMiddleware, (req, res) => {
  const level = req.query.level || 'A1';
  const validLevels = ['A1', 'A2', 'B1'];
  if (!validLevels.includes(level)) {
    return res.status(400).json({ error: 'Geçersiz seviye' });
  }

  const words = db.prepare(`
    SELECT EngWordName, TurWordName FROM SystemWords
    WHERE Level = ?
    ORDER BY SystemWordID ASC
  `).all(level);

  res.json(words);
});

module.exports = router;