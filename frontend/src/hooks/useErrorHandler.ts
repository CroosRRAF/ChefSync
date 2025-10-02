import { useCallback, useEffect } from 'react';
import { useToast } from '@/components/admin/shared';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  reportToService?: boolean;
  fallbackMessage?: string;
}

export interface UseErrorHandlerReturn {
  handleError: (error: Error | string, context?: string, options?: ErrorHandlerOptions) => void;
  handleAsyncError: <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    options?: ErrorHandlerOptions
  ) => Promise<T | null>;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const toast = useToast();

  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      
      toast.error(
        'Unexpected Error',
        'An unexpected error occurred. Please try again or contact support if the problem persists.'
      );

      // Prevent the default browser behavior
      event.preventDefault();
    };

    // Global error handler for JavaScript errors
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Global JavaScript Error:', event.error);
      
      toast.error(
        'Application Error',
        'A JavaScript error occurred. Please refresh the page if needed.'
      );
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [toast]);

  const reportError = useCallback((error: Error, context?: string) => {
    // In a real application, you would send this to an error tracking service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: 'admin-user', // Get from auth context
    };

    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, errorReport);
    
    console.log('Error Report:', errorReport);
  }, []);

  const handleError = useCallback((
    error: Error | string,
    context?: string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logToConsole = true,
      reportToService = true,
      fallbackMessage = 'An unexpected error occurred'
    } = options;

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const errorMessage = errorObj.message || fallbackMessage;

    // Log to console
    if (logToConsole) {
      console.error(`Error${context ? ` in ${context}` : ''}:`, errorObj);
    }

    // Show toast notification
    if (showToast) {
      toast.error(
        context ? `Error in ${context}` : 'Error',
        errorMessage
      );
    }

    // Report to error tracking service
    if (reportToService) {
      reportError(errorObj, context);
    }
  }, [toast, reportError]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, context, options);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
  };
}

// Utility function for API error handling
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    // Handle API error responses
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
    
    // Handle validation errors
    if ('errors' in error && Array.isArray(error.errors)) {
      return error.errors.map((e: any) => e.message || e).join(', ');
    }
  }
  
  return 'An unexpected error occurred';
}

// Error boundary error handler
export function handleBoundaryError(error: Error, errorInfo: React.ErrorInfo) {
  console.group('🚨 Error Boundary');
  console.error('Error:', error);
  console.error('Component Stack:', errorInfo.componentStack);
  console.groupEnd();

  // Report to error tracking service
  const errorReport = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    type: 'boundary',
  };

  // Example: Send to error tracking service
  // errorTrackingService.captureException(error, errorReport);
  
  console.log('Boundary Error Report:', errorReport);
}

export default useErrorHandler;
