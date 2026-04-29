import { fetchCompanySettings, fetchTeamMapping, fetchTeamMembers } from "./db";
import { toast } from "sonner";

interface IntegrationTask {
  title: string;
  description: string;
  priority: string;
  category: string;
  assigneeName?: string;
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

    // 2. Fetch Team Mapping & Members
    const mapping = await fetchTeamMapping(companyId);
    const members = await fetchTeamMembers(companyId);
    console.log("[Integration] Team mapping loaded:", JSON.stringify(mapping));
    console.log("[Integration] Team members loaded:", members.length);

    // 3. Resolve assignee accountId
    let assigneeId: string | null = null;
    let finalAssigneeName = "Unassigned";

    // First try direct assignee name match from AI
    const assigneeNameQuery = task.assigneeName?.trim() || "";
    if (assigneeNameQuery && assigneeNameQuery.toLowerCase() !== "none" && members && members.length > 0) {
      const lowerSearch = assigneeNameQuery.toLowerCase();
      const matchedUser = members.find((u: any) => 
        u.displayName.toLowerCase().includes(lowerSearch) || 
        lowerSearch.includes(u.displayName.toLowerCase())
      );
      
      if (matchedUser) {
        assigneeId = matchedUser.accountId;
        finalAssigneeName = matchedUser.displayName;
        console.log(`[Integration] ✅ Direct assignment match: "${task.assigneeName}" → accountId="${assigneeId}" (${finalAssigneeName})`);
      } else {
        console.warn(`[Integration] ⚠️ Direct assignment "${task.assigneeName}" not found in members.`);
      }
    }

    // Fallback to category mapping if no direct assignment
    if (!assigneeId) {
      assigneeId = resolveAssigneeId(mapping || {}, task.category);
      if (assigneeId && members && members.length > 0) {
        const found = members.find((u: any) => u.accountId === assigneeId);
        if (found) finalAssigneeName = found.displayName;
      }
    }
    console.log("[Integration] Final resolved assigneeId:", assigneeId);

    // 4. Fallback lookup via Jira API (if members list didn't have it for some reason)
    if (assigneeId && finalAssigneeName === "Unassigned" && jira && (jira.accessToken || jira.domain)) {
      try {
        const usersResp = await fetch(`/api/jira/users?companyId=${companyId}`);
        if (usersResp.ok) {
          const users = await usersResp.json();
          const found = users.find((u: any) => u.accountId === assigneeId);
          if (found) {
            finalAssigneeName = found.displayName;
            console.log("[Integration] Resolved assignee name from API:", finalAssigneeName);
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
          console.log("[Integration] ✅ Jira issue created:", jiraKey, "assignee:", finalAssigneeName);
          const assignedMsg = finalAssigneeName !== "Unassigned"
            ? ` → assigned to ${finalAssigneeName}`
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
            assignee: finalAssigneeName,
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
