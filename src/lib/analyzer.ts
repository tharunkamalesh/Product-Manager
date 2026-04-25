import type { AnalysisResult, Memory, Impact } from "@/types/copilot";

const STOPWORDS = new Set([
  "the","a","an","and","or","but","is","are","was","were","be","been","being",
  "have","has","had","do","does","did","will","would","could","should","may",
  "might","must","shall","can","need","want","to","of","in","on","at","by",
  "for","with","about","as","into","like","through","after","over","between",
  "out","against","during","without","before","under","around","among","i",
  "we","you","they","it","this","that","these","those","my","our","your",
  "their","its","not","no","so","if","then","than","just","also","very",
  "really","up","down","off","more","most","some","any","all","each","every",
  "from","get","got","make","made","take","taken","go","went","ok","okay",
]);

const HIGH_IMPACT_KW = ["revenue","payment","churn","retention","launch","customer","user","conversion","critical","crash","bug","outage","security","legal","compliance","investor","fundraise","ship","release"];
const URGENT_KW = ["today","asap","urgent","now","tomorrow","critical","crash","outage","broken","blocker","deadline"];
const LOW_VALUE_KW = ["nice to have","maybe","someday","explore","research","look into","redesign logo","color","font","tweak","minor"];

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w && w.length > 2 && !STOPWORDS.has(w));
}

function splitItems(input: string): string[] {
  return input
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z])|(?:^|\s)[-*•]\s+|;\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

function scoreItem(item: string, memory: Memory): { impact: Impact; urgency: Impact; effort: Impact; total: number; matchedHigh: string[]; matchedUrgent: string[]; matchedLow: string[] } {
  const lc = item.toLowerCase();
  const matchedHigh = HIGH_IMPACT_KW.filter((k) => lc.includes(k));
  const matchedUrgent = URGENT_KW.filter((k) => lc.includes(k));
  const matchedLow = LOW_VALUE_KW.filter((k) => lc.includes(k));

  const impact: Impact = matchedHigh.length >= 2 ? "High" : matchedHigh.length === 1 ? "High" : matchedLow.length ? "Low" : "Medium";
  const urgency: Impact = matchedUrgent.length ? "High" : matchedLow.length ? "Low" : "Medium";

  // Effort heuristic: long sentences or words like "redesign","build","migrate" → high
  const effortKw = ["redesign","rebuild","migrate","refactor","overhaul","research","investigate"];
  const isLargeEffort = effortKw.some((k) => lc.includes(k)) || item.length > 140;
  const isSmallEffort = item.length < 50 && !isLargeEffort;
  const effort: Impact = isLargeEffort ? "High" : isSmallEffort ? "Low" : "Medium";

  const goalBonus = memory.userProfile.goal
    ? tokenize(memory.userProfile.goal).filter((w) => lc.includes(w)).length * 1.5
    : 0;
  const patternBonus = memory.patterns.filter((p) => lc.includes(p)).length;

  const impactScore = impact === "High" ? 3 : impact === "Medium" ? 2 : 1;
  const urgencyScore = urgency === "High" ? 3 : urgency === "Medium" ? 2 : 1;
  const effortPenalty = effort === "High" ? 1 : effort === "Medium" ? 0.5 : 0;

  const total = impactScore * 2 + urgencyScore + goalBonus + patternBonus - effortPenalty;

  return { impact, urgency, effort, total, matchedHigh, matchedUrgent, matchedLow };
}

function buildReasoning(s: ReturnType<typeof scoreItem>): string {
  const bits: string[] = [];
  if (s.matchedHigh.length) bits.push(`high-leverage signal (${s.matchedHigh.slice(0, 2).join(", ")})`);
  if (s.matchedUrgent.length) bits.push(`time-sensitive (${s.matchedUrgent[0]})`);
  if (s.effort === "Low") bits.push("low effort to ship");
  if (s.effort === "High") bits.push("non-trivial effort — scope before committing");
  if (!bits.length) bits.push("balanced trade-off across impact and effort");
  return bits.join("; ") + ".";
}

function buildMemoryInfluence(item: string, memory: Memory): string {
  const lc = item.toLowerCase();
  const goalWords = memory.userProfile.goal ? tokenize(memory.userProfile.goal) : [];
  const goalHit = goalWords.filter((w) => lc.includes(w));
  const patternHit = memory.patterns.filter((p) => lc.includes(p));
  const pastHit = memory.pastPriorities.find((p) => {
    const tokens = tokenize(p);
    return tokens.some((t) => lc.includes(t));
  });

  const parts: string[] = [];
  if (goalHit.length) parts.push(`aligned with goal (${goalHit.slice(0, 2).join(", ")})`);
  if (patternHit.length) parts.push(`recurring theme: ${patternHit[0]}`);
  if (pastHit) parts.push(`echoes past priority`);
  return parts.length ? parts.join(" · ") : "No prior context — net-new item.";
}

function nextStepFor(item: string): { step: string; time: string } {
  const lc = item.toLowerCase();
  if (lc.includes("bug") || lc.includes("crash") || lc.includes("broken"))
    return { step: "Reproduce, isolate, ship a hotfix", time: "1–2h" };
  if (lc.includes("customer") || lc.includes("user") || lc.includes("feedback"))
    return { step: "Talk to 3 users, capture verbatims", time: "45m" };
  if (lc.includes("launch") || lc.includes("ship") || lc.includes("release"))
    return { step: "Draft launch checklist, lock the date", time: "30m" };
  if (lc.includes("write") || lc.includes("draft") || lc.includes("post"))
    return { step: "Outline first, then 25-min focused draft", time: "30m" };
  if (lc.includes("meeting") || lc.includes("call"))
    return { step: "Define the one decision needed, send agenda", time: "15m" };
  return { step: "Define the smallest shippable next step", time: "30m" };
}

export async function analyzeInput(
  input: string,
  memory: Memory,
  useMemory: boolean
): Promise<AnalysisResult> {
  // Simulate latency for "Thinking..." UX
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));

  const activeMemory: Memory = useMemory
    ? memory
    : { userProfile: { goal: "" }, pastPriorities: [], patterns: [], ignoredTasks: [] };

  const items = splitItems(input);
  if (!items.length) {
    return { topPriorities: [], secondary: [], ignore: [], actionPlan: [] };
  }

  const scored = items.map((item) => ({ item, ...scoreItem(item, activeMemory) }));
  scored.sort((a, b) => b.total - a.total);

  const top = scored.slice(0, Math.min(3, scored.length));
  const remaining = scored.slice(top.length);

  const ignore = remaining
    .filter((s) => s.matchedLow.length || s.total < 2.5)
    .map((s) => s.item);
  const secondary = remaining
    .filter((s) => !ignore.includes(s.item))
    .map((s) => s.item);

  const topPriorities = top.map((s) => ({
    task: s.item,
    impact: s.impact,
    urgency: s.urgency,
    effort: s.effort,
    reasoning: buildReasoning(s),
    memoryInfluence: buildMemoryInfluence(s.item, activeMemory),
  }));

  const actionPlan = top.map((s) => {
    const ns = nextStepFor(s.item);
    return { task: s.item, nextStep: ns.step, timeEstimate: ns.time };
  });

  return {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    topPriorities,
    secondary,
    ignore,
    actionPlan,
  };
}

export function extractPatterns(history: string[]): string[] {
  const counts = new Map<string, number>();
  for (const line of history) {
    for (const w of tokenize(line)) counts.set(w, (counts.get(w) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}
