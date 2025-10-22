// Types for Customer Portal

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Chef {
  id: number;
  user_id: number;
  full_name: string;
  avatar_url?: string;
  rating_average: number | string;
  total_orders: number;
  specialties: string[];
  kitchen_address: string;
  kitchen_location: LatLng;
  bio?: string;
  is_active: boolean;
  distance_km?: number; // Calculated distance from customer
}

export interface FoodDetails extends Food {
  chef_details: Chef;
  sizes: FoodPrice[];
  images: FoodImage[];
}

export interface Food {
  id: number;
  name: string;
  description: string;
  chef_id: number;
  chef_name: string;
  chef_avatar?: string;
  category_name: string;
  cuisine_name: string;
  rating_average: number | string;
  total_reviews: number;
  preparation_time: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  spice_level?: 'mild' | 'medium' | 'hot' | 'very_hot';
  ingredients: string[];
  allergens: string[];
  primary_image: string;
  kitchen_location: LatLng;
  is_available: boolean;
  distance_km?: number; // Calculated distance from customer
}

export interface FoodPrice {
  id: number;
  food_id: number;
  size: 'Small' | 'Medium' | 'Large';
  price: number;
  preparation_time: number;
}

export interface FoodImage {
  id: number;
  image: string;
  caption?: string;
  is_primary: boolean;
}

export interface CartItem {
  id: string; // Unique cart item ID
  food_id: number;
  food_name: string;
  food_image: string;
  price_id: number;
  size: 'Small' | 'Medium' | 'Large';
  unit_price: number;
  quantity: number;
  chef_id: number;
  chef_name: string;
  kitchen_address: string;
  kitchen_location: LatLng;
  subtotal: number; // unit_price * quantity
}

export interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id' | 'subtotal'>) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getItemsByChef: () => Map<number, CartItem[]>;
  getTotalByChef: (chefId: number) => number;
  getGrandTotal: () => number;
  getItemCount: () => number;
}

export interface DeliveryAddress {
  id?: number;
  label: string; // 'Home', 'Work', 'Other'
  address: string;
  location: LatLng;
  is_default: boolean;
  distance_km?: number; // Calculated distance from kitchen
}

export interface CheckoutCalculation {
  subtotal: number;
  delivery_fee: number;
  tax: number;
  discount_amount: number;
  total: number;
  estimated_delivery_time?: number; // minutes
}

export interface OrderType {
  delivery: 'delivery';
  pickup: 'pickup';
}

export interface CheckoutFormData {
  chef_id: number;
  items: {
    food_price_id: number;
    quantity: number;
    special_instructions?: string;
  }[];
  order_type: 'delivery' | 'pickup';
  delivery_address_id?: number;
  payment_method: 'cash';
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  total_amount: number;
}

export interface Order {
  id: string;
  chef_name: string;
  total_amount: number;
  order_type: 'delivery' | 'pickup';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  estimated_delivery_time: number;
  delivery_address?: string;
  created_at: string;
}

// Menu filtering and search
export interface MenuFilters {
  search: string;
  cuisine_ids: number[];
  category_ids: number[];
  dietary: {
    vegetarian: boolean;
    vegan: boolean;
    gluten_free: boolean;
  };
  price_range: [number, number];
  spice_level: string[];
  rating_min: number;
  max_distance_km: number;
}

export interface MenuSortOption {
  value: 'distance' | 'rating' | 'price_low' | 'price_high' | 'prep_time';
  label: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}