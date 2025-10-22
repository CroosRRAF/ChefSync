import apiClient from './apiClient';

// Enhanced interfaces for the new menu system
export interface MenuFood {
  food_id: number;
  name: string;
  description: string;
  category: string;
  food_category: number;
  category_name: string;
  cuisine_name: string;
  is_available: boolean;
  is_featured: boolean;
  preparation_time: number;
  calories_per_serving: number;
  ingredients: string[];
  allergens: string[];
  nutritional_info: Record<string, any>;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  spice_level: string;
  rating_average: number | string;
  total_reviews: number;
  total_orders: number;
  primary_image: string;
  image_url: string;
  thumbnail_url: string;
  optimized_image_url: string;
  chef: number;
  chef_name: string;
  chef_rating: number;
  prices: FoodPrice[];
  min_price: number;
  max_price: number;
  delivery_fee?: number;
  distance_km?: number;
  estimated_delivery_time?: number;
  kitchen_location?: {
    latitude: number;
    longitude: number;
    address: string;
    kitchen_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface FoodPrice {
  price_id: number;
  size: string;
  price: number;
  preparation_time: number;
  image_url: string | null;
  food: number;
  cook: number;
  cook_name?: string;
  cook_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface MenuFilters {
  search?: string;
  min_price?: number;
  max_price?: number;
  categories?: number[];
  cuisines?: number[];
  dietary?: string[]; // ['vegetarian', 'vegan', 'gluten_free']
  rating_min?: number;
  chef_ids?: number[];
  user_lat?: number;
  user_lng?: number;
  sort_by?: 'name' | 'price' | 'rating' | 'distance';
  page?: number;
  page_size?: number;
}

export interface MenuResponse {
  results: MenuFood[];
  count: number;
  num_pages: number;
  current_page: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface FilterOptions {
  cuisines: Cuisine[];
  categories: FoodCategory[];
  price_range: {
    min: number;
    max: number;
  };
  dietary_options: {
    value: string;
    label: string;
  }[];
  spice_levels: {
    value: string;
    label: string;
  }[];
  sort_options: {
    value: string;
    label: string;
  }[];
  active_chefs: {
    id: number;
    username: string;
  }[];
}

export interface Cuisine {
  id: number;
  name: string;
  description: string;
  image: string;
  is_active: boolean;
  sort_order: number;
}

export interface FoodCategory {
  id: number;
  name: string;
  cuisine: number;
  cuisine_name: string;
  description: string;
  image: string;
  is_active: boolean;
  sort_order: number;
}

export interface DeliveryFeeResponse {
  distance_km: number;
  base_fee: number;
  additional_fee: number;
  total_delivery_fee: number;
  free_distance_km: number;
  delivery_validation: {
    is_deliverable: boolean;
    distance_km: number;
    max_radius_km: number;
    message: string;
  };
  kitchen_location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

// Enhanced Menu Service
class EnhancedMenuService {
  private baseUrl = '/food';

  /**
   * Get menu foods with advanced filtering and location-based features
   */
  async getMenuFoods(filters: MenuFilters = {}): Promise<MenuResponse> {
    const params = new URLSearchParams();
    
    // Add all filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await apiClient.get(`${this.baseUrl}/menu/?${params}`);
    return response.data;
  }

  /**
   * Get available filter options
   */
  async getFilterOptions(): Promise<FilterOptions> {
    const response = await apiClient.get(`${this.baseUrl}/menu/filters/`);
    return response.data;
  }

  /**
   * Calculate delivery fee for a specific chef
   */
  async calculateDeliveryFee(
    chefId: number,
    userLocation: UserLocation
  ): Promise<DeliveryFeeResponse> {
    const response = await apiClient.post(`${this.baseUrl}/delivery/calculate-fee/`, {
      chef_id: chefId,
      user_latitude: userLocation.latitude,
      user_longitude: userLocation.longitude,
    });
    return response.data;
  }

  /**
   * Search foods with autocomplete
   */
  async searchFoods(query: string): Promise<MenuFood[]> {
    if (!query || query.length < 2) return [];
    
    const response = await apiClient.get(`${this.baseUrl}/search/?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  /**
   * Get food details by ID
   */
  async getFoodDetails(foodId: number, userLocation?: UserLocation): Promise<MenuFood> {
    const params = new URLSearchParams();
    if (userLocation) {
      params.append('user_lat', userLocation.latitude.toString());
      params.append('user_lng', userLocation.longitude.toString());
    }

    const response = await apiClient.get(`${this.baseUrl}/customer/foods/${foodId}/?${params}`);
    return response.data;
  }

  /**
   * Get food prices for a specific food
   */
  async getFoodPrices(foodId: number, userLocation?: UserLocation): Promise<FoodPrice[]> {
    const params = new URLSearchParams();
    if (userLocation) {
      params.append('lat', userLocation.latitude.toString());
      params.append('lng', userLocation.longitude.toString());
    }

    const response = await apiClient.get(`${this.baseUrl}/customer/foods/${foodId}/prices/?${params}`);
    return response.data;
  }

  /**
   * Get all cuisines
   */
  async getCuisines(): Promise<Cuisine[]> {
    const response = await apiClient.get(`${this.baseUrl}/cuisines/`);
    return response.data.results || response.data;
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<FoodCategory[]> {
    const response = await apiClient.get(`${this.baseUrl}/categories/`);
    return response.data.results || response.data;
  }

  /**
   * Add item to cart
   */
  async addToCart(priceId: number, quantity: number = 1, specialInstructions: string = ''): Promise<any> {
    const response = await apiClient.post(`/api/orders/cart/add_to_cart/`, {
      price_id: priceId,
      quantity: quantity,
      special_instructions: specialInstructions,
    });
    return response.data;
  }

  /**
   * Get cart summary
   */
  async getCartSummary(): Promise<any> {
    const response = await apiClient.get(`/api/orders/cart/cart_summary/`);
    return response.data;
  }

  /**
   * Update cart item
   */
  async updateCartItem(itemId: number, quantity: number): Promise<any> {
    const response = await apiClient.patch(`/api/orders/cart/${itemId}/`, {
      quantity: quantity,
    });
    return response.data;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(itemId: number): Promise<any> {
    const response = await apiClient.delete(`/api/orders/cart/${itemId}/`);
    return response.data;
  }

  /**
   * Clear cart
   */
  async clearCart(): Promise<any> {
    const response = await apiClient.delete(`/api/orders/cart/clear_cart/`);
    return response.data;
  }
}

export const enhancedMenuService = new EnhancedMenuService();
export default enhancedMenuService;