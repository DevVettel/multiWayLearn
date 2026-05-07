require('dotenv').config();
const https = require('node:https');

const key = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    json.models
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .forEach(m => console.log(m.name));
  });
}).on('error', console.error);