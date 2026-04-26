import { useLocation, Link, useNavigate } from "react-router-dom";
import { Sparkles, LayoutDashboard, Inbox, Flame, ListChecks, Calendar, Plug, History, Settings, HelpCircle, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { OnboardingGuide } from "./OnboardingGuide";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type NavItem = {
  id: string;
  icon: any;
  label: string;
  path: string;
  badge?: string;
};

const NAV: NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { id: "inbox", icon: Inbox, label: "Inbox", path: "/inbox", badge: "12" },
  { id: "priorities", icon: Flame, label: "Priorities", path: "/priorities" },
  { id: "action-plan", icon: ListChecks, label: "Action Plan", path: "/action-plan" },
  { id: "calendar", icon: Calendar, label: "Calendar", path: "/calendar" },
  { id: "integrations", icon: Plug, label: "Integrations", path: "/integrations" },
  { id: "team-setup", icon: Users, label: "Team Setup", path: "/team-setup" },
  { id: "history", icon: History, label: "History", path: "/history" },
  { id: "guide", icon: HelpCircle, label: "Help & Guide", path: "#" },
  { id: "settings", icon: Settings, label: "Settings", path: "/settings" },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      const toastId = toast.loading("Signing out...");
      await logout();
      toast.dismiss(toastId);
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

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

      {/* User + Logout */}
      <div className="m-3 mt-auto">
        {/* Onboarding */}
        <div className="mb-2">
          <OnboardingGuide>
            <button className="w-full text-[11px] font-medium px-3 py-1.5 rounded-md bg-card border border-border hover:border-primary/40 transition-smooth">
              Learn more →
            </button>
          </OnboardingGuide>
        </div>

        {/* User identity block */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
          <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-sidebar-foreground">{profile?.name || "User"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{profile?.companyName || ""}</p>
          </div>
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            title="Logout"
            className="shrink-0 text-muted-foreground hover:text-destructive transition-smooth p-1 rounded-md hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
