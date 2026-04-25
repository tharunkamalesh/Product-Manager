import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Plug, Layers, MessageSquare, Calendar as CalendarIcon, ExternalLink } from "lucide-react";

const Integrations = () => {
  const APPS = [
    { name: "Jira", status: "Coming Soon", icon: Layers, description: "Import bugs and sync action items with your Jira projects." },
    { name: "Slack", status: "Coming Soon", icon: MessageSquare, description: "Extract tasks from threads and post daily summaries to channels." },
    { name: "Google Calendar", status: "Coming Soon", icon: CalendarIcon, description: "Automatically block time for high-impact priorities." },
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
                <div className="flex items-center text-[11px] font-medium text-muted-foreground/60 group-hover:text-primary transition-colors cursor-not-allowed">
                  Configure Connection <ExternalLink className="h-3 w-3 ml-1.5" />
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
