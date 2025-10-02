// User service for admin dashboard and profile management
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  name?: string; // Full name
  phone_number?: string;
  phone?: string;
  user_type: string;
  role?: string;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
  createdAt?: string;
  avatar?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  specialty_cuisine?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  available_hours?: string;
  service_location?: string;
  bio?: string;
  rating_average?: number;
  total_reviews?: number;
}

export interface CookProfileResponse {
  name: string;
  email: string;
  phone?: string;
  username?: string;
  address?: string;
  specialty_cuisine?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  available_hours?: string;
  service_location?: string;
  bio?: string;
  rating_average?: number;
  total_reviews?: number;
}

export interface ProfileUpdateData {
  // Basic user info
  name?: string;
  phone?: string;
  username?: string;
  address?: string;
  // Cook profile data
  specialty_cuisine?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  available_hours?: string;
  service_location?: string;
  bio?: string;
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
  private baseUrl = 'users';
  private apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  // Get authorization header
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Profile Management Methods
  async getUserProfile(): Promise<CookProfileResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/cook-profile/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(profileData: ProfileUpdateData): Promise<User> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/cook-profile/update/`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.profile || data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async deleteUserAccount(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/cook-profile/delete/`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  }

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
      throw error;
    }
  }
  
}

export const userService = new UserService();
