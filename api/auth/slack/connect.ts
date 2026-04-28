import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[Slack Connect] OAuth route hit", req.query);
  
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;
  const companyId = req.query.companyId as string;

  if (!clientId || clientId === "slack-client-id") {
    console.error("[Slack Connect] Missing or placeholder SLACK_CLIENT_ID");
    return res.redirect("/integrations?error=OAuth configuration missing. Please check environment variables (SLACK_CLIENT_ID).");
  }

  if (!redirectUri) {
    console.error("[Slack Connect] Missing SLACK_REDIRECT_URI");
    return res.redirect("/integrations?error=OAuth configuration missing. Please check environment variables (SLACK_REDIRECT_URI).");
  }

  if (!companyId) {
    console.error("[Slack Connect] Missing companyId");
    return res.redirect("/integrations?error=companyId is required");
  }

  // Define scopes
  const scopes = [
    "incoming-webhook",
    "chat:write",
    "chat:write.public",
    "commands"
  ].join(",");

  const state = encodeURIComponent(JSON.stringify({ companyId }));

  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  console.log("[Slack Connect] Redirect URL generated", { companyId });
  console.log("[Slack Connect] Redirecting to Slack...");
  return res.redirect(authUrl);
}
