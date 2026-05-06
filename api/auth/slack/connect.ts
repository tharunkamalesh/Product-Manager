import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("----------------------------------------");
  console.log("[Slack Connect] OAuth flow started");
  console.log("[Slack Connect] Query params:", req.query);
  
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;
  const companyId = req.query.companyId as string;

  if (!clientId || clientId === "slack-client-id") {
    console.error("[Slack Connect] Error: Missing or placeholder SLACK_CLIENT_ID");
    return res.redirect("/integrations?error=OAuth configuration missing. Please check environment variables (SLACK_CLIENT_ID).");
  }

  if (!redirectUri) {
    console.error("[Slack Connect] Error: Missing SLACK_REDIRECT_URI");
    return res.redirect("/integrations?error=OAuth configuration missing. Please check environment variables (SLACK_REDIRECT_URI).");
  }

  // Fallback warning for missing ngrok URL
  if (redirectUri.includes("localhost")) {
    console.warn("⚠️ [Slack Connect] WARNING: SLACK_REDIRECT_URI contains localhost!");
    console.warn("⚠️ Slack OAuth usually requires an HTTPS ngrok URL.");
    console.warn("⚠️ Make sure your ngrok tunnel is running and .env.local is updated.");
  } else if (!redirectUri.includes("ngrok")) {
    console.warn(`⚠️ [Slack Connect] WARNING: SLACK_REDIRECT_URI (${redirectUri}) does not seem to be an ngrok URL.`);
  }

  if (!companyId) {
    console.error("[Slack Connect] Error: Missing companyId");
    return res.redirect("/integrations?error=companyId is required to map the Slack connection.");
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

  console.log("[Slack Connect] Using Redirect URI:", redirectUri);
  console.log("[Slack Connect] Redirecting to Slack Auth URL...");
  console.log("----------------------------------------");
  return res.redirect(authUrl);
}
