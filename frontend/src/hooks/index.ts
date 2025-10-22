// Optimistic Updates Hook
export { default as useOptimisticUpdates } from "./useOptimisticUpdates";
export type { 
  OptimisticAction, 
  UseOptimisticUpdatesOptions 
} from "./useOptimisticUpdates";

// Error Handler Hook
export { default as useErrorHandler, getErrorMessage, handleBoundaryError } from "./useErrorHandler";
export type { ErrorHandlerOptions, UseErrorHandlerReturn } from "./useErrorHandler";

// Accessibility Hooks
export {
  useFocusTrap,
  useKeyboardNavigation,
  useScreenReader,
  useAriaAttributes,
  useReducedMotion,
  useColorScheme,
  useSkipLinks,
  useFormAccessibility,
} from "./useAccessibility";

// Re-export other hooks if they exist
// export { default as useAuth } from "./useAuth";
// export { default as useLocalStorage } from "./useLocalStorage";
