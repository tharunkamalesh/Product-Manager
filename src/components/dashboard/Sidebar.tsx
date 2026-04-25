import { useState } from "react";
import { Sparkles, LayoutDashboard, Inbox, Flame, ListChecks, Calendar, Plug, History, BarChart3, Settings, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type NavItem = {
  id: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: string;
};

const NAV: NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "inbox", icon: Inbox, label: "Inbox", badge: "12" },
  { id: "priorities", icon: Flame, label: "Priorities" },
  { id: "action-plan", icon: ListChecks, label: "Action Plan" },
  { id: "calendar", icon: Calendar, label: "Calendar" },
  { id: "integrations", icon: Plug, label: "Integrations" },
  { id: "history", icon: History, label: "History" },
  { id: "insights", icon: BarChart3, label: "Insights" },
  { id: "settings", icon: Settings, label: "Settings" },
];

const SECTION_DESCRIPTIONS: Record<string, string> = {
  dashboard: "You're already here.",
  inbox: "Inbox view coming soon — for now, paste items into the capture box.",
  priorities: "Scrolling to your prioritization board.",
  "action-plan": "Scrolling to your AI-generated action plan.",
  calendar: "Calendar view is on the roadmap.",
  integrations: "Manage connected tools from the right rail.",
  history: "History view coming soon — past analyses are stored in memory.",
  insights: "Insights dashboard coming soon.",
  settings: "Settings panel coming soon.",
};

const SCROLL_TARGETS: Record<string, string> = {
  priorities: "priority-board",
  "action-plan": "action-plan",
  integrations: "integrations-panel",
};

export const Sidebar = () => {
  const [active, setActive] = useState<string>("dashboard");

  const handleNav = (id: string) => {
    setActive(id);
    const targetId = SCROLL_TARGETS[id];
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    if (id === "dashboard") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    toast.message(NAV.find((n) => n.id === id)?.label ?? id, {
      description: SECTION_DESCRIPTIONS[id],
    });
  };

  const handleLearnMore = () => {
    toast.success("PM Daily Copilot", {
      description: "Paste tasks, bugs or messages into the capture box and click Analyze Now to get prioritized actions.",
    });
  };

  return (
    <aside className="hidden lg:flex flex-col w-[230px] shrink-0 bg-sidebar border-r border-sidebar-border min-h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-elegant">
          <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold tracking-tight">PM Daily Copilot</h1>
          <p className="text-[10.5px] text-muted-foreground">AI Decision Engine for PMs</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-smooth",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <span className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground tabular-nums">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Promo card */}
      <div className="m-3 p-4 rounded-xl bg-gradient-to-br from-accent to-secondary border border-border text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center mb-2 shadow-elegant">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <p className="text-[11.5px] text-muted-foreground leading-snug mb-2">
          Your AI Copilot for smarter daily decisions.
        </p>
        <button
          onClick={handleLearnMore}
          className="text-[11px] font-medium px-3 py-1.5 rounded-md bg-card border border-border hover:border-primary/40 transition-smooth"
        >
          Learn more →
        </button>
      </div>
    </aside>
  );
};
