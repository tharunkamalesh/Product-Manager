import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createJiraIssue } from "../_lib/jira";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const result = await createJiraIssue(body, process.env as Record<string, string>);
    return res.status(200).json({ success: true, ...result });
  } catch (e: any) {
    console.error("Jira API Error:", e);
    return res.status(500).json({ error: "Jira API Error", details: e.message });
  }
}

