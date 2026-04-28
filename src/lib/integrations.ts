import { fetchCompanySettings, fetchTeamMapping } from "./db";
import { toast } from "sonner";

interface IntegrationTask {
  title: string;
  description: string;
  priority: string;
  category: string;
}

export async function processIntegrations(companyId: string, task: IntegrationTask) {
  try {
    // 1. Fetch Company Settings
    const settings = await fetchCompanySettings(companyId);
    if (!settings) {
      console.log("No integrations configured for this company.");
      return;
    }

    const { jira, slack } = settings;
    
    // 2. Fetch Team Mapping
    const mapping = await fetchTeamMapping(companyId);
    const assigneeId = mapping ? mapping[task.category] : null;

    let jiraKey = "";
    let assigneeName = "Unassigned";

    // 3. Create Jira Issue
    if (jira && (jira.accessToken || (jira.domain && jira.apiToken))) {
      try {
        const jiraPayload: any = {
          companyId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          assigneeId: assigneeId,
        };

        if (jira.type === "oauth") {
          jiraPayload.accessToken = jira.accessToken;
          jiraPayload.cloudId = jira.cloudId;
          jiraPayload.type = "oauth";
        } else {
          jiraPayload.domain = jira.domain;
          jiraPayload.email = jira.email;
          jiraPayload.token = jira.apiToken;
          jiraPayload.projectKey = jira.projectKey;
        }

        const jiraResponse = await fetch("/api/jira/create-issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jiraPayload),
        });

        if (jiraResponse.ok) {
          const jiraData = await jiraResponse.json();
          jiraKey = jiraData.key;
          toast.success(`Jira ticket created: ${jiraKey}`);
          
          // Try to get assignee name if we have users fetched (optimization)
          // For now we'll just use the ID or generic
        } else {
          const err = await jiraResponse.json();
          console.error("Jira Integration Error:", err);
          toast.error("Failed to create Jira ticket");
        }
      } catch (e) {
        console.error("Jira Integration Fetch Error:", e);
      }
    }

    // 4. Send Slack Notification
    if (slack && (slack.webhookUrl || slack.accessToken)) {
      try {
        await fetch("/api/slack/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            priority: task.priority,
            issueKey: jiraKey,
            assignee: task.category + (assigneeId ? ` Lead` : ""),
            description: task.description,
            webhookUrl: slack.webhookUrl,
            accessToken: slack.accessToken,
            type: slack.type
          }),
        });
        toast.success("Slack notification sent");
      } catch (e) {
        console.error("Slack Integration Error:", e);
      }
    }

  } catch (error) {
    console.error("Integration Workflow Error:", error);
  }
}
