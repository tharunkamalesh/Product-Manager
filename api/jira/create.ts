import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { task, priority, description, projectKey, dueDate, assigneeEmail } = req.body;

  const domain = process.env.JIRA_DOMAIN;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!domain || !email || !token) {
    return res.status(500).json({ 
      error: "Jira credentials not configured on server",
      details: "Please set JIRA_DOMAIN, JIRA_EMAIL, and JIRA_API_TOKEN in environment variables."
    });
  }

  // Map our priority levels to Jira priority IDs or names
  // Typical Jira priorities: Highest (1), High (2), Medium (3), Low (4), Lowest (5)
  const jiraPriority = priority === "High" ? "High" : priority === "Medium" ? "Medium" : "Low";

  const jiraIssue = {
    fields: {
      project: { key: projectKey || process.env.JIRA_PROJECT_KEY || "KAN" },
      summary: task,
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: description }]
          }
        ]
      },
      issuetype: { name: "Task" },
      priority: { name: jiraPriority },
      ...(dueDate && { duedate: dueDate }),
      // Assignee is a bit trickier in Jira (needs accountId), 
      // but for simple demo we might just skip it or use a default
    }
  };

  try {
    const auth = Buffer.from(`${email}:${token}`).toString("base64");
    const response = await fetch(`https://${domain}.atlassian.net/rest/api/3/issue`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(jiraIssue)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: "Jira API Error", 
        details: data.errorMessages?.join(", ") || JSON.stringify(data.errors) || "Unknown error"
      });
    }

    return res.status(200).json({ 
      success: true, 
      issueKey: data.key, 
      issueUrl: `https://${domain}.atlassian.net/browse/${data.key}` 
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to connect to Jira", details: error.message });
  }
}
