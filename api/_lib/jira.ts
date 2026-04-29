export interface JiraTaskRequest {
  title: string;
  priority: string;
  description: string;
  category: string;
  assigneeId?: string;
  projectKey?: string;
  dueDate?: string;
  // OAuth support
  type?: "oauth" | "basic";
  accessToken?: string;
  cloudId?: string;
  // Basic Auth support (override)
  domain?: string;
  email?: string;
  token?: string;
}

export async function createJiraIssue(body: JiraTaskRequest, env: Record<string, string>) {
  const { 
    title, 
    priority, 
    description, 
    category, 
    assigneeId, 
    projectKey, 
    dueDate,
    type,
    accessToken,
    cloudId,
    domain: overrideDomain,
    email: overrideEmail,
    token: overrideToken
  } = body;

  const isOAuth = type === "oauth" && accessToken && cloudId;
  
  let domain = (overrideDomain || env.JIRA_DOMAIN || "").trim();
  domain = domain.replace(/^https?:\/\//, "").replace(/\.atlassian\.net\/?$/, "").replace(/\/$/, "");

  const email = (overrideEmail || env.JIRA_EMAIL || "").trim();
  const token = (overrideToken || env.JIRA_API_TOKEN || "").trim();
  const defaultProject = (projectKey || env.JIRA_PROJECT_KEY || "KAN").trim();

  if (!isOAuth && (!domain || !email || !token)) {
    throw new Error("Jira credentials missing (Domain/Email/Token or OAuth session)");
  }

  // Treat obvious placeholders as unset
  const isValidAccountId = (v: unknown): v is string =>
    typeof v === "string" &&
    v.length > 0 &&
    !/account-id$/i.test(v) &&
    !/^(todo|placeholder|unassigned|none)$/i.test(v);

  const assigneeMap: Record<string, string | undefined> = {
    Frontend: env.JIRA_ASSIGNEE_FRONTEND,
    Backend: env.JIRA_ASSIGNEE_BACKEND,
    Payment: env.JIRA_ASSIGNEE_PAYMENT,
    DevOps: env.JIRA_ASSIGNEE_DEVOPS,
    Mobile: env.JIRA_ASSIGNEE_MOBILE,
  };

  const candidateAccountId = assigneeId || assigneeMap[category];
  const accountId = isValidAccountId(candidateAccountId) ? candidateAccountId : undefined;

  const jiraPriority = priority === "High" ? "High" : priority === "Medium" ? "Medium" : "Low";
  const safeDescription = description || "No description provided.";
  
  const jiraIssue = {
    fields: {
      project: { key: defaultProject.toUpperCase() },
      summary: title.slice(0, 255),
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
      ...(accountId && { assignee: { accountId: accountId } }),
    }
  };

  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-Atlassian-Token": "no-check"
  };

  let jiraUrl: string;

  if (isOAuth) {
    headers["Authorization"] = `Bearer ${accessToken}`;
    jiraUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue`;
  } else {
    const auth = Buffer.from(`${email}:${token}`).toString("base64");
    headers["Authorization"] = `Basic ${auth}`;
    jiraUrl = `https://${domain}.atlassian.net/rest/api/3/issue`;
  }

  console.log(`[Jira Lib] Request to ${jiraUrl}`, JSON.stringify(jiraIssue, null, 2));

  const response = await fetch(jiraUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(jiraIssue)
  });

  const responseText = await response.text();
  console.log(`[Jira Lib] Status: ${response.status}`);
  console.log(`[Jira Lib] Response: ${responseText}`);

  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch (e) {
    throw new Error(`Jira returned invalid JSON (Status ${response.status}): ${responseText.slice(0, 100)}`);
  }

  if (!response.ok) {
    const fieldErrors = data.errors
      ? Object.entries(data.errors).map(([k, v]) => `${k}: ${v}`).join("; ")
      : null;
    const errorMsg = data.errorMessages?.[0] || fieldErrors || responseText || "Unknown Jira error";
    throw new Error(`Jira ${response.status}: ${errorMsg}`);
  }

  return {
    key: data.key,
    url: isOAuth ? `https://atlassian.com/jira/issue/${data.key}` : `https://${domain}.atlassian.net/browse/${data.key}`
  };
}
