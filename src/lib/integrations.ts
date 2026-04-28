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

    // 2. Fetch Team Mapping — mapping stores { Category: accountId }
    const mapping = await fetchTeamMapping(companyId);
    const assigneeId: string | null = mapping?.[task.category] || null;

    // 3. Try to resolve assignee display name from Jira users
    let assigneeName = "Unassigned";
    if (assigneeId && jira && (jira.accessToken || jira.domain)) {
      try {
        const usersResp = await fetch(`/api/jira/users?companyId=${companyId}`);
        if (usersResp.ok) {
          const users = await usersResp.json();
          const found = users.find((u: any) => u.accountId === assigneeId);
          if (found) assigneeName = found.displayName;
        }
      } catch (e) {
        console.warn("[processIntegrations] Could not resolve assignee name:", e);
      }
    }

    let jiraKey = "";

    // 4. Create Jira Issue
    if (jira && (jira.accessToken || (jira.domain && jira.apiToken))) {
      try {
        const jiraPayload: any = {
          companyId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          assigneeId: assigneeId || undefined,
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
          const assignedMsg = assigneeName !== "Unassigned"
            ? ` → assigned to ${assigneeName}`
            : " (Unassigned)";
          toast.success(`Jira ticket created: ${jiraKey}${assignedMsg}`);
        } else {
          const err = await jiraResponse.json();
          console.error("Jira Integration Error:", err);
          toast.error("Failed to create Jira ticket");
        }
      } catch (e) {
        console.error("Jira Integration Fetch Error:", e);
      }
    }

    // 5. Send Slack Notification
    if (slack && (slack.webhookUrl || slack.accessToken)) {
      try {
        await fetch("/api/slack/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            priority: task.priority,
            issueKey: jiraKey,
            assignee: assigneeName,
            category: task.category,
            description: task.description,
            webhookUrl: slack.webhookUrl,
            accessToken: slack.accessToken,
            type: slack.type,
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

