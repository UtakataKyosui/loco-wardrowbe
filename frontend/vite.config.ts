import { defineConfig, loadEnv, lazyPlugins } from "vite-plus";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { lismCss } from "@lism-css/plugin/vite";
import react from "@vitejs/plugin-react";

// The backend reads its port from `PORT` (see `config/development.yaml`:
// `get_env(name="PORT", default="5150")`), so this proxy has to read the same
// variable. Hardcoding the default silently sends every `/api` call to 5150 the
// moment anyone overrides it.
//
// `loadEnv` is Vite's own reader; the empty prefix takes shell variables too.
// It is used here for the dev server only — nothing is exposed to the client.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "..", "");
  const backendPort = env.PORT || "5150";

  // Clerk's publishable key is public. The backend reads `CLERK_PUBLISHABLE_KEY`
  // too, so one variable serves both. A key present at build time is inlined;
  // without one the SPA reads it from the backend (`/config.json`).
  const clerkKey = env.CLERK_PUBLISHABLE_KEY || env.VITE_CLERK_PUBLISHABLE_KEY || "";

  return {
    define: {
      "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(clerkKey),
    },
    fmt: {},
    lint: {
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: { "vite-plus/prefer-vite-plus-imports": "error" },
      options: { typeAware: true, typeCheck: true },
    },
    plugins: lazyPlugins(() => [
      lismCss(),
      // Loco serves `dist/client` as static files, so build a SPA shell
      // (`index.html`) instead of an SSR bundle.
      tanstackStart({ spa: { enabled: true, prerender: { outputPath: "/index" } } }),
      // react's vite plugin must come after start's vite plugin
      react(),
    ]),
    server: {
      port: 5173,
      proxy: {
        "/api": `http://localhost:${backendPort}`,
        "/config.json": `http://localhost:${backendPort}`,
      },
    },
  };
});
