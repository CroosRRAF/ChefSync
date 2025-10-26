import apiClient from './apiClient';

export interface FoodReviewData {
  order_id: number;
  cook_id: number;
  rating: number;
  comment: string;
  taste_rating?: number;
  presentation_rating?: number;
  value_rating?: number;
}

export interface DeliveryReviewData {
  order_id: number;
  delivery_agent_id: number;
  rating: number;
  comment: string;
}

export interface ReviewStatus {
  can_review: boolean;
  has_food_review: boolean;
  has_delivery_review: boolean;
  order_status: string;
  chef_id: number | null;
  chef_name: string | null;
  delivery_agent_id: number | null;
  delivery_agent_name: string | null;
}

export interface FoodReview {
  review_id: number;
  rating: number;
  comment: string;
  customer_name: string;
  cook_name: string;
  food_name: string;
  order_number: string;
  taste_rating?: number;
  presentation_rating?: number;
  value_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryReview {
  review_id: number;
  rating: number;
  comment: string;
  customer_name: string;
  delivery_agent_name: string;
  order_number: string;
  created_at: string;
}

/**
 * Submit a food/cook review for a delivered order
 */
export const submitFoodReview = async (reviewData: FoodReviewData): Promise<FoodReview> => {
  try {
    const response = await apiClient.post('/orders/reviews/food/submit/', reviewData);
    return response.data;
  } catch (error: any) {
    console.error('Failed to submit food review:', error);
    throw error.response?.data || error;
  }
};

/**
 * Submit a delivery agent review for a delivered order
 */
export const submitDeliveryReview = async (reviewData: DeliveryReviewData): Promise<DeliveryReview> => {
  try {
    const response = await apiClient.post('/orders/reviews/delivery/submit/', reviewData);
    return response.data;
  } catch (error: any) {
    console.error('Failed to submit delivery review:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get review status for an order (check if already reviewed)
 */
export const getOrderReviewStatus = async (orderId: number): Promise<ReviewStatus> => {
  try {
    const response = await apiClient.get(`/orders/reviews/status/${orderId}/`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to get review status:', error);
    throw error.response?.data || error;
  }
};

/**
 * Submit both food and delivery reviews together
 */
export const submitBothReviews = async (
  orderId: number,
  foodReview: Omit<FoodReviewData, 'order_id'>,
  deliveryReview: Omit<DeliveryReviewData, 'order_id'>
): Promise<{ foodReview: FoodReview; deliveryReview: DeliveryReview }> => {
  try {
    const [foodResult, deliveryResult] = await Promise.all([
      submitFoodReview({ ...foodReview, order_id: orderId }),
      submitDeliveryReview({ ...deliveryReview, order_id: orderId }),
    ]);

    return {
      foodReview: foodResult,
      deliveryReview: deliveryResult,
    };
  } catch (error: any) {
    console.error('Failed to submit reviews:', error);
    throw error;
  }
};

export default {
  submitFoodReview,
  submitDeliveryReview,
  getOrderReviewStatus,
  submitBothReviews,
};

