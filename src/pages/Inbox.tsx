import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useCopilot } from "@/hooks/useCopilot";
import { Button } from "@/components/ui/button";
import { Trash2, Play, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const Inbox = () => {
  const { inbox, addToInbox, removeFromInbox } = useCopilot();
  const [newInput, setNewInput] = useState("");
  const navigate = useNavigate();

  const handleAdd = () => {
    if (!newInput.trim()) return;
    addToInbox(newInput);
    setNewInput("");
    toast.success("Added to inbox");
  };

  const handleAnalyze = (text: string) => {
    navigate("/", { state: { analyze: text } });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-5 py-5 max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">📥 Inbox</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Raw input staging. Save ideas or tasks here before processing them.
            </p>
          </header>

          <div className="flex gap-2 mb-6">
            <Input 
              value={newInput} 
              onChange={(e) => setNewInput(e.target.value)}
              placeholder="Quick add something..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="space-y-3">
            {inbox.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl">
                <p className="text-muted-foreground text-sm">Your inbox is empty.</p>
              </div>
            ) : (
              inbox.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border bg-card shadow-sm flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAnalyze(item.text)}
                      className="text-primary hover:text-primary"
                    >
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                      Analyze
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeFromInbox(item.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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

export default Inbox;
