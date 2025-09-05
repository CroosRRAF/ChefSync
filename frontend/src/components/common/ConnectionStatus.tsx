import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, RefreshCw, Server } from 'lucide-react';

interface ConnectionStatusProps {
  onRetry?: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onRetry }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [serverStatus, setServerStatus] = useState<{
    isOnline: boolean;
    lastChecked: Date | null;
    error?: string;
  }>({
    isOnline: false,
    lastChecked: null
  });

  const checkServerStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/health/', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      setServerStatus({
        isOnline: response.ok,
        lastChecked: new Date(),
        error: response.ok ? undefined : `Server returned status ${response.status}`
      });
    } catch (error: any) {
      let errorMessage = 'Unknown error';
      
      if (error.name === 'TimeoutError') {
        errorMessage = 'Connection timeout - server may be slow or unresponsive';
      } else if (error.code === 'ERR_CONNECTION_REFUSED' || error.name === 'TypeError') {
        errorMessage = 'Connection refused - backend server is not running';
      } else {
        errorMessage = error.message || 'Network error';
      }
      
      setServerStatus({
        isOnline: false,
        lastChecked: new Date(),
        error: errorMessage
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkServerStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    checkServerStatus();
    onRetry?.();
  };

  return (
    <div className="space-y-4">
      <Alert variant={serverStatus.isOnline ? "default" : "destructive"}>
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4" />
          <span className="font-medium">Backend Server Status</span>
          <Badge variant={serverStatus.isOnline ? "default" : "destructive"}>
            {serverStatus.isOnline ? (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Online
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Offline
              </div>
            )}
          </Badge>
        </div>
        
        <AlertDescription className="mt-2">
          {serverStatus.isOnline ? (
            <div className="text-green-700">
              ✅ Backend server is running at http://127.0.0.1:8000
              <br />
              Last checked: {serverStatus.lastChecked?.toLocaleTimeString()}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-red-700">
                ❌ Cannot connect to backend server
                <br />
                Error: {serverStatus.error}
              </div>
              
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                <strong>To fix this issue:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Open a terminal/command prompt</li>
                  <li>Navigate to your project: <code className="bg-gray-200 px-1 rounded">cd E:\ChefSync\backend</code></li>
                  <li>Start the server: <code className="bg-gray-200 px-1 rounded">python manage.py runserver</code></li>
                  <li>Or run the setup script: <code className="bg-gray-200 px-1 rounded">setup_backend_no_venv.bat</code></li>
                </ol>
              </div>
              
              <Button 
                onClick={handleRetry} 
                disabled={isChecking}
                size="sm"
                className="mt-2"
              >
                {isChecking ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Checking...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-3 w-3" />
                    Check Again
                  </div>
                )}
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ConnectionStatus;
