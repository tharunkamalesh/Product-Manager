import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, Memory } from "../../src/types/copilot";

const SYSTEM = `You are an AI decision engine for early-stage founders and product managers.
Given messy daily input (Slack, email, Jira, notes) + optional memory context, you return prioritized actions.
Rules:
- Pick at most 3 top priorities. Score each on impact, urgency, effort.
- Reasoning must reference actual content from the input, not generic advice.
- memoryInfluence must explicitly cite goal/patterns/past priorities when memory is provided, or say "No prior context — net-new item."
- Secondary = useful but not today. Ignore = noise/defer.
- Action plan = concrete next step + realistic time estimate per top priority.`;

const PRIORITY_LEVEL = {
  type: Type.STRING,
  enum: ["High", "Medium", "Low"],
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  required: ["topPriorities", "secondary", "ignore", "actionPlan"],
  properties: {
    topPriorities: {
      type: Type.ARRAY,
      maxItems: 3,
      items: {
        type: Type.OBJECT,
        required: ["task", "impact", "urgency", "effort", "reasoning", "memoryInfluence"],
        properties: {
          task: { type: Type.STRING },
          impact: PRIORITY_LEVEL,
          urgency: PRIORITY_LEVEL,
          effort: PRIORITY_LEVEL,
          reasoning: { type: Type.STRING },
          memoryInfluence: { type: Type.STRING },
        },
      },
    },
    secondary: { type: Type.ARRAY, items: { type: Type.STRING } },
    ignore: { type: Type.ARRAY, items: { type: Type.STRING } },
    actionPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["task", "nextStep", "timeEstimate"],
        properties: {
          task: { type: Type.STRING },
          nextStep: { type: Type.STRING },
          timeEstimate: { type: Type.STRING },
        },
      },
    },
  },
};

export interface AnalyzeRequest {
  input: string;
  memory: Memory;
  useMemory: boolean;
}

export async function analyze(
  body: AnalyzeRequest,
  apiKey: string
): Promise<AnalysisResult> {
  const { input, memory, useMemory } = body;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY on the server");
  }
  if (!input || typeof input !== "string" || !input.trim()) {
    throw new Error("Input is required");
  }

  const ai = new GoogleGenAI({ apiKey });

  const memoryBlock = useMemory && memory
    ? `Memory context:
- Goal: ${memory.userProfile?.goal || "(not set)"}
- Recurring patterns: ${memory.patterns?.join(", ") || "(none yet)"}
- Past priorities: ${memory.pastPriorities?.slice(0, 5).join(" | ") || "(none yet)"}
- Frequently ignored: ${memory.ignoredTasks?.slice(0, 5).join(" | ") || "(none yet)"}`
    : "Memory disabled — analyze without prior context.";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${memoryBlock}\n\nInput to analyze:\n${input}`,
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("AI returned an empty response");
  }

  let data: Omit<AnalysisResult, "id" | "timestamp">;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("AI returned malformed JSON");
  }

  return {
    id: Math.random().toString(36).slice(2, 9),
    timestamp: new Date().toISOString(),
    ...data,
  };
}
