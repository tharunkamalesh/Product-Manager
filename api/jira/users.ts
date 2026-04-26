import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const domain = process.env.JIRA_DOMAIN;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY || "KAN";

  if (!domain || !email || !token) {
    return res.status(500).json({ error: "Jira credentials missing" });
  }

  try {
    const auth = Buffer.from(`${email}:${token}`).toString("base64");
    // Fetch users who can be assigned to issues in the project
    const response = await fetch(
      `https://${domain}.atlassian.net/rest/api/3/user/assignable/search?project=${projectKey}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Accept": "application/json",
        },
      }
    );

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
