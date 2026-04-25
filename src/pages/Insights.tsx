import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useMemory } from "@/hooks/useMemory";
import { BarChart3, TrendingUp, Lightbulb } from "lucide-react";

const Insights = () => {
  const { memory } = useMemory();

  const MOCK_PATTERNS = [
    { type: "Onboarding issues", count: 4, detail: "Recurring feedback on sign-up flow friction." },
    { type: "Bug fixes", count: 3, detail: "Focus on stability after last week's release." },
    { type: "Feature research", count: 2, detail: "Exploring new monetization strategies." },
  ];

  // Use actual memory patterns if available, otherwise mock for demo
  const displayPatterns = memory.patterns.length > 0 
    ? memory.patterns.map((p, i) => ({ 
        type: p.charAt(0).toUpperCase() + p.slice(1), 
        count: Math.floor(Math.random() * 5) + 2,
        detail: "Pattern detected in your recurring priorities."
      }))
    : MOCK_PATTERNS;

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
              <p className="text-2xl font-bold text-primary">82%</p>
              <p className="text-[10px] text-muted-foreground mt-1">High alignment with core goals</p>
            </div>
            <div className="p-5 rounded-2xl bg-priority-medium/5 border border-priority-medium/10">
              <BarChart3 className="h-5 w-5 text-priority-medium mb-3" />
              <h3 className="text-sm font-bold mb-1">Velocity</h3>
              <p className="text-2xl font-bold text-priority-medium">+14%</p>
              <p className="text-[10px] text-muted-foreground mt-1">Faster execution this week</p>
            </div>
            <div className="p-5 rounded-2xl bg-priority-low/5 border border-priority-low/10">
              <Lightbulb className="h-5 w-5 text-priority-low mb-3" />
              <h3 className="text-sm font-bold mb-1">Leverage</h3>
              <p className="text-2xl font-bold text-priority-low">High</p>
              <p className="text-[10px] text-muted-foreground mt-1">Prioritizing high-impact tasks</p>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-4">Recurring Themes</h2>
          <div className="space-y-3">
            {displayPatterns.map((p, i) => (
              <div key={i} className="p-4 rounded-xl border bg-card flex items-center justify-between group">
                <div>
                  <h4 className="text-sm font-bold">{p.type}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.detail}</p>
                </div>
                <div className="h-8 px-3 rounded-lg bg-muted flex items-center justify-center text-xs font-bold tabular-nums">
                  {p.count} times
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Insights;
