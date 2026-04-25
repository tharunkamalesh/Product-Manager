import { ListChecks, Copy, Calendar } from "lucide-react";
import type { ActionStep } from "@/types/copilot";
import { toast } from "sonner";

interface ActionPlanCardProps {
  steps: ActionStep[];
}

const ASSIGNEES = ["Assign to Dev Team", "Assign to DevOps", "Assign to Support Team", "Assign to Product", "Assign to QA Team"];

export const ActionPlanCard = ({ steps }: ActionPlanCardProps) => {
  const handleCopy = () => {
    if (!steps.length) return;
    const text = steps.map((s, i) => `${i + 1}. ${s.task}\n   Next: ${s.nextStep} (~${s.timeEstimate})`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Action plan copied");
  };

  return (
    <section className="rounded-xl border border-border bg-card shadow-card p-5">
      <header className="flex items-start justify-between gap-3 mb-1">
        <div>
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">AI Generated Action Plan</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Step-by-step plan to tackle today's top priorities
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-smooth"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy Plan
        </button>
      </header>

      <ul className="mt-4 divide-y divide-border">
        {steps.length === 0 ? (
          <li className="py-6 text-center text-sm text-muted-foreground">
            Run an analysis to generate your action plan.
          </li>
        ) : (
          steps.map((s, i) => (
            <li key={i} className="py-3 flex items-center gap-3">
              <span className="h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-semibold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <p className="flex-1 text-sm font-medium text-foreground truncate">{s.task}</p>
              <span className="hidden md:inline-flex text-[11px] px-2.5 py-1 rounded-md bg-accent text-accent-foreground font-medium">
                {ASSIGNEES[i % ASSIGNEES.length]}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground min-w-[80px] justify-end">
                <Calendar className="h-3 w-3" />
                {s.timeEstimate}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
};
