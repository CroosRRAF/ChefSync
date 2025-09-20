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

interface PendingUser {
  id: number;
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

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const [cooksResponse, deliveryResponse] = await Promise.all([
        apiClient.get('/api/auth/admin/pending-approvals/?role=cook'),
        apiClient.get('/api/auth/admin/pending-approvals/?role=delivery_agent')
      ]);

      setPendingCooks(cooksResponse.data.users || []);
      setPendingDeliveryAgents(deliveryResponse.data.users || []);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (user: PendingUser, action: 'approve' | 'reject') => {
    try {
      setActionLoading(user.id);
      const endpoint = user.role === 'cook' ? '/api/auth/admin/approve-cook/' : '/api/auth/admin/approve-delivery-agent/';

      const response = await apiClient.post(`${endpoint}${user.id}/`, {
        action: action
      });

      if (response.status >= 200 && response.status < 300) {
        // Remove from pending list
        if (user.role === 'cook') {
          setPendingCooks(prev => prev.filter(u => u.id !== user.id));
        } else {
          setPendingDeliveryAgents(prev => prev.filter(u => u.id !== user.id));
        }

        // Show success message
        alert(`User ${action}d successfully!`);
      }
    } catch (error: any) {
      console.error(`Error ${action}ing user:`, error);
      alert(`Failed to ${action} user: ${error.response?.data?.detail || error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const UserCard: React.FC<{ user: PendingUser }> = ({ user }) => (
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
                {user.name}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {user.email}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {user.role === 'cook' ? 'Cook' : 'Delivery Agent'}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(user.created_at).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApproval(user, 'reject')}
              disabled={actionLoading === user.id}
              className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={() => handleApproval(user, 'approve')}
              disabled={actionLoading === user.id}
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
          </div>
        </div>
      </CardContent>
    </Card>
  );

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

  const totalPending = pendingCooks.length + pendingDeliveryAgents.length;

  return (
    <div className="space-y-6">
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
                  {pendingCooks.length}
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
                  {pendingDeliveryAgents.length}
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
            Cooks ({pendingCooks.length})
          </TabsTrigger>
          <TabsTrigger value="delivery">
            Delivery Agents ({pendingDeliveryAgents.length})
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
              {[...pendingCooks, ...pendingDeliveryAgents].map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cooks" className="space-y-6">
          {pendingCooks.length === 0 ? (
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
              {pendingCooks.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          {pendingDeliveryAgents.length === 0 ? (
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
              {pendingDeliveryAgents.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedApprovals;