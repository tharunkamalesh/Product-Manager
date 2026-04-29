
import { GoogleGenAI } from '@google/genai';

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const ai = new GoogleGenAI({ apiKey });

async function test() {
  try {
    const response = await ai.models.list();
    console.log("Response:", JSON.stringify(response, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
