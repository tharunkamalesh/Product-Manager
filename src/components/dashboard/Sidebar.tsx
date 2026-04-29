import { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Plug,
  Settings,
  LogOut,
  Compass,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OnboardingGuide } from "./OnboardingGuide";
import { useAuth } from "@/contexts/AuthContext";
import { useCopilot } from "@/hooks/useCopilot";
import { toast } from "sonner";

type NavItem = {
  id: string;
  icon: any;
  label: string;
  path: string;
};

const NAV_PRIMARY: NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
];

const NAV_SECONDARY: NavItem[] = [
  { id: "integrations", icon: Plug, label: "Integrations", path: "/integrations" },
  { id: "team-setup", icon: Users, label: "Team Setup", path: "/team-setup" },
  { id: "settings", icon: Settings, label: "Settings", path: "/settings" },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

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

  const renderNav = (items: NavItem[]) =>
    items.map((item) => {
      const isActive = location.pathname === item.path;
      const showBadge = item.id === "inbox" && pendingCount > 0;
      return (
        <Link
          key={item.id}
          to={item.path}
          className={cn(
            "group relative w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded text-[13px] font-medium transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/80 hover:bg-muted hover:text-sidebar-foreground"
          )}
        >
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary" />
          )}
          <span className="flex items-center gap-2.5">
            <item.icon className={cn("h-[15px] w-[15px]", isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
            {item.label}
          </span>
          {showBadge && (
            <span className="text-[10px] font-semibold px-1.5 py-0 rounded-sm bg-primary/10 text-primary tabular-nums">
              {pendingCount}
            </span>
          )}
        </Link>
      );
    });

  return (
    <aside className="hidden lg:flex flex-col w-[240px] shrink-0 bg-sidebar border-r border-sidebar-border min-h-screen sticky top-0">
      {/* Logo */}
      <Link
        to="/"
        className="h-14 px-4 flex items-center gap-2.5 border-b border-sidebar-border hover:bg-muted/40 transition-colors"
      >
        <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
          <Compass className="h-4 w-4 text-primary-foreground" strokeWidth={2.25} />
        </div>
        <span className="text-[14px] font-semibold tracking-tight">Founder's Compass</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
        <div>
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Workspace
          </p>
          <div className="space-y-0.5">{renderNav(NAV_PRIMARY)}</div>
        </div>

        <div>
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Setup
          </p>
          <div className="space-y-0.5">{renderNav(NAV_SECONDARY)}</div>
        </div>

        <div>
          <OnboardingGuide>
            <button className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-[13px] font-medium text-sidebar-foreground/80 hover:bg-muted hover:text-sidebar-foreground transition-colors">
              <Settings className="h-[15px] w-[15px] text-muted-foreground" />
              Help & guide
            </button>
          </OnboardingGuide>
        </div>
      </nav>

      {/* User block */}
      <div className="p-2 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted/60 transition-colors">
          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium leading-tight truncate text-sidebar-foreground">
              {profile?.name || "User"}
            </p>
            <p className="text-[10.5px] text-muted-foreground leading-tight truncate">
              {profile?.companyName || profile?.email || ""}
            </p>
          </div>
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign out"
            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
