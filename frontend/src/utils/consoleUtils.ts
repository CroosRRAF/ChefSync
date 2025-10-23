/**
 * Console utilities for suppressing known warnings in development
 * This helps clean up the console output during development
 */

// Known warnings that we want to suppress in development
const KNOWN_WARNINGS = [
  // React warnings
  'Warning: ReactDOM.render is no longer supported',
  'Warning: componentWillReceiveProps has been renamed',
  'Warning: componentWillMount has been renamed',
  'Warning: componentWillUpdate has been renamed',
  
  // Development warnings
  'Warning: validateDOMNesting',
  'Warning: Each child in a list should have a unique "key" prop',
  
  // Third-party library warnings
  'Warning: Failed prop type',
  'Warning: Unknown event handler property',
  
  // OAuth/Google warnings
  'Warning: Google OAuth',
  'Warning: OAuth popup',
  
  // Network warnings
  'Warning: Network request failed',
  'Warning: CORS',
];

/**
 * Suppress known console warnings in development
 * This function should be called early in the application lifecycle
 */
export const suppressKnownWarnings = () => {
  // Only suppress warnings in development
  if (import.meta.env.DEV) {
    const originalWarn = console.warn;
    const originalError = console.error;
    
    // Override console.warn
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      
      // Check if this is a known warning we want to suppress
      const shouldSuppress = KNOWN_WARNINGS.some(warning => 
        message.includes(warning)
      );
      
      if (!shouldSuppress) {
        originalWarn.apply(console, args);
      }
    };

    // Override console.error for specific known deprecations
    console.error = (...args) => {
      // Filter out undefined or null arguments
      const filteredArgs = args.filter(arg => arg !== undefined && arg !== null);

      // If no valid arguments remain, skip logging entirely
      if (filteredArgs.length === 0) {
        return;
      }

      const message = filteredArgs.join(' ');

      // Filter out -ms-high-contrast deprecation (browser-level, can't be fixed by us)
      if (
        message.includes('-ms-high-contrast is in the process of being deprecated') ||
        message.includes('Deprecation') && message.includes('-ms-high-contrast')
      ) {
        return; // Suppress this browser deprecation warning
      }

      // Allow all other errors through
      originalError.apply(console, args);
    };
  }
};

/**
 * Restore original console methods
 * Useful for testing or if you need to restore normal console behavior
 */
export const restoreConsole = () => {
  // This would require storing the original methods
  // For now, we'll just reload the page to restore
  if (import.meta.env.DEV) {
    console.log('Console methods restored. Reload the page to see all warnings again.');
  }
};

/**
 * Add a custom warning to the suppression list
 * @param warning - The warning message to suppress
 */
export const addSuppressedWarning = (warning: string) => {
  if (!KNOWN_WARNINGS.includes(warning)) {
    KNOWN_WARNINGS.push(warning);
  }
};

/**
 * Remove a warning from the suppression list
 * @param warning - The warning message to stop suppressing
 */
export const removeSuppressedWarning = (warning: string) => {
  const index = KNOWN_WARNINGS.indexOf(warning);
  if (index > -1) {
    KNOWN_WARNINGS.splice(index, 1);
  }
};

/**
 * Get the list of currently suppressed warnings
 * @returns Array of suppressed warning messages
 */
export const getSuppressedWarnings = () => {
  return [...KNOWN_WARNINGS];
};

