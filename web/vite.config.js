import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev: the API runs on PORT (default 7550, npm run dev -w server) and Vite on VITE_PORT (default 7551). /api is proxied,
// so the browser only ever talks to one origin (same-origin writes).
const api = { target: `http://127.0.0.1:${Number(process.env.PORT) || 7550}` };

export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1", port: Number(process.env.VITE_PORT) || 7551, strictPort: true, proxy: { "/api": api } },
  // The server core (real mock AS, gateway and runner) is loaded by Node itself in tests, so its data files resolve normally.
  test: { environment: "jsdom", globals: true, setupFiles: "./src/testSetup.js", server: { deps: { external: [/\/server\/src\//] } } },
});
