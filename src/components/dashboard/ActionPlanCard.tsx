import { useEffect, useMemo, useState } from "react";
import { Copy, Clock, Check, ChevronRight } from "lucide-react";
import type { ActionStep } from "@/types/copilot";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActionPlanCardProps {
  steps: ActionStep[];
}

const ASSIGNEES = ["Dev Team", "DevOps", "Support Team", "Product", "QA Team"];

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const ActionPlanCard = ({ steps }: ActionPlanCardProps) => {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [assignees, setAssignees] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const doneCount = Object.values(done).filter(Boolean).length;
  const progressPercent = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;

  const totalEstimate = useMemo(() => {
    return steps
      .filter((_, i) => !done[i])
      .map((s) => s.timeEstimate)
      .filter(Boolean)
      .join(" + ");
  }, [steps, done]);

  useEffect(() => {
    setDone({});
    setAssignees({});
    setExpanded({});
  }, [steps]);

  const handleCopy = () => {
    if (!steps.length) return;
    const text = steps
      .map((s, i) => {
        const owner = assignees[i] ?? ASSIGNEES[i % ASSIGNEES.length];
        const tick = done[i] ? "[x]" : "[ ]";
        return `${tick} ${i + 1}. ${s.task}\n   Owner: ${owner} · Next: ${s.nextStep} (~${s.timeEstimate})`;
      })
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Action plan copied");
  };

  const toggleDone = (i: number) => setDone((prev) => ({ ...prev, [i]: !prev[i] }));
  const toggleExpanded = (i: number) => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));
  const setAssignee = (i: number, name: string) => {
    setAssignees((prev) => ({ ...prev, [i]: name }));
    toast.success(`Assigned step ${i + 1} to ${name}`);
  };

  return (
    <section id="action-plan" className="rounded-md border border-border bg-card">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-[13px] font-semibold">Action plan</h2>
          {steps.length > 0 && (
            <span className="text-[11.5px] text-muted-foreground">
              <span className="tabular-nums font-medium text-foreground">{doneCount}</span>
              <span className="text-muted-foreground/60"> of </span>
              <span className="tabular-nums font-medium text-foreground">{steps.length}</span>
              <span className="text-muted-foreground/60"> done</span>
              {totalEstimate && (
                <>
                  <span className="text-muted-foreground/40 mx-1.5">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {totalEstimate} remaining
                  </span>
                </>
              )}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          disabled={!steps.length}
          className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2.5 h-7 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Copy className="h-3 w-3" />
          Copy
        </button>
      </header>

      {/* Progress bar (full width) */}
      {steps.length > 0 && (
        <div className="h-0.5 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Step list */}
      <ul className="divide-y divide-border">
        {steps.length === 0 ? (
          <li className="py-12 text-center text-[12.5px] text-muted-foreground">
            Run an analysis to generate your action plan.
          </li>
        ) : (
          steps.map((s, i) => {
            const owner = assignees[i] ?? ASSIGNEES[i % ASSIGNEES.length];
            const isDone = !!done[i];
            const isOpen = !!expanded[i];
            return (
              <li
                key={i}
                className={cn(
                  "px-4 py-2.5 transition-colors",
                  isDone ? "bg-muted/20" : "hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleDone(i)}
                    aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                    className={cn(
                      "h-4 w-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
                      isDone
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary"
                    )}
                  >
                    {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
                  </button>

                  {/* Step label */}
                  <span className="text-[10.5px] font-mono text-muted-foreground/70 tabular-nums shrink-0 w-12">
                    Step {i + 1}
                  </span>

                  {/* Task */}
                  <button
                    onClick={() => toggleExpanded(i)}
                    className={cn(
                      "flex-1 min-w-0 text-left text-[13px] truncate transition-colors",
                      isDone ? "text-muted-foreground line-through" : "text-foreground hover:text-primary"
                    )}
                  >
                    {s.task}
                  </button>

                  {/* Time estimate */}
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums shrink-0">
                    <Clock className="h-3 w-3" />
                    {s.timeEstimate}
                  </span>

                  {/* Assignee */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        title={`Assigned to ${owner}`}
                        className="hidden md:inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-semibold hover:ring-2 hover:ring-primary/20 transition-all shrink-0"
                      >
                        {initialsOf(owner)}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {ASSIGNEES.map((name) => (
                        <DropdownMenuItem key={name} onSelect={() => setAssignee(i, name)}>
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[9px] font-semibold mr-2">
                            {initialsOf(name)}
                          </span>
                          {name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Expand caret */}
                  <button
                    onClick={() => toggleExpanded(i)}
                    aria-label={isOpen ? "Collapse" : "Expand"}
                    className="h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                  >
                    <ChevronRight
                      className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")}
                    />
                  </button>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="mt-2 ml-[60px] pl-3 border-l-2 border-border/70">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                      Next step
                    </div>
                    <p className="text-[12.5px] text-foreground/85 leading-snug">{s.nextStep}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {s.timeEstimate}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span>Owner: <span className="text-foreground/80 font-medium">{owner}</span></span>
                    </div>
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
};
