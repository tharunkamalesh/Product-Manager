
import { GoogleGenAI, Type } from '@google/genai';

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const ai = new GoogleGenAI({ apiKey });

const SYSTEM = "You are a PM. Analyze the input.";
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  required: ["topPriorities", "secondary", "ignore", "actionPlan"],
  properties: {
    topPriorities: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { task: { type: Type.STRING }, impact: { type: Type.STRING }, reasoning: { type: Type.STRING }, category: { type: Type.STRING }, confidence: { type: Type.NUMBER } } } },
    secondary: { type: Type.ARRAY, items: { type: Type.STRING } },
    ignore: { type: Type.ARRAY, items: { type: Type.STRING } },
    actionPlan: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { task: { type: Type.STRING }, nextStep: { type: Type.STRING }, timeEstimate: { type: Type.STRING } } } }
  }
};

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: 'Build a new login page',
      config: {
        systemInstruction: SYSTEM,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });
    console.log("Success:", response.text);
  } catch (e) {
    console.error("Error:", e.message);
    if (e.response) console.error("Details:", JSON.stringify(e.response, null, 2));
  }
}

test();
