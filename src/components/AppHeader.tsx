import { Sparkles } from "lucide-react";

export const AppHeader = () => {
  return (
    <header className="border-b border-border/60 bg-card/40 backdrop-blur-xl sticky top-0 z-30">
      <div className="mx-auto max-w-[1400px] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-elegant">
            <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-semibold tracking-tight">PM Daily Copilot</h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Decide what matters today
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          <span>MVP · Mock AI</span>
        </div>
      </div>
    </header>
  );
};
