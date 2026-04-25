import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2 } from "lucide-react";

interface InputPanelProps {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}

const SAMPLE = `Stripe webhooks failing in production — 3 customers complained today
Redesign onboarding flow
Investor email — needs reply by tomorrow
Maybe explore a new logo
Write launch post for v0.4
Talk to power users about churn
Research competitor pricing pages someday
Bug: dashboard crashes on Safari`;

export const InputPanel = ({ value, onChange, onAnalyze, loading }: InputPanelProps) => {
  const canAnalyze = value.trim().length > 0 && !loading;

  return (
    <div className="flex flex-col h-full rounded-xl border border-border/60 bg-gradient-surface shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Brain dump</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Paste everything. We&apos;ll decide what matters.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(SAMPLE)}
          className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
        >
          Try sample
        </button>
      </div>

      <div className="flex-1 p-4 min-h-0">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your messy tasks, ideas, bugs, feedback, thoughts..."
          className="h-full min-h-[280px] resize-none border-0 bg-transparent text-sm leading-relaxed font-mono focus-visible:ring-0 focus-visible:ring-offset-0 p-0 placeholder:text-muted-foreground/60"
        />
      </div>

      <div className="px-4 py-3 border-t border-border/60 flex items-center justify-between gap-3 bg-card/40">
        <span className="text-xs text-muted-foreground tabular-nums">
          {value.trim().split(/\s+/).filter(Boolean).length} words
        </span>
        <Button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          variant="primary"
          size="default"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              Analyze & Prioritize
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
