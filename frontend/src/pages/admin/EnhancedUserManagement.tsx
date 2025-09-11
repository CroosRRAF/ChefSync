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

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    fetchUsers(1, searchTerm, filters.role, filters.status);
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchUsers(1, newFilters.search, newFilters.role, newFilters.status);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchUsers(page, filters.search, filters.role, filters.status);
  };

  // Handle user status change
  const handleUserStatusChange = async (userId: number, action: 'activate' | 'deactivate') => {
    try {
      await adminService.updateUserStatus(userId, action);
      // Refresh the user list
      fetchUsers(pagination.page, filters.search, filters.role, filters.status);
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (selectedUsers: AdminUser[], action: string) => {
    try {
      switch (action) {
        case 'activate':
          await Promise.all(selectedUsers.map(user => 
            adminService.updateUserStatus(user.id, 'activate')
          ));
          break;
        case 'deactivate':
          await Promise.all(selectedUsers.map(user => 
            adminService.updateUserStatus(user.id, 'deactivate')
          ));
          break;
        default:
          console.log(`Bulk action: ${action}`, selectedUsers);
      }
      // Refresh the user list
      fetchUsers(pagination.page, filters.search, filters.role, filters.status);
    } catch (err) {
      console.error('Failed to perform bulk action:', err);
    }
  };

  // Handle export
  const handleExport = (data: AdminUser[]) => {
    console.log('Exporting users:', data);
    // Implement export functionality
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
        { value: 'chef', label: 'Chef' },
        { value: 'customer', label: 'Customer' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
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
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            onExport={handleExport}
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            showPagination
            onRowClick={(row) => console.log('User clicked:', row)}
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
    </div>
  );
};

export default EnhancedUserManagement;
