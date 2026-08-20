const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const res = await ai.models.batchEmbedContents({
      model: 'gemini-embedding-2',
      requests: ['chunk 1', 'chunk 2', 'chunk 3'].map(text => ({ contents: text, model: 'gemini-embedding-2' }))
    });
    console.log('Got response embeddings count:', res.embeddings.length);
  } catch(e) {
    console.error('Error:', e);
  }
}

test();
