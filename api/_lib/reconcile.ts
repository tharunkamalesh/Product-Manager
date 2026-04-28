import type { Verdict } from "../../src/types/copilot";

export function buildCalibrationNote(verdicts: Verdict[]): string {
  if (!verdicts || verdicts.length < 3) return "";
  const recent = verdicts.slice(-20);
  const misses = recent.filter((v) => v.verdict !== "right");
  if (misses.length === 0) return "Recent calibration: all predictions on track.";
  const lines = misses.slice(0, 3).map((v) => `- ${v.modelNote}`);
  return `Self-calibration (your last ${recent.length} calls graded against reality):\n${lines.join("\n")}`;
}
