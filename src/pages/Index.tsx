import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { InputPanel } from "@/components/InputPanel";
import { OutputPanel } from "@/components/OutputPanel";
import { MemoryPanel } from "@/components/MemoryPanel";
import { useMemory } from "@/hooks/useMemory";
import { analyzeInput } from "@/lib/analyzer";
import type { AnalysisResult } from "@/types/copilot";
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

  return (
    <div className="min-h-screen bg-background relative">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
      <div className="relative">
        <AppHeader />

        <main className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 lg:py-8">
          <div className="mb-6 lg:mb-8">
            <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">
              What should you do <span className="bg-gradient-primary bg-clip-text text-transparent">today</span>?
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
              Drop your messy thoughts. Get a prioritized plan with reasoning in under 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
            {/* Memory (top on mobile, left rail on desktop) */}
            <div className="lg:col-span-3 order-1 lg:order-1">
              <MemoryPanel
                memory={memory}
                useMemory={useMemoryToggle}
                onToggleUseMemory={setUseMemoryToggle}
                onSetGoal={setGoal}
                onClear={clearMemory}
              />
            </div>

            {/* Input */}
            <div className="lg:col-span-4 order-2 lg:order-2 min-h-[480px]">
              <InputPanel
                value={input}
                onChange={setInput}
                onAnalyze={handleAnalyze}
                loading={loading}
              />
            </div>

            {/* Output */}
            <div className="lg:col-span-5 order-3 lg:order-3 min-h-[480px] lg:max-h-[calc(100vh-180px)]">
              <OutputPanel result={result} loading={loading} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
