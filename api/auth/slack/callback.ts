import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state } = req.query;
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!code || !state) {
    return res.status(400).json({ error: "Missing code or state" });
  }

  let companyId: string;
  try {
    const parsedState = JSON.parse(decodeURIComponent(state as string));
    companyId = parsedState.companyId;
  } catch (e) {
    return res.status(400).json({ error: "Invalid state" });
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: code as string,
        redirect_uri: redirectUri!,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.ok) {
      throw new Error(tokenData.error || "Failed to exchange code");
    }

    // OAuth v2 access returns:
    // access_token, token_type, scope, bot_user_id, team: { name, id }, incoming_webhook: { url, channel, configuration_url }
    const { access_token, incoming_webhook, team } = tokenData;

    // 2. Store tokens in Firestore
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${process.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/companies/${companyId}/settings/integrations?updateMask.fieldPaths=slack&key=${process.env.VITE_FIREBASE_API_KEY}`;
    
    await fetch(firestoreUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          slack: {
            mapValue: {
              fields: {
                accessToken: { stringValue: access_token },
                webhookUrl: { stringValue: incoming_webhook?.url || "" },
                teamId: { stringValue: team?.id || "" },
                teamName: { stringValue: team?.name || "" },
                connectedAt: { timestampValue: new Date().toISOString() },
                type: { stringValue: "oauth" }
              }
            }
          }
        }
      }),
    });

    // Redirect back to the app
    return res.redirect("/integrations?success=slack");
  } catch (error: any) {
    console.error("Slack OAuth Error:", error);
    return res.redirect(`/integrations?error=${encodeURIComponent(error.message)}`);
  }
}
