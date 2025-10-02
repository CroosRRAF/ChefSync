import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  RefreshCw, 
  Bug, 
  Home, 
  ArrowLeft,
  Copy,
  CheckCircle
} from "lucide-react";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { GlassCard } from "./GlassCard";
import { GradientButton } from "./GradientButton";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: "page" | "component" | "critical";
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (e.g., Sentry)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you would send this to an error tracking service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: 'admin-user', // Get from auth context
      level: this.props.level || 'component',
    };

    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, errorReport);
    
    console.log('Error Report:', errorReport);
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1,
    });

    // Auto-retry with exponential backoff for component-level errors
    if (this.props.level === 'component') {
      this.retryTimeoutId = setTimeout(() => {
        if (this.state.hasError) {
          this.handleRetry();
        }
      }, Math.pow(2, retryCount) * 1000);
    }
  };

  private handleGoHome = () => {
    window.location.href = '/admin/dashboard';
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private handleCopyError = async () => {
    const { error, errorInfo, errorId } = this.state;
    
    const errorText = `
Error ID: ${errorId}
Message: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI() {
    const { error, errorInfo, errorId, retryCount, copied } = this.state;
    const { level = 'component', showDetails = true } = this.props;
    const canRetry = retryCount < this.maxRetries;

    // Critical error - full page takeover
    if (level === 'critical') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-red-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full"
          >
            <GlassCard gradient="orange" className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Critical System Error
              </h1>
              
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                A critical error has occurred that prevents the application from functioning properly.
                Our team has been notified and is working to resolve this issue.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GradientButton
                  gradient="blue"
                  icon={RefreshCw}
                  onClick={() => window.location.reload()}
                >
                  Reload Application
                </GradientButton>
                
                <GradientButton
                  gradient="green"
                  variant="outline"
                  icon={Home}
                  onClick={this.handleGoHome}
                >
                  Go to Dashboard
                </GradientButton>
              </div>

              {showDetails && (
                <details className="mt-8 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    Technical Details
                  </summary>
                  <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono">
                    <p><strong>Error ID:</strong> {errorId}</p>
                    <p><strong>Message:</strong> {error?.message}</p>
                    {process.env.NODE_ENV === 'development' && (
                      <pre className="mt-2 text-xs overflow-auto">
                        {error?.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </GlassCard>
          </motion.div>
        </div>
      );
    }

    // Page-level error
    if (level === 'page') {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg w-full"
          >
            <GlassCard gradient="orange" className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                  <Bug className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Page Error
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This page encountered an error and couldn't load properly.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {canRetry && (
                  <GradientButton
                    gradient="blue"
                    icon={RefreshCw}
                    onClick={this.handleRetry}
                    size="sm"
                  >
                    Try Again ({this.maxRetries - retryCount} left)
                  </GradientButton>
                )}
                
                <GradientButton
                  gradient="blue"
                  variant="outline"
                  icon={ArrowLeft}
                  onClick={this.handleGoBack}
                  size="sm"
                >
                  Go Back
                </GradientButton>
              </div>

              {showDetails && (
                <div className="mt-4 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Error Details
                    </span>
                    <button
                      onClick={this.handleCopyError}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                    <p><strong>ID:</strong> {errorId}</p>
                    <p><strong>Message:</strong> {error?.message}</p>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>
      );
    }

    // Component-level error (inline)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Component Error
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              This component failed to render properly.
            </p>
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="text-sm text-red-700 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100 font-medium mt-2 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Retry ({this.maxRetries - retryCount} left)
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default ErrorBoundary;
