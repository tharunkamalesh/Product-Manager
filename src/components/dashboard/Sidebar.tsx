import { Sparkles, LayoutDashboard, Inbox, Flame, ListChecks, Calendar, Plug, History, BarChart3, Settings, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Inbox, label: "Inbox", badge: "12" },
  { icon: Flame, label: "Priorities" },
  { icon: ListChecks, label: "Action Plan" },
  { icon: Calendar, label: "Calendar" },
  { icon: Plug, label: "Integrations" },
  { icon: History, label: "History" },
  { icon: BarChart3, label: "Insights" },
  { icon: Settings, label: "Settings" },
];

export const Sidebar = () => {
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
        {NAV.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-smooth",
              item.active
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
        ))}
      </nav>

      {/* Promo card */}
      <div className="m-3 p-4 rounded-xl bg-gradient-to-br from-accent to-secondary border border-border text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center mb-2 shadow-elegant">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <p className="text-[11.5px] text-muted-foreground leading-snug mb-2">
          Your AI Copilot for smarter daily decisions.
        </p>
        <button className="text-[11px] font-medium px-3 py-1.5 rounded-md bg-card border border-border hover:border-primary/40 transition-smooth">
          Learn more →
        </button>
      </div>
    </aside>
  );
};
