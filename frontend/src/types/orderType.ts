export interface Order {
  id: number;
  order_number: string;
  customer: any;
  chef: any;
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
  delivery_fee?: number; // Add this line
  total_amount: number;
  created_at: string;
  updated_at: string;
  actual_delivery_time?: string;
  delivery_address: string;
}