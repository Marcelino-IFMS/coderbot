import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const normalizeBasePath = (value?: string) => {
  if (!value || value === "/") {
    return "/";
  }

  let base = value.trim();

  if (!base.startsWith("/")) {
    base = `/${base}`;
  }

  base = base.replace(/\/+$/, "");

  return `${base}/`;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const configuredBase = env.VITE_APP_BASE_PATH ?? process.env.VITE_APP_BASE_PATH;
  const defaultBase = mode === "production" ? "/teacher" : "/";
  const base = normalizeBasePath(configuredBase ?? defaultBase);

  return {
    base,
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/ollama": {
          target: "http://localhost:11434",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ollama/, "")
        }
      }
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

