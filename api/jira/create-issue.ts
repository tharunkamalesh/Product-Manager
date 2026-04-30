import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendSlackMessage } from "../_lib/slack";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      companyId,
      title,
      description,
      priority,
      assigneeId,
      // OAuth fields
      accessToken: directAccessToken,
      cloudId: directCloudId,
      type,
      // Basic Auth fields (fallback/MVP)
      domain: envDomain,
      email: envEmail,
      token: envToken,
      projectKey: envProjectKey,
    } = req.body;

    let accessToken = directAccessToken;
    let cloudId = directCloudId;
    let domain = envDomain || process.env.JIRA_DOMAIN;
    let email = envEmail || process.env.JIRA_EMAIL;
    let token = envToken || process.env.JIRA_API_TOKEN;
    let projectKey = envProjectKey || process.env.JIRA_PROJECT_KEY || "KAN";

    // If companyId provided and no explicit creds, try Firestore
    if (companyId && !accessToken && !domain) {
      try {
        const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
        const apiKey = process.env.VITE_FIREBASE_API_KEY;
        const fsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/companies/${companyId}/settings/integrations?key=${apiKey}`;
        const fsResp = await fetch(fsUrl);
        if (fsResp.ok) {
          const fsData = await fsResp.json();
          const jf = fsData.fields?.jira?.mapValue?.fields;
          if (jf) {
            accessToken = jf.accessToken?.stringValue || accessToken;
            cloudId = jf.cloudId?.stringValue || cloudId;
            domain = jf.domain?.stringValue || domain;
            email = jf.email?.stringValue || email;
            token = jf.apiToken?.stringValue || token;
            projectKey = jf.projectKey?.stringValue || projectKey;
          }
        }
      } catch (e) {
        console.warn("[create-issue] Could not fetch Firestore settings:", e);
      }
    }

    let url: string;
    let headers: any = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if ((type === "oauth" || accessToken) && accessToken && cloudId) {
      url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue`;
      headers["Authorization"] = `Bearer ${accessToken}`;
    } else if (domain && email && token) {
      url = `https://${domain}.atlassian.net/rest/api/3/issue`;
      const auth = Buffer.from(`${email}:${token}`).toString("base64");
      headers["Authorization"] = `Basic ${auth}`;
    } else {
      return res.status(500).json({ error: "Jira credentials missing. Please connect Jira first." });
    }

    const jiraIssue = {
      fields: {
        project: { key: projectKey },
        summary: (title || "Untitled Task").slice(0, 255),
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: description || "Created via PM Daily Copilot" }],
            },
          ],
        },
        issuetype: { name: "Task" },
        priority: {
          name:
            priority === "High" ? "High" : priority === "Medium" ? "Medium" : "Low",
        },
        ...(assigneeId ? { assignee: { accountId: assigneeId } } : {}),
      },
    };

    console.log("[create-issue] Creating Jira issue:", {
      title: (title || "").slice(0, 60),
      projectKey,
      assigneeId: assigneeId || "NONE (unassigned)",
      priority,
    });

    if (assigneeId) {
      console.log("[create-issue] ✅ Attempting to assign to accountId:", assigneeId);
    } else {
      console.log("[create-issue] ⚠️ No assigneeId provided — issue will be unassigned.");
    }

    let response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(jiraIssue),
    });

    let fallbackUsed = false;
    // Fallback: If assignee is invalid, Jira returns 400. We can retry without assignee.
    if (!response.ok && assigneeId) {
      const errorText = await response.text();
      console.warn("[create-issue] ⚠️ Jira API error with assignee:", response.status, errorText);
      console.log("[create-issue] 🔄 Retrying issue creation without assignee...");
      
      delete jiraIssue.fields.assignee;
      fallbackUsed = true;
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(jiraIssue),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[create-issue] ❌ Jira API error (final):", response.status, errorText);
      return res.status(response.status).json({ error: "Jira API Error", details: errorText });
    }

    const result = await response.json();
    console.log("[create-issue] Issue created:", result.key);

    if (companyId) {
      try {
        const slackText = `🚀 Task Assigned: ${title || "Untitled Task"}
Assigned to: ${assigneeId || "Unassigned"}
Priority: ${priority || "Low"}
Jira: ${result.key}`;
        
        await sendSlackMessage({ companyId, text: slackText });
        console.log("[create-issue] Slack notification sent successfully.");
      } catch (slackError: any) {
        console.warn("[create-issue] Failed to send Slack notification:", slackError.message);
      }
    }

    return res.status(200).json({ ...result, fallbackUnassigned: fallbackUsed });
  } catch (error: any) {
    console.error("[create-issue] Server error:", error.message);
    return res.status(500).json({ error: "Server Error", details: error.message });
  }
}
