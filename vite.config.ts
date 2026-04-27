import { defineConfig, loadEnv } from "vite";
import type { Connect } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Dev-only middleware that mirrors Vercel /api functions locally.
function apiDevPlugin(env: Record<string, string>) {
  return {
    name: "api-dev-plugin",
    configureServer(server: { middlewares: Connect.Server }) {
      // Handle /api/analyze
      server.middlewares.use(
        "/api/analyze",
        async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          if (req.method !== "POST") return next();
          let raw = "";
          req.on("data", (chunk) => (raw += chunk));
          req.on("end", async () => {
            try {
              const body = raw ? JSON.parse(raw) : {};
              const { analyze } = await import("./api/_lib/analyze");
              const result = await analyze(body, env.GEMINI_API_KEY ?? "");
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (e: any) {
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
        }
      );

      // Handle /api/jira/create
      server.middlewares.use(
        "/api/jira/create",
        async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          if (req.method !== "POST") return next();
          let raw = "";
          req.on("data", (chunk) => (raw += chunk));
          req.on("end", async () => {
            try {
              const body = raw ? JSON.parse(raw) : {};
              const { createJiraIssue } = await import("./api/_lib/jira");
              const result = await createJiraIssue(body, env);
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, ...result }));
            } catch (e: any) {
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Jira API Error", details: e.message }));
            }
          });
        }
      );

      // Handle /api/jira/users (GET) — assignable users for the configured project
      server.middlewares.use(
        "/api/jira/users",
        async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          if (req.method !== "GET") return next();
          try {
            let domain = (env.JIRA_DOMAIN || "").trim();
            domain = domain
              .replace(/^https?:\/\//, "")
              .replace(/\.atlassian\.net\/?$/, "")
              .replace(/\/$/, "");
            const email = (env.JIRA_EMAIL || "").trim();
            const token = (env.JIRA_API_TOKEN || "").trim();
            const projectKey = (env.JIRA_PROJECT_KEY || "KAN").trim();

            if (!domain || !email || !token) {
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Jira credentials missing" }));
              return;
            }

            const auth = Buffer.from(`${email}:${token}`).toString("base64");
            const upstream = await fetch(
              `https://${domain}.atlassian.net/rest/api/3/user/assignable/search?project=${projectKey}`,
              {
                method: "GET",
                headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
              }
            );

            if (!upstream.ok) {
              const detail = await upstream.text();
              res.setHeader("Content-Type", "application/json");
              res.statusCode = upstream.status;
              res.end(JSON.stringify({ error: "Jira API Error", details: detail }));
              return;
            }

            const users = (await upstream.json()) as any[];
            const simplified = users
              .filter((u: any) => u.accountType === "atlassian")
              .map((u: any) => ({
                accountId: u.accountId,
                displayName: u.displayName,
                avatarUrl: u.avatarUrls?.["32x32"] || u.avatarUrls?.["48x48"],
              }));

            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(JSON.stringify(simplified));
          } catch (e: any) {
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Server Error", details: e.message }));
          }
        }
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      apiDevPlugin(env),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
