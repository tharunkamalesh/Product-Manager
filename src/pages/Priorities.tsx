import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useCopilot } from "@/hooks/useCopilot";
import { Button } from "@/components/ui/button";
import { Flame, RefreshCcw, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const Priorities = () => {
  const { latestResult } = useCopilot();
  const navigate = useNavigate();

  const handleRerun = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-5 py-5 max-w-4xl mx-auto">
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">⚡ Priorities</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                View the latest high-leverage decisions made by the AI.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRerun}>
              <RefreshCcw className="h-3.5 w-3.5 mr-2" />
              Re-run Analysis
            </Button>
          </header>

          <div className="space-y-6">
            {!latestResult || latestResult.topPriorities.length === 0 ? (
              <div className="text-center py-20 border border-dashed rounded-2xl">
                <Flame className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">No active priorities found. Run an analysis on the dashboard first.</p>
                <Button className="mt-4" onClick={() => navigate("/")}>Go to Dashboard</Button>
              </div>
            ) : (
              latestResult.topPriorities.map((p, i) => (
                <div key={i} className="bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/40" />
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                          p.impact === "High" ? "bg-priority-high/15 text-priority-high" : "bg-priority-medium/15 text-priority-medium"
                        )}>
                          {p.impact} Impact
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent text-accent-foreground uppercase tracking-wider">
                          {p.urgency} Urgency
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                          {p.effort} Effort
                        </span>
                      </div>
                      <h2 className="text-lg font-bold mb-2">{p.task}</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {p.reasoning}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors">
                      <CheckCircle2 className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Priorities;
