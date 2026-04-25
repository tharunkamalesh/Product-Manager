# Task: Wire up real Claude AI (1-hour sprint)

**Owner:** Developer
**Estimated time:** 1 hour
**Priority:** P0 — blocks the rest of the sprint

---

## Goal

Replace the keyword heuristic in `src/lib/analyzer.ts` with a real Claude API call that returns structured `AnalysisResult` JSON.

The function signature stays the same — only the body changes — so the rest of the app does not need touching.

---

## Files involved

| File | Change |
|---|---|
| `src/lib/analyzer.ts` | Replace `analyzeInput` body. Keep `extractPatterns` export unchanged. |
| `src/types/copilot.ts` | Defines the response shape. **Do not change.** |
| `.env.local` | New file. Holds the API key. Must be gitignored. |
| `package.json` | Add `@anthropic-ai/sdk`. |

---

## Time budget

| Step | Minutes |
|---|---|
| 1. Setup | 5 |
| 2. Implement `analyzeInput` | 35 |
| 3. Smoke test with 3 inputs | 15 |
| 4. Build + commit | 5 |
| **Total** | **60** |

---

## Step 1 — Setup (5 min)

Install the SDK:

```bash
npm install @anthropic-ai/sdk
```

Create `.env.local` in the project root with the API key (will be provided separately):

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Confirm `.env.local` is listed in `.gitignore` before continuing. **Do not commit the key.**

---

## Step 2 — Implement `analyzeInput` (35 min)

Use **tool use** with a JSON schema mirroring the `AnalysisResult` type. Forcing the model to call a tool gives structured output without parsing freeform text.

Replace the body of `analyzeInput` in `src/lib/analyzer.ts` with the implementation below. Keep the existing `extractPatterns` export — `src/hooks/useMemory.ts` depends on it.

```ts
import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult, Memory } from "@/types/copilot";

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // SPRINT-ONLY — move to Edge Function before deploy
});

const SYSTEM = `You are an AI decision engine for early-stage founders and product managers.
Given messy daily input (Slack, email, Jira, notes) + optional memory context, you return prioritized actions.
Rules:
- Pick at most 3 top priorities. Score each on impact, urgency, effort.
- Reasoning must reference actual content from the input, not generic advice.
- memoryInfluence must explicitly cite goal/patterns/past priorities when memory is provided, or say "No prior context — net-new item."
- Secondary = useful but not today. Ignore = noise/defer.
- Action plan = concrete next step + realistic time estimate per top priority.`;

const TOOL = {
  name: "return_analysis",
  description: "Return the structured analysis result.",
  input_schema: {
    type: "object",
    required: ["topPriorities", "secondary", "ignore", "actionPlan"],
    properties: {
      topPriorities: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          required: ["task", "impact", "urgency", "effort", "reasoning", "memoryInfluence"],
          properties: {
            task: { type: "string" },
            impact: { type: "string", enum: ["High", "Medium", "Low"] },
            urgency: { type: "string", enum: ["High", "Medium", "Low"] },
            effort: { type: "string", enum: ["High", "Medium", "Low"] },
            reasoning: { type: "string" },
            memoryInfluence: { type: "string" },
          },
        },
      },
      secondary: { type: "array", items: { type: "string" } },
      ignore: { type: "array", items: { type: "string" } },
      actionPlan: {
        type: "array",
        items: {
          type: "object",
          required: ["task", "nextStep", "timeEstimate"],
          properties: {
            task: { type: "string" },
            nextStep: { type: "string" },
            timeEstimate: { type: "string" },
          },
        },
      },
    },
  },
} as const;

export async function analyzeInput(
  input: string,
  memory: Memory,
  useMemory: boolean
): Promise<AnalysisResult> {
  const memoryBlock = useMemory
    ? `Memory context:
- Goal: ${memory.userProfile.goal || "(not set)"}
- Recurring patterns: ${memory.patterns.join(", ") || "(none yet)"}
- Past priorities: ${memory.pastPriorities.slice(0, 5).join(" | ") || "(none yet)"}
- Frequently ignored: ${memory.ignoredTasks.slice(0, 5).join(" | ") || "(none yet)"}`
    : "Memory disabled — analyze without prior context.";

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "return_analysis" },
    messages: [
      {
        role: "user",
        content: `${memoryBlock}\n\nInput to analyze:\n${input}`,
      },
    ],
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("AI did not return structured output");
  }
  const data = toolUse.input as Omit<AnalysisResult, "id" | "timestamp">;

  return {
    id: Math.random().toString(36).slice(2, 9),
    timestamp: new Date().toISOString(),
    ...data,
  };
}
```

---

## Step 3 — Smoke test (15 min)

Run the dev server:

```bash
npm run dev
```

Paste each of these into the dashboard input and verify the output:

### Test 1 — Mixed urgency

**Input:** `"checkout broken on android, also q3 deck due friday, redesign logo color"`

**Expect:** checkout = High, deck = Medium or High, logo = Ignore.

### Test 2 — Goal alignment

1. Set a goal in the right rail: `"reach 1000 users by Q3"`
2. Paste: `"investor follow-up email, fix login bug, water plants"`

**Expect:** `memoryInfluence` on the investor item should reference the goal (1000 users / fundraise).

### Test 3 — Empty memory

**Input:** `"meeting with sara at 3pm, refactor auth module, ship pricing page"`

**Expect:** 3 sensible priorities, no errors when memory is empty.

If reasoning sounds generic ("important task, prioritize accordingly"), tighten the `SYSTEM` prompt and rerun.

---

## Step 4 — Build + commit (5 min)

```bash
npm run build
```

Must compile clean — no TypeScript errors.

Then commit (do **not** push — see security note):

```bash
git add src/lib/analyzer.ts package.json package-lock.json
git commit -m "feat: replace keyword heuristic with Claude API for real AI prioritization"
```

---

## Acceptance criteria

- [ ] Pasting real text produces priorities that quote actual content from the input
- [ ] `memoryInfluence` cites the user's goal when goal is set and memory toggle is on
- [ ] No TypeScript errors on `npm run build`
- [ ] Loading spinner ("Thinking...") still works — typical response time 2–5s
- [ ] Toggling "Use Memory" off in the right rail produces noticeably more generic output

---

## Security note — IMPORTANT

`dangerouslyAllowBrowser: true` exposes the API key in the browser bundle. **Acceptable for local dev only.**

Before deploying to Vercel, the call must move to a server-side Edge Function at `/api/analyze`. That is a separate task scheduled for Day 9 of the sprint.

**Do not push this commit to a public repository until that migration is done, or invalidate and rotate the key first.**

---

## Common blockers

| Issue | Fix |
|---|---|
| `429 rate limit` from Anthropic | Retry once with 2s delay; show `toast.error("Try again in a few seconds")` |
| Tool call missing in response | Rare when `tool_choice` is forced. If it happens, log `response.content` and look for a refusal message in a `text` block. |
| TypeScript: `toolUse.input` is `unknown` | Cast as shown above: `as Omit<AnalysisResult, "id" \| "timestamp">` |
| `Cannot find module '@anthropic-ai/sdk'` | Re-run `npm install` and restart the dev server |
| API key not loaded | Vite only reads `VITE_*` prefixed env vars. Restart dev server after editing `.env.local`. |

---

## Out of scope for this hour

- Streaming responses (Day 8 polish)
- Edge Function migration (Day 9)
- Prompt caching for memory block (Day 8 — optimization)
- Retry logic beyond a single 429 retry (Day 8)
- Replacing mock data in Insights, RightRail trends, Priority card meta (Days 3–4)
