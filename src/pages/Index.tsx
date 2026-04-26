import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { InputBar } from "@/components/dashboard/InputBar";
import { PriorityBoard } from "@/components/dashboard/PriorityBoard";
import { ActionPlanCard } from "@/components/dashboard/ActionPlanCard";
import { RightRail } from "@/components/dashboard/RightRail";
import { useMemory } from "@/hooks/useMemory";
import { useCopilot } from "@/hooks/useCopilot";
import { analyzeInput } from "@/lib/analyzer";
import type { AnalysisResult, Priority } from "@/types/copilot";
import { toast } from "sonner";

const Index = () => {
  const location = useLocation();
  const { memory, setGoal, setUseMemoryToggle, ingestResult, clearMemory } = useMemory();
  const { latestResult, saveToHistory } = useCopilot();

  const [input, setInput] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(latestResult);
  const [loading, setLoading] = useState(false);
  const useMemoryToggle = memory.useMemoryToggle ?? true;

  // Sync with latest result if it changes (e.g. from history clear)
  useEffect(() => {
    setResult(latestResult);
  }, [latestResult]);

  const handleAnalyze = async (overrideInput?: string) => {
    const text = typeof overrideInput === "string" ? overrideInput : input;
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await analyzeInput(text, memory, useMemoryToggle);
      setResult(res);
      ingestResult(res);
      await saveToHistory(res, text);
      toast.success("Analysis complete");
    } catch (e) {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle analyze request from router state (from Inbox)
  useEffect(() => {
    const state = location.state as { analyze?: string };
    if (state?.analyze) {
      const text = state.analyze;
      setInput(text);
      window.history.replaceState({}, document.title);
      handleAnalyze(text);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Bucket all items into High / Medium / Low for the 3-column board
  const { high, medium, low } = useMemo(() => {
    const buckets = { high: [] as Priority[], medium: [] as Priority[], low: [] as Priority[] };
    if (!result) return buckets;

    for (const p of result.topPriorities) {
      const key = p.impact.toLowerCase() as "high" | "medium" | "low";
      buckets[key].push(p);
    }
    for (const s of result.secondary) {
      buckets.medium.push({
        task: s,
        impact: "Medium",
        urgency: "Medium",
        effort: "Medium",
        reasoning: "Secondary task — handle after top priorities.",
        memoryInfluence: "",
        category: "Other",
      });
    }
    for (const s of result.ignore) {
      buckets.low.push({
        task: s,
        impact: "Low",
        urgency: "Low",
        effort: "Low",
        reasoning: "Defer — low signal, low leverage.",
        memoryInfluence: "",
        category: "Other",
      });
    }
    return buckets;
  }, [result]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <TopBar />

        <main className="px-5 py-5">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Center column */}
            <div className="xl:col-span-9 space-y-5 min-w-0">
              <InputBar
                value={input}
                onChange={setInput}
                onAnalyze={handleAnalyze}
                loading={loading}
              />
              <PriorityBoard high={high} medium={medium} low={low} hasResult={!!result} />
              <ActionPlanCard steps={result?.actionPlan ?? []} />
            </div>

            {/* Right rail */}
            <div className="xl:col-span-3">
              <RightRail
                result={result}
                memory={memory}
                useMemory={useMemoryToggle}
                onToggleUseMemory={setUseMemoryToggle}
                onSetGoal={setGoal}
                onClear={clearMemory}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
