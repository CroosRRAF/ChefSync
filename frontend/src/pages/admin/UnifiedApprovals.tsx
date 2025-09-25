import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/utils/fetcher';
import {
  Users,
  ChefHat,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  AlertTriangle,
  Clock
} from 'lucide-react';
import ApiTest from '@/components/ApiTest';

interface PendingUser {
  user_id: number;
  name: string;
  email: string;
  role: 'cook' | 'delivery_agent';
  phone_no?: string;
  address?: string;
  created_at: string;
  documents?: any[];
  approval_status: 'pending' | 'approved' | 'rejected';
}

const UnifiedApprovals: React.FC = () => {
  const { theme } = useTheme();
  const [pendingCooks, setPendingCooks] = useState<PendingUser[]>([]);
  const [pendingDeliveryAgents, setPendingDeliveryAgents] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    checkUserProfile();
    fetchPendingApprovals();
  }, []);

  const checkUserProfile = async () => {
    try {
      const profile = await apiClient.get('auth/profile/');
      setUserProfile(profile);
      console.log('👤 User profile:', profile);
    } catch (error) {
      console.warn('⚠️ Could not fetch user profile:', error);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);

      // Check authentication status
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('⚠️ No authentication token found. Please log in as an admin user.');
        alert('Please log in as an admin user to view pending approvals.');
        setPendingCooks([]);
        setPendingDeliveryAgents([]);
        setLoading(false);
        return;
      }

      const [cooksResponse, deliveryResponse] = await Promise.all([
        apiClient.get('auth/admin/pending-approvals/?role=cook'),
        apiClient.get('auth/admin/pending-approvals/?role=delivery_agent')
      ]);

      // Enhanced validation for API responses (apiClient.get() returns response.data directly)
      const validateResponse = (data: any, role: string) => {
        if (!data) {
          console.warn(`${role} API: No data received`);
          return [];
        }

        if (typeof data !== 'object') {
          console.warn(`${role} API: Invalid data type received:`, typeof data, data);
          return [];
        }

        if (!data.users) {
          console.warn(`${role} API response missing 'users' property. Available properties:`, Object.keys(data));
          console.warn(`${role} API response data:`, data);
          return [];
        }

        if (!Array.isArray(data.users)) {
          console.warn(`${role} API response data.users is not an array. Type: ${typeof data.users}, Value:`, data.users);
          return [];
        }

        console.log(`${role} API: Successfully received ${data.users.length} pending users`);
        return data.users;
      };

      const cooksData = validateResponse(cooksResponse, 'Cooks');
      const deliveryData = validateResponse(deliveryResponse, 'Delivery Agents');

      setPendingCooks(cooksData);
      setPendingDeliveryAgents(deliveryData);
    } catch (error: any) {
      console.error('❌ Error fetching pending approvals:', error);

      // Set empty arrays on error to prevent undefined state
      setPendingCooks([]);
      setPendingDeliveryAgents([]);

      // Provide more specific error messages
      if (error.response?.status === 401) {
        alert('Authentication required. Please log in as an admin user.');
      } else if (error.response?.status === 403) {
        alert('Access denied. You do not have permission to view pending approvals.');
      } else if (error.response?.status === 400) {
        alert(`Invalid request: ${error.response?.data?.error || 'Bad request'}`);
      } else {
        alert(`Failed to load pending approvals: ${error.response?.data?.detail || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (user: PendingUser, action: 'approve' | 'reject') => {
    try {
      setActionLoading(user.user_id);
      
      console.log(`🔄 ${action}ing user:`, user.user_id, action);
      
      const response = await apiClient.post(`auth/admin/user/${user.user_id}/approve/`, {
        action: action
      });

      console.log(`✅ ${action} response:`, response);

      // Since apiClient.post returns response.data directly, we don't need to check response.status
      // If we get here without throwing an error, the request was successful
      if (response) {
        // Remove from pending list
        if (user.role === 'cook') {
          setPendingCooks(prev => prev.filter(u => u.user_id !== user.user_id));
        } else {
          setPendingDeliveryAgents(prev => prev.filter(u => u.user_id !== user.user_id));
        }

        // Show success message with backend response message if available
        const message = response.message || `User ${action}d successfully!`;
        alert(`${message} ${action === 'approve' ? 'Approval email sent.' : 'Rejection email sent.'}`);
      }
    } catch (error: any) {
      console.error(`❌ Error ${action}ing user:`, error);

      // Provide more specific error messages
      if (error.response?.status === 401) {
        alert('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        alert('Access denied. You do not have permission to approve users.');
      } else if (error.response?.status === 404) {
        alert(`User not found: ${error.response?.data?.error || 'User does not exist'}`);
      } else if (error.response?.status === 400) {
        alert(`Invalid request: ${error.response?.data?.error || 'Bad request'}`);
      } else {
        alert(`Failed to ${action} user: ${error.response?.data?.detail || error.response?.data?.error || error.message}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const UserCard: React.FC<{ user: PendingUser }> = ({ user }) => {
    // Enhanced safety check for user object
    if (!user) {
      console.warn('UserCard received undefined/null user');
      return null;
    }

    if (!user.user_id) {
      console.warn('UserCard received user without ID:', user);
      return null;
    }

    return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              user.role === 'cook'
                ? 'bg-orange-100 dark:bg-orange-900/20'
                : 'bg-green-100 dark:bg-green-900/20'
            }`}>
              {user.role === 'cook' ? (
                <ChefHat className={`h-6 w-6 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
              ) : (
                <Truck className={`h-6 w-6 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
              )}
            </div>
            <div>
              <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {user.name || 'Unknown User'}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {user.email || 'No email provided'}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {user.role === 'cook' ? 'Cook' : user.role === 'delivery_agent' ? 'Delivery Agent' : 'Unknown Role'}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Date not available'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApproval(user, 'reject')}
              disabled={actionLoading === user.user_id}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={() => handleApproval(user, 'approve')}
              disabled={actionLoading === user.user_id}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </div>
        </div>

        {/* Additional Details */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {user.phone_no && (
              <div>
                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Phone:
                </span>
                <span className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user.phone_no}
                </span>
              </div>
            )}
            {user.address && (
              <div>
                <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Address:
                </span>
                <span className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user.address}
                </span>
              </div>
            )}
            {(!user.phone_no && !user.address) && (
              <div className="col-span-2">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  No additional contact information provided
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Unified Approvals
            </h1>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Loading pending approvals...
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalPending = (Array.isArray(pendingCooks) ? pendingCooks : []).length +
                      (Array.isArray(pendingDeliveryAgents) ? pendingDeliveryAgents : []).length;

  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem('access_token');

  return (
    <div className="space-y-6">
      {/* Authentication Status */}
      {!isAuthenticated && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 dark:text-red-200 font-medium">
                Authentication Required
              </p>
            </div>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">
              Please log in as an admin user to view and manage pending approvals.
            </p>
          </CardContent>
        </Card>
      )}

      {isAuthenticated && userProfile && userProfile.role.toLowerCase() !== 'admin' && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                Admin Access Required
              </p>
            </div>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
              You need admin privileges to view pending approvals. Current role: {userProfile.role}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Unified Approvals
          </h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Manage all pending user approvals in one place
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="text-sm">
            {totalPending} pending approval{totalPending !== 1 ? 's' : ''}
          </Badge>
          <Button onClick={fetchPendingApprovals} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pending Cooks
                </p>
                <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {Array.isArray(pendingCooks) ? pendingCooks.length : 0}
                </p>
              </div>
              <ChefHat className={`h-8 w-8 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pending Delivery Agents
                </p>
                <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {Array.isArray(pendingDeliveryAgents) ? pendingDeliveryAgents.length : 0}
                </p>
              </div>
              <Truck className={`h-8 w-8 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Pending
                </p>
                <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {totalPending}
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approvals Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            All Pending ({totalPending})
          </TabsTrigger>
          <TabsTrigger value="cooks">
            Cooks ({Array.isArray(pendingCooks) ? pendingCooks.length : 0})
          </TabsTrigger>
          <TabsTrigger value="delivery">
            Delivery Agents ({Array.isArray(pendingDeliveryAgents) ? pendingDeliveryAgents.length : 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {totalPending === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className={`h-16 w-16 mx-auto mb-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  All Caught Up!
                </h3>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  There are no pending approvals at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {[
                ...(Array.isArray(pendingCooks) ? pendingCooks : []),
                ...(Array.isArray(pendingDeliveryAgents) ? pendingDeliveryAgents : [])
              ].map((user) => (
                <UserCard key={user?.user_id || Math.random()} user={user} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cooks" className="space-y-6">
          {Array.isArray(pendingCooks) && pendingCooks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ChefHat className={`h-16 w-16 mx-auto mb-4 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  No Pending Cooks
                </h3>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  All cook applications have been processed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {(Array.isArray(pendingCooks) ? pendingCooks : []).map((user) => (
                <UserCard key={user?.user_id || Math.random()} user={user} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          {Array.isArray(pendingDeliveryAgents) && pendingDeliveryAgents.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Truck className={`h-16 w-16 mx-auto mb-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  No Pending Delivery Agents
                </h3>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  All delivery agent applications have been processed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {(Array.isArray(pendingDeliveryAgents) ? pendingDeliveryAgents : []).map((user) => (
                <UserCard key={user?.user_id || Math.random()} user={user} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* API Test Section - Remove this after testing */}
      <div className="mt-8">
        <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          API Endpoint Testing
        </h2>

        {/* Debug Information */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="space-y-1">
              <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
              <p><strong>User Role:</strong> {userProfile?.role || 'Unknown'}</p>
              <p><strong>Pending Cooks:</strong> {Array.isArray(pendingCooks) ? pendingCooks.length : 'N/A'}</p>
              <p><strong>Pending Delivery Agents:</strong> {Array.isArray(pendingDeliveryAgents) ? pendingDeliveryAgents.length : 'N/A'}</p>
              <p><strong>Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}</p>
            </div>
          </CardContent>
        </Card>

        <ApiTest />
      </div>
    </div>
  );
};

export default UnifiedApprovals;