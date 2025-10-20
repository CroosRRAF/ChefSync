/**
 * Payment Service
 * Handles all payment-related API calls
 */

import axios, { AxiosInstance } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token interceptor
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

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = response.data.access;
          localStorage.setItem("access_token", newAccessToken);
          
          // Retry the original request
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(error.config);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/auth/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// TypeScript Interfaces

export interface Payment {
  id: number;
  order_id: number;
  amount: string;
  payment_method: string;
  status: "pending" | "completed" | "failed" | "refunded" | "processing";
  transaction_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: number;
  type: "card" | "paypal" | "bank_transfer" | "cash" | "wallet";
  card_last_four?: string;
  card_brand?: string;
  is_default: boolean;
  expiry_date?: string;
  created_at: string;
}

export interface Refund {
  id: number;
  payment_id: number;
  amount: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "processed";
  requested_by: number;
  processed_by?: number;
  created_at: string;
  processed_at?: string;
}

export interface Transaction {
  id: number;
  payment_id: number;
  order_id: number;
  amount: string;
  type: "payment" | "refund" | "chargeback";
  status: string;
  transaction_date: string;
  description: string;
}

export interface PaymentRequest {
  order_id: number;
  payment_method: string;
  amount: string;
  save_payment_method?: boolean;
  payment_details?: {
    card_number?: string;
    card_holder?: string;
    expiry_month?: string;
    expiry_year?: string;
    cvv?: string;
  };
}

export interface RefundRequest {
  payment_id: number;
  amount: string;
  reason: string;
}

export interface PaymentStats {
  total_transactions: number;
  total_revenue: string;
  total_refunds: string;
  pending_refunds: number;
  success_rate: number;
  average_transaction_value: string;
}

/**
 * Payment Service Class
 */
