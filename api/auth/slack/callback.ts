import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[Slack Callback] OAuth route hit", req.query);
  const { code, state } = req.query;

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!code || !state) {
    console.error("[Slack Callback] Missing code or state");
    return res.status(400).json({ error: "Missing code or state" });
  }

  let companyId: string;
  try {
    const parsedState = JSON.parse(decodeURIComponent(state as string));
    companyId = parsedState.companyId;
    console.log("[Slack Callback] Parsed companyId", companyId);
  } catch (e) {
    console.error("[Slack Callback] Failed to parse state", e);
    return res.status(400).json({ error: "Invalid state" });
  }

  try {
    // 1. Exchange code for access token
    console.log("[Slack Callback] Exchanging code for token with Slack API...");
    console.log(`[Slack Callback] Request Payload:`, {
      client_id: clientId,
      redirect_uri: redirectUri,
      code_length: code.length
    });

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
      console.error("[Slack Callback] Token exchange failed. Response from Slack:", tokenData);
      throw new Error(tokenData.error || "Failed to exchange code");
    }

    const { access_token, incoming_webhook, team } = tokenData;
    console.log("[Slack Callback] Token exchange successful!");
    console.log("[Slack Callback] Slack Team Name:", team?.name);
    console.log("[Slack Callback] Has Webhook:", !!incoming_webhook);

    // 2. Store tokens in Firestore
    console.log("[Slack Callback] Updating Firestore for company", companyId);
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${process.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/companies/${companyId}/settings/integrations?updateMask.fieldPaths=slack&key=${process.env.VITE_FIREBASE_API_KEY}`;
    
    const dbResponse = await fetch(firestoreUrl, {
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

    if (!dbResponse.ok) {
      const dbError = await dbResponse.text();
      console.error("[Slack Callback] Firestore update failed", dbError);
      throw new Error("Failed to save tokens to database");
    }

    console.log("[Slack Callback] Successfully connected Slack for company", companyId);
    return res.redirect("/integrations?success=slack");
  } catch (error: any) {
    console.error("[Slack Callback] Error:", error.message);
    return res.redirect(`/integrations?error=${encodeURIComponent(error.message)}`);
  }
}
