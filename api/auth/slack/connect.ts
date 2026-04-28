import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;
  const companyId = req.query.companyId as string;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: "Slack OAuth credentials not configured" });
  }

  if (!companyId) {
    return res.status(400).json({ error: "companyId is required" });
  }

  // Define scopes: incoming-webhook is needed for notifications
  // chat:write is needed for more advanced messaging
  const scopes = [
    "incoming-webhook",
    "chat:write",
    "chat:write.public",
    "commands"
  ].join(",");

  const state = encodeURIComponent(JSON.stringify({ companyId }));

  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return res.redirect(authUrl);
}
