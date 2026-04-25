import { defineConfig, loadEnv } from "vite";
import type { Connect } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Dev-only middleware that mirrors the Vercel /api/analyze function locally.
function apiAnalyzeDevPlugin(env: Record<string, string>) {
  return {
    name: "api-analyze-dev",
    configureServer(server: { middlewares: Connect.Server }) {
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
              const message = e?.message || "Analysis failed";
              res.setHeader("Content-Type", "application/json");
              res.statusCode = message.startsWith("Input is required") ? 400 : 500;
              res.end(JSON.stringify({ error: message }));
            }
          });
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
      apiAnalyzeDevPlugin(env),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
