import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useCopilot } from "@/hooks/useCopilot";
import { Button } from "@/components/ui/button";
import { ListChecks, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const ActionPlan = () => {
  const { latestResult } = useCopilot();
  const [completed, setCompleted] = useState<Record<number, boolean>>({});

  const handleCopy = () => {
    if (!latestResult) return;
    const text = latestResult.actionPlan
      .map((s, i) => `${i + 1}. ${s.task} -> ${s.nextStep} (${s.timeEstimate})`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Action plan copied to clipboard");
  };

  const toggleComplete = (i: number) => {
    setCompleted(prev => ({ ...prev, [i]: !prev[i] }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-5 py-5 max-w-4xl mx-auto">
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">✅ Action Plan</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                The execution layer. Focus on these concrete next steps.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!latestResult}>
              <Copy className="h-3.5 w-3.5 mr-2" />
              Copy Plan
            </Button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!latestResult || latestResult.actionPlan.length === 0 ? (
              <div className="col-span-full text-center py-20 border border-dashed rounded-2xl">
                <ListChecks className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">No action plan generated. Run an analysis on the dashboard first.</p>
              </div>
            ) : (
              latestResult.actionPlan.map((step, i) => (
                <div 
                  key={i} 
                  className={`p-5 rounded-2xl border bg-card shadow-sm transition-all duration-300 ${completed[i] ? 'opacity-60 bg-muted/50' : 'hover:shadow-md'}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className={`text-sm font-bold leading-tight ${completed[i] ? 'line-through' : ''}`}>
                      {step.task}
                    </h3>
                    <button 
                      onClick={() => toggleComplete(i)}
                      className={`shrink-0 h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${completed[i] ? 'bg-primary border-primary text-white' : 'border-border'}`}
                    >
                      {completed[i] && <CheckCircle className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Next Step</label>
                      <p className="text-sm mt-1 font-medium">{step.nextStep}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        <span className="font-semibold uppercase text-[9px] tracking-tight">Estimate:</span>
                        {step.timeEstimate}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ActionPlan;
