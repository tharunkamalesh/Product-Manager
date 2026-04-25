import type { AnalysisResult, Memory } from "@/types/copilot";

// ---------------------------------------------------------------------------
// Pattern extraction (used by useMemory.ts) — runs in the browser
// ---------------------------------------------------------------------------

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

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w && w.length > 2 && !STOPWORDS.has(w));
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

// ---------------------------------------------------------------------------
// Calls the server-side /api/analyze endpoint
// ---------------------------------------------------------------------------

export async function analyzeInput(
  input: string,
  memory: Memory,
  useMemory: boolean
): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, memory, useMemory }),
  });

  if (!response.ok) {
    let message = `Analysis failed (${response.status})`;
    try {
      const err = await response.json();
      if (err?.error) message = err.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return (await response.json()) as AnalysisResult;
}
