import { Bell, Search, ChevronDown } from "lucide-react";

export const TopBar = () => {
  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-xl sticky top-0 z-30 flex items-center px-5 gap-4">
      {/* Search */}
      <div className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
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
        <button className="relative h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition-smooth">
          <Bell className="h-4 w-4 text-foreground/70" />
          <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
            3
          </span>
        </button>
        <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-muted transition-smooth">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground text-xs font-semibold">
            AV
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold leading-tight">Aman Verma</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Product Manager</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
};
