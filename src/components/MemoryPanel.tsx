import { Brain, RotateCcw, Target } from "lucide-react";
import type { Memory } from "@/types/copilot";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MemoryPanelProps {
  memory: Memory;
  useMemory: boolean;
  onToggleUseMemory: (v: boolean) => void;
  onSetGoal: (v: string) => void;
  onClear: () => void;
}

export const MemoryPanel = ({
  memory,
  useMemory,
  onToggleUseMemory,
  onSetGoal,
  onClear,
}: MemoryPanelProps) => {
  return (
    <aside className="rounded-xl border border-border/60 bg-gradient-surface shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Memory</h2>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="use-memory" className="text-xs text-muted-foreground cursor-pointer">
            Use context
          </Label>
          <Switch
            id="use-memory"
            checked={useMemory}
            onCheckedChange={onToggleUseMemory}
          />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Goal */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Target className="h-3 w-3 text-muted-foreground" />
            <Label htmlFor="goal" className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Current goal
            </Label>
          </div>
          <Input
            id="goal"
            placeholder="e.g. Reach $10k MRR by Q3"
            value={memory.userProfile.goal}
            onChange={(e) => onSetGoal(e.target.value)}
            className="h-9 text-sm bg-card/60 border-border/60"
          />
        </div>

        {/* Past priorities */}
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Past priorities
          </Label>
          {memory.pastPriorities.length === 0 ? (
            <p className="text-xs text-muted-foreground/70 italic">
              None yet. Run your first analysis.
            </p>
          ) : (
            <ul className="space-y-1">
              {memory.pastPriorities.map((p, i) => (
                <li
                  key={i}
                  className="text-xs text-foreground/85 rounded-md bg-card/60 border border-border/40 px-2.5 py-1.5 truncate"
                  title={p}
                >
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Patterns */}
        <div className="space-y-2">
          <Label className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Recurring patterns
          </Label>
          {memory.patterns.length === 0 ? (
            <p className="text-xs text-muted-foreground/70 italic">
              No patterns detected yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {memory.patterns.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-accent text-accent-foreground border border-primary/20 font-mono"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reset */}
        {(memory.pastPriorities.length > 0 ||
          memory.userProfile.goal ||
          memory.ignoredTasks.length > 0) && (
          <button
            type="button"
            onClick={onClear}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-smooth pt-2 border-t border-border/40"
          >
            <RotateCcw className="h-3 w-3" />
            Reset memory
          </button>
        )}
      </div>
    </aside>
  );
};
