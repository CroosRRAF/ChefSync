import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserPlus,
  Download,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService, type AdminUser, type UserListResponse } from '@/services/adminService';
import AdvancedDataTable from '@/components/admin/AdvancedDataTable';
import AdvancedStatsCard from '@/components/admin/AdvancedStatsCard';

const EnhancedUserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: ''
  });

  // Fetch users
  const fetchUsers = useCallback(async (page = 1, search = '', role = '', status = '') => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getUsers({
        page,
        limit: pagination.limit,
        search,
        role,
        status,
        sort_by: 'date_joined',
        sort_order: 'desc'
      });
      
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [user, pagination.limit]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Enhanced search with debouncing
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const handleSearch = useCallback((searchTerm: string) => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce search
    const timeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      fetchUsers(1, searchTerm, filters.role, filters.status);
    }, 300);
    
    setSearchTimeout(timeout);
  }, [filters.role, filters.status, searchTimeout]);

  // Enhanced filter change with date range support
  const handleFilterChange = useCallback((key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Handle date range filters
    if (key === 'date_joined') {
      const now = new Date();
      let startDate = '';
      
      switch (value) {
        case 'today':
          startDate = now.toISOString().split('T')[0];
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString().split('T')[0];
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          startDate = monthAgo.toISOString().split('T')[0];
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          startDate = quarterAgo.toISOString().split('T')[0];
          break;
      }
      
      if (startDate) {
        // You would need to modify the backend to support date filtering
        console.log('Date filter:', startDate);
      }
    }
    
    fetchUsers(1, newFilters.search, newFilters.role, newFilters.status);
  }, [filters]);

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({ search: '', role: '', status: '' });
    fetchUsers(1, '', '', '');
  };

  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(value => value !== '').length;

  // Handle user detail view
  const handleUserDetail = async (user: AdminUser) => {
    try {
      setSelectedUser(user);
      setUserDetailLoading(true);
      setShowUserDetail(true);
      
      const details = await adminService.getUserDetails(user.id);
      setUserDetails(details);
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user details');
    } finally {
      setUserDetailLoading(false);
    }
  };

  // Handle user update
  const handleUserUpdate = async (userId: number, updates: any) => {
    try {
      await adminService.updateUser(userId, updates);
      // Refresh user details
      if (selectedUser) {
        const details = await adminService.getUserDetails(userId);
        setUserDetails(details);
      }
      // Refresh user list
      fetchUsers(pagination.page, filters.search, filters.role, filters.status);
    } catch (err) {
      console.error('Failed to update user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (selectedUsers: AdminUser[], action: string) => {
    try {
      const userIds = selectedUsers.map(user => user.id);
      
      switch (action) {
        case 'activate':
          await adminService.bulkActivateUsers(userIds);
          break;
        case 'deactivate':
          await adminService.bulkDeactivateUsers(userIds);
          break;
        case 'delete':
          await adminService.bulkDeleteUsers(userIds);
          break;
        default:
          console.log(`Bulk action: ${action}`, selectedUsers);
      }
      // Refresh the user list
      fetchUsers(pagination.page, filters.search, filters.role, filters.status);
    } catch (err) {
      console.error('Failed to perform bulk action:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform bulk action');
    }
  };

  // Handle export
  const handleExport = async (data: AdminUser[]) => {
    try {
      const blob = await adminService.exportUsers({
        role: filters.role,
        status: filters.status
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export users:', err);
      setError(err instanceof Error ? err.message : 'Failed to export users');
    }
  };

  // Get user stats
  const userStats = {
    total: pagination.total,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    newThisWeek: users.filter(u => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(u.date_joined) > weekAgo;
    }).length
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (value: string, row: AdminUser) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{value}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      title: 'Role',
      sortable: true,
      render: (value: string) => (
        <Badge 
          variant={
            value === 'admin' ? 'default' :
            value === 'chef' ? 'secondary' : 'outline'
          }
        >
          {value}
        </Badge>
      )
    },
    {
      key: 'is_active',
      title: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'destructive'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'total_orders',
      title: 'Orders',
      sortable: true,
      align: 'center' as const,
      render: (value: number) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'total_spent',
      title: 'Total Spent',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-medium">${value.toFixed(2)}</span>
      )
    },
    {
      key: 'last_login',
      title: 'Last Login',
      sortable: true,
      render: (value: string | null) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : 'Never'}
        </span>
      )
    },
    {
      key: 'date_joined',
      title: 'Joined',
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    }
  ];

  // Filter options
  const filterOptions = [
    {
      key: 'role',
      label: 'Role',
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'cook', label: 'Cook' },
        { value: 'customer', label: 'Customer' },
        { value: 'delivery_agent', label: 'Delivery Agent' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    {
      key: 'date_joined',
      label: 'Registration Date',
      type: 'date_range' as const,
      options: [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'quarter', label: 'This Quarter' }
      ]
    }
  ];

  // Bulk actions
  const bulkActions = [
    {
      label: 'Activate',
      icon: <UserCheck className="h-4 w-4" />,
      action: (selectedUsers: AdminUser[]) => handleBulkAction(selectedUsers, 'activate'),
      variant: 'default' as const
    },
    {
      label: 'Deactivate',
      icon: <UserX className="h-4 w-4" />,
      action: (selectedUsers: AdminUser[]) => handleBulkAction(selectedUsers, 'deactivate'),
      variant: 'destructive' as const
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      action: (selectedUsers: AdminUser[]) => handleBulkAction(selectedUsers, 'delete'),
      variant: 'destructive' as const,
      confirmMessage: 'Are you sure you want to delete the selected users? This action cannot be undone.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, roles, and permissions across your platform.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => fetchUsers()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="outline" onClick={handleClearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters ({activeFilterCount})
            </Button>
          )}
          <Button variant="outline" onClick={() => handleExport(users)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdvancedStatsCard
          title="Total Users"
          value={userStats.total}
          subtitle={`${userStats.active} active`}
          icon={<Users className="h-6 w-6" />}
          color="blue"
          onRefresh={() => fetchUsers()}
        />
        
        <AdvancedStatsCard
          title="Active Users"
          value={userStats.active}
          subtitle={`${userStats.inactive} inactive`}
          icon={<UserCheck className="h-6 w-6" />}
          color="green"
          onRefresh={() => fetchUsers()}
        />
        
        <AdvancedStatsCard
          title="New This Week"
          value={userStats.newThisWeek}
          subtitle="Recent registrations"
          icon={<Calendar className="h-6 w-6" />}
          color="purple"
          onRefresh={() => fetchUsers()}
        />
        
        <AdvancedStatsCard
          title="Total Revenue"
          value={`$${users.reduce((sum, user) => sum + user.total_spent, 0).toFixed(0)}`}
          subtitle="From all users"
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
          onRefresh={() => fetchUsers()}
        />
      </div>

      {/* Search and Filters Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <span className="text-sm text-gray-500">
                {pagination.total} users found
                {filters.search && ` for "${filters.search}"`}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {activeFilterCount > 0 && (
                <Badge variant="secondary">
                  {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                </Badge>
              )}
            </div>
          </div>
          
          {/* Quick Filter Buttons */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Quick Filters:</span>
            <Button
              variant={filters.status === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('status', filters.status === 'active' ? '' : 'active')}
            >
              Active Users
            </Button>
            <Button
              variant={filters.status === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('status', filters.status === 'inactive' ? '' : 'inactive')}
            >
              Inactive Users
            </Button>
            <Button
              variant={filters.role === 'admin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('role', filters.role === 'admin' ? '' : 'admin')}
            >
              Admins
            </Button>
            <Button
              variant={filters.role === 'cook' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('role', filters.role === 'cook' ? '' : 'cook')}
            >
              Cooks
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="chefs">Chefs</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <AdvancedDataTable
            title="All Users"
            data={users}
            columns={columns}
            searchable
            filterable
            sortable
            selectable
            bulkActions={bulkActions}
            filters={filterOptions}
            loading={loading}
            error={error}
            onExport={handleExport}
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            showPagination
            onRowClick={(row) => handleUserDetail(row)}
          />
        </TabsContent>

        <TabsContent value="chefs" className="space-y-6">
          <AdvancedDataTable
            title="Chefs"
            data={users.filter(u => u.role === 'chef')}
            columns={columns}
            searchable
            filterable
            sortable
            selectable
            bulkActions={bulkActions}
            filters={filterOptions}
            loading={loading}
            error={error}
            onExport={handleExport}
            onRowClick={(row) => console.log('Chef clicked:', row)}
          />
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <AdvancedDataTable
            title="Customers"
            data={users.filter(u => u.role === 'customer')}
            columns={columns}
            searchable
            filterable
            sortable
            selectable
            bulkActions={bulkActions}
            filters={filterOptions}
            loading={loading}
            error={error}
            onExport={handleExport}
            onRowClick={(row) => console.log('Customer clicked:', row)}
          />
        </TabsContent>

        <TabsContent value="admins" className="space-y-6">
          <AdvancedDataTable
            title="Administrators"
            data={users.filter(u => u.role === 'admin')}
            columns={columns}
            searchable
            filterable
            sortable
            selectable
            bulkActions={bulkActions}
            filters={filterOptions}
            loading={loading}
            error={error}
            onExport={handleExport}
            onRowClick={(row) => console.log('Admin clicked:', row)}
          />
        </TabsContent>
      </Tabs>

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserDetail(false)}
                >
                  ✕
                </Button>
              </div>

              {userDetailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">Loading user details...</span>
                </div>
              ) : userDetails ? (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <UserCheck className="h-5 w-5 mr-2" />
                          Basic Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{userDetails.name}</h3>
                            <p className="text-gray-600">{userDetails.email}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Role:</span>
                            <select
                              value={userDetails.role}
                              onChange={(e) => handleUserUpdate(userDetails.id, { role: e.target.value })}
                              className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="customer">Customer</option>
                              <option value="cook">Cook</option>
                              <option value="delivery_agent">Delivery Agent</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-2"
                              onClick={() => handleUserUpdate(userDetails.id, { 
                                is_active: !userDetails.is_active 
                              })}
                            >
                              {userDetails.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span>
                            <input
                              type="text"
                              value={userDetails.phone_no || ''}
                              onChange={(e) => setUserDetails({...userDetails, phone_no: e.target.value})}
                              onBlur={(e) => handleUserUpdate(userDetails.id, { phone_no: e.target.value })}
                              className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-32"
                              placeholder="Phone number"
                            />
                          </div>
                          <div>
                            <span className="font-medium">Address:</span>
                            <input
                              type="text"
                              value={userDetails.address || ''}
                              onChange={(e) => setUserDetails({...userDetails, address: e.target.value})}
                              onBlur={(e) => handleUserUpdate(userDetails.id, { address: e.target.value })}
                              className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-32"
                              placeholder="Address"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <DollarSign className="h-5 w-5 mr-2" />
                          Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {userDetails.statistics?.total_orders || 0}
                            </div>
                            <div className="text-sm text-gray-600">Total Orders</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              ${userDetails.statistics?.total_spent?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-sm text-gray-600">Total Spent</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Orders */}
                  {userDetails.recent_orders && userDetails.recent_orders.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {userDetails.recent_orders.map((order: any) => (
                            <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-medium">Order #{order.order_number}</div>
                                <div className="text-sm text-gray-600">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">${order.total_amount}</div>
                                <Badge variant={
                                  order.status === 'delivered' ? 'default' :
                                  order.status === 'cancelled' ? 'destructive' : 'secondary'
                                }>
                                  {order.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Activity Logs */}
                  {userDetails.activity_logs && userDetails.activity_logs.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {userDetails.activity_logs.map((log: any) => (
                            <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <div className="flex-1">
                                <div className="font-medium">{log.action}</div>
                                <div className="text-sm text-gray-600">{log.description}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(log.timestamp).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Failed to load user details
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedUserManagement;
