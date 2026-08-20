const https = require('https');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.models) {
        const textModels = json.models.map(m => m.name).filter(n => !n.includes('embed'));
        console.log('Available generative models:\n', textModels.join('\n'));
      } else {
        console.log('Response:', json);
      }
    } catch(e) {
      console.error('Error parsing JSON', data);
    }
  });
}).on('error', (e) => {
  console.error(e);
});
