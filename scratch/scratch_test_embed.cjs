const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const res = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: 'test content',
      config: { outputDimensionality: 768 }
    });
    const vals = res.embeddings[0].values;
    console.log('Embedding dimensions:', vals.length);
  } catch(e) {
    console.error('Error:', e);
  }
}

test();
