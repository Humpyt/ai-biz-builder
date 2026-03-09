import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("recharts")) {
            return "charts";
          }

          if (id.includes("@supabase")) {
            return "supabase";
          }

          if (id.includes(`${path.sep}react${path.sep}`) || id.includes(`${path.sep}react-dom${path.sep}`)) {
            return "react-core";
          }

          if (id.includes("framer-motion")) {
            return "motion";
          }

          if (id.includes("date-fns")) {
            return "date-utils";
          }

          if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) {
            return "forms";
          }

          if (id.includes("next-themes") || id.includes("sonner")) {
            return "app-shell";
          }

          if (id.includes("react-router") || id.includes("@tanstack/react-query")) {
            return "router-data";
          }

          if (id.includes("@radix-ui") || id.includes("lucide-react")) {
            return "ui";
          }

          return "vendor";
        },
      },
    },
  },
}));
