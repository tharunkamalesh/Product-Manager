import { useCallback, useEffect, useState } from "react";
import type { AnalysisResult, Memory } from "@/types/copilot";
import { extractPatterns } from "@/lib/analyzer";

const STORAGE_KEY = "pm-daily-copilot:memory:v1";

const defaultMemory: Memory = {
  userProfile: { goal: "" },
  pastPriorities: [],
  patterns: [],
  ignoredTasks: [],
};

export function useMemory() {
  const [memory, setMemory] = useState<Memory>(defaultMemory);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMemory({ ...defaultMemory, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch {
      // ignore
    }
  }, [memory, hydrated]);

  const setGoal = useCallback((goal: string) => {
    setMemory((m) => ({ ...m, userProfile: { goal } }));
  }, []);

  const ingestResult = useCallback((result: AnalysisResult) => {
    setMemory((m) => {
      const newPast = [
        ...result.topPriorities.map((p) => p.task),
        ...m.pastPriorities,
      ].slice(0, 5);
      const newIgnored = [...result.ignore, ...m.ignoredTasks].slice(0, 10);
      const patterns = extractPatterns([...newPast, ...newIgnored]);
      return {
        ...m,
        pastPriorities: newPast,
        ignoredTasks: newIgnored,
        patterns,
      };
    });
  }, []);

  const clearMemory = useCallback(() => {
    setMemory(defaultMemory);
  }, []);

  return { memory, setGoal, ingestResult, clearMemory, hydrated };
}
