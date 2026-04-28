import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, MessageSquare, Calendar as CalendarIcon, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { fetchCompanySettings } from "@/lib/db";
import { useSearchParams } from "react-router-dom";

const IntegrationsSetup = () => {
  const { loading: authLoading, getCompanyId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<{
    jira?: any;
    slack?: any;
    google?: any;
  }>({});

  const checkStatus = async () => {
    const companyId = getCompanyId();
    if (!companyId) return;
    try {
      const data = await fetchCompanySettings(companyId);
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
    // Wait until auth has resolved before checking
    if (authLoading) return;
    checkStatus();

    // Handle success/error messages from OAuth redirect
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      toast.success(`${success.charAt(0).toUpperCase() + success.slice(1)} connected successfully!`);
      searchParams.delete("success");
      setSearchParams(searchParams);
      // Re-fetch status after successful OAuth
      checkStatus();
    }

    if (error) {
      toast.error(`Connection failed: ${error}`);
      searchParams.delete("error");
      setSearchParams(searchParams);
    }
  }, [authLoading]);

  const handleConnectJira = () => {
    if (authLoading) return;
    const companyId = getCompanyId();
    if (!companyId) {
      // This should never happen on a protected route — user is guaranteed to be signed in
      toast.error("Unable to resolve your account. Please refresh the page.");
      return;
    }
    console.log("[Jira OAuth] Initiating with companyId:", companyId);
    window.location.href = `/api/auth/jira/connect?companyId=${companyId}`;
  };

  const handleConnectSlack = () => {
    if (authLoading) return;
    const companyId = getCompanyId();
    if (!companyId) {
      toast.error("Unable to resolve your account. Please refresh the page.");
      return;
    }
    console.log("[Slack OAuth] Initiating with companyId:", companyId);
    window.location.href = `/api/auth/slack/connect?companyId=${companyId}`;
  };

  const isJiraConnected = !!integrations.jira && (integrations.jira.type === "oauth" || !!integrations.jira.apiToken);
  const isSlackConnected = !!integrations.slack && (integrations.slack.type === "oauth" || !!integrations.slack.webhookUrl);

  // Show a loading skeleton while auth context resolves
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <TopBar />
          <main className="px-5 py-5 max-w-4xl mx-auto flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="px-5 py-5 max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-[22px] font-semibold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Connect your company's Jira and Slack workspaces to enable automatic task assignment and notifications.
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
                  Authorize your Atlassian workspace to create issues and fetch your team's developers.
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
                      <span className="text-sm">Not connected</span>
                    </div>
                  )}
                </div>
                <Button 
                  id="connect-jira-btn"
                  className={`w-full ${isJiraConnected ? 'bg-secondary hover:bg-secondary/80 text-secondary-foreground' : 'bg-blue-600 hover:bg-blue-700 text-white'}`} 
                  onClick={handleConnectJira}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : isJiraConnected ? (
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
                  Authorize your Slack workspace to send automated team notifications.
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
                      <span className="text-sm">Not connected</span>
                    </div>
                  )}
                </div>
                <Button 
                  id="connect-slack-btn"
                  className={`w-full ${isSlackConnected ? 'bg-secondary hover:bg-secondary/80 text-secondary-foreground' : 'bg-purple-600 hover:bg-purple-700 text-white'}`} 
                  onClick={handleConnectSlack}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : isSlackConnected ? (
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

          {/* Info callout */}
          <div className="mt-8 bg-muted/30 rounded-lg border border-border px-5 py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">How Integrations Work</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
              {[
                { step: "1", text: "Click Connect — authorize with your company Jira or Slack account (separate from your Founder's Compass login)" },
                { step: "2", text: "After Jira is connected, go to Team Setup to fetch your real developers and map categories" },
                { step: "3", text: "Jira tasks are auto-created and assigned; Slack notifications are sent automatically" },
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

export default IntegrationsSetup;
