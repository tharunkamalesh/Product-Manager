import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useCopilot } from "@/hooks/useCopilot";
import { useMemory } from "@/hooks/useMemory";
import {
  History as HistoryIcon,
  ArrowRight,
  Calendar,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { VerdictType } from "@/types/copilot";

const VERDICT_CONFIG: Record<
  VerdictType,
  { label: string; color: string; icon: React.ReactNode }
> = {
  right: {
    label: "Called it",
    color: "text-green-600 bg-green-50 border-green-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  wrong_urgency: {
    label: "Wrong urgency",
    color: "text-orange-600 bg-orange-50 border-orange-200",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  wrong_size: {
    label: "Wrong size",
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  wrong_impact: {
    label: "Wrong impact",
    color: "text-red-600 bg-red-50 border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
  memory_miss: {
    label: "Memory miss",
    color: "text-purple-600 bg-purple-50 border-purple-200",
    icon: <XCircle className="h-3 w-3" />,
  },
  noise_call: {
    label: "Noise call",
    color: "text-blue-600 bg-blue-50 border-blue-200",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

const History = () => {
  const { history, clearHistory } = useCopilot();
  const { memory } = useMemory();
  const verdicts = memory.verdicts || [];

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
                Past analysis sessions. Graded against reality after 24h.
              </p>
            </div>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Clear History
              </Button>
            )}
          </header>

          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-20 border border-dashed rounded-md">
                <HistoryIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No history yet. Start analyzing your inputs.
                </p>
              </div>
            ) : (
              history.map((session) => {
                const sessionVerdicts = verdicts.filter(
                  (v) => v.sessionId === session.id
                );
                const misses = sessionVerdicts.filter((v) => v.verdict !== "right");
                const hits = sessionVerdicts.filter((v) => v.verdict === "right");

                return (
                  <div key={session.id} className="rounded-md border bg-card shadow-sm">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <Calendar className="h-3 w-3" />
                          {new Date(session.timestamp).toLocaleDateString()} ·{" "}
                          {new Date(session.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                      </div>
                      <h3 className="text-sm font-bold line-clamp-1 mb-1">
                        {session.inputSummary}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-tight">
                          Top Priority:
                        </span>
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {session.topPriority}
                        </p>
                      </div>
                    </div>

                    {sessionVerdicts.length > 0 && (
                      <div className="border-t px-5 py-3 bg-muted/30">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Looking back · {hits.length}/{sessionVerdicts.length} predictions held
                        </p>
                        <div className="space-y-1.5">
                          {sessionVerdicts.map((v) => {
                            const cfg = VERDICT_CONFIG[v.verdict];
                            return (
                              <div key={v.predictionId} className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cfg.color}`}
                                >
                                  {cfg.icon} {cfg.label}
                                </span>
                                <span className="text-[11px] text-muted-foreground truncate">
                                  {v.task}
                                </span>
                                {v.delta && (
                                  <span className="text-[10px] text-muted-foreground/60 truncate">
                                    {v.delta}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {misses.length > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-2 italic">
                            Calibrating future similar calls.
                          </p>
                        )}
                      </div>
                    )}

                    {sessionVerdicts.length === 0 && (
                      <div className="border-t px-5 py-2.5 bg-muted/20">
                        <p className="text-[10px] text-muted-foreground italic">
                          Grading my own work — check back in 24h.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default History;
