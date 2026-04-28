import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useCopilot } from "@/hooks/useCopilot";
import { useMemory } from "@/hooks/useMemory";
import { BarChart3, TrendingUp, Lightbulb } from "lucide-react";
import { useMemo } from "react";

const Insights = () => {
  const { history } = useCopilot();
  const { memory } = useMemory();

  const verdicts = memory.verdicts || [];
  const misses = verdicts.filter((v) => v.verdict !== "right");
  const accuracy =
    verdicts.length > 0
      ? Math.round(
          (verdicts.filter((v) => v.verdict === "right").length / verdicts.length) * 100
        )
      : null;

  const insights = useMemo(() => {
    if (history.length === 0)
      return { focusScore: 0, velocity: 0, leverage: "None", themes: [] };

    const highPriorityCount = history.filter((s) =>
      s.result.topPriorities.some((p) => p.impact === "High")
    ).length;
    const focusScore = Math.round((highPriorityCount / history.length) * 100);
    const velocity = history.length;
    const highImpactCount = history.reduce(
      (acc, s) => acc + s.result.topPriorities.filter((p) => p.impact === "High").length,
      0
    );
    const leverage = highImpactCount > history.length * 0.5 ? "High" : "Moderate";
    const themes = history.slice(0, 5).map((s) => ({
      type: s.topPriority,
      count: 1,
      detail: "Detected in your recent priorities.",
    }));

    return { focusScore, velocity, leverage, themes };
  }, [history]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-5 py-5 max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-[22px] font-semibold tracking-tight">Insights</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              AI-detected patterns and recurring themes in your work.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-5 rounded-md bg-primary/5 border border-primary/10">
              <TrendingUp className="h-5 w-5 text-primary mb-3" />
              <h3 className="text-sm font-bold mb-1">Focus Score</h3>
              <p className="text-2xl font-bold text-primary">{insights.focusScore}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Alignment with High Priority
              </p>
            </div>
            <div className="p-5 rounded-md bg-priority-medium/5 border border-priority-medium/10">
              <BarChart3 className="h-5 w-5 text-priority-medium mb-3" />
              <h3 className="text-sm font-bold mb-1">Sessions</h3>
              <p className="text-2xl font-bold text-priority-medium">{insights.velocity}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Total analyses performed</p>
            </div>
            <div className="p-5 rounded-md bg-priority-low/5 border border-priority-low/10">
              <Lightbulb className="h-5 w-5 text-priority-low mb-3" />
              <h3 className="text-sm font-bold mb-1">Leverage</h3>
              <p className="text-2xl font-bold text-priority-low">{insights.leverage}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Impact potential of current work
              </p>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-4">Recurring Themes</h2>
          <div className="space-y-3">
            {insights.themes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                No themes detected yet. Run more analyses!
              </p>
            ) : (
              insights.themes.map((p, i) => (
                <div
                  key={i}
                  className="p-4 rounded border bg-card flex items-center justify-between group"
                >
                  <div>
                    <h4 className="text-sm font-bold">{p.type}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {verdicts.length >= 3 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Where the AI was wrong</h2>
                {accuracy !== null && (
                  <span className="text-sm text-muted-foreground font-medium">
                    {accuracy}% accuracy across {verdicts.length} predictions
                  </span>
                )}
              </div>

              {misses.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-md">
                  <p className="text-sm text-muted-foreground">
                    All recent predictions held. Run more sessions to see calibration data.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {misses.slice(0, 10).map((v, i) => (
                    <div
                      key={i}
                      className="p-3 rounded border bg-card flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{v.task}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{v.modelNote}</p>
                        {v.delta && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5">{v.delta}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                        {v.verdict.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {verdicts.length > 0 && verdicts.length < 3 && (
            <div className="mt-8 p-4 rounded border border-dashed text-center">
              <p className="text-sm text-muted-foreground">
                Grading my own work — need a few more sessions to show calibration.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Insights;
