import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/utils/fetcher';

const ApiTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState<string | null>(null);

  const runTest = async (testName: string, apiCall: () => Promise<any>) => {
    setLoading(testName);
    try {
      const result = await apiCall();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result }
      }));
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        }
      }));
    } finally {
      setLoading(null);
    }
  };

  const testPendingApprovals = () => runTest('pending-cooks', () =>
    apiClient.get('auth/admin/pending-approvals/?role=cook')
  );

  const testPendingDeliveryAgents = () => runTest('pending-delivery-agents', () =>
    apiClient.get('auth/admin/pending-approvals/?role=delivery_agent')
  );

  const testHealthCheck = () => runTest('health-check', () =>
    apiClient.get('auth/health/')
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={testPendingApprovals}
              disabled={loading === 'pending-cooks'}
              className="w-full"
            >
              {loading === 'pending-cooks' ? 'Testing...' : 'Test Pending Cooks'}
            </Button>
            <Button
              onClick={testPendingDeliveryAgents}
              disabled={loading === 'pending-delivery-agents'}
              className="w-full"
            >
              {loading === 'pending-delivery-agents' ? 'Testing...' : 'Test Pending Delivery Agents'}
            </Button>
            <Button
              onClick={testHealthCheck}
              disabled={loading === 'health-check'}
              className="w-full"
            >
              {loading === 'health-check' ? 'Testing...' : 'Test Health Check'}
            </Button>
          </div>

          <div className="space-y-4">
            {Object.entries(testResults).map(([testName, result]: [string, any]) => (
              <Card key={testName} className="border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{testName}</CardTitle>
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {result.success ? (
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-sm text-red-600 dark:text-red-400">
                      <p><strong>Error:</strong> {result.error}</p>
                      {result.status && <p><strong>Status:</strong> {result.status}</p>}
                      {result.data && (
                        <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded mt-2 overflow-auto max-h-32">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiTest;