import fetch from "node-fetch";

export async function sendSlackMessage({ companyId, text }: { companyId: string, text: string }) {
  if (!companyId) {
    throw new Error("Missing companyId");
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    throw new Error("Missing Firebase configuration");
  }

  // Fetch from Firestore
  const fsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/companies/${companyId}/settings/integrations?key=${apiKey}`;
  const fsResp = await fetch(fsUrl);
  
  if (!fsResp.ok) {
    throw new Error(`Failed to fetch integrations: ${fsResp.statusText}`);
  }

  const fsData = await (fsResp.json() as Promise<any>);
  const slackFields = fsData.fields?.slack?.mapValue?.fields;

  if (!slackFields || (!slackFields.accessToken && !slackFields.webhookUrl)) {
    throw new Error("Slack not connected for this company");
  }

  const accessToken = slackFields.accessToken?.stringValue;
  
  // Try sending via Webhook first if it exists, otherwise use accessToken
  // Wait, the prompt specifically says:
  // "Fetch access_token from Firebase"
  // "Call Slack API: POST https://slack.com/api/chat.postMessage"
  // "Payload: { channel: '#pm-testing', text: text }"

  if (!accessToken) {
    throw new Error("Slack access token missing");
  }

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      channel: "#pm-testing",
      text: text
    })
  });

  const responseData = await (response.json() as Promise<any>);

  if (!response.ok || !responseData.ok) {
    throw new Error(`Slack API error: ${responseData.error || response.statusText}`);
  }

  return responseData;
}
