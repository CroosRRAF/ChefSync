import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserStore } from '@/store/userStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AuthDebug: React.FC = () => {
  const auth = useAuth();
  const userStore = useUserStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Authentication Debug</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Auth Context State</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
              {JSON.stringify({
                isAuthenticated: auth.isAuthenticated,
                isLoading: auth.isLoading,
                user: auth.user,
                token: auth.token ? 'Present' : 'Missing'
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Store State</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
              {JSON.stringify({
                user: userStore.user,
                isAuthenticated: userStore.isAuthenticated
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => navigate('/cook/dashboard')}>
                Go to Cook Dashboard
              </Button>
              <Button onClick={() => navigate('/customer/dashboard')}>
                Go to Customer Dashboard
              </Button>
              <Button onClick={() => navigate('/admin/dashboard')}>
                Go to Admin Dashboard
              </Button>
              <Button onClick={() => navigate('/delivery/dashboard')}>
                Go to Delivery Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Local Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
              {JSON.stringify({
                chefsync_token: localStorage.getItem('chefsync_token') ? 'Present' : 'Missing',
                chefsync_refresh_token: localStorage.getItem('chefsync_refresh_token') ? 'Present' : 'Missing'
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthDebug;
