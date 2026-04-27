import { useState } from "react";
import { ChevronDown, Layers, Mail, Bug, FileText, Clock, ChevronsUp, Equal, ChevronsDown } from "lucide-react";
import type { Priority } from "@/types/copilot";
import { cn } from "@/lib/utils";

type Bucket = "high" | "medium" | "low";

const BUCKET_META: Record<
  Bucket,
  { label: string; iconColor: string; dot: string; Icon: any }
> = {
  high: {
    label: "Highest",
    iconColor: "text-priority-high",
    dot: "bg-priority-high",
    Icon: ChevronsUp,
  },
  medium: {
    label: "Medium",
    iconColor: "text-priority-medium",
    dot: "bg-priority-medium",
    Icon: Equal,
  },
  low: {
    label: "Low",
    iconColor: "text-priority-low",
    dot: "bg-priority-low",
    Icon: ChevronsDown,
  },
};

const COLLAPSED_LIMIT = 3;

interface PriorityBoardProps {
  high: Priority[];
  medium: Priority[];
  low: Priority[];
  hasResult: boolean;
}

export const PriorityBoard = ({ high, medium, low, hasResult }: PriorityBoardProps) => {
  const [expanded, setExpanded] = useState<Record<Bucket, boolean>>({
    high: false,
    medium: false,
    low: false,
  });

  const allExpanded = expanded.high && expanded.medium && expanded.low;

  const toggleAll = () => {
    const next = !allExpanded;
    setExpanded({ high: next, medium: next, low: next });
  };

  const toggleBucket = (bucket: Bucket) => {
    setExpanded((prev) => ({ ...prev, [bucket]: !prev[bucket] }));
  };

  return (
    <section id="priority-board" className="rounded-md border border-border bg-card">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h2 className="text-[13px] font-semibold">Prioritization</h2>
          <p className="text-[11.5px] text-muted-foreground mt-0.5">
            Ranked by impact, urgency, and effort.
          </p>
        </div>
        <button
          onClick={toggleAll}
          className="text-[11.5px] font-medium text-primary hover:underline"
        >
          {allExpanded ? "Collapse all" : "Expand all"}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
        <Column bucket="high" items={high} hasResult={hasResult} expanded={expanded.high} onToggle={() => toggleBucket("high")} />
        <Column bucket="medium" items={medium} hasResult={hasResult} expanded={expanded.medium} onToggle={() => toggleBucket("medium")} />
        <Column bucket="low" items={low} hasResult={hasResult} expanded={expanded.low} onToggle={() => toggleBucket("low")} />
      </div>
    </section>
  );
};

const Column = ({
  bucket,
  items,
  hasResult,
  expanded,
  onToggle,
}: {
  bucket: Bucket;
  items: Priority[];
  hasResult: boolean;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const meta = BUCKET_META[bucket];
  const visible = expanded ? items : items.slice(0, COLLAPSED_LIMIT);

  return (
    <div className="p-3 min-w-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
        <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          {meta.label}
        </h3>
        <span className="ml-auto text-[10.5px] tabular-nums text-muted-foreground/70 px-1.5 rounded-sm bg-muted">
          {items.length}
        </span>
      </div>

      <div className="space-y-1.5">
        {items.length === 0 ? (
          <div className="rounded border border-dashed border-border py-6 text-center">
            <p className="text-[11.5px] text-muted-foreground/70">
              {hasResult ? "Nothing here" : "Run analysis"}
            </p>
          </div>
        ) : (
          visible.map((p, i) => <PriorityCard key={i} item={p} bucket={bucket} expanded={expanded} />)
        )}

        {items.length > COLLAPSED_LIMIT && (
          <button
            onClick={onToggle}
            className="w-full text-[11.5px] font-medium pt-1 inline-flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
            {expanded ? "Show less" : `Show ${items.length - visible.length} more`}
          </button>
        )}
      </div>
    </div>
  );
};

// Parse "BUG-1421 (P1) — Payment SDK crash..." into { key: "BUG-1421", title: "Payment SDK crash..." }
const parseTask = (raw: string): { key: string | null; title: string } => {
  const text = (raw || "").trim();
  // Match a leading issue key like "BUG-1421", "TASK-902", "SUPP-330", optional " (P1)" tag, then separator
  const m = text.match(/^([A-Z][A-Z0-9]{1,9}-\d+)(?:\s*\([^)]*\))?\s*[—\-:]\s*(.+)$/);
  if (m) {
    return { key: m[1], title: m[2].trim() };
  }
  return { key: null, title: text };
};

const TYPE_ICONS: Record<string, any> = {
  BUG: Bug,
  TASK: Layers,
  STORY: FileText,
  SUPP: Mail,
  EMAIL: Mail,
};

const PriorityCard = ({
  item,
  bucket,
  expanded,
}: {
  item: Priority;
  bucket: Bucket;
  expanded: boolean;
}) => {
  const meta = BUCKET_META[bucket];
  const PriorityIcon = meta.Icon;

  const { key, title } = parseTask(item.task);
  const prefix = key ? key.split("-")[0] : null;
  const Icon =
    (prefix && TYPE_ICONS[prefix]) ||
    (item.source === "Email" ? Mail : item.source === "Jira" ? Layers : Layers);

  const dueDate = item.dueDate ?? null;
  const subtitle = item.reasoning;

  return (
    <article className="rounded border border-border bg-card hover:border-primary/40 hover:bg-muted/30 transition-colors p-2.5 group">
      <div className="flex items-start gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {/* Title + status pill */}
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "text-[12.5px] font-medium leading-snug text-foreground",
              !expanded && "line-clamp-2"
            )}>
              {title}
            </h4>
            <span
              title={meta.label}
              className={cn(
                "shrink-0 inline-flex items-center justify-center h-4 w-4 rounded-sm",
                meta.iconColor
              )}
              aria-label={`Priority: ${meta.label}`}
            >
              <PriorityIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          </div>

          {/* Issue key + meta row */}
          <div className="flex items-center gap-2 mt-1.5 text-[10.5px] text-muted-foreground">
            {key && (
              <span className="font-mono tracking-tight text-muted-foreground/80">
                {key}
              </span>
            )}
            {key && (item.effort || dueDate) && (
              <span className="text-muted-foreground/40">·</span>
            )}
            {item.effort && (
              <span className="inline-flex items-center gap-1">
                <span className="text-muted-foreground/60">Effort</span>
                <span className="font-medium text-foreground/80">{item.effort}</span>
              </span>
            )}
            {dueDate && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {dueDate}
                </span>
              </>
            )}
          </div>

          {/* Reasoning (only when expanded) */}
          {expanded && subtitle && (
            <p className="text-[11.5px] text-muted-foreground leading-snug mt-2 pt-2 border-t border-border/70">
              {subtitle}
            </p>
          )}
          {expanded && item.memoryInfluence && (
            <p className="text-[11px] italic text-muted-foreground/80 leading-snug mt-1.5 border-l-2 border-primary/40 pl-2">
              {item.memoryInfluence}
            </p>
          )}
        </div>
      </div>
    </article>
  );
};
