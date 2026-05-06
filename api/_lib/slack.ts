import fetch from "node-fetch";

async function getOrJoinChannel(companyId: string, accessToken: string, fsData: any, projectId: string, apiKey: string): Promise<string> {
  const slackFields = fsData.fields?.slack?.mapValue?.fields;
  
  if (slackFields?.channelId?.stringValue) {
    return slackFields.channelId.stringValue;
  }

  const channelName = "pm-testing";
  console.log(`[Slack] Resolving channel ID for #${channelName}...`);
  
  // 1. Fetch channels to find channel_id
  const listResp = await fetch("https://slack.com/api/conversations.list?types=public_channel,private_channel", {
    headers: { "Authorization": `Bearer ${accessToken}` }
  });
  const listData = await (listResp.json() as Promise<any>);
  
  if (!listData.ok) {
    console.error("[Slack] Failed to list channels:", listData.error);
    throw new Error(`Failed to list channels: ${listData.error}`);
  }

  const channel = listData.channels.find((c: any) => c.name === channelName);
  if (!channel) {
    console.error(`[Slack] Channel #${channelName} not found.`);
    throw new Error(`Channel #${channelName} not found in Slack workspace`);
  }

  const channelId = channel.id;
  console.log(`[Slack] Found #${channelName} with ID: ${channelId}`);

  // 2. Join the channel
  if (!channel.is_member) {
    console.log(`[Slack] Bot not in #${channelName}. Auto-joining...`);
    const joinResp = await fetch("https://slack.com/api/conversations.join", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
      body: JSON.stringify({ channel: channelId })
    });
    const joinData = await (joinResp.json() as Promise<any>);
    
    if (!joinData.ok) {
      console.warn(`[Slack] Failed to auto-join channel, error:`, joinData.error);
    } else {
      console.log(`[Slack] Successfully joined #${channelName}`);
    }
  }

  // 3. Save to Firestore
  console.log(`[Slack] Saving channel_id ${channelId} to Firestore...`);
  const fsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/companies/${companyId}/settings/integrations?updateMask.fieldPaths=slack.channelId&key=${apiKey}`;
  
  const saveResp = await fetch(fsUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields: {
        slack: {
          mapValue: {
            fields: {
              channelId: { stringValue: channelId }
            }
          }
        }
      }
    })
  });

  if (!saveResp.ok) {
    console.warn(`[Slack] Failed to save channelId to Firestore: ${saveResp.statusText}`);
  } else {
    console.log(`[Slack] channel_id saved to Firestore.`);
  }

  return channelId;
}

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

  if (!accessToken) {
    throw new Error("Slack access token missing");
  }

  const channelId = await getOrJoinChannel(companyId, accessToken, fsData, projectId, apiKey);

  console.log(`[Slack] Sending message to channel ${channelId}...`);
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      channel: channelId,
      text: text
    })
  });

  const responseData = await (response.json() as Promise<any>);

  if (!response.ok || !responseData.ok) {
    console.error(`[Slack] API error:`, responseData.error || response.statusText);
    
    // Fallback: If not in channel error, try joining and retrying
    if (responseData.error === "not_in_channel") {
      console.log(`[Slack] Got not_in_channel error. Attempting to join and retry...`);
      await fetch("https://slack.com/api/conversations.join", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
        body: JSON.stringify({ channel: channelId })
      });
      
      const retryResponse = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
        body: JSON.stringify({ channel: channelId, text: text })
      });
      const retryData = await (retryResponse.json() as Promise<any>);
      if (!retryResponse.ok || !retryData.ok) {
        throw new Error(`Slack API error on retry: ${retryData.error}`);
      }
      console.log(`[Slack] Message sent successfully on retry.`);
      return retryData;
    }
    
    throw new Error(`Slack API error: ${responseData.error || response.statusText}`);
  }

  console.log(`[Slack] Message sent successfully!`);
  return responseData;
}

