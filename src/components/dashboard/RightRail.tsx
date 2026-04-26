import { useState } from "react";
import { Calendar, FileText, ListPlus, Download, CheckCircle2, AlertCircle, Clock, MoreHorizontal } from "lucide-react";
import { downloadActionPlanICS } from "@/lib/calendar";
import type { AnalysisResult, Memory } from "@/types/copilot";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RightRailProps {
  result: AnalysisResult | null;
  memory: Memory;
  useMemory: boolean;
  onToggleUseMemory: (v: boolean) => void;
  onSetGoal: (v: string) => void;
  onClear: () => void;
}

const ALL_ACTIVITY = [
  { tone: "success" as const, text: "Payment crash issue updated", time: "2h ago" },
  { tone: "info" as const, text: "New bug imported from Jira", time: "3h ago" },
  { tone: "warning" as const, text: "Action plan generated", time: "3h ago" },
  { tone: "success" as const, text: "Server issue resolved", time: "5h ago" },
  { tone: "info" as const, text: "Slack thread synced", time: "1d ago" },
  { tone: "warning" as const, text: "Goal updated", time: "2d ago" },
  { tone: "success" as const, text: "Memory context refreshed", time: "3d ago" },
];

export const RightRail = ({ result, memory, useMemory, onToggleUseMemory, onSetGoal, onClear }: RightRailProps) => {
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({
    Jira: true,
    "Google Calendar": true,
  });

  const total = result ? result.topPriorities.length + result.secondary.length + result.ignore.length : 0;
  const high = result?.topPriorities.filter((p) => p.impact === "High").length ?? 0;
  const low = result?.ignore.length ?? 0;

  const requireResult = (action: string): boolean => {
    if (result) return true;
    toast.error("Nothing to send", {
      description: `Run an analysis first, then ${action}.`,
    });
    return false;
  };

  const handleCreateJira = () => {
    if (!requireResult("create Jira tasks")) return;
    if (!integrations.Jira) {
      toast.error("Jira not connected", { description: "Connect Jira from Integrations." });
      return;
    }
    const count = result!.topPriorities.length;
    toast.success(`Created ${count} Jira task${count === 1 ? "" : "s"} (demo)`, {
      description: "In production, this would post to your Jira project.",
    });
  };

  const handleAddCalendar = () => {
    if (!requireResult("add to calendar")) return;
    
    try {
      downloadActionPlanICS(result!.actionPlan);
      toast.success("Calendar file (.ics) downloaded", {
        description: "You can import this file into Google Calendar, Outlook, or Apple Calendar.",
      });
    } catch (error) {
      console.error("Calendar export failed:", error);
      toast.error("Failed to generate calendar file");
    }
  };

  const handleExport = () => {
    if (!requireResult("export a report")) return;
    const lines: string[] = [
      `# PM Daily Copilot — ${new Date().toLocaleDateString()}`,
      "",
      `## Top priorities (${result!.topPriorities.length})`,
      ...result!.topPriorities.map((p, i) => `${i + 1}. [${p.impact}] ${p.task}\n   - ${p.reasoning}`),
      "",
      `## Secondary (${result!.secondary.length})`,
      ...result!.secondary.map((s, i) => `${i + 1}. ${s}`),
      "",
      `## Ignored (${result!.ignore.length})`,
      ...result!.ignore.map((s, i) => `${i + 1}. ${s}`),
      "",
      `## Action plan`,
      ...result!.actionPlan.map((a, i) => `${i + 1}. ${a.task} — ${a.nextStep} (~${a.timeEstimate})`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pm-daily-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  const toggleIntegration = (name: string) => {
    setIntegrations((prev) => {
      const next = { ...prev, [name]: !prev[name] };
      toast.message(`${name} ${next[name] ? "connected" : "disconnected"}`);
      return next;
    });
  };

  const handleManageAll = () => {
    toast.message("Integrations", {
      description: "Click each integration's status badge to toggle (demo).",
    });
  };

  const visibleActivity = activityExpanded ? ALL_ACTIVITY : ALL_ACTIVITY.slice(0, 4);

  return (
    <aside className="space-y-4">
      {/* Today's Summary */}
      <div className="rounded-xl border border-border bg-card shadow-card p-3">
        <header className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today's Summary</h3>
          <Calendar className="h-3.5 w-3.5 text-muted-foreground/50" />
        </header>
        <div className="grid grid-cols-2 gap-1.5">
          <CompactStat label="Total" value={total} tone="primary" />
          <CompactStat label="High" value={high} tone="high" />
          <CompactStat label="Medium" value={result?.secondary.length ?? 0} tone="medium" />
          <CompactStat label="Low" value={low} tone="low" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-card shadow-card p-4">
        <header className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Quick Actions</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center transition-smooth">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleAddCalendar}>
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                Add to Calendar
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleExport}>
                <Download className="h-4 w-4 mr-2 text-muted-foreground" />
                Export Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <div className="space-y-1">
          <QuickAction onClick={handleCreateJira} icon={<ListPlus className="h-4 w-4 text-info" />} label="Create Jira Task" />
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
      <div id="integrations-panel" className="rounded-xl border border-border bg-card shadow-card p-4">
        <header className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Integrations</h3>
          <button onClick={handleManageAll} className="text-[11px] font-medium text-primary hover:underline">
            Manage all
          </button>
        </header>
        <div className="space-y-2">
          {Object.entries(integrations).map(([name, connected]) => (
            <Integration key={name} name={name} connected={connected} onToggle={() => toggleIntegration(name)} />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card shadow-card p-4">
        <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
        <ul className="space-y-2.5">
          {visibleActivity.map((a, i) => (
            <Activity key={i} tone={a.tone} text={a.text} time={a.time} />
          ))}
        </ul>
        <button
          onClick={() => setActivityExpanded((v) => !v)}
          className="mt-3 text-[11px] font-medium text-primary hover:underline"
        >
          {activityExpanded ? "Show less ↑" : "View all activity →"}
        </button>
      </div>
    </aside>
  );
};

const CompactStat = ({ label, value, tone }: { label: string; value: number; tone: "primary" | "high" | "medium" | "low" }) => {
  const map = {
    primary: "border-primary/20 bg-primary/5 text-primary",
    high: "border-priority-high/20 bg-priority-high/5 text-priority-high",
    medium: "border-priority-medium/20 bg-priority-medium/5 text-priority-medium",
    low: "border-priority-low/20 bg-priority-low/5 text-priority-low",
  };
  return (
    <div className={cn("rounded-lg border p-2 flex items-center justify-between", map[tone])}>
      <p className="text-[10px] font-medium uppercase tracking-tight opacity-70">{label}</p>
      <p className="text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
};

const QuickAction = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted text-sm text-foreground/85 transition-smooth"
  >
    {icon}
    {label}
  </button>
);

const Integration = ({ name, connected, onToggle }: { name: string; connected: boolean; onToggle: () => void }) => (
  <div className="flex items-center justify-between text-xs">
    <span className="font-medium text-foreground/85">{name}</span>
    <button
      onClick={onToggle}
      className={
        connected
          ? "text-[10px] font-semibold px-2 py-0.5 rounded bg-priority-low-soft text-priority-low hover:opacity-80 transition-smooth"
          : "text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/70 transition-smooth"
      }
    >
      {connected ? "Connected" : "Off"}
    </button>
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
