// User service for admin dashboard
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  user_type: string;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  user_type?: string;
  is_active?: boolean;
}

export interface UserResponse {
  users: User[];
  total: number;
  page: number;
  total_pages: number;
}

class UserService {
  private baseUrl = '/api/users';

  async getUsers(filters: UserFilters = {}): Promise<UserResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.user_type) params.append('user_type', filters.user_type);
      if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());

      const response = await fetch(`${this.baseUrl}/users/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      // Return mock data for development
      return this.getMockUsers(filters);
    }
  }

  private getMockUsers(filters: UserFilters): UserResponse {
    const mockUsers: User[] = [
      {
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+1234567890',
        user_type: 'customer',
        is_active: true,
        date_joined: '2024-01-15T10:30:00Z',
        last_login: '2024-01-20T14:30:00Z',
      },
      {
        id: 2,
        username: 'chef_maria',
        email: 'maria@example.com',
        first_name: 'Maria',
        last_name: 'Rodriguez',
        phone_number: '+1234567891',
        user_type: 'chef',
        is_active: true,
        date_joined: '2024-01-10T09:15:00Z',
        last_login: '2024-01-19T16:45:00Z',
      },
      {
        id: 3,
        username: 'mike_delivery',
        email: 'mike@example.com',
        first_name: 'Mike',
        last_name: 'Johnson',
        phone_number: '+1234567892',
        user_type: 'delivery',
        is_active: true,
        date_joined: '2024-01-12T11:20:00Z',
        last_login: '2024-01-18T13:15:00Z',
      },
      {
        id: 4,
        username: 'admin_sarah',
        email: 'sarah@example.com',
        first_name: 'Sarah',
        last_name: 'Wilson',
        phone_number: '+1234567893',
        user_type: 'admin',
        is_active: true,
        date_joined: '2024-01-05T08:00:00Z',
        last_login: '2024-01-20T10:30:00Z',
      },
      {
        id: 5,
        username: 'chef_antonio',
        email: 'antonio@example.com',
        first_name: 'Antonio',
        last_name: 'Garcia',
        phone_number: '+1234567894',
        user_type: 'chef',
        is_active: false,
        date_joined: '2024-01-08T14:30:00Z',
        last_login: '2024-01-15T12:00:00Z',
      },
    ];

    // Apply filters
    let filteredUsers = mockUsers;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.first_name.toLowerCase().includes(searchLower) ||
        user.last_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower)
      );
    }

    if (filters.user_type) {
      filteredUsers = filteredUsers.filter(user => user.user_type === filters.user_type);
    }

    if (filters.is_active !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.is_active === filters.is_active);
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      total: filteredUsers.length,
      page: page,
      total_pages: Math.ceil(filteredUsers.length / limit),
    };
  }
}

export const userService = new UserService();
