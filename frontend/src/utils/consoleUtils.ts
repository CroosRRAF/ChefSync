// Development console clean-up utility
// This file helps suppress known deprecation warnings during development

export const suppressKnownWarnings = () => {
  if (process.env.NODE_ENV === 'development') {
    // Store original console methods
    const originalWarn = console.warn;
    const originalError = console.error;

    // Override console.warn to filter out known React Router deprecation warnings
    console.warn = (...args) => {
      const message = args.join(' ');
      
      // Filter out React Router future flag warnings
      if (
        message.includes('React Router Future Flag Warning') ||
        message.includes('v7_startTransition') ||
        message.includes('v7_relativeSplatPath')
      ) {
        return; // Suppress these warnings since we've already addressed them
      }
      
      // Allow all other warnings through
      originalWarn.apply(console, args);
    };

    // Override console.error for specific known deprecations
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Filter out -ms-high-contrast deprecation (browser-level, can't be fixed by us)
      if (message.includes('-ms-high-contrast is in the process of being deprecated')) {
        return; // Suppress this browser deprecation warning
      }
      
      // Allow all other errors through
      originalError.apply(console, args);
    };

    console.log('🧹 Development console warnings cleaned up');
  }
};

// Restore original console methods (useful for testing)
export const restoreConsole = () => {
  if (typeof window !== 'undefined') {
    // This would require storing original methods globally, for now just reload
    console.log('Console methods can be restored by page reload');
  }
};
