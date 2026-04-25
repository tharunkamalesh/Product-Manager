import { useCallback, useEffect, useState } from "react";
import type { AnalysisResult, InboxItem, HistorySession, Priority } from "@/types/copilot";

const INBOX_KEY = "pm-daily-copilot:inbox:v1";
const HISTORY_KEY = "pm-daily-copilot:history:v1";
const LATEST_KEY = "pm-daily-copilot:latest:v1";

export function useCopilot() {
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [latestResult, setLatestResult] = useState<AnalysisResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawInbox = localStorage.getItem(INBOX_KEY);
      const rawHistory = localStorage.getItem(HISTORY_KEY);
      const rawLatest = localStorage.getItem(LATEST_KEY);

      if (rawInbox) setInbox(JSON.parse(rawInbox));
      if (rawHistory) setHistory(JSON.parse(rawHistory));
      if (rawLatest) setLatestResult(JSON.parse(rawLatest));
    } catch (e) {
      console.error("Failed to hydrate copilot state", e);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(INBOX_KEY, JSON.stringify(inbox));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    localStorage.setItem(LATEST_KEY, JSON.stringify(latestResult));
  }, [inbox, history, latestResult, hydrated]);

  const addToInbox = useCallback((text: string) => {
    const newItem: InboxItem = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      timestamp: new Date().toISOString(),
    };
    setInbox((prev) => [newItem, ...prev]);
  }, []);

  const removeFromInbox = useCallback((id: string) => {
    setInbox((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const saveToHistory = useCallback((result: AnalysisResult, inputSummary: string) => {
    const session: HistorySession = {
      id: result.id,
      inputSummary,
      topPriority: result.topPriorities[0]?.task || "No tasks",
      result,
      timestamp: result.timestamp,
    };
    setHistory((prev) => [session, ...prev].slice(0, 50));
    setLatestResult(result);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setLatestResult(null);
  }, []);

  return {
    inbox,
    history,
    latestResult,
    addToInbox,
    removeFromInbox,
    saveToHistory,
    clearHistory,
    hydrated,
  };
}
