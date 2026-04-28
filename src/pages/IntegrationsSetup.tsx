import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, MessageSquare, Calendar as CalendarIcon, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { fetchCompanySettings } from "@/lib/db";
import { useSearchParams } from "react-router-dom";

const IntegrationsSetup = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<{
    jira?: any;
    slack?: any;
    google?: any;
  }>({});

  const checkStatus = async () => {
    if (!profile?.companyId) return;
    try {
      const data = await fetchCompanySettings(profile.companyId);
      if (data) {
        setIntegrations({
          jira: data.jira,
          slack: data.slack,
          google: data.google
        });
      }
    } catch (error) {
      console.error("Failed to fetch integration status", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Handle success/error messages from redirect
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    
    if (success) {
      toast.success(`${success.charAt(0).toUpperCase() + success.slice(1)} connected successfully!`);
      // Clear params to prevent re-toasting
      searchParams.delete("success");
      setSearchParams(searchParams);
    }
    
    if (error) {
      toast.error(`Connection failed: ${error}`);
      searchParams.delete("error");
      setSearchParams(searchParams);
    }
  }, [profile?.companyId, searchParams]);

  const handleConnectJira = () => {
    if (!profile?.companyId) return;
    window.location.href = `/api/auth/jira/connect?companyId=${profile.companyId}`;
  };

  const handleConnectSlack = () => {
    if (!profile?.companyId) return;
    window.location.href = `/api/auth/slack/connect?companyId=${profile.companyId}`;
  };

  const isJiraConnected = !!integrations.jira && (integrations.jira.type === "oauth" || !!integrations.jira.apiToken);
  const isSlackConnected = !!integrations.slack && (integrations.slack.type === "oauth" || !!integrations.slack.webhookUrl);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-5 py-5 max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-[22px] font-semibold tracking-tight">Integrations Setup</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Connect your company's Jira and Slack workspaces to automate task assignment.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Jira Connection */}
            <Card className="border-border shadow-sm flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-lg">Jira</CardTitle>
                </div>
                <CardDescription>
                  Connect to Atlassian to create issues and fetch developers.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="mb-6">
                  {isJiraConnected ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-500/10 p-3 rounded-md border border-green-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Jira Connected</span>
                      <span className="text-[10px] ml-auto text-green-600/70">{integrations.jira?.siteUrl || "Workspace Ready"}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/40 p-3 rounded-md border border-dashed">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Jira Not Connected</span>
                    </div>
                  )}
                </div>
                <Button 
                  className={`w-full ${isJiraConnected ? 'bg-secondary hover:bg-secondary/80 text-secondary-foreground' : 'bg-blue-600 hover:bg-blue-700'}`} 
                  onClick={handleConnectJira}
                >
                  {isJiraConnected ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reconnect Jira
                    </>
                  ) : (
                    "Connect Jira"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Slack Connection */}
            <Card className="border-border shadow-sm flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-purple-500" />
                  </div>
                  <CardTitle className="text-lg">Slack</CardTitle>
                </div>
                <CardDescription>
                  Connect to Slack for automated team notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="mb-6">
                  {isSlackConnected ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-500/10 p-3 rounded-md border border-green-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Slack Connected</span>
                      <span className="text-[10px] ml-auto text-green-600/70">{integrations.slack?.teamName || "Workspace Ready"}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/40 p-3 rounded-md border border-dashed">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Slack Not Connected</span>
                    </div>
                  )}
                </div>
                <Button 
                  className={`w-full ${isSlackConnected ? 'bg-secondary hover:bg-secondary/80 text-secondary-foreground' : 'bg-purple-600 hover:bg-purple-700 text-white'}`} 
                  onClick={handleConnectSlack}
                >
                  {isSlackConnected ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reconnect Slack
                    </>
                  ) : (
                    "Connect Slack"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Google Calendar (Coming Soon) */}
            <Card className="border-border shadow-sm flex flex-col opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <CalendarIcon className="h-4 w-4 text-red-500" />
                  </div>
                  <CardTitle className="text-lg text-muted-foreground">Google Calendar</CardTitle>
                </div>
                <CardDescription>
                  Sync your priorities to your calendar.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end pt-4">
                <Button variant="outline" className="w-full cursor-not-allowed" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default IntegrationsSetup;
