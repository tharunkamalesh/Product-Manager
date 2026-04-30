import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendSlackMessage } from "../_lib/slack";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "Missing companyId" });
    }

    await sendSlackMessage({ 
      companyId, 
      text: "👋 Hello from Founder's Compass! This is a test message to confirm your integration is working." 
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("[slack/test] Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
