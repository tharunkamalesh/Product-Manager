import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useCopilot } from "@/hooks/useCopilot";
import { BarChart3, TrendingUp, Lightbulb } from "lucide-react";
import { useMemo } from "react";

const Insights = () => {
  const { history } = useCopilot();

  const insights = useMemo(() => {
    if (history.length === 0) return {
      focusScore: 0,
      velocity: 0,
      leverage: "None",
      themes: []
    };

    // Calculate Focus Score (% of High priority tasks)
    const highPriorityCount = history.filter(s => 
      s.result.topPriorities.some(p => p.impact === "High")
    ).length;
    const focusScore = Math.round((highPriorityCount / history.length) * 100);

    // Calculate Velocity (count of analyses)
    const velocity = history.length;

    // Calculate Leverage (High impact vs Medium/Low)
    const highImpactCount = history.reduce((acc, s) => 
      acc + s.result.topPriorities.filter(p => p.impact === "High").length, 0
    );
    const leverage = highImpactCount > history.length ? "High" : "Moderate";

    // Extract Themes (from memory patterns - or here from topPriority text)
    const themes = history.slice(0, 5).map(s => ({
      type: s.topPriority,
      count: 1,
      detail: "Detected in your recent priorities."
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
            <h1 className="text-2xl font-bold tracking-tight">📊 Insights</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              AI-detected patterns and recurring themes in your work.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
              <TrendingUp className="h-5 w-5 text-primary mb-3" />
              <h3 className="text-sm font-bold mb-1">Focus Score</h3>
              <p className="text-2xl font-bold text-primary">{insights.focusScore}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">Alignment with High Priority</p>
            </div>
            <div className="p-5 rounded-2xl bg-priority-medium/5 border border-priority-medium/10">
              <BarChart3 className="h-5 w-5 text-priority-medium mb-3" />
              <h3 className="text-sm font-bold mb-1">Sessions</h3>
              <p className="text-2xl font-bold text-priority-medium">{insights.velocity}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Total analyses performed</p>
            </div>
            <div className="p-5 rounded-2xl bg-priority-low/5 border border-priority-low/10">
              <Lightbulb className="h-5 w-5 text-priority-low mb-3" />
              <h3 className="text-sm font-bold mb-1">Leverage</h3>
              <p className="text-2xl font-bold text-priority-low">{insights.leverage}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Impact potential of current work</p>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-4">Recurring Themes</h2>
          <div className="space-y-3">
            {insights.themes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No themes detected yet. Run more analyses!</p>
            ) : (
              insights.themes.map((p, i) => (
                <div key={i} className="p-4 rounded-xl border bg-card flex items-center justify-between group">
                  <div>
                    <h4 className="text-sm font-bold">{p.type}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.detail}</p>
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

export default Insights;
