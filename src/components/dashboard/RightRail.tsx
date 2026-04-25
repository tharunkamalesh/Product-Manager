import { Calendar, FileText, Slack as SlackIcon, ListPlus, Send, Download, CheckCircle2, AlertCircle, Clock, Bug } from "lucide-react";
import type { AnalysisResult, Memory } from "@/types/copilot";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface RightRailProps {
  result: AnalysisResult | null;
  memory: Memory;
  useMemory: boolean;
  onToggleUseMemory: (v: boolean) => void;
  onSetGoal: (v: string) => void;
  onClear: () => void;
}

export const RightRail = ({ result, memory, useMemory, onToggleUseMemory, onSetGoal, onClear }: RightRailProps) => {
  const total = result ? result.topPriorities.length + result.secondary.length + result.ignore.length : 0;
  const high = result?.topPriorities.filter((p) => p.impact === "High").length ?? 0;
  const medium = result?.topPriorities.filter((p) => p.impact === "Medium").length ?? 0 + (result?.secondary.length ?? 0);
  const low = result?.ignore.length ?? 0;

  return (
    <aside className="space-y-4">
      {/* Today's Summary */}
      <div className="rounded-xl border border-border bg-card shadow-card p-4">
        <header className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Today's Summary</h3>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </header>
        <div className="grid grid-cols-2 gap-2">
          <SummaryStat label="Total Items" value={total} icon={<FileText className="h-3.5 w-3.5" />} tone="primary" />
          <SummaryStat label="High Priority" value={high} icon={<AlertCircle className="h-3.5 w-3.5" />} tone="high" />
          <SummaryStat label="Medium Priority" value={result?.secondary.length ?? 0} icon={<Clock className="h-3.5 w-3.5" />} tone="medium" />
          <SummaryStat label="Low Priority" value={low} icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="low" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-card shadow-card p-4">
        <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
        <div className="space-y-1">
          <QuickAction icon={<ListPlus className="h-4 w-4 text-info" />} label="Create Jira Task" />
          <QuickAction icon={<Send className="h-4 w-4 text-[#611f69]" />} label="Send to Slack" />
          <QuickAction icon={<Calendar className="h-4 w-4 text-primary" />} label="Add to Calendar" />
          <QuickAction icon={<Download className="h-4 w-4 text-muted-foreground" />} label="Export Report" />
        </div>
      </div>

      {/* Memory / Context */}
      <div className="rounded-xl border border-border bg-card shadow-card p-4">
        <header className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Memory Context</h3>
          <Switch checked={useMemory} onCheckedChange={onToggleUseMemory} />
        </header>
        <div className="space-y-3">
          <div>
            <label className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">Goal</label>
            <Input
              value={memory.userProfile.goal}
              onChange={(e) => onSetGoal(e.target.value)}
              placeholder="e.g. Reach $10k MRR by Q3"
              className="h-8 mt-1 text-xs"
            />
          </div>
          {memory.patterns.length > 0 && (
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Patterns</p>
              <div className="flex flex-wrap gap-1">
                {memory.patterns.map((p) => (
                  <span key={p} className="text-[10.5px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground font-mono">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          {memory.pastPriorities.length > 0 && (
            <button
              onClick={onClear}
              className="text-[11px] text-muted-foreground hover:text-destructive transition-smooth"
            >
              Reset memory
            </button>
          )}
        </div>
      </div>

      {/* Integrations */}
      <div className="rounded-xl border border-border bg-card shadow-card p-4">
        <header className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Integrations</h3>
          <button className="text-[11px] font-medium text-primary hover:underline">Manage all</button>
        </header>
        <div className="space-y-2">
          <Integration name="Jira" connected />
          <Integration name="Slack" connected />
          <Integration name="Google Calendar" connected />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card shadow-card p-4">
        <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
        <ul className="space-y-2.5">
          <Activity tone="success" text="Payment crash issue updated" time="2h ago" />
          <Activity tone="info" text="New bug imported from Jira" time="3h ago" />
          <Activity tone="warning" text="Action plan generated" time="3h ago" />
          <Activity tone="success" text="Server issue resolved" time="5h ago" />
        </ul>
        <button className="mt-3 text-[11px] font-medium text-primary hover:underline">
          View all activity →
        </button>
      </div>
    </aside>
  );
};

const SummaryStat = ({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: "primary" | "high" | "medium" | "low" }) => {
  const map = {
    primary: "bg-accent text-accent-foreground",
    high: "bg-priority-high-soft text-priority-high",
    medium: "bg-priority-medium-soft text-priority-medium",
    low: "bg-priority-low-soft text-priority-low",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 flex items-center gap-2.5">
      <div className={`h-8 w-8 rounded-md flex items-center justify-center ${map[tone]}`}>{icon}</div>
      <div className="leading-tight">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-base font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
};

const QuickAction = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted text-sm text-foreground/85 transition-smooth">
    {icon}
    {label}
  </button>
);

const Integration = ({ name, connected }: { name: string; connected: boolean }) => (
  <div className="flex items-center justify-between text-xs">
    <span className="font-medium text-foreground/85">{name}</span>
    <span className={connected ? "text-[10px] font-semibold px-2 py-0.5 rounded bg-priority-low-soft text-priority-low" : "text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground"}>
      {connected ? "Connected" : "Off"}
    </span>
  </div>
);

const Activity = ({ tone, text, time }: { tone: "success" | "info" | "warning"; text: string; time: string }) => {
  const dot = {
    success: "bg-priority-low",
    info: "bg-info",
    warning: "bg-priority-medium",
  }[tone];
  return (
    <li className="flex items-center gap-2.5 text-xs">
      <span className={`h-2 w-2 rounded-full ${dot} shrink-0`} />
      <span className="flex-1 text-foreground/85 truncate">{text}</span>
      <span className="text-muted-foreground text-[10.5px] shrink-0">{time}</span>
    </li>
  );
};
