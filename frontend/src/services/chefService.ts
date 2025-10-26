import apiClient from './apiClient';

export interface Chef {
  id: number;
  user_id: number;
  user: number;
  name: string;
  username: string;
  email: string;
  phone_no?: string;
  specialty_cuisines?: string[];
  experience_years?: number;
  certifications?: string[];
  bio?: string;
  approval_status?: string;
  rating?: number | string;
  rating_average?: number | string;
  total_orders?: number;
  total_reviews?: number;
  is_featured?: boolean;
  kitchen_location?: {
    address: string;
    city: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  };
}

class ChefService {
  private baseUrl = '/users/chef-profiles';

  async getChefDetails(chefId: number): Promise<Chef> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${chefId}/`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching details for chef ${chefId}:`, error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch chef details');
    }
  }

  async getAllChefs(): Promise<Chef[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching all chefs:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch chefs');
    }
  }
}

export const chefService = new ChefService();
