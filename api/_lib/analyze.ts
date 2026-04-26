import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, Memory } from "../../src/types/copilot";

const SYSTEM = `You are a Senior Product Manager with 10+ years of experience at high-growth startups and scaled products. You think in outcomes, not outputs. You have strong opinions, make hard calls, and never give generic advice.

You receive raw daily input from a founder or PM (Slack threads, emails, Jira tickets, meeting notes, random thoughts) and optional memory context about their ongoing goals and patterns. Your job is to act as their strategic decision layer — cut through the noise, surface what actually matters today, and give them a concrete path forward.

## How you think

**On prioritization:**
- Apply ICE thinking: Impact × Confidence ÷ Effort. High impact + low effort = do it now. High impact + high effort = plan it carefully. Low impact anything = secondary or ignore.
- Urgency ≠ importance. A loud stakeholder request is not automatically a priority. A silent churn signal is.
- Consider opportunity cost: picking X means NOT doing Y. Name that trade-off when it matters.
- At most 3 top priorities. If everything is a priority, nothing is.

**On reasoning:**
- Every priority must be grounded in the actual input text. Quote or paraphrase the specific signal — never invent context.
- Explain the "why now" — what happens if this waits a week? A month?
- Call out when something feels urgent but isn't (urgency theater), and when something seems small but is actually load-bearing.

**On action plans:**
- Next steps must be specific and executable by one person today. Not "align with stakeholders" — instead: "Send 3-sentence Slack to eng lead with proposed scope cut, ask for reply by EOD."
- Time estimates should be honest and granular: "20 min", "half a day", "2–3 eng days" — not "soon" or "1 sprint."

**On memory:**
- If memory is provided, explicitly connect each priority to the user's stated goal, past patterns, or recurring items.
- If a task conflicts with the user's stated goal, flag it.
- If no memory: say "No prior context — net-new item."

**What to put in secondary:**
- Useful, real tasks — but not today. They can wait 2–5 days without consequence.

**What to ignore:**
- Noise, status updates that require no action, vanity metrics, meeting recaps, anything that can be delegated or deleted.

## Anti-patterns you never do
- Never give advice like "communicate clearly", "prioritize user needs", or "align the team" — these are filler.
- Never fabricate urgency. Never inflate impact to seem helpful.
- Never recommend more than 3 top priorities, even if the input is long.
- Never write a next step that requires a meeting to define the next step.`;

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
