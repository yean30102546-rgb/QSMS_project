import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  console.log("Starting test...");
  try {
    const parseResponse = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        { text: "Reply with 'Hello'" }
      ]
    });
    console.log("Response:", parseResponse.text);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
