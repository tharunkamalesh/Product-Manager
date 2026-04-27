import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useCopilot } from "@/hooks/useCopilot";
import { History as HistoryIcon, ArrowRight, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const History = () => {
  const { history, clearHistory } = useCopilot();

  const handleClear = () => {
    if (confirm("Clear all analysis history? This cannot be undone.")) {
      clearHistory();
      toast.success("History cleared");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-5 py-5 max-w-4xl mx-auto">
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight">History</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Past analysis sessions and AI decisions.
              </p>
            </div>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Clear History
              </Button>
            )}
          </header>

          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-20 border border-dashed rounded-md">
                <HistoryIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">No history yet. Start analyzing your inputs.</p>
              </div>
            ) : (
              history.map((session) => (
                <div key={session.id} className="p-5 rounded-md border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <Calendar className="h-3 w-3" />
                      {new Date(session.timestamp).toLocaleDateString()} · {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-sm font-bold line-clamp-1 mb-1">{session.inputSummary}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-tight">Top Priority:</span>
                    <p className="text-xs text-muted-foreground truncate flex-1">{session.topPriority}</p>
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

export default History;
