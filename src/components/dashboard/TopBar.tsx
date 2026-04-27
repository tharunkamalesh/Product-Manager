import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings as SettingsIcon,
  Moon,
  Sun,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";

const NOTIFICATIONS = [
  { id: 1, title: "New bug imported from Jira", time: "3h ago", unread: true },
  { id: 2, title: "Action plan generated", time: "3h ago", unread: true },
  { id: 3, title: "Server issue resolved", time: "5h ago", unread: true },
];

const PATH_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/inbox": "Inbox",
  "/priorities": "Priorities",
  "/action-plan": "Action plan",
  "/calendar": "Calendar",
  "/integrations": "Integrations",
  "/team-setup": "Team setup",
  "/history": "History",
  "/settings": "Settings",
  "/insights": "Insights",
};

export const TopBar = () => {
  const { theme, setTheme } = useTheme();
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [unread, setUnread] = useState(NOTIFICATIONS.filter((n) => n.unread).length);

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = document.getElementById("global-search") as HTMLInputElement | null;
        input?.focus();
        input?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !query.trim()) return;
    toast.message(`Searching for "${query.trim()}"`, {
      description: "Global search is coming soon.",
    });
  };

  const handleMarkAllRead = () => {
    setUnread(0);
    toast.success("Notifications marked as read");
  };

  const currentLabel = PATH_LABELS[location.pathname] || "";

  return (
    <header className="h-14 border-b border-border bg-card sticky top-0 z-30 flex items-center px-5 gap-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] min-w-0">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors truncate">
          Projects
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors truncate">
          Founder's Compass
        </Link>
        {currentLabel && (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
            <span className="font-medium text-foreground truncate">{currentLabel}</span>
          </>
        )}
      </nav>

      {/* Search */}
      <div className="ml-auto flex items-center gap-1">
        <div className="relative w-72 hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            id="global-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search"
            className="w-full h-8 pl-8 pr-12 rounded border border-border bg-card focus:bg-card focus:border-primary/60 text-[13px] placeholder:text-muted-foreground/70 outline-none transition-colors"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground bg-muted border border-border px-1 py-0.5 rounded-sm">
            ⌘K
          </kbd>
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8 rounded hover:bg-muted flex items-center justify-center transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Moon className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="relative h-8 w-8 rounded hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
              <p className="text-[13px] font-semibold">Notifications</p>
              <button
                onClick={handleMarkAllRead}
                disabled={unread === 0}
                className="text-[11px] font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
              >
                Mark all read
              </button>
            </div>
            <ul className="max-h-72 overflow-auto divide-y divide-border">
              {NOTIFICATIONS.map((n) => (
                <li key={n.id} className="px-3 py-2.5 hover:bg-muted/60 transition-colors">
                  <p className="text-[12px] font-medium text-foreground">{n.title}</p>
                  <p className="text-[10.5px] text-muted-foreground mt-0.5">{n.time}</p>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-1 pr-2 h-8 rounded hover:bg-muted transition-colors ml-1">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">
                {initials}
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
              Signed in as
              <p className="text-[12px] font-semibold text-foreground truncate">
                {profile?.email || profile?.name}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/settings")}>
              <User className="h-3.5 w-3.5 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/settings")}>
              <SettingsIcon className="h-3.5 w-3.5 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              id="topbar-logout-btn"
              onSelect={handleLogout}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
