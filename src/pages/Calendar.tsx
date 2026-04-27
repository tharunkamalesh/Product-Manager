import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useCopilot } from "@/hooks/useCopilot";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

const Calendar = () => {
  const { latestResult } = useCopilot();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-5 py-5 max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-[22px] font-semibold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Suggested time blocks for your top priorities.
            </p>
          </header>

          <div className="space-y-4">
            {!latestResult || latestResult.actionPlan.length === 0 ? (
              <div className="text-center py-20 border border-dashed rounded-md">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">No time blocks suggested yet. Run an analysis first.</p>
              </div>
            ) : (
              latestResult.actionPlan.map((step, i) => (
                <div key={i} className="p-4 rounded border bg-card flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded bg-primary/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary uppercase">Today</span>
                    <span className="text-lg font-bold text-primary">{new Date().getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold truncate">{step.task}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Next step: {step.nextStep}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground text-sm font-medium shrink-0">
                    <Clock className="h-4 w-4" />
                    {step.timeEstimate}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-12 p-6 rounded-md bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground leading-relaxed text-center italic">
              "Calendar mapping is illustrative. Focus on finishing these blocks today."
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Calendar;
