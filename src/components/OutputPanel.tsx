import { Brain, CheckCircle2, Flame, MinusCircle, Sparkles, Zap } from "lucide-react";
import type { AnalysisResult } from "@/types/copilot";
import { MetaPill } from "./MetaPill";
import { cn } from "@/lib/utils";

interface OutputPanelProps {
  result: AnalysisResult | null;
  loading: boolean;
}

const EmptyState = () => (
  <div className="h-full flex flex-col items-center justify-center text-center px-8 py-16">
    <div className="h-12 w-12 rounded-xl bg-gradient-primary/10 border border-primary/20 flex items-center justify-center mb-4">
      <Sparkles className="h-5 w-5 text-primary" />
    </div>
    <h3 className="text-base font-semibold mb-1.5">Your action plan appears here</h3>
    <p className="text-sm text-muted-foreground max-w-sm">
      Paste your messy inputs on the left and click <span className="text-foreground font-medium">Analyze & Prioritize</span>. You&apos;ll get a clear decision in seconds — with reasoning.
    </p>
  </div>
);

const LoadingState = () => (
  <div className="h-full flex flex-col items-center justify-center text-center px-8">
    <div className="relative h-12 w-12 mb-4">
      <div className="absolute inset-0 rounded-xl bg-gradient-primary opacity-20 animate-ping" />
      <div className="relative h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-elegant">
        <Brain className="h-5 w-5 text-primary-foreground animate-pulse" />
      </div>
    </div>
    <p className="text-sm font-medium">Thinking...</p>
    <p className="text-xs text-muted-foreground mt-1">
      Scoring impact, urgency, effort, and memory signals.
    </p>
  </div>
);

const SectionHeader = ({
  icon,
  title,
  count,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  tone: "primary" | "warning" | "muted" | "success";
}) => {
  const toneClass = {
    primary: "text-primary",
    warning: "text-warning",
    muted: "text-muted-foreground",
    success: "text-success",
  }[tone];
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={cn("flex items-center gap-1.5", toneClass)}>{icon}</div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground">
        {title}
      </h3>
      {typeof count === "number" && (
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
};

export const OutputPanel = ({ result, loading }: OutputPanelProps) => {
  return (
    <div className="flex flex-col h-full rounded-xl border border-border/60 bg-gradient-surface shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60">
        <h2 className="text-sm font-semibold">Decision plan</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Prioritized output with reasoning and next steps.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <LoadingState />
        ) : !result ? (
          <EmptyState />
        ) : (
          <div className="p-5 space-y-7">
            {/* Top Priorities */}
            <section>
              <SectionHeader
                icon={<Flame className="h-3.5 w-3.5" />}
                title="🔥 Top priorities"
                count={result.topPriorities.length}
                tone="primary"
              />
              {result.topPriorities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No clear priorities detected. Add more context.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {result.topPriorities.map((p, i) => (
                    <article
                      key={i}
                      className="rounded-lg border border-border/60 bg-card p-4 hover:border-primary/40 transition-smooth"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-md bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0 shadow-elegant">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug text-foreground">
                            {p.task}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            <MetaPill label="Impact" value={p.impact} variant="impact" />
                            <MetaPill label="Urgency" value={p.urgency} variant="urgency" />
                            <MetaPill label="Effort" value={p.effort} variant="effort" />
                          </div>
                          <div className="mt-3 space-y-1.5 text-xs">
                            <div className="flex gap-2">
                              <span className="text-muted-foreground shrink-0 w-20">
                                Reasoning
                              </span>
                              <span className="text-foreground/85">{p.reasoning}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-muted-foreground shrink-0 w-20">
                                Memory
                              </span>
                              <span className="text-primary/90">{p.memoryInfluence}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Secondary */}
            {result.secondary.length > 0 && (
              <section>
                <SectionHeader
                  icon={<Zap className="h-3.5 w-3.5" />}
                  title="⚡ Secondary tasks"
                  count={result.secondary.length}
                  tone="warning"
                />
                <ul className="space-y-1.5">
                  {result.secondary.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm rounded-md border border-border/40 bg-card/60 px-3 py-2 text-foreground/90"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Ignore */}
            {result.ignore.length > 0 && (
              <section>
                <SectionHeader
                  icon={<MinusCircle className="h-3.5 w-3.5" />}
                  title="🚫 Ignore / defer"
                  count={result.ignore.length}
                  tone="muted"
                />
                <ul className="space-y-1.5">
                  {result.ignore.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm rounded-md px-3 py-2 text-muted-foreground line-through decoration-muted-foreground/40"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Action Plan */}
            {result.actionPlan.length > 0 && (
              <section>
                <SectionHeader
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  title="✅ Action plan"
                  count={result.actionPlan.length}
                  tone="success"
                />
                <ol className="space-y-2">
                  {result.actionPlan.map((a, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-border/60 bg-card p-3.5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-mono text-muted-foreground tabular-nums mt-0.5">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-snug">{a.task}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs">
                            <span className="text-foreground/80">
                              <span className="text-muted-foreground">Next: </span>
                              {a.nextStep}
                            </span>
                            <span className="text-success font-mono tabular-nums">
                              ~{a.timeEstimate}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
