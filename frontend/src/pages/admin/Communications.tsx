import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { lazy, Suspense } from 'react';

// Lazy load the communication components
const FeedbackManagement = lazy(() => import('@/pages/admin/communications/FeedbackManagement'));
const ComplaintManagement = lazy(() => import('@/pages/admin/communications/ComplaintManagement'));
const SystemAlerts = lazy(() => import('@/pages/admin/communications/SystemAlerts'));
const EmailTemplates = lazy(() => import('@/pages/admin/communications/EmailTemplates'));

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-semibold text-red-800">Something went wrong</h3>
        <p className="text-red-600">Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }

  return <>{children}</>;
};

const TabContent: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => {
  return (
    <TabsContent value={value}>
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        }>
          {children}
        </Suspense>
      </ErrorBoundary>
    </TabsContent>
  );
};

const Communications: React.FC = () => {
  const [activeTab, setActiveTab] = useState('feedback');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Remove loading state after components are mounted
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
        <p className="text-muted-foreground">
          Manage customer feedback, complaints, system alerts, and email communications.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="feedback">Feedback Management</TabsTrigger>
              <TabsTrigger value="complaints">Complaint Management</TabsTrigger>
              <TabsTrigger value="alerts">System Alerts</TabsTrigger>
              <TabsTrigger value="templates">Email Templates</TabsTrigger>
            </TabsList>

            <TabContent value="feedback">
              <FeedbackManagement />
            </TabContent>

            <TabContent value="complaints">
              <ComplaintManagement />
            </TabContent>

            <TabContent value="alerts">
              <SystemAlerts />
            </TabContent>

            <TabContent value="templates">
              <EmailTemplates />
            </TabContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Communications;