import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("[Jira Callback] OAuth route hit", req.query);
  const { code, state } = req.query;

  const clientId = process.env.JIRA_CLIENT_ID;
  const clientSecret = process.env.JIRA_CLIENT_SECRET;
  const redirectUri = process.env.JIRA_REDIRECT_URI;

  if (!code || !state) {
    console.error("[Jira Callback] Missing code or state");
    return res.status(400).json({ error: "Missing code or state" });
  }

  let companyId: string;
  try {
    const parsedState = JSON.parse(decodeURIComponent(state as string));
    companyId = parsedState.companyId;
    console.log("[Jira Callback] Parsed companyId", companyId);
  } catch (e) {
    console.error("[Jira Callback] Failed to parse state", e);
    return res.status(400).json({ error: "Invalid state" });
  }

  try {
    // 1. Exchange code for access token
    console.log("[Jira Callback] Exchanging code for token...");
    const tokenResponse = await fetch("https://auth.atlassian.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("[Jira Callback] Token exchange failed", tokenData);
      throw new Error(tokenData.error_description || tokenData.error || "Failed to exchange code");
    }

    const { access_token, refresh_token } = tokenData;
    console.log("[Jira Callback] Token exchange successful");

    // 2. Fetch cloud ID
    console.log("[Jira Callback] Fetching accessible resources...");
    const resourceResponse = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Accept": "application/json",
      },
    });

    const resources = await resourceResponse.json();
    if (!resourceResponse.ok || !resources.length) {
      console.error("[Jira Callback] Failed to fetch resources", resources);
      throw new Error("Failed to fetch accessible resources");
    }

    const cloudId = resources[0].id;
    const siteUrl = resources[0].url;
    console.log("[Jira Callback] Cloud ID identified", { cloudId, siteUrl });

    // 3. Store tokens in Firestore
    console.log("[Jira Callback] Updating Firestore for company", companyId);
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${process.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/companies/${companyId}/settings/integrations?updateMask.fieldPaths=jira&key=${process.env.VITE_FIREBASE_API_KEY}`;
    
    const dbResponse = await fetch(firestoreUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          jira: {
            mapValue: {
              fields: {
                accessToken: { stringValue: access_token },
                refreshToken: { stringValue: refresh_token || "" },
                cloudId: { stringValue: cloudId },
                siteUrl: { stringValue: siteUrl },
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
      console.error("[Jira Callback] Firestore update failed", dbError);
      throw new Error("Failed to save tokens to database");
    }

    console.log("[Jira Callback] Successfully connected Jira for company", companyId);
    return res.redirect("/integrations?success=jira");
  } catch (error: any) {
    console.error("[Jira Callback] Error:", error.message);
    return res.redirect(`/integrations?error=${encodeURIComponent(error.message)}`);
  }
}
