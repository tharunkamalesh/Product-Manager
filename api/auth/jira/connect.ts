import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.JIRA_CLIENT_ID;
  const redirectUri = process.env.JIRA_REDIRECT_URI;
  const companyId = req.query.companyId as string;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: "Jira OAuth credentials not configured" });
  }

  if (!companyId) {
    return res.status(400).json({ error: "companyId is required" });
  }

  // Define the scopes required
  const scopes = [
    "read:jira-user",
    "read:jira-work",
    "write:jira-work",
    "manage:jira-project",
    "manage:jira-configuration",
    "offline_access" // Important for refresh tokens
  ].join(" ");

  // State should include companyId so we can store tokens for the right company in the callback
  const state = encodeURIComponent(JSON.stringify({ companyId }));

  const authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code&prompt=consent`;

  return res.redirect(authUrl);
}
