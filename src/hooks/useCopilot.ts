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
  const { getCompanyId } = useAuth();
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [latestResult, setLatestResult] = useState<AnalysisResult | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  const companyId = getCompanyId();

  useEffect(() => {
    if (!companyId) return;

    const init = async () => {
      try {
        const rawLatest = localStorage.getItem(`${LATEST_KEY}:${companyId}`);
        if (rawLatest) setLatestResult(JSON.parse(rawLatest));

        setLoading(true);
        console.log("[useCopilot] Fetching history and inbox for company:", companyId);
        const [firestoreHistory, firestoreInbox] = await Promise.all([
          fetchHistory(companyId),
          fetchInbox(companyId),
        ]);
        setHistory(firestoreHistory);
        setInbox(firestoreInbox);
        
        // Use first history item as latest if none in localStorage
        if (!rawLatest && firestoreHistory.length > 0) {
          setLatestResult(firestoreHistory[0].result);
        }
      } catch (e) {
        console.error("[useCopilot] Failed to hydrate copilot state", e);
      } finally {
        setLoading(false);
        setHydrated(true);
      }
    };
    init();
  }, [companyId]);

  useEffect(() => {
    if (!hydrated || !companyId) return;
    localStorage.setItem(`${LATEST_KEY}:${companyId}`, JSON.stringify(latestResult));
  }, [latestResult, hydrated, companyId]);

  const addToInbox = useCallback(
    async (text: string) => {
      if (!companyId) throw new Error("No company identified");
      const id = await addInboxItem(companyId, text);
      const newItem: InboxItem = {
        id,
        text,
        timestamp: new Date().toISOString(),
        status: "pending",
      };
      setInbox((prev) => [newItem, ...prev]);
      return id;
    },
    [companyId]
  );

  const removeFromInbox = useCallback(async (id: string) => {
    if (!companyId) return;
    await deleteInboxItem(companyId, id);
    setInbox((prev) => prev.filter((item) => item.id !== id));
  }, [companyId]);

  const editInboxItem = useCallback(async (id: string, text: string) => {
    if (!companyId) return;
    await updateInboxItemText(companyId, id, text);
    setInbox((prev) => prev.map((item) => (item.id === id ? { ...item, text } : item)));
  }, [companyId]);

  const setInboxStatus = useCallback(async (id: string, status: InboxStatus) => {
    if (!companyId) return;
    await setInboxItemStatus(companyId, id, status);
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
  }, [companyId]);

  const saveToHistory = useCallback(
    async (result: AnalysisResult, input: string) => {
      if (!companyId) return;
      try {
        const firestoreId = await saveAnalysis(companyId, input, result);
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
        console.error("[useCopilot] Failed to save to history:", error);
      }
    },
    [companyId]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    setLatestResult(null);
  }, []);

  const refreshHistory = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const firestoreHistory = await fetchHistory(companyId);
    setHistory(firestoreHistory);
    setLoading(false);
  }, [companyId]);

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
