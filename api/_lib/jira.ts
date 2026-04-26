export interface JiraTaskRequest {
  task: string;
  priority: string;
  description: string;
  category: string;
  assigneeId?: string;
  projectKey?: string;
  dueDate?: string;
}

export async function createJiraIssue(body: JiraTaskRequest, env: Record<string, string>) {
  const { task, priority, description, category, assigneeId, projectKey, dueDate } = body;

  let domain = env.JIRA_DOMAIN || "";
  if (domain.includes(".atlassian.net")) {
    domain = domain.replace(".atlassian.net", "").replace("https://", "").replace("http://", "");
  }
  
  const email = env.JIRA_EMAIL;
  const token = env.JIRA_API_TOKEN;
  const defaultProject = env.JIRA_PROJECT_KEY || "KAN";

  if (!domain || !email || !token) {
    throw new Error("Jira credentials missing (JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN)");
  }

  // Developer Mapping (AccountId mapping)
  const assigneeMap: Record<string, string | undefined> = {
    Frontend: env.JIRA_ASSIGNEE_FRONTEND,
    Backend: env.JIRA_ASSIGNEE_BACKEND,
    Payment: env.JIRA_ASSIGNEE_PAYMENT,
    DevOps: env.JIRA_ASSIGNEE_DEVOPS,
    Mobile: env.JIRA_ASSIGNEE_MOBILE,
  };

  const accountId = assigneeId || assigneeMap[category];

  const jiraPriority = priority === "High" ? "High" : priority === "Medium" ? "Medium" : "Low";
  
  // Ensure description is valid ADF (Atlassian Document Format)
  const safeDescription = description || "No description provided.";
  
  const jiraIssue = {
    fields: {
      project: { key: (projectKey || defaultProject).toUpperCase() },
      summary: task.slice(0, 255), // Jira summary limit
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: safeDescription
              }
            ]
          }
        ]
      },
      issuetype: { name: "Task" },
      priority: { name: jiraPriority },
      ...(dueDate && { duedate: dueDate }),
      ...(accountId && { assignee: { id: accountId } }),
    }
  };

  const auth = Buffer.from(`${email}:${token}`).toString("base64");
  const jiraUrl = `https://${domain}.atlassian.net/rest/api/3/issue`;

  console.log(`Jira API Request to ${jiraUrl}`, JSON.stringify(jiraIssue, null, 2));

  const response = await fetch(jiraUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Atlassian-Token": "no-check" // Sometimes helps with CSRF/Auth issues
    },
    body: JSON.stringify(jiraIssue)
  });

  const responseText = await response.text();
  console.log(`Jira API Status: ${response.status}`);
  console.log(`Jira API Response: ${responseText}`);

  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch (e) {
    throw new Error(`Jira returned invalid JSON (Status ${response.status}): ${responseText.slice(0, 100)}`);
  }

  if (!response.ok) {
    const errorMsg = data.errorMessages?.[0] || 
                     (data.errors ? Object.values(data.errors).join(", ") : null) || 
                     responseText || 
                     "Unknown Jira error";
    throw new Error(errorMsg);
  }

  return {
    issueKey: data.key,
    issueUrl: `https://${domain}.atlassian.net/browse/${data.key}`
  };
}
