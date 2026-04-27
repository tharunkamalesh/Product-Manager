import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useCopilot } from "@/hooks/useCopilot";
import { Button } from "@/components/ui/button";
import { ListChecks, Copy, Check, Clock, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const parseTask = (raw: string): { key: string | null; title: string } => {
  const text = (raw || "").trim();
  const m = text.match(/^([A-Z][A-Z0-9]{1,9}-\d+)(?:\s*\([^)]*\))?\s*[—\-:]\s*(.+)$/);
  if (m) return { key: m[1], title: m[2].trim() };
  return { key: null, title: text };
};

const ActionPlan = () => {
  const { latestResult } = useCopilot();
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setCompleted({});
    setExpanded({});
  }, [latestResult]);

  const steps = latestResult?.actionPlan ?? [];
  const doneCount = Object.values(completed).filter(Boolean).length;
  const progressPercent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  const remaining = useMemo(
    () => steps.filter((_, i) => !completed[i]).map((s) => s.timeEstimate).filter(Boolean).join(" + "),
    [steps, completed]
  );

  const handleCopy = () => {
    if (!steps.length) return;
    const text = steps
      .map((s, i) => `${completed[i] ? "[x]" : "[ ]"} ${i + 1}. ${s.task}\n   Next: ${s.nextStep} (~${s.timeEstimate})`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Action plan copied");
  };

  const toggleComplete = (i: number) => setCompleted((prev) => ({ ...prev, [i]: !prev[i] }));
  const toggleExpanded = (i: number) => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-8 py-6 max-w-[1100px] mx-auto">
          {/* Page header */}
          <div className="flex items-end justify-between mb-6 gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Projects / Founder's Compass
              </p>
              <h1 className="text-[22px] font-semibold tracking-tight mt-1">Action plan</h1>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!steps.length}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy plan
            </Button>
          </div>

          {/* Card */}
          <div className="rounded-md border border-border bg-card overflow-hidden">
            {/* Stats header */}
            {steps.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3 text-[11.5px]">
                  <span className="text-muted-foreground">
                    <span className="tabular-nums font-semibold text-foreground">{doneCount}</span>
                    <span className="text-muted-foreground/60"> of </span>
                    <span className="tabular-nums font-semibold text-foreground">{steps.length}</span>
                    <span className="text-muted-foreground/60"> done</span>
                  </span>
                  {remaining && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {remaining} remaining
                      </span>
                    </>
                  )}
                </div>
                <span className="text-[11.5px] tabular-nums text-muted-foreground">{progressPercent}%</span>
              </div>
            )}

            {/* Progress bar */}
            {steps.length > 0 && (
              <div className="h-0.5 w-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Rows */}
            {steps.length === 0 ? (
              <div className="text-center py-20">
                <ListChecks className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-[12.5px] text-muted-foreground">
                  No action plan yet. Run an analysis on the dashboard first.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {steps.map((step, i) => {
                  const isDone = !!completed[i];
                  const isOpen = !!expanded[i];
                  const { key, title } = parseTask(step.task);
                  return (
                    <li
                      key={i}
                      className={cn(
                        "transition-colors",
                        isDone ? "bg-muted/20" : "hover:bg-muted/30"
                      )}
                    >
                      <div className="grid grid-cols-[20px_56px_1fr_auto_28px] items-center gap-3 px-4 py-2.5">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleComplete(i)}
                          aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                          className={cn(
                            "h-4 w-4 rounded-sm border flex items-center justify-center transition-colors",
                            isDone
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border bg-card hover:border-primary"
                          )}
                        >
                          {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
                        </button>

                        {/* Step number */}
                        <span className="text-[10.5px] font-mono text-muted-foreground/70 tabular-nums">
                          Step {i + 1}
                        </span>

                        {/* Task */}
                        <button
                          onClick={() => toggleExpanded(i)}
                          className={cn(
                            "min-w-0 text-left text-[13px] truncate transition-colors",
                            isDone ? "text-muted-foreground line-through" : "text-foreground hover:text-primary"
                          )}
                        >
                          {key && (
                            <span className="font-mono text-[11.5px] text-muted-foreground/80 mr-2">
                              {key}
                            </span>
                          )}
                          <span className={cn("font-medium", isDone && "font-normal")}>{title}</span>
                        </button>

                        {/* Estimate */}
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums shrink-0">
                          <Clock className="h-3 w-3" />
                          {step.timeEstimate}
                        </span>

                        {/* Expand caret */}
                        <button
                          onClick={() => toggleExpanded(i)}
                          aria-label={isOpen ? "Collapse" : "Expand"}
                          className="h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <ChevronRight
                            className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")}
                          />
                        </button>
                      </div>

                      {/* Expanded detail */}
                      {isOpen && (
                        <div className="pl-[88px] pr-12 pb-3 -mt-1">
                          <div className="border-l-2 border-primary/30 pl-3 py-1">
                            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                              Next step
                            </div>
                            <p className="text-[12.5px] text-foreground/90 leading-relaxed">
                              {step.nextStep}
                            </p>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ActionPlan;
