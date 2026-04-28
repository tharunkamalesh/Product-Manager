import type { VercelRequest, VercelResponse } from "@vercel/node";

async function getFirestoreIntegrations(companyId: string) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/companies/${companyId}/settings/integrations?key=${apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const data = await resp.json();
  if (!data.fields) return null;

  // Parse Firestore document fields
  const fields = data.fields;
  const jira: any = {};
  if (fields.jira?.mapValue?.fields) {
    const jf = fields.jira.mapValue.fields;
    jira.accessToken = jf.accessToken?.stringValue;
    jira.cloudId = jf.cloudId?.stringValue;
    jira.type = jf.type?.stringValue;
    jira.domain = jf.domain?.stringValue;
    jira.email = jf.email?.stringValue;
    jira.apiToken = jf.apiToken?.stringValue;
    jira.projectKey = jf.projectKey?.stringValue;
  }
  return jira;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("[Jira Users] OAuth route hit", req.query);

  const params = req.method === "POST" ? req.body : req.query;
  const { companyId, accessToken: directToken, cloudId: directCloudId, type: directType,
          domain: directDomain, email: directEmail, token: directApiToken, projectKey: directProjectKey } = params;

  let resolvedAccessToken = directToken;
  let resolvedCloudId = directCloudId;
  let resolvedType = directType;
  let resolvedDomain = directDomain || process.env.JIRA_DOMAIN;
  let resolvedEmail = directEmail || process.env.JIRA_EMAIL;
  let resolvedApiToken = directApiToken || process.env.JIRA_API_TOKEN;
  let resolvedProjectKey = directProjectKey || process.env.JIRA_PROJECT_KEY || "KAN";

  // If companyId provided, fetch from Firestore (preferred)
  if (companyId) {
    try {
      const jira = await getFirestoreIntegrations(companyId);
      if (jira) {
        resolvedAccessToken = jira.accessToken || resolvedAccessToken;
        resolvedCloudId = jira.cloudId || resolvedCloudId;
        resolvedType = jira.type || resolvedType;
        resolvedDomain = jira.domain || resolvedDomain;
        resolvedEmail = jira.email || resolvedEmail;
        resolvedApiToken = jira.apiToken || resolvedApiToken;
        resolvedProjectKey = jira.projectKey || resolvedProjectKey;
      }
    } catch (e) {
      console.warn("[Jira Users] Could not fetch Firestore settings:", e);
    }
  }

  let url: string;
  let headers: any = { "Accept": "application/json" };

  if (resolvedType === "oauth" && resolvedAccessToken && resolvedCloudId) {
    // Use Atlassian REST API with OAuth — search for all users in project
    url = `https://api.atlassian.com/ex/jira/${resolvedCloudId}/rest/api/3/user/assignable/search?project=${resolvedProjectKey}&maxResults=100`;
    headers["Authorization"] = `Bearer ${resolvedAccessToken}`;
    console.log("[Jira Users] Using OAuth mode", { cloudId: resolvedCloudId, projectKey: resolvedProjectKey });
  } else if (resolvedDomain && resolvedEmail && resolvedApiToken) {
    url = `https://${resolvedDomain}.atlassian.net/rest/api/3/user/assignable/search?project=${resolvedProjectKey}&maxResults=100`;
    const auth = Buffer.from(`${resolvedEmail}:${resolvedApiToken}`).toString("base64");
    headers["Authorization"] = `Basic ${auth}`;
    console.log("[Jira Users] Using Basic Auth mode", { domain: resolvedDomain, projectKey: resolvedProjectKey });
  } else {
    console.error("[Jira Users] No valid credentials found");
    return res.status(500).json({ error: "Jira credentials missing. Please connect Jira first." });
  }

  try {
    const response = await fetch(url, { method: "GET", headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Jira Users] Jira API error:", response.status, errorText);
      return res.status(response.status).json({ error: "Jira API Error", details: errorText });
    }

    const users = await response.json();

    // Filter out bot/app users; keep only real Atlassian users
    const simplifiedUsers = users
      .filter((u: any) => u.accountType === "atlassian")
      .map((u: any) => ({
        accountId: u.accountId,
        displayName: u.displayName,
        avatarUrl: u.avatarUrls?.["32x32"] || u.avatarUrls?.["48x48"] || "",
      }));

    console.log(`[Jira Users] Returning ${simplifiedUsers.length} users`);
    return res.status(200).json(simplifiedUsers);
  } catch (error: any) {
    console.error("[Jira Users] Server error:", error.message);
    return res.status(500).json({ error: "Server Error", details: error.message });
  }
}
