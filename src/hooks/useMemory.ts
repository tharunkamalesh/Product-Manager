import { useCallback, useEffect, useState } from "react";
import type { AnalysisResult, Memory, Verdict } from "@/types/copilot";
import { extractPatterns } from "@/lib/analyzer";
import { fetchSettings, saveSettings, saveVerdicts } from "@/lib/db";

const STORAGE_KEY = "pm-daily-copilot:memory:v1";

const defaultMemory: Memory = {
  userProfile: { goal: "" },
  pastPriorities: [],
  patterns: [],
  ignoredTasks: [],
  useMemoryToggle: true,
  verdicts: [],
  calibration: {},
};

export function useMemory() {
  const [memory, setMemory] = useState<Memory>(defaultMemory);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const firestoreSettings = await fetchSettings();
        if (firestoreSettings) {
          setMemory({ ...defaultMemory, ...firestoreSettings });
        } else {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) setMemory({ ...defaultMemory, ...JSON.parse(raw) });
        }
      } catch {
        // fall back to defaults
      } finally {
        setHydrated(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
      saveSettings(memory);
    } catch {
      // ignore
    }
  }, [memory, hydrated]);

  const setGoal = useCallback((goal: string) => {
    setMemory((m) => ({ ...m, userProfile: { goal } }));
  }, []);

  const setUseMemoryToggle = useCallback((useMemoryToggle: boolean) => {
    setMemory((m) => ({ ...m, useMemoryToggle }));
  }, []);

  const ingestResult = useCallback((result: AnalysisResult) => {
    setMemory((m) => {
      const newPast = [
        ...result.topPriorities.map((p) => p.task),
        ...m.pastPriorities,
      ].slice(0, 5);
      const newIgnored = [...result.ignore, ...m.ignoredTasks].slice(0, 10);
      const patterns = extractPatterns([...newPast, ...newIgnored]);
      return { ...m, pastPriorities: newPast, ignoredTasks: newIgnored, patterns };
    });
  }, []);

  const ingestVerdicts = useCallback((newVerdicts: Verdict[]) => {
    setMemory((m) => {
      const existing = m.verdicts || [];
      const existingIds = new Set(existing.map((v) => v.predictionId));
      const fresh = newVerdicts.filter((v) => !existingIds.has(v.predictionId));
      const merged = [...existing, ...fresh].slice(-200);
      const calibration: Record<string, { hits: number; misses: number }> = {};
      for (const v of merged) {
        const key = v.verdict === "right" ? "hit" : "miss";
        if (!calibration[key]) calibration[key] = { hits: 0, misses: 0 };
        if (v.verdict === "right") calibration[key].hits++;
        else calibration[key].misses++;
      }
      const updated = { ...m, verdicts: merged, calibration };
      saveVerdicts(merged);
      return updated;
    });
  }, []);

  const clearMemory = useCallback(() => {
    setMemory(defaultMemory);
  }, []);

  return { memory, setGoal, setUseMemoryToggle, ingestResult, ingestVerdicts, clearMemory, hydrated };
}
