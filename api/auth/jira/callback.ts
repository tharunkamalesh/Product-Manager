import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state } = req.query;
  const clientId = process.env.JIRA_CLIENT_ID;
  const clientSecret = process.env.JIRA_CLIENT_SECRET;
  const redirectUri = process.env.JIRA_REDIRECT_URI;

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
      throw new Error(tokenData.error_description || tokenData.error || "Failed to exchange code");
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // 2. Fetch cloud ID (accessible resources)
    const resourceResponse = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Accept": "application/json",
      },
    });

    const resources = await resourceResponse.json();
    if (!resourceResponse.ok || !resources.length) {
      throw new Error("Failed to fetch accessible resources");
    }

    // Use the first available resource (or let user choose in a more complex flow)
    const cloudId = resources[0].id;
    const siteUrl = resources[0].url;

    // 3. Store tokens in Firestore
    // Note: We are using a simple fetch to update Firestore via REST API
    // This requires the project ID and the field name
    // For production, use firebase-admin or a secure backend call
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${process.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/companies/${companyId}/settings/integrations?updateMask.fieldPaths=jira&key=${process.env.VITE_FIREBASE_API_KEY}`;
    
    await fetch(firestoreUrl, {
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

    // Redirect back to the app
    return res.redirect("/integrations?success=jira");
  } catch (error: any) {
    console.error("Jira OAuth Error:", error);
    return res.redirect(`/integrations?error=${encodeURIComponent(error.message)}`);
  }
}