class PaymentService {
  /**
   * Process a payment
   */
  async processPayment(paymentData: PaymentRequest): Promise<Payment> {
    try {
      const response = await apiClient.post("/payments/payments/", paymentData);
      return response.data;
    } catch (error: any) {
      console.error("Error processing payment:", error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: number): Promise<Payment> {
    try {
      const response = await apiClient.get(`/payments/payments/${paymentId}/`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching payment:", error);
      throw error;
    }
  }

  /**
   * Get all payment methods for current user
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await apiClient.get("/payments/methods/");
      return response.data.results || response.data || [];
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
      throw error;
    }
  }

  /**
   * Add a new payment method
   */
  async addPaymentMethod(methodData: Partial<PaymentMethod>): Promise<PaymentMethod> {
    try {
      const response = await apiClient.post("/payments/methods/", methodData);
      return response.data;
    } catch (error: any) {
      console.error("Error adding payment method:", error);
      throw error;
    }
  }

  /**
   * Update a payment method
   */
  async updatePaymentMethod(
    methodId: number,
    methodData: Partial<PaymentMethod>
  ): Promise<PaymentMethod> {
    try {
      const response = await apiClient.patch(
        `/payments/methods/${methodId}/`,
        methodData
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating payment method:", error);
      throw error;
    }
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(methodId: number): Promise<void> {
    try {
      await apiClient.delete(`/payments/methods/${methodId}/`);
    } catch (error: any) {
      console.error("Error deleting payment method:", error);
      throw error;
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(methodId: number): Promise<PaymentMethod> {
    try {
      const response = await apiClient.patch(
        `/payments/methods/${methodId}/set_default/`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error setting default payment method:", error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
  }): Promise<{ results: Transaction[]; count: number }> {
    try {
      const response = await apiClient.get("/payments/transactions/", { params });
      return {
        results: response.data.results || response.data || [],
        count: response.data.count || 0,
      };
    } catch (error: any) {
      console.error("Error fetching transaction history:", error);
      throw error;
    }
  }

  /**
   * Request a refund
   */
  async requestRefund(refundData: RefundRequest): Promise<Refund> {
    try {
      const response = await apiClient.post("/payments/refunds/", refundData);
      return response.data;
    } catch (error: any) {
      console.error("Error requesting refund:", error);
      throw error;
    }
  }

  /**
   * Get refund status
   */
  async getRefund(refundId: number): Promise<Refund> {
    try {
      const response = await apiClient.get(`/payments/refunds/${refundId}/`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching refund:", error);
      throw error;
    }
  }

  /**
   * Get all refunds (admin)
   */
  async getRefunds(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ results: Refund[]; count: number }> {
    try {
      const response = await apiClient.get("/payments/refunds/", { params });
      return {
        results: response.data.results || response.data || [],
        count: response.data.count || 0,
      };
    } catch (error: any) {
      console.error("Error fetching refunds:", error);
      throw error;
    }
  }

  /**
   * Process a refund (admin)
   */
  async processRefund(
    refundId: number,
    action: "approve" | "reject",
    note?: string
  ): Promise<Refund> {
    try {
      const response = await apiClient.post(`/payments/refunds/${refundId}/${action}/`, {
        note,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error processing refund:", error);
      throw error;
    }
  }

  /**
   * Get payment statistics (admin)
   */
  async getPaymentStats(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<PaymentStats> {
    try {
      const response = await apiClient.get("/payments/stats/", { params });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching payment stats:", error);
      throw error;
    }
  }

  /**
   * Verify payment status
   */
  async verifyPaymentStatus(paymentId: number): Promise<Payment> {
    try {
      const response = await apiClient.get(
        `/payments/payments/${paymentId}/verify/`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  }

  /**
   * Cancel a pending payment
   */
  async cancelPayment(paymentId: number): Promise<Payment> {
    try {
      const response = await apiClient.post(
        `/payments/payments/${paymentId}/cancel/`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error canceling payment:", error);
      throw error;
    }
  }

  /**
   * Get payment methods for checkout (public)
   */
  async getAvailablePaymentMethods(): Promise<
    Array<{ id: string; name: string; type: string; enabled: boolean }>
  > {
    try {
      const response = await apiClient.get("/payments/available-methods/");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching available payment methods:", error);
      // Return default methods if endpoint doesn't exist
      return [
        { id: "card", name: "Credit/Debit Card", type: "card", enabled: true },
        { id: "paypal", name: "PayPal", type: "paypal", enabled: false },
        { id: "cash", name: "Cash on Delivery", type: "cash", enabled: true },
      ];
    }
  }

  /**
   * Validate payment details before processing
   */
  validatePaymentDetails(paymentData: PaymentRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!paymentData.order_id) {
      errors.push("Order ID is required");
    }

    if (!paymentData.payment_method) {
      errors.push("Payment method is required");
    }

    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      errors.push("Valid amount is required");
    }

    if (paymentData.payment_method === "card" && paymentData.payment_details) {
      const details = paymentData.payment_details;
      
      if (!details.card_number || details.card_number.length < 13) {
        errors.push("Valid card number is required");
      }

      if (!details.card_holder) {
        errors.push("Card holder name is required");
      }

      if (!details.expiry_month || !details.expiry_year) {
        errors.push("Card expiry date is required");
      }

      if (!details.cvv || details.cvv.length < 3) {
        errors.push("Valid CVV is required");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format card number for display (mask)
   */
  formatCardNumber(cardNumber: string): string {
    if (!cardNumber) return "";
    const lastFour = cardNumber.slice(-4);
    return `**** **** **** ${lastFour}`;
  }

  /**
   * Get card brand from card number
   */
  getCardBrand(cardNumber: string): string {
    if (!cardNumber) return "unknown";

    const cleaned = cardNumber.replace(/\s/g, "");
    
    if (/^4/.test(cleaned)) return "visa";
    if (/^5[1-5]/.test(cleaned)) return "mastercard";
    if (/^3[47]/.test(cleaned)) return "amex";
    if (/^6(?:011|5)/.test(cleaned)) return "discover";
    
    return "unknown";
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export class for testing
export default PaymentService;
