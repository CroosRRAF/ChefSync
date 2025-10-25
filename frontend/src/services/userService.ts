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
  experience_level?: "beginner" | "intermediate" | "advanced" | "expert";
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
  experience_level?: "beginner" | "intermediate" | "advanced" | "expert";
  available_hours?: string;
  service_location?: string;
  bio?: string;
  rating_average?: number;
  total_reviews?: number;
  kitchen_location?: {
    id?: number;
    latitude?: number;
    longitude?: number;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    landmark?: string;
  };
}

export interface ProfileUpdateData {
  // Basic user info
  name?: string;
  phone?: string;
  username?: string;
  address?: string;
  // Cook profile data
  specialty_cuisine?: string;
  experience_level?: "beginner" | "intermediate" | "advanced" | "expert";
  available_hours?: string;
  service_location?: string;
  bio?: string;
  // Kitchen location data
  kitchen_location?: {
    latitude?: number;
    longitude?: number;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    landmark?: string;
  };
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
  private baseUrl = "users";
  private apiUrl = import.meta.env.VITE_API_BASE_URL || "/api";

  // Get authorization header
  private getAuthHeaders() {
    const token = localStorage.getItem("access_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  // Profile Management Methods
  async getUserProfile(): Promise<CookProfileResponse> {
    try {
      // Get user role from localStorage or default to general profile endpoint
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const userRole = user?.role?.toLowerCase();

      // Use role-specific endpoint if cook, otherwise use general profile endpoint
      const endpoint =
        userRole === "cook" || userRole === "chef"
          ? "/auth/cook-profile/"
          : "/auth/profile/";

      console.log(`Fetching user profile from ${endpoint} (role: ${userRole})`);
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("User profile data received:", data);
      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }

  async updateUserProfile(profileData: ProfileUpdateData): Promise<User> {
    try {
      // Get user role to determine correct endpoint
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const userRole = user?.role?.toLowerCase();

      // Use role-specific endpoint if cook, otherwise use general profile update
      const endpoint =
        userRole === "cook" || userRole === "chef"
          ? "/auth/cook-profile/update/"
          : "/auth/profile/update/";

      console.log(`Updating profile via ${endpoint} with data:`, profileData);
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(
          "Update failed with status:",
          response.status,
          "Error:",
          errorData
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Profile update response:", data);
      return data.profile || data.user || data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  // Cook-specific profile methods
  async getCookProfile(): Promise<CookProfileResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/cook-profile/`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching cook profile:", error);
      throw error;
    }
  }

  async updateCookProfile(profileData: ProfileUpdateData): Promise<User> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/cook-profile/update/`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.profile || data;
    } catch (error) {
      console.error("Error updating cook profile:", error);
      throw error;
    }
  }

  async deleteUserAccount(): Promise<void> {
    try {
      // For now, keep using cook-profile endpoint for deletion
      // This should be changed to a general user deletion endpoint
      const response = await fetch(`${this.apiUrl}/auth/cook-profile/delete/`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting user account:", error);
      throw error;
    }
  }

  async getUsers(filters: UserFilters = {}): Promise<UserResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.search) params.append("search", filters.search);
      if (filters.user_type) params.append("user_type", filters.user_type);
      if (filters.is_active !== undefined)
        params.append("is_active", filters.is_active.toString());

      const response = await fetch(
        `${this.baseUrl}/users/?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  // Location Management Methods
  async updateChefLocation(location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/chef/location/`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating chef location:", error);
      throw error;
    }
  }

  async getChefLocation(
    chefId: number
  ): Promise<{
    latitude: number;
    longitude: number;
    lastUpdate: string;
  } | null> {
    try {
      const response = await fetch(
        `${this.apiUrl}/auth/chef/${chefId}/location/`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No location data available
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching chef location:", error);
      throw error;
    }
  }

  // Toggle location tracking status
  async toggleLocationTracking(isActive: boolean): Promise<void> {
    try {
      const response = await fetch(
        `${this.apiUrl}/auth/chef/location/toggle/`,
        {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            is_tracking: isActive,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("Location tracking status updated:", isActive);
    } catch (error) {
      console.error("Error updating location tracking status:", error);
      throw error;
    }
  }

  // Get current location tracking status
  async getLocationTrackingStatus(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiUrl}/auth/chef/location/status/`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.is_tracking || false;
    } catch (error) {
      console.error("Error fetching location tracking status:", error);
      return false; // Default to false if error
    }
  }
}

export const userService = new UserService();
