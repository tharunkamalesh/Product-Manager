import { useCallback, useEffect, useState } from "react";
import type { AnalysisResult, InboxItem, InboxStatus, HistorySession } from "@/types/copilot";
import {
  fetchHistory,
  saveAnalysis,
  fetchInbox,
  addInboxItem,
  updateInboxItemText,
  setInboxItemStatus,
  deleteInboxItem,
} from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";

const LATEST_KEY = "pm-daily-copilot:latest:v1";

export function useCopilot() {
  const { user } = useAuth();
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [latestResult, setLatestResult] = useState<AnalysisResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const rawLatest = localStorage.getItem(LATEST_KEY);
        if (rawLatest) setLatestResult(JSON.parse(rawLatest));

        setLoading(true);
        const [firestoreHistory, firestoreInbox] = await Promise.all([
          fetchHistory(),
          user ? fetchInbox(user.uid) : Promise.resolve([] as InboxItem[]),
        ]);
        setHistory(firestoreHistory);
        setInbox(firestoreInbox);
      } catch (e) {
        console.error("Failed to hydrate copilot state", e);
      } finally {
        setLoading(false);
        setHydrated(true);
      }
    };
    init();
  }, [user]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LATEST_KEY, JSON.stringify(latestResult));
  }, [latestResult, hydrated]);

  const addToInbox = useCallback(
    async (text: string) => {
      if (!user) throw new Error("Not signed in");
      const id = await addInboxItem(user.uid, text);
      const newItem: InboxItem = {
        id,
        text,
        timestamp: new Date().toISOString(),
        status: "pending",
      };
      setInbox((prev) => [newItem, ...prev]);
      return id;
    },
    [user]
  );

  const removeFromInbox = useCallback(async (id: string) => {
    await deleteInboxItem(id);
    setInbox((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const editInboxItem = useCallback(async (id: string, text: string) => {
    await updateInboxItemText(id, text);
    setInbox((prev) => prev.map((item) => (item.id === id ? { ...item, text } : item)));
  }, []);

  const setInboxStatus = useCallback(async (id: string, status: InboxStatus) => {
    await setInboxItemStatus(id, status);
    setInbox((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              ...(status === "processed" ? { processedAt: new Date().toISOString() } : {}),
            }
          : item
      )
    );
  }, []);

  const saveToHistory = useCallback(
    async (result: AnalysisResult, input: string) => {
      try {
        const firestoreId = await saveAnalysis(input, result);
        const session: HistorySession = {
          id: firestoreId || result.id,
          inputSummary: input.slice(0, 60) + (input.length > 60 ? "..." : ""),
          topPriority: result.topPriorities[0]?.task || "No tasks",
          result: { ...result, id: firestoreId || result.id },
          timestamp: result.timestamp,
        };
        setHistory((prev) => [session, ...prev].slice(0, 50));
        setLatestResult(result);
      } catch (error) {
        console.error("Failed to save to history:", error);
      }
    },
    []
  );

  const clearHistory = useCallback(() => {
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
    editInboxItem,
    setInboxStatus,
    saveToHistory,
    clearHistory,
    refreshHistory,
    hydrated,
    loading,
  };
}
