export interface Food {
  id: number;
  chef: number;
  name: string;
  description: string;
  category: number;
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
  spice_level?: 'mild' | 'medium' | 'hot' | 'very_hot';
  rating_average: number;
  total_reviews: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
  
  // Populated fields from relationships
  chef_name?: string;
  category_name?: string;
  cuisine_name?: string;
  images?: FoodImage[];
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
  is_active: boolean;
  sort_order: number;
}

export interface FoodCategory {
  id: number;
  name: string;
  cuisine: number;
  description?: string;
  image?: string;
  is_active: boolean;
  sort_order: number;
  
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
  is_available?: boolean;
  is_featured?: boolean;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  spice_level?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
}