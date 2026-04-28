import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Save, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { saveTeamMapping, fetchTeamMapping, fetchCompanySettings } from "@/lib/db";

const CATEGORIES = [
  { key: "Frontend", label: "Frontend", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  { key: "Backend", label: "Backend", color: "bg-green-500/10 text-green-600 border-green-200" },
  { key: "Payment", label: "Payment", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  { key: "DevOps", label: "DevOps", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
  { key: "Mobile", label: "Mobile", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  { key: "QA", label: "QA", color: "bg-red-500/10 text-red-600 border-red-200" },
  { key: "Other", label: "Other", color: "bg-muted text-muted-foreground border-border" },
];

interface JiraUser {
  accountId: string;
  displayName: string;
  avatarUrl: string;
}

const TeamSetup = () => {
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [jiraUsers, setJiraUsers] = useState<JiraUser[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [jiraConnected, setJiraConnected] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const fetchJiraUsers = async (showToast = true) => {
    if (!profile?.companyId) return;

    setFetchingUsers(true);
    try {
      // Verify Jira is connected
      const settings = await fetchCompanySettings(profile.companyId);
      if (!settings?.jira) {
        setJiraConnected(false);
        if (showToast) toast.error("Please connect Jira first via Settings → Integrations.");
        return;
      }
      setJiraConnected(true);

      // Fetch users — pass companyId and let the API read credentials from Firestore
      const response = await fetch(`/api/jira/users?companyId=${profile.companyId}`);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch Jira users");
      }

      const users: JiraUser[] = await response.json();

      if (users.length === 0) {
        toast.warning("No assignable users found in Jira project. Check your project key.");
        return;
      }

      setJiraUsers(users);
      setLastSynced(new Date().toLocaleTimeString());
      if (showToast) toast.success(`Developers synced from Jira (${users.length} found)`);
    } catch (error: any) {
      console.error("[TeamSetup] fetchJiraUsers error:", error);
      if (showToast) toast.error(error.message || "Failed to fetch Jira users.");
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    if (!profile?.companyId) return;
    // Load saved mapping + fetch users in parallel
    fetchTeamMapping(profile.companyId).then((savedMapping) => {
      if (savedMapping && Object.keys(savedMapping).length > 0) {
        setMapping(savedMapping);
      }
    });
    fetchJiraUsers(false);
  }, [profile?.companyId]);

  const handleSaveMapping = async () => {
    if (!profile?.companyId) return;
    setSaving(true);
    try {
      await saveTeamMapping(profile.companyId, mapping);
      toast.success("Team mapping saved successfully");
    } catch (error) {
      console.error("[TeamSetup] save error:", error);
      toast.error("Failed to save team mapping. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getUserById = (accountId: string) =>
    jiraUsers.find((u) => u.accountId === accountId);

  const mappedCount = Object.values(mapping).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-5 py-5 max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight">Team Setup</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Map work categories to developers. Tasks will be auto-assigned when created.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchJiraUsers(true)}
              disabled={fetchingUsers}
            >
              {fetchingUsers ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync from Jira
            </Button>
          </header>

          {/* Status Bar */}
          <div className="mb-6">
            {!jiraConnected && !fetchingUsers && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-500/10 px-4 py-3 rounded-lg border border-amber-200 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>
                  Jira is not connected. Go to{" "}
                  <a href="/integrations" className="underline font-medium">
                    Integrations
                  </a>{" "}
                  to connect first.
                </span>
              </div>
            )}
            {fetchingUsers && (
              <div className="flex items-center gap-2 text-muted-foreground bg-muted/40 px-4 py-3 rounded-lg border border-dashed text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Fetching developers from Jira workspace...</span>
              </div>
            )}
            {jiraConnected && !fetchingUsers && jiraUsers.length > 0 && (
              <div className="flex items-center gap-2 text-green-600 bg-green-500/10 px-4 py-3 rounded-lg border border-green-200 text-sm">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>{jiraUsers.length} developers</strong> synced from Jira workspace
                  {lastSynced && <span className="text-green-600/70 ml-2">· Synced at {lastSynced}</span>}
                </span>
              </div>
            )}
          </div>

          {/* Mapping Card */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Category → Developer Mapping</CardTitle>
                    <CardDescription className="mt-0.5">
                      AI will auto-assign tickets to the mapped developer
                    </CardDescription>
                  </div>
                </div>
                {mappedCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {mappedCount} / {CATEGORIES.length} mapped
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {jiraUsers.length === 0 && !fetchingUsers ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No developers loaded yet.</p>
                  <p className="text-xs mt-1">Connect Jira and click "Sync from Jira" to load team members.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {CATEGORIES.map(({ key, label, color }) => {
                    const selectedUser = mapping[key] ? getUserById(mapping[key]) : null;
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">{label} Lead</Label>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${color}`}>
                            {key}
                          </span>
                        </div>
                        <Select
                          value={mapping[key] || ""}
                          onValueChange={(val) =>
                            setMapping((prev) => ({ ...prev, [key]: val }))
                          }
                          disabled={fetchingUsers || jiraUsers.length === 0}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a developer">
                              {selectedUser && (
                                <div className="flex items-center gap-2">
                                  {selectedUser.avatarUrl && (
                                    <img
                                      src={selectedUser.avatarUrl}
                                      alt=""
                                      className="w-5 h-5 rounded-full object-cover"
                                    />
                                  )}
                                  <span>{selectedUser.displayName}</span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">
                              <span className="text-muted-foreground">Unassigned</span>
                            </SelectItem>
                            {jiraUsers.map((user) => (
                              <SelectItem key={user.accountId} value={user.accountId}>
                                <div className="flex items-center gap-2">
                                  {user.avatarUrl && (
                                    <img
                                      src={user.avatarUrl}
                                      alt=""
                                      className="w-5 h-5 rounded-full object-cover"
                                    />
                                  )}
                                  <span>{user.displayName}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Save Button */}
              <div className="pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  Mappings are saved per-company and used for automatic Jira task assignment.
                </p>
                <Button
                  className="sm:w-auto w-full px-10"
                  onClick={handleSaveMapping}
                  disabled={saving || jiraUsers.length === 0}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Mapping
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* How it works */}
          <div className="mt-6 bg-muted/30 rounded-lg border border-border px-5 py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">How Auto-Assignment Works</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
              {[
                { step: "1", text: "PM types task description" },
                { step: "2", text: "AI classifies category (Frontend, Backend...)" },
                { step: "3", text: "Mapped developer fetched from this table" },
                { step: "4", text: "Jira ticket created + auto-assigned" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step}
                  </span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeamSetup;
