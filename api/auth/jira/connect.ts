import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[Jira Connect] OAuth route hit", req.query);
  
  const clientId = process.env.JIRA_CLIENT_ID;
  const redirectUri = process.env.JIRA_REDIRECT_URI;
  const companyId = req.query.companyId as string;

  if (!clientId || clientId === "jira-client-id") {
    console.error("[Jira Connect] Missing or placeholder JIRA_CLIENT_ID");
    return res.redirect("/integrations?error=OAuth configuration missing. Please check environment variables (JIRA_CLIENT_ID).");
  }
  
  if (!redirectUri) {
    console.error("[Jira Connect] Missing JIRA_REDIRECT_URI");
    return res.redirect("/integrations?error=OAuth configuration missing. Please check environment variables (JIRA_REDIRECT_URI).");
  }

  if (!companyId) {
    console.error("[Jira Connect] Missing companyId");
    return res.redirect("/integrations?error=companyId is required");
  }

  // Define the scopes required
  const scopes = [
    "read:jira-user",
    "read:jira-work",
    "write:jira-work",
    "offline_access"
  ].join(" ");

  // State should include companyId
  const state = encodeURIComponent(JSON.stringify({ companyId }));

  const authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code&prompt=consent&access_type=offline`;

  console.log("[Jira Connect] Configuration:", { clientId, redirectUri, companyId });
  console.log("[Jira Connect] Scopes:", scopes);
  console.log("[Jira Connect] Generated Auth URL:", authUrl);
  console.log("[Jira Connect] Redirecting to Atlassian...");
  return res.redirect(authUrl);
}
