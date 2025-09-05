import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useUserStore } from '@/store/userStore';
import { Users, Search, UserPlus, Edit, Trash2, Shield } from 'lucide-react';

const AdminManageUsers: React.FC = () => {
  const { user } = useUserStore();

  if (!user) {
    return <div>Loading...</div>;
  }

  // Mock data - in real app this would come from API
  const mockUsers = [
    {
      id: '1',
      name: 'John Customer',
      email: 'john@example.com',
      role: 'customer',
      status: 'active',
      created_at: '2024-01-15',
      last_login: '2024-01-20'
    },
    {
      id: '2',
      name: 'Chef Maria',
      email: 'maria@example.com',
      role: 'cook',
      status: 'active',
      created_at: '2024-01-10',
      last_login: '2024-01-19'
    },
    {
      id: '3',
      name: 'Mike Delivery',
      email: 'mike@example.com',
      role: 'delivery_agent',
      status: 'active',
      created_at: '2024-01-12',
      last_login: '2024-01-18'
    }
  ];

  const getRoleBadge = (role: string) => {
    const variants = {
      customer: 'default',
      cook: 'secondary',
      delivery_agent: 'outline',
      admin: 'destructive'
    };
    return <Badge variant={variants[role as keyof typeof variants] || 'default'}>
      {role.replace('_', ' ')}
    </Badge>;
  };

  const getStatusBadge = (status: string) => {
    return <Badge variant={status === 'active' ? 'default' : 'secondary'}>
      {status}
    </Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all users on the platform</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name or email..."
              className="pl-10"
            />
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>All Users ({mockUsers.length})</span>
            </CardTitle>
            <CardDescription>
              Manage user accounts, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Joined</th>
                    <th className="text-left py-3 px-4 font-medium">Last Login</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(user.last_login).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <Shield className="h-3 w-3 mr-1" />
                            Permissions
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminManageUsers;

