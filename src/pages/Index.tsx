import { useState, useMemo } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { InputBar } from "@/components/dashboard/InputBar";
import { PriorityBoard } from "@/components/dashboard/PriorityBoard";
import { ActionPlanCard } from "@/components/dashboard/ActionPlanCard";
import { RightRail } from "@/components/dashboard/RightRail";
import { useMemory } from "@/hooks/useMemory";
import { analyzeInput } from "@/lib/analyzer";
import type { AnalysisResult, Priority } from "@/types/copilot";
import { toast } from "sonner";

const Index = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [useMemoryToggle, setUseMemoryToggle] = useState(true);
  const { memory, setGoal, ingestResult, clearMemory } = useMemory();

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await analyzeInput(input, memory, useMemoryToggle);
      setResult(res);
      ingestResult(res);
    } catch (e) {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Bucket all items into High / Medium / Low for the 3-column board
  const { high, medium, low } = useMemo(() => {
    const buckets = { high: [] as Priority[], medium: [] as Priority[], low: [] as Priority[] };
    if (!result) return buckets;

    // Top priorities are richly typed already
    for (const p of result.topPriorities) {
      const key = p.impact.toLowerCase() as "high" | "medium" | "low";
      buckets[key].push(p);
    }
    // Secondary → medium with sensible defaults
    for (const s of result.secondary) {
      buckets.medium.push({
        task: s,
        impact: "Medium",
        urgency: "Medium",
        effort: "Medium",
        reasoning: "Secondary task — handle after top priorities.",
        memoryInfluence: "",
      });
    }
    // Ignored → low
    for (const s of result.ignore) {
      buckets.low.push({
        task: s,
        impact: "Low",
        urgency: "Low",
        effort: "Low",
        reasoning: "Defer — low signal, low leverage.",
        memoryInfluence: "",
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
