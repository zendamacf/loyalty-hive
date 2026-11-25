import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** Local API for `bun run dev`. Change with ADMIN_API_PROXY_TARGET. */
const apiTarget = process.env.ADMIN_API_PROXY_TARGET ?? "http://localhost:3000";

export default defineConfig({
  // The API serves the build at /admin.
  base: "/admin/",
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      // Same origin in dev, so the admin session cookie works like in production.
      "/api": { target: apiTarget, changeOrigin: true },
    },
  },
});
