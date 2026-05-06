import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendSlackMessage } from "../_lib/slack";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { companyId, title, description, priority, assigneeId } = req.body;

    if (!companyId) {
      console.error("[create-issue] Missing companyId in request.");
      return res.status(400).json({ error: "Missing companyId. Please log in again." });
    }

    console.log(`[create-issue] Started Jira issue creation for company ${companyId}`);

    let accessToken, cloudId, domain, email, token, projectKey = "KAN";

    // 1. Fetch credentials from Firestore
    try {
      const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
      const apiKey = process.env.VITE_FIREBASE_API_KEY;
      const fsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/companies/${companyId}/settings/integrations?key=${apiKey}`;
      const fsResp = await fetch(fsUrl);
      
      if (fsResp.ok) {
        const fsData = await fsResp.json();
        const jf = fsData.fields?.jira?.mapValue?.fields;
        if (jf) {
          accessToken = jf.accessToken?.stringValue;
          cloudId = jf.cloudId?.stringValue;
          domain = jf.domain?.stringValue;
          email = jf.email?.stringValue;
          token = jf.apiToken?.stringValue;
          projectKey = jf.projectKey?.stringValue || "KAN";
        }
      }
    } catch (e) {
      console.warn("[create-issue] Could not fetch Firestore settings:", e);
    }

    // 2. Validate Jira credentials
    let url: string;
    let headers: any = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (accessToken && cloudId) {
      url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue`;
      headers["Authorization"] = `Bearer ${accessToken}`;
    } else if (domain && email && token) {
      // Some users type full URL, some type just domain. Clean it:
      const cleanDomain = domain.replace("https://", "").replace(".atlassian.net", "");
      url = `https://${cleanDomain}.atlassian.net/rest/api/3/issue`;
      const auth = Buffer.from(`${email}:${token}`).toString("base64");
      headers["Authorization"] = `Basic ${auth}`;
    } else {
      console.error(`[create-issue] No valid Jira credentials found for company ${companyId}.`);
      return res.status(401).json({ error: "Jira not connected. Please go to Integrations and connect your Jira workspace." });
    }

    // 3. Prepare Issue Payload
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
          name: priority === "High" ? "High" : priority === "Medium" ? "Medium" : "Low",
        },
        ...(assigneeId ? { assignee: { accountId: assigneeId } } : {}),
      },
    };

    console.log("[create-issue] Sending POST request to Jira API...", {
      url,
      projectKey,
      assigneeId: assigneeId || "NONE (unassigned)",
      priority,
    });

    let response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(jiraIssue),
    });

    let fallbackUsed = false;

    // Fallback: If assignee is invalid, Jira returns 400. Retry without assignee.
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
      return res.status(response.status).json({ error: "Invalid credentials or Jira API Error", details: errorText });
    }

    const result = await response.json();
    console.log("[create-issue] ✅ Successfully created Jira issue:", result.key);

    // 4. Send Slack Message
    if (companyId) {
      try {
        console.log(`[create-issue] Triggering Slack notification...`);
        const slackText = `🚀 New Task Created\nTitle: ${title || "Untitled Task"}\nAssignee: ${assigneeId || "Unassigned"}\nPriority: ${priority || "Low"}\nJira: ${result.key}`;
        
        await sendSlackMessage({ companyId, text: slackText });
        console.log("[create-issue] ✅ Slack notification sent successfully.");
      } catch (slackError: any) {
        console.warn("[create-issue] ⚠️ Failed to send Slack notification (Jira issue still created):", slackError.message);
      }
    }

    return res.status(200).json({ ...result, fallbackUnassigned: fallbackUsed });
  } catch (error: any) {
    console.error("[create-issue] Server error:", error.message);
    return res.status(500).json({ error: "Server Error", details: error.message });
  }
}

