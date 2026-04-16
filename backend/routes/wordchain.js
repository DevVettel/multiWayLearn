const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
router.post('/generate', authMiddleware, async (req, res) => {
    const userID = req.user.userID;
    const { words } = req.body;

    if (!words || !Array.isArray(words) || words.length < 2) {
        return res.status(400).json({ error: 'En az 2 kelime gerekli' });
    }

    if (!isValidChain(words)) {
        return res.status(400).json({ error: 'Kelimeler zincir kuralına uymuyor' });
    }

    try {
        // 1. Gemini ile hikaye üret
        const storyModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const wordList = words.join(', ');

        const storyPrompt = `
You are a creative writer. Write a short story (3-4 sentences) in English.
STRICT RULES:
1. Use these words IN THIS EXACT ORDER: ${words.map((w, i) => `${i + 1}. ${w}`).join(', ')}
2. The last letter of each word must connect to the first letter of the next word in the story flow
3. Bold each chain word using **word** markdown
4. Only return the story text, nothing else, no explanations

Words: ${wordList}
`;

        const storyResult = await storyModel.generateContent(storyPrompt);
        const story = storyResult.response.text().trim();

        // 2. Gemini ile görsel üret
        let imagePath = null;
        try {
            const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
            const imagePrompt = `A simple colorful cartoon illustration for a story about: ${wordList}.`;

            const imageResult = await imageModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: imagePrompt }] }],
                generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
            });

            for (const part of imageResult.response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const fileName = `story_${userID}_${Date.now()}.png`;
                    const filePath = path.join(__dirname, '../uploads', fileName);
                    fs.writeFileSync(filePath, Buffer.from(part.inlineData.data, 'base64'));
                    imagePath = `/uploads/${fileName}`;
                    break;
                }
            }
        } catch (imgErr) {
            console.log('Görsel üretilemedi:', imgErr.message);
        }
        // 3. Veritabanına kaydet
        const stmt = db.prepare(`
      INSERT INTO WordChainStories (UserID, Words, Story, ImagePath)
      VALUES (?, ?, ?, ?)
    `);
        const result = stmt.run(userID, JSON.stringify(words), story, imagePath);

        res.json({
            storyID: result.lastInsertRowid,
            words,
            story,
            imagePath,
        });

    } catch (err) {
        console.error('WordChain hata:', err);
        res.status(500).json({ error: 'Hikaye oluşturulamadı: ' + err.message });
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

    const parsed = stories.map(s => ({
        ...s,
        words: JSON.parse(s.Words),
    }));

    res.json(parsed);
});

module.exports = router;