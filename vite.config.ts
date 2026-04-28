import { defineConfig, loadEnv } from "vite";
import type { Connect } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Dev-only middleware that mirrors Vercel /api functions locally.
// Dev-only middleware that mirrors Vercel /api functions locally.
function apiDevPlugin(env: Record<string, string>) {
  return {
    name: "api-dev-plugin",
    configureServer(server: { middlewares: Connect.Server }) {
      // Inject loaded environment variables into process.env for the API handlers
      Object.assign(process.env, env);

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
        const url = new URL(req.url || "", `http://${req.headers.host}`);
        if (!url.pathname.startsWith("/api")) return next();
        
        // Skip some paths that might be static files or handled elsewhere
        if (url.pathname.includes(".")) return next();

        console.log(`[API DEV] ${req.method} ${url.pathname}`);

        try {
          // Resolve file path: /api/auth/jira/connect -> ./api/auth/jira/connect.ts
          const parts = url.pathname.split("/").filter(Boolean);
          const filePath = parts.join("/") + ".ts";
          
          let handlerModule;
          try {
            handlerModule = await (server as any).ssrLoadModule(filePath);
          } catch (e: any) {
            // Try /api/jira/create-issue -> api/jira/create-issue.ts
            // If it fails, maybe it's a 404
            console.warn(`[API DEV] Could not find handler for ${url.pathname} at ${filePath}`);
            return next();
          }

          const handler = handlerModule.default;
          if (typeof handler !== "function") {
            console.error(`[API DEV] ${filePath} does not export a default function`);
            return next();
          }

          // Read body if POST/PUT
          let body = {};
          if (req.method === "POST" || req.method === "PUT") {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const data = Buffer.concat(buffers).toString();
            try {
              body = data ? JSON.parse(data) : {};
            } catch (e) {
              body = data; // fallback to raw string
            }
          }

          // Mock Vercel Request/Response
          const vReq: any = req;
          vReq.query = Object.fromEntries(url.searchParams.entries());
          vReq.body = body;
          vReq.cookies = {}; // mock

          const vRes: any = res;
          const originalSetHeader = res.setHeader.bind(res);
          
          vRes.status = (code: number) => {
            res.statusCode = code;
            return vRes;
          };
          vRes.json = (json: any) => {
            originalSetHeader("Content-Type", "application/json");
            res.end(JSON.stringify(json));
            return vRes;
          };
          vRes.redirect = (url: string) => {
            res.statusCode = 302;
            originalSetHeader("Location", url);
            res.end();
            return vRes;
          };
          vRes.setHeader = (name: string, value: string) => {
            originalSetHeader(name, value);
            return vRes;
          };

          // Execute handler
          await handler(vReq, vRes);
        } catch (error: any) {
          console.error(`[API DEV] Error handling ${url.pathname}:`, error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Internal Server Error", details: error.message }));
        }
      });
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
