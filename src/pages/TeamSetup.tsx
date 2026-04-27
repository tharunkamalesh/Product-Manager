import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Users, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface JiraUser {
  accountId: string;
  displayName: string;
  avatarUrl: string;
}

interface TeamMapping {
  frontend?: string;
  backend?: string;
  payment?: string;
  devops?: string;
  mobile?: string;
}

const CATEGORIES = [
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "payment", label: "Payment" },
  { id: "devops", label: "DevOps" },
  { id: "mobile", label: "Mobile" },
];

const TeamSetup = () => {
  const { user } = useAuth();
  const [jiraUsers, setJiraUsers] = useState<JiraUser[]>([]);
  const [mapping, setMapping] = useState<TeamMapping>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // 1. Fetch Jira users from our API
        const usersRes = await fetch("/api/jira/users");
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setJiraUsers(usersData);
        }

        // 2. Fetch existing mapping from Firestore
        const docRef = doc(db, "team_mapping", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMapping(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching team setup data:", error);
        toast.error("Failed to load team data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "team_mapping", user.uid), {
        ...mapping,
        companyId: user.uid,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Team mapping saved successfully");
    } catch (error) {
      console.error("Error saving mapping:", error);
      toast.error("Failed to save mapping");
    } finally {
      setSaving(false);
    }
  };

  const updateMapping = (category: string, accountId: string) => {
    setMapping((prev) => ({ ...prev, [category]: accountId }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-5 py-5 max-w-2xl mx-auto">
          <header className="mb-8">
            <h1 className="text-[22px] font-semibold tracking-tight">Team setup</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Map work categories to Jira developers for automatic task assignment.
            </p>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-card/50 border rounded-md p-6 space-y-6 shadow-sm">
                {CATEGORIES.map((cat) => (
                  <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold">{cat.label}</h4>
                      <p className="text-xs text-muted-foreground">Assign tasks related to {cat.label.toLowerCase()} work.</p>
                    </div>
                    <div className="w-full sm:w-[240px]">
                      <Select
                        value={mapping[cat.id as keyof TeamMapping] || ""}
                        onValueChange={(val) => updateMapping(cat.id, val)}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select Developer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {jiraUsers.map((u) => (
                            <SelectItem key={u.accountId} value={u.accountId}>
                              <div className="flex items-center gap-2">
                                <img src={u.avatarUrl} className="h-4 w-4 rounded-full" alt="" />
                                <span>{u.displayName}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="px-6"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Mapping
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded p-4 flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-[11px] leading-relaxed text-primary/80">
                  <span className="font-bold">Pro Tip:</span> Automatic assignment works by analyzing the task type during the analysis phase. If you change these mappings, they will apply to all future "Create Jira Task" actions.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TeamSetup;
