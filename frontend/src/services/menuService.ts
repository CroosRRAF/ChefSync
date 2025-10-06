import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const API = API_BASE;

// Create axios instance with authentication
const apiClient = axios.create({
  baseURL: API_BASE,
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

// Types
export interface FoodItem {
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
  rating_average: number;
  total_reviews: number;
  total_orders: number;
  images: FoodImage[];
  primary_image: string;
  image_url?: string; // Additional image URL field
  thumbnail_url?: string; // Thumbnail URL field
  available_cooks_count: number;
  prices?: FoodPriceSimple[]; // Add prices array
  created_at: string;
  updated_at: string;
}

export interface FoodImage {
  id: number;
  image: string;
  thumbnail: string;
  caption: string;
  is_primary: boolean;
  sort_order: number;
}

export interface FoodPriceSimple {
  price_id: number;
  size: string;
  price: string; // Price comes as string from API
  preparation_time: number;
  image_url: string | null;
  image_data_url: string | null;
  food: number;
  food_name: string;
  cook: number;
  cook_name: string;
  cook_rating: number;
  created_at: string;
  updated_at: string;
}

export interface FoodPrice {
  price_id: number;
  size: string;
  price: number;
  image_url: string;
  cook: {
    id: number;
    name: string;
    rating: number;
    is_active: boolean;
    profile_image?: string;
  };
  distance?: number;
  estimated_delivery_time?: number;
  created_at: string;
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

export interface CartItem {
  id: number;
  price: number;
  quantity: number;
  special_instructions: string;
  food_name: string;
  cook_name: string;
  chef_id: number;
  size: string;
  unit_price: number;
  total_price: number;
  food_image: string;
  created_at: string;
  updated_at: string;
  discount?: number; // Optional discount percentage
  isVeg?: boolean; // Optional vegetarian indicator
}

export interface CartSummary {
  total_items: number;
  total_value: number;
  cart_items: CartItem[];
}

// API Functions
export const menuService = {
  // Get all foods with filters
  getFoods: async (
    params: {
      q?: string;
      category?: string;
      cuisine?: string;
      min_price?: number;
      max_price?: number;
      veg?: boolean;
      lat?: number;
      lng?: number;
      delivery?: boolean;
      sort_by?: string;
      page?: number;
      page_size?: number;
    } = {}
  ) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(
      `/food/customer/foods/?${searchParams}`
    );
    return response.data;
  },

  // Get food prices for a specific food
  getFoodPrices: async (foodId: number, lat?: number, lng?: number) => {
    const params = new URLSearchParams();
    if (lat !== undefined) params.append("lat", lat.toString());
    if (lng !== undefined) params.append("lng", lng.toString());

    const response = await apiClient.get(
      `/food/customer/foods/${foodId}/prices/?${params}`
    );
    return response.data;
  },

  // Get cuisines
  getCuisines: async () => {
    const response = await apiClient.get(`/food/cuisines/`);
    return response.data;
  },

  // Get food categories
  getCategories: async () => {
    const response = await apiClient.get(`/food/categories/`);
    return response.data;
  },

  // Cart operations
  addToCart: async (priceId: number, quantity: number = 1) => {
    const response = await apiClient.post(`/orders/cart/add_to_cart/`, {
      price_id: priceId,
      quantity: quantity,
    });
    return response.data;
  },

  getCartSummary: async () => {
    const response = await apiClient.get(`/orders/cart/cart_summary/`);
    return response.data;
  },

  clearCart: async () => {
    const response = await apiClient.delete(`/orders/cart/clear_cart/`);
    return response.data;
  },

  updateCartItem: async (itemId: number, quantity: number) => {
    const response = await apiClient.patch(`/orders/cart/${itemId}/`, {
      quantity: quantity,
    });
    return response.data;
  },

  removeFromCart: async (itemId: number) => {
    const response = await apiClient.delete(`/orders/cart/${itemId}/`);
    return response.data;
  },
};

export default menuService;
