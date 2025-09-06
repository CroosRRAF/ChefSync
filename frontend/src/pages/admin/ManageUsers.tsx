import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge, StatusBadge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import type { User, UserFilters } from '../../services/userService';

// Transform backend User to frontend User interface
interface FrontendUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: 'admin' | 'chef' | 'customer' | 'delivery';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  joinDate: string;
  lastLogin: string;
  avatar?: string;
}

const UserManagement: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<keyof FrontendUser>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [logout]);
  
  // API state management
  const [users, setUsers] = useState<FrontendUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Transform backend user to frontend user
  const transformUser = useCallback((backendUser: User): FrontendUser => {
    return {
      id: backendUser.id.toString(),
      name: `${backendUser.first_name} ${backendUser.last_name}`.trim() || 'Unknown User',
      email: backendUser.email,
      phone: backendUser.phone_number || 'N/A',
      user_type: backendUser.user_type as 'admin' | 'chef' | 'customer' | 'delivery',
      status: backendUser.is_active ? 'active' : 'inactive',
      joinDate: new Date(backendUser.date_joined).toLocaleDateString(),
      lastLogin: backendUser.last_login ? new Date(backendUser.last_login).toLocaleString() : 'Never',
      avatar: undefined,
    };
  }, []);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: UserFilters = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        user_type: selectedRole !== 'all' ? selectedRole : undefined,
        is_active: selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
      };

      const response = await userService.getUsers(filters);
      const transformedUsers = response.users.map(transformUser);
      
      setUsers(transformedUsers);
      setTotalUsers(response.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedRole, selectedStatus, transformUser]);

  // Load users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedRole, selectedStatus]);

  // For now, we'll use the users directly since filtering is handled by the API
  const filteredUsers = users;

  const handleSort = (column: keyof FrontendUser) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue === undefined || bValue === undefined) return 0;
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getRoleBadge = (user_type: string) => {
    const roleConfig = {
      admin: { variant: 'destructive' as const, text: 'Admin' },
      chef: { variant: 'secondary' as const, text: 'Chef' },
      customer: { variant: 'default' as const, text: 'Customer' },
      delivery: { variant: 'outline' as const, text: 'Delivery' },
    };
    
    const config = roleConfig[user_type as keyof typeof roleConfig] || { variant: 'default' as const, text: user_type };
    
    return (
      <Badge variant={config.variant}>
        {config.text}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'name' as keyof FrontendUser,
      header: 'User',
      sortable: true,
      render: (_value: any, user: FrontendUser) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.name.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'user_type' as keyof FrontendUser,
      header: 'Role',
      sortable: true,
      render: (value: any) => getRoleBadge(value),
    },
    {
      key: 'status' as keyof FrontendUser,
      header: 'Status',
      sortable: true,
      render: (value: any) => <StatusBadge status={value} size="sm" />,
    },
    {
      key: 'joinDate' as keyof FrontendUser,
      header: 'Join Date',
      sortable: true,
      render: (value: any) => (
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <i className="bx bx-calendar h-4 w-4 mr-2"></i>
          {value}
        </div>
      ),
    },
    {
      key: 'lastLogin' as keyof FrontendUser,
      header: 'Last Login',
      sortable: true,
      render: (value: any) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {value}
        </div>
      ),
    },
    {
      key: 'actions' as keyof FrontendUser,
      header: 'Actions',
      sortable: false,
      render: (_value: any, _user: FrontendUser) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <i className="bx-show h-4 w-4"></i>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <i className="bx-edit h-4 w-4"></i>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-error-600 hover:text-error-700">
            <i className="bx-trash h-4 w-4"></i>
          </Button>
        </div>
      ),
    },
  ];

  const stats = [
    { label: 'Total Users', value: users.length, icon: 'bx-user', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { label: 'Active Users', value: users.filter(u => u.status === 'active').length, icon: 'bx-user-check', color: 'text-green-600', bgColor: 'bg-green-100' },
    { label: 'Pending Users', value: users.filter(u => u.status === 'pending').length, icon: 'bx-user-x', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { label: 'Suspended Users', value: users.filter(u => u.status === 'suspended').length, icon: 'bx-user-x', color: 'text-red-600', bgColor: 'bg-red-100' },
  ];

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              User Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage all users, roles, and permissions in your kitchen platform.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => navigate('/admin/dashboard')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <i className="bx bx-arrow-back w-4 h-4"></i>
              <span>Back to Dashboard</span>
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <i className="bx bx-log-out w-4 h-4"></i>
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent>
              <div className="flex items-center">
                <div className={`flex-shrink-0 h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <i className={`${stat.icon} h-6 w-6 ${stat.color}`}></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 min-w-0">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="chef">Chef</option>
                <option value="customer">Customer</option>
                <option value="delivery">Delivery</option>
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <Button className="lg:ml-4">
              <i className="bx-plus h-4 w-4 mr-2"></i>
              Add User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                {loading ? 'Loading...' : `${filteredUsers.length} of ${totalUsers} users`}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <i className={`bx bx-refresh h-4 w-4 ${loading ? 'animate-spin' : ''}`}></i>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center">
                <i className="bx bx-error-circle text-red-500 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Failed to load users
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  <i className="bx bx-refresh h-4 w-4 mr-2"></i>
                  Try Again
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="p-8">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                    <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead 
                      key={column.key}
                      className={column.sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
                      onClick={column.sortable ? () => handleSort(column.key) : undefined}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.header}</span>
                        {column.sortable && (
                          <i className={`bx bx-sort text-gray-400 ${
                            sortColumn === column.key 
                              ? sortDirection === 'asc' ? 'bx-sort-up' : 'bx-sort-down'
                              : ''
                          }`}></i>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.render(user[column.key], user)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;