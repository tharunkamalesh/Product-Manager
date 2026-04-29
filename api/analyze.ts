import type { VercelRequest, VercelResponse } from "@vercel/node";
import { analyze } from "./_lib/analyze";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const result = await analyze(body, apiKey);
    return res.status(200).json(result);
  } catch (e: any) {
    const message = e?.message || "Analysis failed";
    const status = message.startsWith("Input is required") ? 400 : 500;
    return res.status(status).json({ error: message });
  }
}
