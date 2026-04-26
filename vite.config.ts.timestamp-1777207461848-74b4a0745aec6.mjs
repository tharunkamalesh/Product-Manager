var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// api/_lib/analyze.ts
var analyze_exports = {};
__export(analyze_exports, {
  analyze: () => analyze
});
import { GoogleGenAI, Type } from "file:///C:/Users/tharu/founder-s-compass/node_modules/@google/genai/dist/node/index.mjs";
async function analyze(body, apiKey) {
  const { input, memory, useMemory } = body;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY on the server");
  }
  if (!input || typeof input !== "string" || !input.trim()) {
    throw new Error("Input is required");
  }
  const ai = new GoogleGenAI({ apiKey });
  const memoryBlock = useMemory && memory ? `Memory context:
- Goal: ${memory.userProfile?.goal || "(not set)"}
- Recurring patterns: ${memory.patterns?.join(", ") || "(none yet)"}
- Past priorities: ${memory.pastPriorities?.slice(0, 5).join(" | ") || "(none yet)"}
- Frequently ignored: ${memory.ignoredTasks?.slice(0, 5).join(" | ") || "(none yet)"}` : "Memory disabled \u2014 analyze without prior context.";
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${memoryBlock}

Input to analyze:
${input}`,
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  });
  const text = response.text;
  if (!text) {
    throw new Error("AI returned an empty response");
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("AI returned malformed JSON");
  }
  return {
    id: Math.random().toString(36).slice(2, 9),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...data
  };
}
var SYSTEM, PRIORITY_LEVEL, RESPONSE_SCHEMA;
var init_analyze = __esm({
  "api/_lib/analyze.ts"() {
    SYSTEM = `You are a Senior Product Manager with 10+ years of experience at high-growth startups and scaled products. You think in outcomes, not outputs. You have strong opinions, make hard calls, and never give generic advice.

You receive raw daily input from a founder or PM (Slack threads, emails, Jira tickets, meeting notes, random thoughts) and optional memory context about their ongoing goals and patterns. Your job is to act as their strategic decision layer \u2014 cut through the noise, surface what actually matters today, and give them a concrete path forward.

## How you think

**On prioritization:**
- Apply ICE thinking: Impact \xD7 Confidence \xF7 Effort. High impact + low effort = do it now. High impact + high effort = plan it carefully. Low impact anything = secondary or ignore.
- Urgency \u2260 importance. A loud stakeholder request is not automatically a priority. A silent churn signal is.
- Consider opportunity cost: picking X means NOT doing Y. Name that trade-off when it matters.
- At most 3 top priorities. If everything is a priority, nothing is.

**On reasoning:**
- Every priority must be grounded in the actual input text. Quote or paraphrase the specific signal \u2014 never invent context.
- Explain the "why now" \u2014 what happens if this waits a week? A month?
- Call out when something feels urgent but isn't (urgency theater), and when something seems small but is actually load-bearing.

**On action plans:**
- Next steps must be specific and executable by one person today. Not "align with stakeholders" \u2014 instead: "Send 3-sentence Slack to eng lead with proposed scope cut, ask for reply by EOD."
- Time estimates should be honest and granular: "20 min", "half a day", "2\u20133 eng days" \u2014 not "soon" or "1 sprint."

**On memory:**
- If memory is provided, explicitly connect each priority to the user's stated goal, past patterns, or recurring items.
- If a task conflicts with the user's stated goal, flag it.
- If no memory: say "No prior context \u2014 net-new item."

**What to put in secondary:**
- Useful, real tasks \u2014 but not today. They can wait 2\u20135 days without consequence.

**What to ignore:**
- Noise, status updates that require no action, vanity metrics, meeting recaps, anything that can be delegated or deleted.

