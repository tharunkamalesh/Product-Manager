import type { HistorySession, Verdict, VerdictType } from "@/types/copilot";

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000;
}

export function reconcileSessions(sessions: HistorySession[]): Verdict[] {
  const verdicts: Verdict[] = [];
  const now = new Date().toISOString();

  for (const session of sessions) {
    const ageDays = daysBetween(session.timestamp, now);
    if (ageDays < 1) continue;

    for (const priority of session.result.topPriorities) {
      const predictionId =
        priority.predictionId || `${session.id}-${priority.task.slice(0, 8)}`;
      const evidence: string[] = [];
      let verdict: VerdictType = "right";
      let delta: string | undefined;
      let modelNote = "";

      const status = priority.status || "Open";

      if (priority.urgency === "High" && status === "Open" && ageDays > 5) {
        verdict = "wrong_urgency";
        evidence.push(`status:open_${Math.floor(ageDays)}d`);
        delta = `Predicted High urgency — still open after ${Math.floor(ageDays)} days`;
        modelNote = `Over-ranked urgency on "${priority.task}". Reduce urgency confidence on similar items.`;
      } else if (
        session.result.ignore.some((i) =>
          i.toLowerCase().includes(priority.task.toLowerCase().slice(0, 8))
        )
      ) {
        verdict = "noise_call";
        evidence.push("appeared_in_ignore_but_was_prioritized");
        modelNote = `Contradictory signal on "${priority.task}" — appeared in both top priorities and ignore.`;
      } else if (status === "Closed" || status === "In Progress") {
        verdict = "right";
        evidence.push(`status:${status.toLowerCase()}`);
        modelNote = `Correct call on "${priority.task}".`;
      } else if (priority.effort === "Low" && status === "Open" && ageDays > 3) {
        verdict = "wrong_size";
        evidence.push(`effort_low_but_open_${Math.floor(ageDays)}d`);
        delta = `Predicted Low effort — still unfinished after ${Math.floor(ageDays)} days`;
        modelNote = `Under-estimated effort on "${priority.task}". Be more conservative on Low effort labels.`;
      }

      verdicts.push({
        predictionId,
        sessionId: session.id,
        task: priority.task,
        verdict,
        delta,
        evidence,
        reconciledAt: now,
        modelNote,
      });
    }
  }

  return verdicts;
}

export function buildCalibrationNote(verdicts: Verdict[]): string {
  if (verdicts.length < 3) return "";
  const recent = verdicts.slice(-20);
  const misses = recent.filter((v) => v.verdict !== "right");
  if (misses.length === 0) return "Recent calibration: all predictions on track.";
  const lines = misses.slice(0, 3).map((v) => `- ${v.modelNote}`);
  return `Self-calibration (your last ${recent.length} calls graded against reality):\n${lines.join("\n")}`;
}
