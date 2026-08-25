import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  // Polyfill for sockjs-client which uses Node's 'global' in browser context
  define: {
    global: "globalThis",
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8082",
        changeOrigin: true
      },
      "/ws": {
        target: "http://127.0.0.1:8082",
        changeOrigin: true,
        ws: true
      }
    }
  }
});

