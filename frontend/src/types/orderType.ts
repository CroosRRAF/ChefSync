export interface Chef {
  id: number;
  name: string;
  email: string;
  phone_no?: string;
  specialty?: string;
  kitchen_location?: string; // Pickup location for delivery partners
  availability_hours?: string;
  rating_avg?: number;
}

export interface OrderItem {
  id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  food_name: string;
  food_description?: string;
  food_image?: string;
  size?: string;
  cook_name?: string;
  price?: number;
  item_total: number;
  price_details?: {
    food_name: string;
    food_description: string;
    size: string;
    price: number;
  };
}

export interface Order {
  id: number;
  order_number: string;
  customer: any;
  customer_name: string;
  chef: Chef; // Enhanced chef interface with pickup location
  delivery_partner?: any;
  status:
    | 'cart'
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'out_for_delivery'
    | 'in_transit'
    | 'delivered'
    | 'cancelled'
    | 'refunded';
  status_display?: string;
  order_type?: string;
  delivery_fee?: number;
  delivery_instructions?: string;
  special_instructions?: string;
  total_amount: number;
  total_items?: number;
  payment_method?: string;
  payment_status?: string;
  created_at: string;
  updated_at: string;
  actual_delivery_time?: string;
  time_since_order?: string;
  delivery_address: string; // Customer delivery address
  pickup_location?: string; // Chef's kitchen location for pickup
  items?: OrderItem[];
}