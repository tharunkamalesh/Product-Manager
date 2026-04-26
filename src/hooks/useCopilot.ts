import { useCallback, useEffect, useState } from "react";
import type { AnalysisResult, InboxItem, HistorySession } from "@/types/copilot";
import { fetchHistory, saveAnalysis } from "@/lib/db";

const INBOX_KEY = "pm-daily-copilot:inbox:v1";
const LATEST_KEY = "pm-daily-copilot:latest:v1";

export function useCopilot() {
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [latestResult, setLatestResult] = useState<AnalysisResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const rawInbox = localStorage.getItem(INBOX_KEY);
        const rawLatest = localStorage.getItem(LATEST_KEY);

        if (rawInbox) setInbox(JSON.parse(rawInbox));
        if (rawLatest) setLatestResult(JSON.parse(rawLatest));
        
        // Fetch history from Firestore
        setLoading(true);
        const firestoreHistory = await fetchHistory();
        setHistory(firestoreHistory);
      } catch (e) {
        console.error("Failed to hydrate copilot state", e);
      } finally {
        setLoading(false);
        setHydrated(true);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(INBOX_KEY, JSON.stringify(inbox));
    localStorage.setItem(LATEST_KEY, JSON.stringify(latestResult));
  }, [inbox, latestResult, hydrated]);

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

  const saveToHistory = useCallback(async (result: AnalysisResult, input: string) => {
    try {
      // Save to Firestore
      const firestoreId = await saveAnalysis(input, result);
      
      const session: HistorySession = {
        id: firestoreId || result.id,
        inputSummary: input.slice(0, 60) + (input.length > 60 ? "..." : ""),
        topPriority: result.topPriorities[0]?.task || "No tasks",
        result: {
          ...result,
          id: firestoreId || result.id
        },
        timestamp: result.timestamp,
      };
      
      setHistory((prev) => [session, ...prev].slice(0, 50));
      setLatestResult(result);
    } catch (error) {
      console.error("Failed to save to history:", error);
    }
  }, []);

  const clearHistory = useCallback(() => {
    // Note: This only clears local state for now. 
    // In a real app, we might want a "delete all" Firestore function.
    setHistory([]);
    setLatestResult(null);
  }, []);

  const refreshHistory = useCallback(async () => {
    setLoading(true);
    const firestoreHistory = await fetchHistory();
    setHistory(firestoreHistory);
    setLoading(false);
  }, []);

  return {
    inbox,
    history,
    latestResult,
    addToInbox,
    removeFromInbox,
    saveToHistory,
    clearHistory,
    refreshHistory,
    hydrated,
    loading
  };
}
