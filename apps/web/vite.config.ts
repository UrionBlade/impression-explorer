import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // ponytail: proxy /api to the Spring Boot backend in dev so the browser
    // talks to one origin; drop this if you serve web and api behind one gateway.
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
