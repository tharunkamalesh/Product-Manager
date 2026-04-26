import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plug, Layers, Calendar as CalendarIcon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const Integrations = () => {
  const APPS = [
    { name: "Jira", status: "Active", icon: Layers, description: "Create real Jira tickets from your top priorities and sync progress." },
    { name: "Google Calendar", status: "Connected", icon: CalendarIcon, description: "Export action plans as .ics files to block time in your calendar." },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-5 py-5 max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">🔌 Integrations</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Connect your favorite tools to automate data capture and sync decisions.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {APPS.map((app) => (
              <div key={app.name} className="p-6 rounded-2xl border bg-card/50 relative overflow-hidden group border-dashed">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                    <app.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-widest">
                    {app.status}
                  </span>
                </div>
                <h3 className="font-bold text-base mb-2">{app.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {app.description}
                </p>
                <div className={cn(
                  "flex items-center text-[11px] font-medium transition-colors",
                  app.status === "Active" || app.status === "Connected" 
                    ? "text-primary cursor-pointer" 
                    : "text-muted-foreground/60 cursor-not-allowed"
                )}>
                  {app.status === "Active" || app.status === "Connected" ? "Manage Connection" : "Configure Connection"} 
                  <ExternalLink className="h-3 w-3 ml-1.5" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Integrations;
