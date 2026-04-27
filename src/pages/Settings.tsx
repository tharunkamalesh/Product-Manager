import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useMemory } from "@/hooks/useMemory";
import { useCopilot } from "@/hooks/useCopilot";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Brain, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const Settings = () => {
  const { memory, setGoal, setUseMemoryToggle, clearMemory } = useMemory();
  const { clearHistory } = useCopilot();

  const handleReset = () => {
    if (confirm("Reset everything? This will clear your goal, memory context, and analysis history.")) {
      clearMemory();
      clearHistory();
      toast.success("System reset complete");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-5 py-5 max-w-2xl mx-auto">
          <header className="mb-8">
            <h1 className="text-[22px] font-semibold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Configure your copilot's behavior and core context.
            </p>
          </header>

          <div className="space-y-8">
            {/* Core Goal */}
            <div className="p-6 rounded-md border bg-card shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Strategic Goal</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                The AI uses this to prioritize tasks that align with your long-term objective.
              </p>
              <Input
                value={memory.userProfile.goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Reach $10k MRR by Q4 or launch the mobile app"
                className="bg-muted/50 border-border"
              />
            </div>

            {/* AI Behavior */}
            <div className="p-6 rounded-md border bg-card shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-purple-500" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">AI Behavior</h2>
              </div>
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h3 className="text-sm font-bold">Use Memory Context</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Allow the AI to learn from your past priorities and patterns to give better suggestions over time.
                  </p>
                </div>
                <Switch checked={memory.useMemoryToggle} onCheckedChange={setUseMemoryToggle} />
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-8 border-t">
              <h2 className="text-sm font-bold text-destructive uppercase tracking-wider mb-4">Danger Zone</h2>
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5"
                onClick={handleReset}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset System (Clear all memory & history)
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
