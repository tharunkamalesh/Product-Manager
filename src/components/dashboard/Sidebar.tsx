import { useLocation, Link } from "react-router-dom";
import { Sparkles, LayoutDashboard, Inbox, Flame, ListChecks, Calendar, Plug, History, Settings, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { OnboardingGuide } from "./OnboardingGuide";

type NavItem = {
  id: string;
  icon: any;
  label: string;
  path: string;
  badge?: string;
};

const NAV: NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { id: "inbox", icon: Inbox, label: "Inbox", path: "/inbox", badge: "12" },
  { id: "priorities", icon: Flame, label: "Priorities", path: "/priorities" },
  { id: "action-plan", icon: ListChecks, label: "Action Plan", path: "/action-plan" },
  { id: "calendar", icon: Calendar, label: "Calendar", path: "/calendar" },
  { id: "integrations", icon: Plug, label: "Integrations", path: "/integrations" },
  { id: "history", icon: History, label: "History", path: "/history" },
  { id: "guide", icon: HelpCircle, label: "Help & Guide", path: "#" },
  { id: "settings", icon: Settings, label: "Settings", path: "/settings" },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-[230px] shrink-0 bg-sidebar border-r border-sidebar-border min-h-screen sticky top-0">
      {/* Logo */}
      <Link to="/" className="px-5 py-5 flex items-center gap-2.5 hover:opacity-90 transition-opacity">
        <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-elegant">
          <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold tracking-tight">PM Daily Copilot</h1>
          <p className="text-[10.5px] text-muted-foreground">AI Decision Engine for PMs</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map((item) => {
          const isActive = location.pathname === item.path;
          const content = (
            <Link
              key={item.id}
              to={item.path}
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
            </Link>
          );

          if (item.id === "guide") {
            return (
              <div key={item.id} className="cursor-pointer">
                <OnboardingGuide>{content}</OnboardingGuide>
              </div>
            );
          }

          return content;
        })}
      </nav>

      {/* Learn more trigger */}
      <div className="m-3 p-4">
        <OnboardingGuide>
          <button
            className="w-full text-[11px] font-medium px-3 py-1.5 rounded-md bg-card border border-border hover:border-primary/40 transition-smooth"
          >
            Learn more →
          </button>
        </OnboardingGuide>
      </div>
    </aside>
  );
};
