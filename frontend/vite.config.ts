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
    port: 8081,
    // In dev, omit COOP/OAC headers entirely to avoid any postMessage/closed warnings.
    // In non-dev, keep a permissive COOP for OAuth popups.
    headers: mode === 'development' ? {} : {
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
    exclude: ["delivery-theme.css"],  // Exclude custom CSS from dependency optimization
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "axios",
      "lucide-react",
      "framer-motion",
      "@tanstack/react-query"
    ]
  },
  build: {
    // Performance optimizations for production builds
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    reportCompressedSize: false, // Disable gzip reporting for faster builds
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion', '@radix-ui/react-tooltip'],
          'data-vendor': ['axios', '@tanstack/react-query', 'zustand'],
          
          // Admin chunks
          'admin-dashboard': [
            './src/pages/admin/Dashboard.tsx',
            './src/components/admin/shared/AnimatedStats.tsx',
            './src/components/admin/shared/charts/index.ts'
          ],
          'admin-management': [
            './src/pages/admin/ManageUser.tsx',
            './src/pages/admin/OrderManagement.tsx',
            './src/pages/admin/FoodMenuManagement.tsx'
          ],
          'admin-analytics': [
            './src/pages/admin/Analytics.tsx',
            './src/pages/admin/AIInsights.tsx',
            './src/services/analyticsService.ts'
          ],
          'admin-communication': [
            './src/pages/admin/Communication.tsx',
            './src/pages/admin/FeedbackManagement.tsx',
            './src/services/communicationService.ts'
          ]
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') : 'chunk';
          return `assets/js/[name]-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // Terser options for better minification
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : []
      },
      mangle: {
        safari10: true
      }
    }
  }
}));
