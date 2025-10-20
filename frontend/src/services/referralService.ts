import { toast } from "@/components/ui/use-toast";
import axios, { AxiosError } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as any;

    let message = "An unexpected error occurred";
    if (data?.message || data?.detail) {
      message = data.message || data.detail;
    } else if (status === 401) {
      message = "Authentication required. Please log in.";
    } else if (status === 403) {
      message = "You do not have permission to perform this action.";
    } else if (status === 404) {
      message = "The requested resource was not found.";
    } else if (status === 422) {
      message = "Invalid data provided.";
    }

    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });

    return Promise.reject(error);
  }
);

export interface ReferralToken {
  id: number;
  token: string;
  referrer: {
    id: number;
    name: string;
    email: string;
  };
  uses: number;
  max_uses?: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  successful_referrals: number;
}

export interface ReferralStats {
  total_tokens: number;
  active_tokens: number;
  total_referrals: number;
  successful_referrals: number;
  pending_referrals: number;
  conversion_rate: number;
  top_referrers: Array<{
    user: {
      id: number;
      name: string;
      email: string;
    };
    referral_count: number;
    successful_count: number;
  }>;
}

export interface ReferralValidation {
  valid: boolean;
  token?: ReferralToken;
  message?: string;
}

export interface CreateReferralTokenPayload {
  max_uses?: number;
  expires_at?: string;
}

class ReferralService {
  /**
   * Get referral statistics
   */
  async getReferralStats(): Promise<ReferralStats> {
    try {
      const response = await apiClient.get("/api/auth/referral/stats/");
      return response.data;
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      throw error;
    }
  }

  /**
   * Get all referral tokens for the current user (or all tokens for admin)
   */
  async getReferralTokens(): Promise<ReferralToken[]> {
    try {
      const response = await apiClient.get("/auth/referral/tokens/");
      return response.data.results || response.data || [];
    } catch (error) {
      console.error("Error fetching referral tokens:", error);
      throw error;
    }
  }

  /**
   * Create a new referral token
   */
  async createReferralToken(
    payload: CreateReferralTokenPayload = {}
  ): Promise<ReferralToken> {
    try {
      const response = await apiClient.post(
        "/auth/referral/create-token/",
        payload
      );
      toast({
        title: "Success",
        description: "Referral token created successfully",
      });
      return response.data;
    } catch (error) {
      console.error("Error creating referral token:", error);
      throw error;
    }
  }

  /**
   * Validate a referral token
   */
  async validateReferralToken(token: string): Promise<ReferralValidation> {
    try {
      const response = await apiClient.post("/auth/referral/validate/", {
        token,
      });
      return {
        valid: true,
        token: response.data,
      };
    } catch (error) {
      console.error("Error validating referral token:", error);
      return {
        valid: false,
        message: "Invalid or expired referral token",
      };
    }
  }

  /**
   * Generate referral link
   */
  generateReferralLink(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth/register?referral=${token}`;
  }

  /**
   * Copy referral link to clipboard
   */
  async copyReferralLink(token: string): Promise<boolean> {
    try {
      const link = this.generateReferralLink(token);
      await navigator.clipboard.writeText(link);
      toast({
        title: "Success",
        description: "Referral link copied to clipboard",
      });
      return true;
    } catch (error) {
      console.error("Error copying referral link:", error);
      toast({
        title: "Error",
        description: "Failed to copy referral link",
        variant: "destructive",
      });
      return false;
    }
  }
}

export const referralService = new ReferralService();
