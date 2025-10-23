import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/context/ThemeContext";
import AppRoutes from "./routes/AppRoutes.tsx";
import "./index.css";
import { suppressKnownWarnings } from "./utils/consoleUtils";
import { performanceMonitor } from "./utils/performanceMonitor";
import { browserCompatibility } from "./utils/browserCompatibility";

// Clean up known console warnings in development
suppressKnownWarnings();

// Register service worker for offline support and cross-device caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✓ Service Worker registered successfully');
        
        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60000);
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available - show notification
                console.log('🔄 New version available! Reloading...');
                
                // Automatically reload after a short delay
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
    
    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Message from SW:', event.data);
      
      if (event.data.type === 'SW_UPDATED') {
        console.log(`Service Worker updated to version ${event.data.version}`);
        // Clear any stale data from localStorage if needed
        // You could show a notification here
      }
    });
  });
  
  // Handle service worker controller change (when new SW takes control)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Service Worker controller changed - reloading page');
    // Only reload if we're not already reloading
    if (!window.sessionStorage.getItem('sw_reloaded')) {
      window.sessionStorage.setItem('sw_reloaded', 'true');
      window.location.reload();
    }
  });
}

  // Configure React Query for optimal performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus in production
      refetchOnWindowFocus: import.meta.env.DEV,
      // Don't refetch on reconnect in production
      refetchOnReconnect: import.meta.env.DEV,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Start performance monitoring
if (import.meta.env.DEV) {
  console.log('🚀 Performance monitoring enabled');
  performanceMonitor.recordMetric('App Initialization', performance.now());
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
