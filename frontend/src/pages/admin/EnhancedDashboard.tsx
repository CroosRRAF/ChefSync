import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  ShoppingCart,
  DollarSign,
  ChefHat,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Bell,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  PieChart,
  Calendar,
  Globe,
  Package,
  UserCheck,
  UserX,
  UserPlus,
  ShoppingBag,
  Package2,
  Truck2,
  Map,
  Navigation,
  Route,
  Timer,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Archive,
  Bookmark,
  Flag,
  AlertCircle,
  Info,
  Lightbulb,
  Rocket,
  Award,
  Gift,
  Crown,
  Gem,
  Sparkles,
  Zap,
  Target,
  TrendingDown,
  Users2,
  Shield,
  Settings,
  Database,
  FileText,
  MessageSquare,
  CreditCard,
  Truck,
  ChefHat as ChefHatIcon,
  ShoppingCart as ShoppingCartIcon,
  BarChart3 as BarChart3Icon,
  Bell as BellIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  CreditCard as CreditCardIcon,
  Truck as TruckIcon,
  MessageSquare as MessageSquareIcon,
  FileText as FileTextIcon,
  Database as DatabaseIcon,
  Users as UsersIcon,
  TrendingUp as TrendingUpIcon,
  Activity as ActivityIcon,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  Download as DownloadIcon,
  RefreshCw as RefreshCwIcon,
  Eye as EyeIcon,
  ArrowUpRight as ArrowUpRightIcon,
  ArrowDownRight as ArrowDownRightIcon,
  ArrowRight as ArrowRightIcon,
  PieChart as PieChartIcon,
  Calendar as CalendarIcon,
  Globe as GlobeIcon,
  Package as PackageIcon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { adminService, type DashboardStats, type AdminOrder, type AdminActivityLog } from '@/services/adminService';
import InteractiveChart from '@/components/admin/InteractiveChart';
import AdvancedDataTable from '@/components/admin/AdvancedDataTable';
import { formatCurrency } from '@/utils/numberUtils';
import NotificationCenter from '@/components/admin/NotificationCenter';
import SystemHealthMonitor from '@/components/admin/SystemHealthMonitor';

const EnhancedDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [recentActivities, setRecentActivities] = useState<AdminActivityLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, ordersData, activitiesData, healthData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentOrders({ limit: 10 }),
        adminService.getRecentActivities({ limit: 10 }),
        adminService.getSystemHealth()
      ]);

      setStats(statsData);
      setRecentOrders(ordersData);
      setRecentActivities(activitiesData);
      setSystemHealth(healthData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleRefresh = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rejected':
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name} • Last updated: {lastRefresh?.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats?.new_users_today || 0}</span> today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats?.orders_today || 0}</span> today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats?.revenue_growth || 0}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chefs</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_chefs || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-yellow-600">{stats?.pending_chef_approvals || 0}</span> pending approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Recent Orders */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Order #{order.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.customer_name} • {order.total_amount}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <SystemHealthMonitor />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => navigate('/admin/approvals')}
                >
                  <Shield className="h-6 w-6 mb-2" />
                  <span className="text-sm">Review Approvals</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => navigate('/admin/orders')}
                >
                  <ShoppingCart className="h-6 w-6 mb-2" />
                  <span className="text-sm">Manage Orders</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => navigate('/admin/users')}
                >
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-sm">User Management</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => navigate('/admin/analytics')}
                >
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span className="text-sm">View Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
            </CardHeader>
            <CardContent>
              <AdvancedDataTable
                data={recentOrders}
                columns={[
                  { key: 'id', label: 'Order ID', sortable: true },
                  { key: 'customer_name', label: 'Customer', sortable: true },
                  { key: 'status', label: 'Status', sortable: true },
                  { key: 'total_amount', label: 'Amount', sortable: true },
                  { key: 'created_at', label: 'Date', sortable: true },
                ]}
                onRowClick={(order) => navigate(`/admin/orders/${order.id}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Pending Approvals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.pending_chef_approvals || 0}</div>
                    <p className="text-xs text-muted-foreground">Chefs waiting for approval</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.active_users || 0}</div>
                    <p className="text-xs text-muted-foreground">Users online today</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">New Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.new_users_today || 0}</div>
                    <p className="text-xs text-muted-foreground">Registered today</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <InteractiveChart
                data={[
                  { name: 'Jan', value: 400 },
                  { name: 'Feb', value: 300 },
                  { name: 'Mar', value: 600 },
                  { name: 'Apr', value: 800 },
                  { name: 'May', value: 500 },
                  { name: 'Jun', value: 700 },
                ]}
                type="line"
                title="Monthly Revenue"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <SystemHealthMonitor />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedDashboard;
