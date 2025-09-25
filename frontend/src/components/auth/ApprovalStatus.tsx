import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApprovalStatusData {
  approval_status: string;
  approval_status_display: string;
  approval_notes: string;
  approved_at: string;
  can_login: boolean;
  message: string;
}

interface ApprovalStatusProps {
  onStatusChange?: (canLogin: boolean) => void;
}

const ApprovalStatus: React.FC<ApprovalStatusProps> = ({ onStatusChange }) => {
  const [statusData, setStatusData] = useState<ApprovalStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have pending user data from login attempt
    const pendingUserData = localStorage.getItem('pending_user_data');
    if (pendingUserData) {
      try {
        const data = JSON.parse(pendingUserData);
        setStatusData({
          approval_status: data.approval_status,
          approval_status_display: data.approval_status === 'pending' ? 'Pending Approval' : 
                                  data.approval_status === 'rejected' ? 'Rejected' : 'Approved',
          approval_notes: '',
          approved_at: null,
          can_login: false,
          message: data.message
        });
        onStatusChange?.(false);
        setIsLoading(false);
        // Clear the pending data
        localStorage.removeItem('pending_user_data');
        return;
      } catch (error) {
        console.error('Error parsing pending user data:', error);
      }
    }
    
    checkApprovalStatus();
  }, []);

  const checkApprovalStatus = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const token = localStorage.getItem('access_token');
      
      // Debug logging
      console.log('🔍 Checking approval status...');
      console.log('📍 API URL:', apiUrl);
      console.log('🔑 Has token:', !!token);
      
      // First try with authentication if token exists
      if (token) {
        try {
          const response = await fetch(`${apiUrl}/api/auth/approval-status/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('🔐 Auth response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Auth success:', data);
            setStatusData(data);
            onStatusChange?.(data.can_login);
            return;
          }
        } catch (authError) {
          console.log('🔐 Auth request failed:', authError);
        }
      }

      // If authentication fails or no token, try to get user email and check without auth
      let userEmail = localStorage.getItem('user_email');
      
      // If no user_email in localStorage, try to get it from user object
      if (!userEmail) {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            userEmail = user.email;
            console.log('📧 Found email in user_data:', userEmail);
          } catch (parseError) {
            console.error('❌ Error parsing user data:', parseError);
          }
        }
      } else {
        console.log('📧 Found email in user_email:', userEmail);
      }

      if (userEmail) {
        console.log('🔍 Checking with email parameter...');
        const responseWithoutAuth = await fetch(`${apiUrl}/api/auth/approval-status/?email=${encodeURIComponent(userEmail)}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📧 Email response status:', responseWithoutAuth.status);
        
        if (responseWithoutAuth.ok) {
          const data = await responseWithoutAuth.json();
          console.log('✅ Email check success:', data);
          setStatusData(data);
          onStatusChange?.(data.can_login);
        } else {
          const errorText = await responseWithoutAuth.text();
          console.error('❌ Failed to check approval status without auth:', responseWithoutAuth.status, errorText);
          // Set a default error state instead of throwing
          setStatusData({
            approval_status: 'unknown',
            approval_status_display: 'Unknown',
            approval_notes: '',
            approved_at: null,
            can_login: false,
            message: 'Unable to verify approval status. Please try logging in again.'
          });
          onStatusChange?.(false);
        }
      } else {
        console.warn('⚠️ No user email available for approval status check');
        // Set a default error state for missing email
        setStatusData({
          approval_status: 'unknown',
          approval_status_display: 'Unknown',
          approval_notes: '',
          approved_at: null,
          can_login: false,
          message: 'Unable to verify approval status. Please try logging in again.'
        });
        onStatusChange?.(false);
      }
    } catch (error) {
      console.error('💥 Error checking approval status:', error);
      // Set a more user-friendly error state instead of showing toast immediately
      setStatusData({
        approval_status: 'error',
        approval_status_display: 'Error',
        approval_notes: '',
        approved_at: null,
        can_login: false,
        message: 'Network error occurred while checking approval status. Please check your connection and try again.'
      });
      onStatusChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkApprovalStatus();
    setIsRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-8 w-8 text-red-500" />;
      case 'pending':
        return <Clock className="h-8 w-8 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
      case 'unknown':
        return <AlertTriangle className="h-8 w-8 text-orange-500" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20';
      case 'rejected':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20';
      case 'unknown':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Error</Badge>;
      case 'unknown':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Unknown</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!statusData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Unable to load approval status</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto ${getStatusColor(statusData.approval_status)}`}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {getStatusIcon(statusData.approval_status)}
        </div>
        <CardTitle className="text-2xl">
          Account Status: {statusData.approval_status_display}
        </CardTitle>
        <CardDescription className="text-base">
          {statusData.message}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          {getStatusBadge(statusData.approval_status)}
        </div>

        {statusData.approval_notes && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Admin Notes:</strong> {statusData.approval_notes}
            </AlertDescription>
          </Alert>
        )}

        {statusData.approved_at && (
          <div className="text-center text-sm text-muted-foreground">
            {statusData.approval_status === 'approved' ? 'Approved' : 'Processed'} on{' '}
            {new Date(statusData.approved_at).toLocaleDateString()}
          </div>
        )}

        {statusData.approval_status === 'pending' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Your account is currently under review.</strong>
              <br />
              Our admin team is reviewing your application and documents. You will receive an email notification once the review is complete.
              <br />
              <br />
              <strong>What happens next?</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Admin reviews your submitted documents</li>
                <li>Account gets approved or rejected</li>
                <li>You receive an email notification</li>
                <li>If approved, you can login and access your dashboard</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {statusData.approval_status === 'rejected' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Your account application was not approved.</strong>
              <br />
              Our admin team has reviewed your application and decided not to approve it at this time.
              <br />
              <br />
              <strong>What you can do:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Contact support for more information about the rejection</li>
                <li>Review the admin notes (if provided) for specific reasons</li>
                <li>Consider reapplying with updated information or documents</li>
                <li>Contact us if you believe this was an error</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {(statusData.approval_status === 'error' || statusData.approval_status === 'unknown') && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Unable to verify your approval status.</strong>
              <br />
              {statusData.message}
              <br />
              <br />
              <strong>What you can do:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Click "Refresh Status" to try again</li>
                <li>Check your internet connection</li>
                <li>Try logging out and logging back in</li>
                <li>Contact support if the problem persists</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApprovalStatus;
