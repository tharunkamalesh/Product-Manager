import { fetchCompanySettings, fetchTeamMapping } from "./db";
import { toast } from "sonner";

interface IntegrationTask {
  title: string;
  description: string;
  priority: string;
  category: string;
}

/**
 * Resolves the accountId for a given category from the team mapping.
 * Tries exact match first, then case-insensitive match.
 */
function resolveAssigneeId(
  mapping: Record<string, string>,
  category: string
): string | null {
  if (!mapping || !category) return null;

  // 1. Exact match
  if (mapping[category] && mapping[category] !== "" && mapping[category] !== "none") {
    console.log(`[Integration] ✅ Exact match: category="${category}" → accountId="${mapping[category]}"`);
    return mapping[category];
  }

  // 2. Case-insensitive match
  const lowerCategory = category.toLowerCase();
  const matchingKey = Object.keys(mapping).find(
    (k) => k.toLowerCase() === lowerCategory
  );
  if (matchingKey && mapping[matchingKey] && mapping[matchingKey] !== "" && mapping[matchingKey] !== "none") {
    console.log(`[Integration] ✅ Case-insensitive match: category="${category}" matched key="${matchingKey}" → accountId="${mapping[matchingKey]}"`);
    return mapping[matchingKey];
  }

  // 3. No match
  console.warn(`[Integration] ⚠️ No mapping found for category="${category}". Available keys: ${Object.keys(mapping).join(", ")}`);
  return null;
}

export async function processIntegrations(companyId: string, task: IntegrationTask) {
  try {
    console.log("[Integration] Starting for companyId:", companyId, "task:", task.title, "category:", task.category);

    // 1. Fetch Company Settings
    const settings = await fetchCompanySettings(companyId);
    if (!settings) {
      console.log("[Integration] No integrations configured for this company.");
      return;
    }

    const { jira, slack } = settings;
    console.log("[Integration] Jira config present:", !!jira, "Slack config present:", !!slack);

    // 2. Fetch Team Mapping
    const mapping = await fetchTeamMapping(companyId);
    console.log("[Integration] Team mapping loaded:", JSON.stringify(mapping));

    // 3. Resolve assignee accountId
    const assigneeId = resolveAssigneeId(mapping || {}, task.category);
    console.log("[Integration] Resolved assigneeId:", assigneeId);

    // 4. Resolve assignee display name
    let assigneeName = "Unassigned";
    if (assigneeId && jira && (jira.accessToken || jira.domain)) {
      try {
        const usersResp = await fetch(`/api/jira/users?companyId=${companyId}`);
        if (usersResp.ok) {
          const users = await usersResp.json();
          const found = users.find((u: any) => u.accountId === assigneeId);
          if (found) {
            assigneeName = found.displayName;
            console.log("[Integration] Resolved assignee name:", assigneeName);
          }
        }
      } catch (e) {
        console.warn("[Integration] Could not resolve assignee name:", e);
      }
    }

    let jiraKey = "";

    // 5. Create Jira Issue
    if (jira && (jira.accessToken || (jira.domain && jira.apiToken))) {
      try {
        const jiraPayload: any = {
          companyId,
          title: task.title,
          description: task.description,
          priority: task.priority,
        };

        // Only include assigneeId if it's a valid non-empty string
        if (assigneeId && assigneeId.trim() !== "" && assigneeId !== "none") {
          jiraPayload.assigneeId = assigneeId;
          console.log("[Integration] Sending assigneeId to Jira:", assigneeId);
        } else {
          console.log("[Integration] No assignee — creating unassigned Jira ticket.");
        }

        if (jira.type === "oauth" || jira.accessToken) {
          jiraPayload.accessToken = jira.accessToken;
          jiraPayload.cloudId = jira.cloudId;
          jiraPayload.type = "oauth";
        } else {
          jiraPayload.domain = jira.domain;
          jiraPayload.email = jira.email;
          jiraPayload.token = jira.apiToken;
          jiraPayload.projectKey = jira.projectKey;
        }

        console.log("[Integration] Calling /api/jira/create-issue with payload:", JSON.stringify({
          ...jiraPayload,
          token: jiraPayload.token ? "[REDACTED]" : undefined,
          accessToken: jiraPayload.accessToken ? "[REDACTED]" : undefined,
        }));

        const jiraResponse = await fetch("/api/jira/create-issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jiraPayload),
        });

        if (jiraResponse.ok) {
          const jiraData = await jiraResponse.json();
          jiraKey = jiraData.key;
          console.log("[Integration] ✅ Jira issue created:", jiraKey, "assignee:", assigneeName);
          const assignedMsg = assigneeName !== "Unassigned"
            ? ` → assigned to ${assigneeName}`
            : " (Unassigned)";
          toast.success(`Jira ticket created: ${jiraKey}${assignedMsg}`);
        } else {
          const err = await jiraResponse.json().catch(() => ({}));
          console.error("[Integration] ❌ Jira API error:", jiraResponse.status, err);
          toast.error("Failed to create Jira ticket");
        }
      } catch (e) {
        console.error("[Integration] ❌ Jira fetch error:", e);
      }
    } else {
      console.log("[Integration] Jira not configured — skipping ticket creation.");
    }

    // 6. Send Slack Notification
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
        console.error("[Integration] Slack error:", e);
      }
    }
  } catch (error) {
    console.error("[Integration] ❌ Workflow error:", error);
  }
}
