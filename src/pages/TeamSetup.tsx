import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { saveTeamMapping, fetchTeamMapping, fetchCompanySettings } from "@/lib/db";

const CATEGORIES = [
  "Frontend",
  "Backend",
  "Payment",
  "DevOps",
  "Mobile",
  "QA",
];

interface JiraUser {
  accountId: string;
  displayName: string;
  avatarUrl: string;
}

const TeamSetup = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [jiraUsers, setJiraUsers] = useState<JiraUser[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const fetchJiraUsers = async () => {
    if (!profile?.companyId) return;
    
    setFetchingUsers(true);
    try {
      // 1. Get settings first
      const settings = await fetchCompanySettings(profile.companyId);
      if (!settings || !settings.jira) {
        toast.error("Please configure Jira integration first");
        return;
      }

      // 2. Call our internal API proxy with the credentials
      const response = await fetch(`/api/jira/users`, {
        method: "POST", // Use POST to send credentials securely in body
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: settings.jira.domain,
          email: settings.jira.email,
          token: settings.jira.apiToken,
          projectKey: settings.jira.projectKey
        })
      });

      if (!response.ok) throw new Error("Failed to fetch Jira users");
      const users = await response.json();
      setJiraUsers(users);
      toast.success(`Fetched ${users.length} users from Jira`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch Jira users. Check your integration settings.");
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    if (profile?.companyId) {
      fetchTeamMapping(profile.companyId).then((savedMapping) => {
        if (savedMapping) setMapping(savedMapping);
      });
      fetchJiraUsers();
    }
  }, [profile?.companyId]);

  const handleSaveMapping = async () => {
    if (!profile?.companyId) return;
    setLoading(true);
    try {
      await saveTeamMapping(profile.companyId, mapping);
      toast.success("Team mapping saved successfully");
    } catch (error) {
      toast.error("Failed to save team mapping");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-5 py-5 max-w-4xl mx-auto">
          <header className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight">Team Setup</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Map work categories to specific developers in your Jira workspace.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchJiraUsers} disabled={fetchingUsers}>
              <RefreshCw className={`h-4 w-4 mr-2 ${fetchingUsers ? 'animate-spin' : ''}`} />
              Refresh Users
            </Button>
          </header>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-500" />
                </div>
                <CardTitle className="text-lg">Category Mapping</CardTitle>
              </div>
              <CardDescription>
                When AI detects a category, the task will be automatically assigned to the selected person.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {CATEGORIES.map((category) => (
                  <div key={category} className="space-y-2">
                    <Label className="text-sm font-medium">{category} Lead</Label>
                    <Select
                      value={mapping[category] || ""}
                      onValueChange={(val) => setMapping({ ...mapping, [category]: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a developer" />
                      </SelectTrigger>
                      <SelectContent>
                        {jiraUsers.map((user) => (
                          <SelectItem key={user.accountId} value={user.accountId}>
                            <div className="flex items-center gap-2">
                              {user.avatarUrl && (
                                <img src={user.avatarUrl} alt="" className="w-4 h-4 rounded-full" />
                              )}
                              <span>{user.displayName}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t">
                <Button className="w-full md:w-auto md:px-12" onClick={handleSaveMapping} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save Mapping"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default TeamSetup;
