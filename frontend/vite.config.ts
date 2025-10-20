import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { componentTagger } from "lovable-tagger";

// __dirname is not defined in ESM; compute it from import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => ({
  server: {
    host: "::",
    port: 8080,
    // In dev, omit COOP/OAC headers entirely to avoid any postMessage/closed warnings.
    // In non-dev, keep a permissive COOP for OAuth popups.
    headers: mode === 'development' ? {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    } : {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["delivery-theme.css"]  // Exclude custom CSS from dependency optimization
  }
}));
