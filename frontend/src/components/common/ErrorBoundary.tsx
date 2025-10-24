/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service (e.g., Sentry) if configured
    // this.logErrorToService(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full border-2 border-red-200 dark:border-red-800">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-red-900 dark:text-red-100">
                    Oops! Something went wrong
                  </CardTitle>
                  <CardDescription className="text-base">
                    We encountered an unexpected error
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Message */}
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  Error Details:
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 font-mono">
                  {this.state.error?.toString()}
                </p>
              </div>

              {/* Development Info */}
              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Stack Trace (Development Only)
                  </summary>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-64 mt-2">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Helpful Tips */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <span>💡</span> What you can do:
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600">•</span>
                    Try refreshing the page
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600">•</span>
                    Go back to the home page
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600">•</span>
                    Check your internet connection
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600">•</span>
                    Clear your browser cache
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600">•</span>
                    Contact support if the problem persists
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={this.handleReload}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
                <Button
                  onClick={this.handleReset}
                  variant="secondary"
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>

              {/* Support Info */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  If this problem continues, please contact our support team
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Functional wrapper for easier use with hooks
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};
