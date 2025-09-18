import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
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
  const [previewUser, setPreviewUser] = useState<AdminUser | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
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

  // Handle user preview on hover
  const handleUserPreview = (user: AdminUser, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    setPreviewUser(user);
    setShowPreview(true);
    setPreviewPosition({
      x: rect.left + rect.width / 2 + scrollLeft,
      y: rect.top + scrollTop - 10
    });
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
    setPreviewUser(null);
  };

  // Handle user detail view
  const handleUserDetail = async (user: AdminUser) => {
    try {
      setSelectedUser(user);
      setUserDetailLoading(true);
      setShowUserDetail(true);
      setUserDetails(null); // Reset details while loading
      
      const details = await adminService.getUserDetails(user.id);
      setUserDetails(details);
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user details');
      setUserDetails(null); // Ensure userDetails is null on error
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
    }).length,
    // Calculate role counts from all users (not filtered)
    adminCount: users.filter(u => u.role === 'admin').length,
    cookCount: users.filter(u => u.role === 'cook').length,
    customerCount: users.filter(u => u.role === 'customer').length,
    deliveryCount: users.filter(u => u.role === 'delivery_agent').length
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (value: string, row: AdminUser) => (
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors relative group"
          onMouseEnter={(e) => handleUserPreview(row, e)}
          onMouseLeave={handlePreviewClose}
          onClick={() => handleUserDetail(row)}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {value.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {value}
            </div>
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
            value === 'cook' ? 'secondary' :
            value === 'delivery_agent' ? 'outline' : 'secondary'
          }
          className={
            value === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
            value === 'cook' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
            value === 'delivery_agent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          }
        >
          {value === 'delivery_agent' ? 'Delivery' : value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      )
    },
    {
      key: 'is_active',
      title: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <Badge variant={value ? 'default' : 'destructive'} className="text-xs">
            {value ? 'Active' : 'Inactive'}
          </Badge>
        </div>
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
      key: 'actions',
      title: 'Actions',
      render: (value: any, row: AdminUser) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleUserUpdate(row.id, { is_active: !row.is_active });
            }}
            className={`h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 ${
              row.is_active 
                ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300' 
                : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
            }`}
            title={row.is_active ? 'Deactivate User' : 'Activate User'}
          >
            {row.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleUserDetail(row);
            }}
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Filters:</span>
            <Button
              variant={filters.role === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('role', '')}
            >
              All Users ({userStats.total})
            </Button>
            <Button
              variant={filters.role === 'admin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('role', filters.role === 'admin' ? '' : 'admin')}
            >
              Admins ({userStats.adminCount})
            </Button>
            <Button
              variant={filters.role === 'cook' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('role', filters.role === 'cook' ? '' : 'cook')}
            >
              Cooks ({userStats.cookCount})
            </Button>
            <Button
              variant={filters.role === 'customer' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('role', filters.role === 'customer' ? '' : 'customer')}
            >
              Customers ({userStats.customerCount})
            </Button>
            <Button
              variant={filters.role === 'delivery_agent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('role', filters.role === 'delivery_agent' ? '' : 'delivery_agent')}
            >
              Delivery ({userStats.deliveryCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                All Users
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage all users across your platform • {pagination.total} total users
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                Page {pagination.page} of {pagination.pages}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <AdvancedDataTable
            title=""
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
            onPageChange={(page) => fetchUsers(page, filters.search, filters.role, filters.status)}
            onRowClick={(row) => handleUserDetail(row)}
          />
        </CardContent>
      </Card>

      {/* User Preview Popup */}
      {showPreview && previewUser && (
        <div 
          className="fixed z-50 pointer-events-none animate-in fade-in-0 zoom-in-95"
          style={{
            left: `${previewPosition.x}px`,
            top: `${previewPosition.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 w-80 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {previewUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{previewUser.name}</h3>
                <p className="text-sm text-gray-500 truncate">{previewUser.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">Role:</span>
                <Badge 
                  variant={
                    previewUser.role === 'admin' ? 'default' :
                    previewUser.role === 'cook' ? 'secondary' :
                    previewUser.role === 'delivery_agent' ? 'outline' : 'secondary'
                  }
                  className={`text-xs ${
                    previewUser.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    previewUser.role === 'cook' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                    previewUser.role === 'delivery_agent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}
                >
                  {previewUser.role === 'delivery_agent' ? 'Delivery' : previewUser.role.charAt(0).toUpperCase() + previewUser.role.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${previewUser.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <Badge 
                    variant={previewUser.is_active ? 'default' : 'destructive'} 
                    className="text-xs"
                  >
                    {previewUser.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Orders:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-semibold">{previewUser.total_orders}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Spent:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-semibold">${previewUser.total_spent.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Joined: {new Date(previewUser.date_joined).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>Last Login: {previewUser.last_login ? new Date(previewUser.last_login).toLocaleDateString() : 'Never'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => userDetails && handleUserUpdate(userDetails.id, { 
                      is_active: !userDetails.is_active 
                    })}
                    disabled={!userDetails || userDetailLoading}
                  >
                    {userDetails?.is_active ? (
                      <>
                        <UserX className="h-4 w-4 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowUserDetail(false);
                      setSelectedUser(null);
                      setUserDetails(null);
                    }}
                  >
                    ✕
                  </Button>
                </div>
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
                            <h3 className="font-semibold text-lg">{userDetails?.name || 'Loading...'}</h3>
                            <p className="text-gray-600">{userDetails?.email || 'Loading...'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Role:</span>
                            <select
                              value={userDetails?.role || ''}
                              onChange={(e) => userDetails && handleUserUpdate(userDetails.id, { role: e.target.value })}
                              className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
                              disabled={!userDetails || userDetailLoading}
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
                              variant={userDetails?.is_active ? "default" : "destructive"}
                              size="sm"
                              className="ml-2"
                              onClick={() => userDetails && handleUserUpdate(userDetails.id, { 
                                is_active: !userDetails.is_active 
                              })}
                              disabled={!userDetails || userDetailLoading}
                            >
                              {userDetails?.is_active ? (
                                <>
                                  <UserX className="h-4 w-4 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span>
                            <input
                              type="text"
                              value={userDetails?.phone_no || ''}
                              onChange={(e) => setUserDetails(userDetails ? {...userDetails, phone_no: e.target.value} : null)}
                              onBlur={(e) => userDetails && handleUserUpdate(userDetails.id, { phone_no: e.target.value })}
                              className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-32"
                              placeholder="Phone number"
                              disabled={!userDetails || userDetailLoading}
                            />
                          </div>
                          <div>
                            <span className="font-medium">Address:</span>
                            <input
                              type="text"
                              value={userDetails?.address || ''}
                              onChange={(e) => setUserDetails(userDetails ? {...userDetails, address: e.target.value} : null)}
                              onBlur={(e) => userDetails && handleUserUpdate(userDetails.id, { address: e.target.value })}
                              className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-32"
                              placeholder="Address"
                              disabled={!userDetails || userDetailLoading}
                            />
                          </div>
                          <div>
                            <span className="font-medium">Joined:</span>
                            <span className="ml-2 text-gray-600">
                              {userDetails?.date_joined ? new Date(userDetails.date_joined).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Last Login:</span>
                            <span className="ml-2 text-gray-600">
                              {userDetails?.last_login ? new Date(userDetails.last_login).toLocaleDateString() : 'Never'}
                            </span>
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
                              {userDetails?.statistics?.total_orders || 0}
                            </div>
                            <div className="text-sm text-gray-600">Total Orders</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              ${userDetails?.statistics?.total_spent?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-sm text-gray-600">Total Spent</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Orders */}
                  {userDetails?.recent_orders && userDetails.recent_orders.length > 0 && (
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
                  {userDetails?.activity_logs && userDetails.activity_logs.length > 0 && (
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
