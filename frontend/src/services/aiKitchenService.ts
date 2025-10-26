import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_AI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';

class AIKitchenService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (GOOGLE_AI_API_KEY) {
      try {
        this.genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
        // Use gemini-pro (stable and widely available)
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      } catch (error) {
        console.error('Failed to initialize AI Kitchen Service:', error);
      }
    }
  }

  /**
   * Get kitchen address from chef name using AI
   */
  async getKitchenAddress(chefName: string, city: string = 'Colombo'): Promise<string | null> {
    if (!this.model) {
      console.warn('AI not initialized. Using default address.');
      return null;
    }

    try {
      const prompt = `Given a chef/restaurant named "${chefName}" in ${city}, Sri Lanka, generate a realistic kitchen/restaurant address. 
      Format: Street address, City, Sri Lanka
      Be concise and realistic. Just provide the address, nothing else.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const address = response.text().trim();
      
      return address || null;
    } catch (error) {
      console.error('Error getting kitchen address from AI:', error);
      return null;
    }
  }

  /**
   * Get kitchen preparation status description using AI
   */
  async getPreparationStatus(
    foodItems: string[],
    status: string,
    estimatedTime: number | null
  ): Promise<string> {
    // Fallback messages (used if AI fails or not available)
    const fallbacks: Record<string, string> = {
      pending: '🕐 Waiting for chef to start preparing your order...',
      confirmed: '✅ Chef has confirmed your order and will start soon!',
      preparing: '👨‍🍳 Your delicious meal is being prepared with care...',
      ready: '✨ Your food is ready and waiting for you!',
      out_for_delivery: '🚴 Your order is on the way to you!',
      delivered: '🎉 Order delivered! Enjoy your meal!',
    };
    
    if (!this.model) {
      return fallbacks[status] || 'Processing your order...';
    }

    try {
      const itemsList = foodItems.slice(0, 2).join(', '); // Limit to 2 items for brevity
      const timeText = estimatedTime ? `${estimatedTime} mins` : 'soon';
      
      const prompt = `Create a SHORT status message (max 12 words) for food order status "${status}".
Items: ${itemsList}
Time: ${timeText}

Use 1-2 emojis. Be warm and friendly. One line only.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const message = response.text().trim();
      
      // Return AI message or fallback
      return message || fallbacks[status] || 'Processing your order...';
    } catch (error) {
      // Silently fall back to default messages
      return fallbacks[status] || '👨‍🍳 Your order is being prepared...';
    }
  }

  /**
   * Get pickup instructions using AI
   */
  async getPickupInstructions(kitchenName: string, address: string): Promise<string> {
    const fallback = `📍 Navigate to ${kitchenName} to pick up your order`;
    
    if (!this.model) {
      return fallback;
    }

    try {
      const prompt = `Create pickup instruction (max 15 words) for "${kitchenName}".
Include 1 emoji. Be friendly. One line.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const instructions = response.text().trim();
      
      return instructions || fallback;
    } catch (error) {
      // Silently fall back
      return fallback;
    }
  }
}

export const aiKitchenService = new AIKitchenService();
export default aiKitchenService;

