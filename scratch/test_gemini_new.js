import { GoogleGenAI } from '@google/genai';

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
if (!apiKey) {
  console.error("GEMINI_API_KEY is missing");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function test() {
  console.log("Testing with model: gemini-2.0-flash");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Say hello',
    });
    console.log("Response text:", response.text);
  } catch (e) {
    console.error("Error:", e.message);
    if (e.response) {
      console.error("Details:", JSON.stringify(e.response, null, 2));
    }
  }
}

test();
