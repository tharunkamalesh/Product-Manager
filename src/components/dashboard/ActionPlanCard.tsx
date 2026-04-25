import { useEffect, useState } from "react";
import { ListChecks, Copy, Calendar, Check } from "lucide-react";
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

export const ActionPlanCard = ({ steps }: ActionPlanCardProps) => {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [assignees, setAssignees] = useState<Record<number, string>>({});

  const doneCount = Object.values(done).filter(Boolean).length;
  const progressPercent = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;

  useEffect(() => {
    setDone({});
    setAssignees({});
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

  const toggleDone = (i: number) => {
    setDone((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const setAssignee = (i: number, name: string) => {
    setAssignees((prev) => ({ ...prev, [i]: name }));
    toast.success(`Assigned step ${i + 1} to ${name}`);
  };

  return (
    <section id="action-plan" className="rounded-xl border border-border bg-card shadow-card p-5">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">AI Generated Action Plan</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Step-by-step plan to tackle today's top priorities
          </p>
          
          {/* Progress Overview */}
          {steps.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className="text-muted-foreground">Today's Progress</span>
                <span className="text-primary">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-in-out" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!steps.length}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy Plan
          </button>
        </div>
      </header>

      <ul className="mt-4 divide-y divide-border">
        {steps.length === 0 ? (
          <li className="py-6 text-center text-sm text-muted-foreground">
            Run an analysis to generate your action plan.
          </li>
        ) : (
          steps.map((s, i) => {
            const owner = assignees[i] ?? ASSIGNEES[i % ASSIGNEES.length];
            const isDone = !!done[i];
            return (
              <li key={i} className="py-3 flex items-center gap-3">
                <button
                  onClick={() => toggleDone(i)}
                  aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                  className={cn(
                    "h-6 w-6 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 transition-smooth",
                    isDone
                      ? "bg-priority-low text-white"
                      : "bg-accent text-accent-foreground hover:bg-accent/80"
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </button>
                <p
                  className={cn(
                    "flex-1 text-sm font-medium truncate",
                    isDone ? "text-muted-foreground line-through" : "text-foreground"
                  )}
                >
                  {s.task}
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden md:inline-flex text-[11px] px-2.5 py-1 rounded-md bg-accent text-accent-foreground font-medium hover:bg-accent/70 transition-smooth">
                      Assign to {owner}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {ASSIGNEES.map((name) => (
                      <DropdownMenuItem key={name} onSelect={() => setAssignee(i, name)}>
                        {name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground min-w-[80px] justify-end">
                  <Calendar className="h-3 w-3" />
                  {s.timeEstimate}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
};
