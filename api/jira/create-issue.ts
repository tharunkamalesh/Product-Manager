import type { VercelRequest, VercelResponse } from "@vercel/node";

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
      // For fallback/MVP if no company settings in DB yet
      domain: envDomain,
      email: envEmail,
      token: envToken,
      projectKey: envProjectKey
    } = req.body;

    // OAuth support
    const { accessToken, cloudId, type } = req.body;
    
    // In production, we'd fetch domain/email/token from Firestore using companyId
    // For now, we'll use the provided ones or environment variables as fallback
    const domain = envDomain || process.env.JIRA_DOMAIN;
    const email = envEmail || process.env.JIRA_EMAIL;
    const token = envToken || process.env.JIRA_API_TOKEN;
    const projectKey = envProjectKey || process.env.JIRA_PROJECT_KEY || "KAN";

    let url = `https://${domain}.atlassian.net/rest/api/3/issue`;
    let headers: any = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    if (type === "oauth" && accessToken && cloudId) {
      url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue`;
      headers["Authorization"] = `Bearer ${accessToken}`;
    } else if (domain && email && token) {
      const auth = Buffer.from(`${email}:${token}`).toString("base64");
      headers["Authorization"] = `Basic ${auth}`;
    } else {
      return res.status(500).json({ error: "Jira credentials missing" });
    }

    const jiraIssue = {
      fields: {
        project: { key: projectKey },
        summary: title,
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
        priority: { name: priority === "High" ? "High" : priority === "Medium" ? "Medium" : "Low" },
        ...(assigneeId && { assignee: { accountId: assigneeId } }),
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(jiraIssue),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: "Jira API Error", details: errorText });
    }

    const result = await response.json();
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: "Server Error", details: error.message });
  }
}
