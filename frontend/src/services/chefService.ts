import apiClient from './apiClient';

export interface Chef {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    profile: {
      profile_picture: string;
      phone_number: string;
      latitude: number;
      longitude: number;
    };
  };
  bio: string;
  city: string;
  specialty: string;
  average_rating: number;
  total_reviews: number;
}

class ChefService {
  private baseUrl = '/chefs';

  async getChefDetails(chefId: number): Promise<Chef> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${chefId}/`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching details for chef ${chefId}:`, error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch chef details');
    }
  }
}

export const chefService = new ChefService();
