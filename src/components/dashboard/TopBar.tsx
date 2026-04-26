import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, ChevronDown, LogOut, User, Settings as SettingsIcon, Moon, Sun, Filter } from "lucide-react";
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

export const TopBar = () => {
  const { theme, setTheme } = useTheme();
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
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
      description: "Search across tasks, priorities and history is coming soon.",
    });
  };

  const handleMarkAllRead = () => {
    setUnread(0);
    toast.success("Notifications marked as read");
  };

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-xl sticky top-0 z-30 flex items-center px-5 gap-4">
      {/* Search */}
      <div className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="global-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search anything..."
            className="w-full h-9 pl-9 pr-16 rounded-lg bg-muted/60 border border-transparent focus:border-border focus:bg-card text-sm placeholder:text-muted-foreground/70 outline-none transition-smooth"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground bg-card border border-border px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition-smooth"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-foreground/70" />
          ) : (
            <Moon className="h-4 w-4 text-foreground/70" />
          )}
        </button>

        {/* Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition-smooth"
              aria-label="Filters"
            >
              <Filter className="h-4 w-4 text-foreground/70" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <div className="p-3 space-y-4">
              <p className="text-sm font-semibold">Advanced Filters</p>
              <div className="space-y-2">
                <label className="text-xs font-medium">Priority</label>
                <select className="w-full h-8 text-xs bg-muted border border-border rounded px-2 outline-none">
                  <option>All Priorities</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Status</label>
                <select className="w-full h-8 text-xs bg-muted border border-border rounded px-2 outline-none">
                  <option>All Statuses</option>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Closed</option>
                </select>
              </div>
              <button
                className="w-full py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:opacity-90"
                onClick={() => toast.success("Filters applied")}
              >
                Apply Filters
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="relative h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition-smooth"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-foreground/70" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold">Notifications</p>
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
                <li key={n.id} className="px-4 py-3 hover:bg-muted/60 transition-smooth">
                  <p className="text-xs font-medium text-foreground">{n.title}</p>
                  <p className="text-[10.5px] text-muted-foreground mt-0.5">{n.time}</p>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-muted transition-smooth">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground text-xs font-semibold">
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold leading-tight">{profile?.name || "User"}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{profile?.companyName || ""}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast.message("Profile", { description: "Profile page coming soon." })}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.message("Settings", { description: "Settings panel coming soon." })}>
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              id="topbar-logout-btn"
              onSelect={handleLogout}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
