import { Sparkles, ArrowUpRight, Flame, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Priority } from "@/types/copilot";
import { cn } from "@/lib/utils";

type Bucket = "high" | "medium" | "low";

const BUCKET_META: Record<Bucket, { label: string; emoji: string; icon: any; bg: string; border: string; text: string; pillBg: string; pillText: string; tagBg: string; tagText: string }> = {
  high: {
    label: "High Priority",
    emoji: "🔥",
    icon: Flame,
    bg: "bg-priority-high-soft",
    border: "border-priority-high-border",
    text: "text-priority-high",
    pillBg: "bg-priority-high/10",
    pillText: "text-priority-high",
    tagBg: "bg-priority-high",
    tagText: "text-white",
  },
  medium: {
    label: "Medium Priority",
    emoji: "🟡",
    icon: AlertCircle,
    bg: "bg-priority-medium-soft",
    border: "border-priority-medium-border",
    text: "text-priority-medium",
    pillBg: "bg-priority-medium/10",
    pillText: "text-priority-medium",
    tagBg: "bg-priority-medium",
    tagText: "text-white",
  },
  low: {
    label: "Low Priority",
    emoji: "🟢",
    icon: CheckCircle2,
    bg: "bg-priority-low-soft",
    border: "border-priority-low-border",
    text: "text-priority-low",
    pillBg: "bg-priority-low/10",
    pillText: "text-priority-low",
    tagBg: "bg-priority-low",
    tagText: "text-white",
  },
};

interface PriorityBoardProps {
  high: Priority[];
  medium: Priority[];
  low: Priority[];
  hasResult: boolean;
}

export const PriorityBoard = ({ high, medium, low, hasResult }: PriorityBoardProps) => {
  return (
    <section className="rounded-xl border border-border bg-card shadow-card p-5">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">AI Prioritization</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Based on impact, urgency, effort & context
          </p>
        </div>
        <button className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
          View all <ArrowUpRight className="h-3 w-3" />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Column bucket="high" items={high} hasResult={hasResult} />
        <Column bucket="medium" items={medium} hasResult={hasResult} />
        <Column bucket="low" items={low} hasResult={hasResult} />
      </div>
    </section>
  );
};

const Column = ({ bucket, items, hasResult }: { bucket: Bucket; items: Priority[]; hasResult: boolean }) => {
  const meta = BUCKET_META[bucket];
  return (
    <div className={cn("rounded-xl border p-3", meta.bg, meta.border)}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className={cn("text-sm font-semibold flex items-center gap-1.5", meta.text)}>
          <span>{meta.emoji}</span>
          {meta.label} ({items.length})
        </h3>
      </div>

      <div className="space-y-2.5">
        {items.length === 0 ? (
          <div className="rounded-lg bg-card/70 border border-dashed border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">
              {hasResult ? "No items in this bucket." : "Run analysis to populate."}
            </p>
          </div>
        ) : (
          items.map((p, i) => <PriorityCard key={i} item={p} bucket={bucket} />)
        )}

        {items.length > 0 && (
          <button className={cn("w-full text-xs font-medium pt-1 inline-flex items-center justify-center gap-1 hover:underline", meta.text)}>
            View all ({items.length}) →
          </button>
        )}
      </div>
    </div>
  );
};

const PriorityCard = ({ item, bucket }: { item: Priority; bucket: Bucket }) => {
  const meta = BUCKET_META[bucket];
  const tag = bucket === "high" ? "Critical" : bucket === "medium" ? "Medium" : "Low";
  const tagClass =
    bucket === "high"
      ? "bg-priority-high/15 text-priority-high"
      : bucket === "medium"
      ? "bg-priority-medium/15 text-priority-medium"
      : "bg-priority-low/15 text-priority-low";

  // Pull a short title from the first line / first 60 chars
  const lines = item.task.split(/[\n.—-]/).map((s) => s.trim()).filter(Boolean);
  const title = (lines[0] || item.task).slice(0, 60);
  const subtitle = lines.slice(1).join(" · ").slice(0, 80) || item.reasoning.slice(0, 80);

  return (
    <article className="rounded-lg bg-card border border-border p-3 shadow-soft hover:shadow-card transition-smooth">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-[13px] font-semibold leading-snug text-foreground">{title}</h4>
        <span className={cn("shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded", tagClass)}>
          {tag}
        </span>
      </div>
      <p className="text-[11.5px] text-muted-foreground leading-snug mb-2.5 line-clamp-2">
        {subtitle}
      </p>
      <div className="flex items-center justify-between pt-2 border-t border-border/70">
        <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
          <span className="font-medium text-foreground/70">Task</span>
          <span>·</span>
          <span>Impact: <span className="font-medium text-foreground/70">{item.impact}</span></span>
          <span>·</span>
          <span>{item.effort}</span>
        </div>
        <div className={cn("h-5 w-5 rounded-md flex items-center justify-center", meta.pillBg)}>
          <Sparkles className={cn("h-3 w-3", meta.pillText)} />
        </div>
      </div>
    </article>
  );
};