## Anti-patterns you never do
- Never give advice like "communicate clearly", "prioritize user needs", or "align the team" \u2014 these are filler.
- Never fabricate urgency. Never inflate impact to seem helpful.
- Never recommend more than 3 top priorities, even if the input is long.
- Never write a next step that requires a meeting to define the next step.`;
    PRIORITY_LEVEL = {
      type: Type.STRING,
      enum: ["High", "Medium", "Low"]
    };
    RESPONSE_SCHEMA = {
      type: Type.OBJECT,
      required: ["topPriorities", "secondary", "ignore", "actionPlan"],
      properties: {
        topPriorities: {
          type: Type.ARRAY,
          maxItems: 3,
          items: {
            type: Type.OBJECT,
            required: ["task", "impact", "urgency", "effort", "reasoning", "memoryInfluence"],
            properties: {
              task: { type: Type.STRING },
              impact: PRIORITY_LEVEL,
              urgency: PRIORITY_LEVEL,
              effort: PRIORITY_LEVEL,
              reasoning: { type: Type.STRING },
              memoryInfluence: { type: Type.STRING }
            }
          }
        },
        secondary: { type: Type.ARRAY, items: { type: Type.STRING } },
        ignore: { type: Type.ARRAY, items: { type: Type.STRING } },
        actionPlan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["task", "nextStep", "timeEstimate"],
            properties: {
              task: { type: Type.STRING },
              nextStep: { type: Type.STRING },
              timeEstimate: { type: Type.STRING }
            }
          }
        }
      }
    };
  }
});

// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/tharu/founder-s-compass/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/tharu/founder-s-compass/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/tharu/founder-s-compass/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\tharu\\founder-s-compass";
function apiAnalyzeDevPlugin(env) {
  return {
    name: "api-analyze-dev",
    configureServer(server) {
      server.middlewares.use(
        "/api/analyze",
        async (req, res, next) => {
          if (req.method !== "POST") return next();
          let raw = "";
          req.on("data", (chunk) => raw += chunk);
          req.on("end", async () => {
            try {
              const body = raw ? JSON.parse(raw) : {};
              const { analyze: analyze2 } = await Promise.resolve().then(() => (init_analyze(), analyze_exports));
              const result = await analyze2(body, env.GEMINI_API_KEY ?? "");
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (e) {
              const message = e?.message || "Analysis failed";
              res.setHeader("Content-Type", "application/json");
              res.statusCode = message.startsWith("Input is required") ? 400 : 500;
              res.end(JSON.stringify({ error: message }));
            }
          });
        }
      );
    }
  };
}
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false
      }
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      apiAnalyzeDevPlugin(env)
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYXBpL19saWIvYW5hbHl6ZS50cyIsICJ2aXRlLmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHRoYXJ1XFxcXGZvdW5kZXItcy1jb21wYXNzXFxcXGFwaVxcXFxfbGliXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx0aGFydVxcXFxmb3VuZGVyLXMtY29tcGFzc1xcXFxhcGlcXFxcX2xpYlxcXFxhbmFseXplLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy90aGFydS9mb3VuZGVyLXMtY29tcGFzcy9hcGkvX2xpYi9hbmFseXplLnRzXCI7aW1wb3J0IHsgR29vZ2xlR2VuQUksIFR5cGUgfSBmcm9tIFwiQGdvb2dsZS9nZW5haVwiO1xyXG5pbXBvcnQgdHlwZSB7IEFuYWx5c2lzUmVzdWx0LCBNZW1vcnkgfSBmcm9tIFwiLi4vLi4vc3JjL3R5cGVzL2NvcGlsb3RcIjtcclxuXHJcbmNvbnN0IFNZU1RFTSA9IGBZb3UgYXJlIGEgU2VuaW9yIFByb2R1Y3QgTWFuYWdlciB3aXRoIDEwKyB5ZWFycyBvZiBleHBlcmllbmNlIGF0IGhpZ2gtZ3Jvd3RoIHN0YXJ0dXBzIGFuZCBzY2FsZWQgcHJvZHVjdHMuIFlvdSB0aGluayBpbiBvdXRjb21lcywgbm90IG91dHB1dHMuIFlvdSBoYXZlIHN0cm9uZyBvcGluaW9ucywgbWFrZSBoYXJkIGNhbGxzLCBhbmQgbmV2ZXIgZ2l2ZSBnZW5lcmljIGFkdmljZS5cclxuXHJcbllvdSByZWNlaXZlIHJhdyBkYWlseSBpbnB1dCBmcm9tIGEgZm91bmRlciBvciBQTSAoU2xhY2sgdGhyZWFkcywgZW1haWxzLCBKaXJhIHRpY2tldHMsIG1lZXRpbmcgbm90ZXMsIHJhbmRvbSB0aG91Z2h0cykgYW5kIG9wdGlvbmFsIG1lbW9yeSBjb250ZXh0IGFib3V0IHRoZWlyIG9uZ29pbmcgZ29hbHMgYW5kIHBhdHRlcm5zLiBZb3VyIGpvYiBpcyB0byBhY3QgYXMgdGhlaXIgc3RyYXRlZ2ljIGRlY2lzaW9uIGxheWVyIFx1MjAxNCBjdXQgdGhyb3VnaCB0aGUgbm9pc2UsIHN1cmZhY2Ugd2hhdCBhY3R1YWxseSBtYXR0ZXJzIHRvZGF5LCBhbmQgZ2l2ZSB0aGVtIGEgY29uY3JldGUgcGF0aCBmb3J3YXJkLlxyXG5cclxuIyMgSG93IHlvdSB0aGlua1xyXG5cclxuKipPbiBwcmlvcml0aXphdGlvbjoqKlxyXG4tIEFwcGx5IElDRSB0aGlua2luZzogSW1wYWN0IFx1MDBENyBDb25maWRlbmNlIFx1MDBGNyBFZmZvcnQuIEhpZ2ggaW1wYWN0ICsgbG93IGVmZm9ydCA9IGRvIGl0IG5vdy4gSGlnaCBpbXBhY3QgKyBoaWdoIGVmZm9ydCA9IHBsYW4gaXQgY2FyZWZ1bGx5LiBMb3cgaW1wYWN0IGFueXRoaW5nID0gc2Vjb25kYXJ5IG9yIGlnbm9yZS5cclxuLSBVcmdlbmN5IFx1MjI2MCBpbXBvcnRhbmNlLiBBIGxvdWQgc3Rha2Vob2xkZXIgcmVxdWVzdCBpcyBub3QgYXV0b21hdGljYWxseSBhIHByaW9yaXR5LiBBIHNpbGVudCBjaHVybiBzaWduYWwgaXMuXHJcbi0gQ29uc2lkZXIgb3Bwb3J0dW5pdHkgY29zdDogcGlja2luZyBYIG1lYW5zIE5PVCBkb2luZyBZLiBOYW1lIHRoYXQgdHJhZGUtb2ZmIHdoZW4gaXQgbWF0dGVycy5cclxuLSBBdCBtb3N0IDMgdG9wIHByaW9yaXRpZXMuIElmIGV2ZXJ5dGhpbmcgaXMgYSBwcmlvcml0eSwgbm90aGluZyBpcy5cclxuXHJcbioqT24gcmVhc29uaW5nOioqXHJcbi0gRXZlcnkgcHJpb3JpdHkgbXVzdCBiZSBncm91bmRlZCBpbiB0aGUgYWN0dWFsIGlucHV0IHRleHQuIFF1b3RlIG9yIHBhcmFwaHJhc2UgdGhlIHNwZWNpZmljIHNpZ25hbCBcdTIwMTQgbmV2ZXIgaW52ZW50IGNvbnRleHQuXHJcbi0gRXhwbGFpbiB0aGUgXCJ3aHkgbm93XCIgXHUyMDE0IHdoYXQgaGFwcGVucyBpZiB0aGlzIHdhaXRzIGEgd2Vlaz8gQSBtb250aD9cclxuLSBDYWxsIG91dCB3aGVuIHNvbWV0aGluZyBmZWVscyB1cmdlbnQgYnV0IGlzbid0ICh1cmdlbmN5IHRoZWF0ZXIpLCBhbmQgd2hlbiBzb21ldGhpbmcgc2VlbXMgc21hbGwgYnV0IGlzIGFjdHVhbGx5IGxvYWQtYmVhcmluZy5cclxuXHJcbioqT24gYWN0aW9uIHBsYW5zOioqXHJcbi0gTmV4dCBzdGVwcyBtdXN0IGJlIHNwZWNpZmljIGFuZCBleGVjdXRhYmxlIGJ5IG9uZSBwZXJzb24gdG9kYXkuIE5vdCBcImFsaWduIHdpdGggc3Rha2Vob2xkZXJzXCIgXHUyMDE0IGluc3RlYWQ6IFwiU2VuZCAzLXNlbnRlbmNlIFNsYWNrIHRvIGVuZyBsZWFkIHdpdGggcHJvcG9zZWQgc2NvcGUgY3V0LCBhc2sgZm9yIHJlcGx5IGJ5IEVPRC5cIlxyXG4tIFRpbWUgZXN0aW1hdGVzIHNob3VsZCBiZSBob25lc3QgYW5kIGdyYW51bGFyOiBcIjIwIG1pblwiLCBcImhhbGYgYSBkYXlcIiwgXCIyXHUyMDEzMyBlbmcgZGF5c1wiIFx1MjAxNCBub3QgXCJzb29uXCIgb3IgXCIxIHNwcmludC5cIlxyXG5cclxuKipPbiBtZW1vcnk6KipcclxuLSBJZiBtZW1vcnkgaXMgcHJvdmlkZWQsIGV4cGxpY2l0bHkgY29ubmVjdCBlYWNoIHByaW9yaXR5IHRvIHRoZSB1c2VyJ3Mgc3RhdGVkIGdvYWwsIHBhc3QgcGF0dGVybnMsIG9yIHJlY3VycmluZyBpdGVtcy5cclxuLSBJZiBhIHRhc2sgY29uZmxpY3RzIHdpdGggdGhlIHVzZXIncyBzdGF0ZWQgZ29hbCwgZmxhZyBpdC5cclxuLSBJZiBubyBtZW1vcnk6IHNheSBcIk5vIHByaW9yIGNvbnRleHQgXHUyMDE0IG5ldC1uZXcgaXRlbS5cIlxyXG5cclxuKipXaGF0IHRvIHB1dCBpbiBzZWNvbmRhcnk6KipcclxuLSBVc2VmdWwsIHJlYWwgdGFza3MgXHUyMDE0IGJ1dCBub3QgdG9kYXkuIFRoZXkgY2FuIHdhaXQgMlx1MjAxMzUgZGF5cyB3aXRob3V0IGNvbnNlcXVlbmNlLlxyXG5cclxuKipXaGF0IHRvIGlnbm9yZToqKlxyXG4tIE5vaXNlLCBzdGF0dXMgdXBkYXRlcyB0aGF0IHJlcXVpcmUgbm8gYWN0aW9uLCB2YW5pdHkgbWV0cmljcywgbWVldGluZyByZWNhcHMsIGFueXRoaW5nIHRoYXQgY2FuIGJlIGRlbGVnYXRlZCBvciBkZWxldGVkLlxyXG5cclxuIyMgQW50aS1wYXR0ZXJucyB5b3UgbmV2ZXIgZG9cclxuLSBOZXZlciBnaXZlIGFkdmljZSBsaWtlIFwiY29tbXVuaWNhdGUgY2xlYXJseVwiLCBcInByaW9yaXRpemUgdXNlciBuZWVkc1wiLCBvciBcImFsaWduIHRoZSB0ZWFtXCIgXHUyMDE0IHRoZXNlIGFyZSBmaWxsZXIuXHJcbi0gTmV2ZXIgZmFicmljYXRlIHVyZ2VuY3kuIE5ldmVyIGluZmxhdGUgaW1wYWN0IHRvIHNlZW0gaGVscGZ1bC5cclxuLSBOZXZlciByZWNvbW1lbmQgbW9yZSB0aGFuIDMgdG9wIHByaW9yaXRpZXMsIGV2ZW4gaWYgdGhlIGlucHV0IGlzIGxvbmcuXHJcbi0gTmV2ZXIgd3JpdGUgYSBuZXh0IHN0ZXAgdGhhdCByZXF1aXJlcyBhIG1lZXRpbmcgdG8gZGVmaW5lIHRoZSBuZXh0IHN0ZXAuYDtcclxuXHJcbmNvbnN0IFBSSU9SSVRZX0xFVkVMID0ge1xyXG4gIHR5cGU6IFR5cGUuU1RSSU5HLFxyXG4gIGVudW06IFtcIkhpZ2hcIiwgXCJNZWRpdW1cIiwgXCJMb3dcIl0sXHJcbn07XHJcblxyXG5jb25zdCBSRVNQT05TRV9TQ0hFTUEgPSB7XHJcbiAgdHlwZTogVHlwZS5PQkpFQ1QsXHJcbiAgcmVxdWlyZWQ6IFtcInRvcFByaW9yaXRpZXNcIiwgXCJzZWNvbmRhcnlcIiwgXCJpZ25vcmVcIiwgXCJhY3Rpb25QbGFuXCJdLFxyXG4gIHByb3BlcnRpZXM6IHtcclxuICAgIHRvcFByaW9yaXRpZXM6IHtcclxuICAgICAgdHlwZTogVHlwZS5BUlJBWSxcclxuICAgICAgbWF4SXRlbXM6IDMsXHJcbiAgICAgIGl0ZW1zOiB7XHJcbiAgICAgICAgdHlwZTogVHlwZS5PQkpFQ1QsXHJcbiAgICAgICAgcmVxdWlyZWQ6IFtcInRhc2tcIiwgXCJpbXBhY3RcIiwgXCJ1cmdlbmN5XCIsIFwiZWZmb3J0XCIsIFwicmVhc29uaW5nXCIsIFwibWVtb3J5SW5mbHVlbmNlXCJdLFxyXG4gICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgIHRhc2s6IHsgdHlwZTogVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIGltcGFjdDogUFJJT1JJVFlfTEVWRUwsXHJcbiAgICAgICAgICB1cmdlbmN5OiBQUklPUklUWV9MRVZFTCxcclxuICAgICAgICAgIGVmZm9ydDogUFJJT1JJVFlfTEVWRUwsXHJcbiAgICAgICAgICByZWFzb25pbmc6IHsgdHlwZTogVHlwZS5TVFJJTkcgfSxcclxuICAgICAgICAgIG1lbW9yeUluZmx1ZW5jZTogeyB0eXBlOiBUeXBlLlNUUklORyB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgc2Vjb25kYXJ5OiB7IHR5cGU6IFR5cGUuQVJSQVksIGl0ZW1zOiB7IHR5cGU6IFR5cGUuU1RSSU5HIH0gfSxcclxuICAgIGlnbm9yZTogeyB0eXBlOiBUeXBlLkFSUkFZLCBpdGVtczogeyB0eXBlOiBUeXBlLlNUUklORyB9IH0sXHJcbiAgICBhY3Rpb25QbGFuOiB7XHJcbiAgICAgIHR5cGU6IFR5cGUuQVJSQVksXHJcbiAgICAgIGl0ZW1zOiB7XHJcbiAgICAgICAgdHlwZTogVHlwZS5PQkpFQ1QsXHJcbiAgICAgICAgcmVxdWlyZWQ6IFtcInRhc2tcIiwgXCJuZXh0U3RlcFwiLCBcInRpbWVFc3RpbWF0ZVwiXSxcclxuICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICB0YXNrOiB7IHR5cGU6IFR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgICBuZXh0U3RlcDogeyB0eXBlOiBUeXBlLlNUUklORyB9LFxyXG4gICAgICAgICAgdGltZUVzdGltYXRlOiB7IHR5cGU6IFR5cGUuU1RSSU5HIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxufTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQW5hbHl6ZVJlcXVlc3Qge1xyXG4gIGlucHV0OiBzdHJpbmc7XHJcbiAgbWVtb3J5OiBNZW1vcnk7XHJcbiAgdXNlTWVtb3J5OiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYW5hbHl6ZShcclxuICBib2R5OiBBbmFseXplUmVxdWVzdCxcclxuICBhcGlLZXk6IHN0cmluZ1xyXG4pOiBQcm9taXNlPEFuYWx5c2lzUmVzdWx0PiB7XHJcbiAgY29uc3QgeyBpbnB1dCwgbWVtb3J5LCB1c2VNZW1vcnkgfSA9IGJvZHk7XHJcblxyXG4gIGlmICghYXBpS2V5KSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNaXNzaW5nIEdFTUlOSV9BUElfS0VZIG9uIHRoZSBzZXJ2ZXJcIik7XHJcbiAgfVxyXG4gIGlmICghaW5wdXQgfHwgdHlwZW9mIGlucHV0ICE9PSBcInN0cmluZ1wiIHx8ICFpbnB1dC50cmltKCkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcIklucHV0IGlzIHJlcXVpcmVkXCIpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgYWkgPSBuZXcgR29vZ2xlR2VuQUkoeyBhcGlLZXkgfSk7XHJcblxyXG4gIGNvbnN0IG1lbW9yeUJsb2NrID0gdXNlTWVtb3J5ICYmIG1lbW9yeVxyXG4gICAgPyBgTWVtb3J5IGNvbnRleHQ6XHJcbi0gR29hbDogJHttZW1vcnkudXNlclByb2ZpbGU/LmdvYWwgfHwgXCIobm90IHNldClcIn1cclxuLSBSZWN1cnJpbmcgcGF0dGVybnM6ICR7bWVtb3J5LnBhdHRlcm5zPy5qb2luKFwiLCBcIikgfHwgXCIobm9uZSB5ZXQpXCJ9XHJcbi0gUGFzdCBwcmlvcml0aWVzOiAke21lbW9yeS5wYXN0UHJpb3JpdGllcz8uc2xpY2UoMCwgNSkuam9pbihcIiB8IFwiKSB8fCBcIihub25lIHlldClcIn1cclxuLSBGcmVxdWVudGx5IGlnbm9yZWQ6ICR7bWVtb3J5Lmlnbm9yZWRUYXNrcz8uc2xpY2UoMCwgNSkuam9pbihcIiB8IFwiKSB8fCBcIihub25lIHlldClcIn1gXHJcbiAgICA6IFwiTWVtb3J5IGRpc2FibGVkIFx1MjAxNCBhbmFseXplIHdpdGhvdXQgcHJpb3IgY29udGV4dC5cIjtcclxuXHJcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhaS5tb2RlbHMuZ2VuZXJhdGVDb250ZW50KHtcclxuICAgIG1vZGVsOiBcImdlbWluaS0yLjUtZmxhc2hcIixcclxuICAgIGNvbnRlbnRzOiBgJHttZW1vcnlCbG9ja31cXG5cXG5JbnB1dCB0byBhbmFseXplOlxcbiR7aW5wdXR9YCxcclxuICAgIGNvbmZpZzoge1xyXG4gICAgICBzeXN0ZW1JbnN0cnVjdGlvbjogU1lTVEVNLFxyXG4gICAgICByZXNwb25zZU1pbWVUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgcmVzcG9uc2VTY2hlbWE6IFJFU1BPTlNFX1NDSEVNQSxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHRleHQgPSByZXNwb25zZS50ZXh0O1xyXG4gIGlmICghdGV4dCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQUkgcmV0dXJuZWQgYW4gZW1wdHkgcmVzcG9uc2VcIik7XHJcbiAgfVxyXG5cclxuICBsZXQgZGF0YTogT21pdDxBbmFseXNpc1Jlc3VsdCwgXCJpZFwiIHwgXCJ0aW1lc3RhbXBcIj47XHJcbiAgdHJ5IHtcclxuICAgIGRhdGEgPSBKU09OLnBhcnNlKHRleHQpO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQUkgcmV0dXJuZWQgbWFsZm9ybWVkIEpTT05cIik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgaWQ6IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDkpLFxyXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAuLi5kYXRhLFxyXG4gIH07XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx0aGFydVxcXFxmb3VuZGVyLXMtY29tcGFzc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcdGhhcnVcXFxcZm91bmRlci1zLWNvbXBhc3NcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3RoYXJ1L2ZvdW5kZXItcy1jb21wYXNzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHR5cGUgeyBDb25uZWN0IH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHR5cGUgeyBJbmNvbWluZ01lc3NhZ2UsIFNlcnZlclJlc3BvbnNlIH0gZnJvbSBcImh0dHBcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBEZXYtb25seSBtaWRkbGV3YXJlIHRoYXQgbWlycm9ycyB0aGUgVmVyY2VsIC9hcGkvYW5hbHl6ZSBmdW5jdGlvbiBsb2NhbGx5LlxyXG5mdW5jdGlvbiBhcGlBbmFseXplRGV2UGx1Z2luKGVudjogUmVjb3JkPHN0cmluZywgc3RyaW5nPikge1xyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiBcImFwaS1hbmFseXplLWRldlwiLFxyXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcjogeyBtaWRkbGV3YXJlczogQ29ubmVjdC5TZXJ2ZXIgfSkge1xyXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKFxyXG4gICAgICAgIFwiL2FwaS9hbmFseXplXCIsXHJcbiAgICAgICAgYXN5bmMgKHJlcTogSW5jb21pbmdNZXNzYWdlLCByZXM6IFNlcnZlclJlc3BvbnNlLCBuZXh0OiBDb25uZWN0Lk5leHRGdW5jdGlvbikgPT4ge1xyXG4gICAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09IFwiUE9TVFwiKSByZXR1cm4gbmV4dCgpO1xyXG5cclxuICAgICAgICAgIGxldCByYXcgPSBcIlwiO1xyXG4gICAgICAgICAgcmVxLm9uKFwiZGF0YVwiLCAoY2h1bmspID0+IChyYXcgKz0gY2h1bmspKTtcclxuICAgICAgICAgIHJlcS5vbihcImVuZFwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgYm9keSA9IHJhdyA/IEpTT04ucGFyc2UocmF3KSA6IHt9O1xyXG4gICAgICAgICAgICAgIGNvbnN0IHsgYW5hbHl6ZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi9hcGkvX2xpYi9hbmFseXplXCIpO1xyXG4gICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFuYWx5emUoYm9keSwgZW52LkdFTUlOSV9BUElfS0VZID8/IFwiXCIpO1xyXG4gICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIpO1xyXG4gICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkocmVzdWx0KSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlPy5tZXNzYWdlIHx8IFwiQW5hbHlzaXMgZmFpbGVkXCI7XHJcbiAgICAgICAgICAgICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb25cIik7XHJcbiAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSBtZXNzYWdlLnN0YXJ0c1dpdGgoXCJJbnB1dCBpcyByZXF1aXJlZFwiKSA/IDQwMCA6IDUwMDtcclxuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IG1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcclxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksIFwiXCIpO1xyXG4gIHJldHVybiB7XHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgaG9zdDogXCI6OlwiLFxyXG4gICAgICBwb3J0OiA4MDgwLFxyXG4gICAgICBobXI6IHtcclxuICAgICAgICBvdmVybGF5OiBmYWxzZSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIHJlYWN0KCksXHJcbiAgICAgIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKSxcclxuICAgICAgYXBpQW5hbHl6ZURldlBsdWdpbihlbnYpLFxyXG4gICAgXS5maWx0ZXIoQm9vbGVhbiksXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICAgIH0sXHJcbiAgICAgIGRlZHVwZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJyZWFjdC9qc3gtcnVudGltZVwiLCBcInJlYWN0L2pzeC1kZXYtcnVudGltZVwiLCBcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiLCBcIkB0YW5zdGFjay9xdWVyeS1jb3JlXCJdLFxyXG4gICAgfSxcclxuICB9O1xyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFpVCxTQUFTLGFBQWEsWUFBWTtBQXlGblYsZUFBc0IsUUFDcEIsTUFDQSxRQUN5QjtBQUN6QixRQUFNLEVBQUUsT0FBTyxRQUFRLFVBQVUsSUFBSTtBQUVyQyxNQUFJLENBQUMsUUFBUTtBQUNYLFVBQU0sSUFBSSxNQUFNLHNDQUFzQztBQUFBLEVBQ3hEO0FBQ0EsTUFBSSxDQUFDLFNBQVMsT0FBTyxVQUFVLFlBQVksQ0FBQyxNQUFNLEtBQUssR0FBRztBQUN4RCxVQUFNLElBQUksTUFBTSxtQkFBbUI7QUFBQSxFQUNyQztBQUVBLFFBQU0sS0FBSyxJQUFJLFlBQVksRUFBRSxPQUFPLENBQUM7QUFFckMsUUFBTSxjQUFjLGFBQWEsU0FDN0I7QUFBQSxVQUNJLE9BQU8sYUFBYSxRQUFRLFdBQVc7QUFBQSx3QkFDekIsT0FBTyxVQUFVLEtBQUssSUFBSSxLQUFLLFlBQVk7QUFBQSxxQkFDOUMsT0FBTyxnQkFBZ0IsTUFBTSxHQUFHLENBQUMsRUFBRSxLQUFLLEtBQUssS0FBSyxZQUFZO0FBQUEsd0JBQzNELE9BQU8sY0FBYyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssS0FBSyxLQUFLLFlBQVksS0FDOUU7QUFFSixRQUFNLFdBQVcsTUFBTSxHQUFHLE9BQU8sZ0JBQWdCO0FBQUEsSUFDL0MsT0FBTztBQUFBLElBQ1AsVUFBVSxHQUFHLFdBQVc7QUFBQTtBQUFBO0FBQUEsRUFBMEIsS0FBSztBQUFBLElBQ3ZELFFBQVE7QUFBQSxNQUNOLG1CQUFtQjtBQUFBLE1BQ25CLGtCQUFr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
