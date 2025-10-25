export interface Food {
  id: number;
  food_id?: number;
  chef: number;
  name: string;
  description: string;
  category: number;
  food_category?: number;
  price: number;
  original_price?: number;
  is_available: boolean;
  is_featured: boolean;
  preparation_time: number;
  calories_per_serving?: number;
  ingredients: string[];
  allergens: string[];
  nutritional_info?: Record<string, any>;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  spice_level?: "mild" | "medium" | "hot" | "very_hot";
  rating_average: number | string;
  total_reviews: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
  status?: "Pending" | "Approved" | "Rejected";

  // Populated fields from relationships
  chef_name?: string;
  chef_rating?: number | string;
  category_name?: string;
  cuisine_name?: string;
  images?: FoodImage[];

  // Image fields
  image?: string;
  image_url?: string;
  primary_image?: string;
  optimized_image_url?: string;
  thumbnail_url?: string;

  // Price information
  prices?: FoodPrice[];
  available_cooks_count?: number;
  min_price?: number;
  max_price?: number;

  // Delivery information
  delivery_fee?: number;
  distance_km?: number;
  estimated_delivery_time?: number;
  kitchen_location?: {
    latitude: number;
    longitude: number;
    address: string;
    kitchen_name?: string;
  };
}

export interface FoodPrice {
  price_id: number;
  size: "Small" | "Medium" | "Large";
  price: number;
  preparation_time: number;
  image_url?: string;
  image_data_url?: string;
  food: number;
  food_name?: string;
  cook: number | CookInfo;
  cook_name?: string;
  cook_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface CookInfo {
  id: number;
  name: string;
  rating: number;
  is_active: boolean;
  profile_image?: string;
  kitchen_location?: {
    latitude: number;
    longitude: number;
    address: string;
    kitchen_name?: string;
  };
}

export interface FoodImage {
  id: number;
  food: number;
  image: string;
  thumbnail?: string;
  caption?: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface Cuisine {
  id: number;
  name: string;
  description?: string;
  image?: string;
  origin_country?: string;
  is_active: boolean;
  sort_order: number;
  food_count?: number;
}

export interface FoodCategory {
  id: number;
  name: string;
  cuisine: number;
  description?: string;
  image?: string;
  is_active: boolean;
  sort_order: number;
  food_count?: number;

  // Populated fields from relationships
  cuisine_name?: string;
}

export interface FoodReview {
  id: number;
  food: number;
  customer: number;
  order: number;
  overall_rating: number;
  taste_rating?: number;
  presentation_rating?: number;
  value_rating?: number;
  comment?: string;
  is_verified_purchase: boolean;
  helpful_votes: number;
  created_at: string;
  updated_at: string;

  // Populated fields from relationships
  customer_name?: string;
  food_name?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface FoodFilterParams {
  page?: number;
  search?: string;
  category?: number;
  cuisine?: number;
  status?: "Pending" | "Approved" | "Rejected";
  is_available?: boolean;
  is_featured?: boolean;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  spice_level?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
  availability?: string;
}
