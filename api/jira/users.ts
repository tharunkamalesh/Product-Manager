import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Allow passing credentials for verification during setup
  const { 
    domain: qDomain, 
    email: qEmail, 
    token: qToken, 
    projectKey: qProjectKey,
    accessToken,
    cloudId,
    type
  } = req.method === "POST" ? req.body : req.query;

  const domain = qDomain || process.env.JIRA_DOMAIN;
  const email = qEmail || process.env.JIRA_EMAIL;
  const token = qToken || process.env.JIRA_API_TOKEN;
  const projectKey = qProjectKey || process.env.JIRA_PROJECT_KEY || "KAN";

  let url = `https://${domain}.atlassian.net/rest/api/3/user/assignable/search?project=${projectKey}`;
  let headers: any = {
    "Accept": "application/json",
  };

  if (type === "oauth" && accessToken && cloudId) {
    url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/user/assignable/search?project=${projectKey}`;
    headers["Authorization"] = `Bearer ${accessToken}`;
  } else if (domain && email && token) {
    const auth = Buffer.from(`${email}:${token}`).toString("base64");
    headers["Authorization"] = `Basic ${auth}`;
  } else {
    return res.status(500).json({ error: "Jira credentials missing" });
  }

  try {
    // Fetch users who can be assigned to issues in the project
    const response = await fetch(url, {
      method: "GET",
      headers: headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: "Jira API Error", details: errorText });
    }

    const users = await response.json();
    
    // Filter out app users and simplify the list
    const simplifiedUsers = users
      .filter((u: any) => u.accountType === "atlassian")
      .map((u: any) => ({
        accountId: u.accountId,
        displayName: u.displayName,
        avatarUrl: u.avatarUrls?.["32x32"] || u.avatarUrls?.["48x48"],
      }));

    return res.status(200).json(simplifiedUsers);
  } catch (error: any) {
    return res.status(500).json({ error: "Server Error", details: error.message });
  }
}
