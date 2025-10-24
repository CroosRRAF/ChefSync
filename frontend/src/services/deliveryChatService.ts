import apiClient from './apiClient';

export interface ChatMessage {
  message_id: string;
  order: number;
  sender: number;
  receiver: number;
  sender_name: string;
  sender_role: 'customer' | 'delivery_agent';
  message: string;
  message_type: 'text' | 'location' | 'image';
  is_read: boolean;
  is_own_message: boolean;
  created_at: string;
}

export interface ChatMessagesResponse {
  order_number: string;
  messages: ChatMessage[];
  unread_count: number;
}

export interface SendMessageRequest {
  message: string;
  message_type?: 'text' | 'location' | 'image';
}

export interface SendMessageResponse {
  success: boolean;
  message: ChatMessage;
}

export interface QuickMessagesResponse {
  quick_messages: string[];
}

class DeliveryChatService {
  private baseUrl = '/orders/orders';

  /**
   * Get all chat messages for an order
   */
  async getChatMessages(orderId: number): Promise<ChatMessagesResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${orderId}/chat/messages/`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching chat messages:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch chat messages');
    }
  }

  /**
   * Send a chat message
   */
  async sendMessage(orderId: number, data: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${orderId}/chat/send/`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error sending chat message:', error);
      throw new Error(error.response?.data?.error || 'Failed to send message');
    }
  }

  /**
   * Get quick/suggested messages
   */
  async getQuickMessages(orderId: number): Promise<QuickMessagesResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${orderId}/chat/quick-messages/`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching quick messages:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch quick messages');
    }
  }

  /**
   * Poll for new messages
   */
  async pollMessages(
    orderId: number,
    callback: (data: ChatMessagesResponse) => void,
    interval: number = 5000 // 5 seconds
  ): Promise<() => void> {
    let isActive = true;

    const poll = async () => {
      if (!isActive) return;

      try {
        const data = await this.getChatMessages(orderId);
        callback(data);
      } catch (error) {
        console.error('Polling error:', error);
      }

      if (isActive) {
        setTimeout(poll, interval);
      }
    };

    // Start polling
    poll();

    // Return cleanup function
    return () => {
      isActive = false;
    };
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    // If this week, show day and time
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    // Otherwise show date and time
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}

export const deliveryChatService = new DeliveryChatService();
export default deliveryChatService;

