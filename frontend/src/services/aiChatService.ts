import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  message: string;
  error?: string;
}

class AIChatService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private chat: any = null;

  // ChefSync platform context
  private readonly PLATFORM_CONTEXT = `
You are an AI assistant for ChefSync, a food delivery platform connecting customers with local home chefs.

**Platform Overview:**
- ChefSync connects customers with talented home chefs who prepare fresh, homemade meals
- Customers can browse menus, place orders, and get food delivered to their doorstep
- We support both individual orders and bulk orders for events
- Our platform operates in Sri Lanka, with a focus on authentic local and international cuisines

**Key Features:**
1. **Menu Browsing**: Customers can explore diverse menus from various chefs
2. **Order Management**: Track orders in real-time from preparation to delivery
3. **Chef Profiles**: View chef ratings, specialties, and customer reviews
4. **Bulk Orders**: Special ordering system for events and large gatherings
5. **Delivery Tracking**: Real-time GPS tracking of deliveries
6. **Multiple Cuisines**: Indian, Chinese, Italian, Mexican, Sri Lankan, and more

**Customer Services:**
- Dashboard: View order history and statistics
- Profile Management: Update personal information and preferences
- Settings: Customize notifications and preferences
- Cart: Add items and checkout
- Delivery Addresses: Save multiple delivery locations

**How to Use ChefSync:**
1. Browse the menu page to discover dishes from local chefs
2. Add items to your cart
3. Proceed to checkout and select delivery address
4. Track your order in real-time
5. Rate and review your experience

**Support:**
- Contact page for inquiries
- About page for platform information
- Real-time order tracking
- Customer support through multiple channels

When answering questions:
- Be helpful and friendly
- Provide specific, actionable information
- Guide users through the platform features
- Suggest relevant menu items or chefs when appropriate
- Help with order-related queries
- Explain platform features clearly

If asked about specific orders, menus, or account details you don't have access to, politely inform users to check their dashboard or contact support.
`;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Get API key from environment
      const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || 
                     import.meta.env.VITE_GOOGLE_GEMINI_API_KEY || 
                     import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('Google AI API key not found');
        return;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      // Use most compatible model
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.0-pro",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      // Start a new chat session with context
      this.chat = this.model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: this.PLATFORM_CONTEXT }],
          },
          {
            role: "model",
            parts: [{ text: "I understand. I'm ready to assist ChefSync customers with information about the platform, help them navigate features, answer questions about ordering food, and provide guidance on using the service. How can I help?" }],
          },
        ],
      });
    } catch (error) {
      console.error('Failed to initialize AI chat service:', error);
    }
  }

  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      if (!this.chat) {
        // Fallback responses when API is not available
        return this.getFallbackResponse(message);
      }

      const result = await this.chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();

      return {
        message: text
      };
    } catch (error: any) {
      console.error('Error sending message to AI:', error);
      
      // Check for specific error types
      if (error?.message?.includes('API_KEY_INVALID') || error?.message?.includes('API key')) {
        return this.getFallbackResponse(message);
      }
      
      let errorMessage = "I apologize, but I'm experiencing technical difficulties. Let me try to help you anyway!";
      
      if (error?.message?.includes('quota')) {
        errorMessage = "The AI service is currently at capacity. Here's what I can help you with:";
      }

      // Provide fallback response even on error
      const fallback = this.getFallbackResponse(message);
      return {
        message: fallback.message,
        error: error?.message || "Unknown error"
      };
    }
  }

  /**
   * Provide fallback responses when AI API is not available
   */
  private getFallbackResponse(message: string): ChatResponse {
    const lowerMessage = message.toLowerCase();

    // Order-related questions
    if (lowerMessage.includes('order') || lowerMessage.includes('place order') || lowerMessage.includes('how to order')) {
      return {
        message: `To place an order on ChefSync:

1. **Browse Menus**: Go to the Menu page to explore dishes from local chefs
2. **Add to Cart**: Click on items you like to add them to your cart
3. **Review Cart**: Click the cart icon to review your selections
4. **Checkout**: Proceed to checkout and select your delivery address
5. **Payment**: Complete your payment
6. **Track**: Monitor your order in real-time from the Orders page

Need help with a specific step? Just ask!`
      };
    }

    // Menu/Food related
    if (lowerMessage.includes('menu') || lowerMessage.includes('food') || lowerMessage.includes('cuisine') || lowerMessage.includes('dish')) {
      return {
        message: `ChefSync offers a variety of cuisines from talented home chefs:

🍛 **Available Cuisines**: Indian, Chinese, Italian, Mexican, Sri Lankan, and more!

**How to Browse**:
- Visit the **Menu** page from the top navigation
- Filter by cuisine type, price, or chef
- View detailed dish descriptions and chef ratings
- Check chef profiles to see their specialties

**Popular Features**:
- Fresh, homemade meals from local chefs
- Customer reviews and ratings
- Chef specialties and authentic recipes

What type of cuisine are you interested in?`
      };
    }

    // Delivery related
    if (lowerMessage.includes('deliver') || lowerMessage.includes('track') || lowerMessage.includes('shipping')) {
      return {
        message: `**Delivery & Tracking Information**:

📦 **Track Your Order**:
- Go to the **Orders** page in your dashboard
- View real-time order status
- GPS tracking for deliveries in progress

🚚 **Delivery Process**:
1. Chef prepares your meal fresh
2. Delivery agent picks up from chef
3. Real-time GPS tracking
4. Delivered to your doorstep

📍 **Multiple Addresses**:
- Save multiple delivery addresses in your profile
- Select delivery location at checkout

Need help with a specific delivery?`
      };
    }

    // Bulk orders
    if (lowerMessage.includes('bulk') || lowerMessage.includes('event') || lowerMessage.includes('catering') || lowerMessage.includes('large order')) {
      return {
        message: `**Bulk Orders for Events**:

ChefSync offers special bulk ordering for events and gatherings!

🎉 **Perfect For**:
- Office parties and meetings
- Family gatherings
- Birthday celebrations
- Corporate events

📋 **How to Place Bulk Orders**:
1. Go to **Bulk Orders** in your customer dashboard
2. Browse bulk menus from chefs
3. Specify quantity and event details
4. Get special pricing for large orders

💡 **Benefits**:
- Special bulk pricing
- Coordinated delivery
- Custom menu options
- Dedicated support

Visit the Bulk Orders page to get started!`
      };
    }

    // Account/Profile related
    if (lowerMessage.includes('profile') || lowerMessage.includes('account') || lowerMessage.includes('settings')) {
      return {
        message: `**Account Management**:

👤 **Your Profile**:
- Update personal information
- Manage delivery addresses
- View order history
- Set dietary preferences

⚙️ **Settings**:
- Notification preferences
- Account security
- Payment methods
- Language preferences

📊 **Dashboard Features**:
- Order statistics
- Favorite chefs
- Loyalty rewards
- Recent activity

Access everything from your Customer Dashboard!`
      };
    }

    // Payment related
    if (lowerMessage.includes('pay') || lowerMessage.includes('payment') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
      return {
        message: `**Payment Information**:

💳 **Accepted Payment Methods**:
- Credit/Debit Cards
- Digital Wallets
- Secure online payment

💰 **Pricing**:
- Transparent pricing on all menu items
- No hidden fees
- View total before checkout
- Special bulk order discounts

🔒 **Security**:
- Secure payment processing
- Encrypted transactions
- Safe and reliable

All prices are shown clearly on the menu page!`
      };
    }

    // Chef related
    if (lowerMessage.includes('chef') || lowerMessage.includes('cook') || lowerMessage.includes('rating')) {
      return {
        message: `**About Our Chefs**:

👨‍🍳 **Talented Home Chefs**:
- Verified and approved chefs
- Customer ratings and reviews
- Specialties and cuisines
- Professional profiles

⭐ **Chef Profiles Include**:
- Biography and experience
- Specialty dishes
- Customer reviews
- Average ratings
- Available menus

🔍 **How to Find Great Chefs**:
1. Browse the Menu page
2. Click on chef profiles
3. Read customer reviews
4. Check their specialties
5. View their ratings

Every chef is carefully vetted for quality!`
      };
    }

    // Contact/Support
    if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('problem')) {
      return {
        message: `**Need More Help?**:

📞 **Contact Support**:
- Visit our **Contact** page
- Fill out the contact form
- Or browse the **About** page for more info

🆘 **Common Issues**:
- Order tracking: Check Orders page
- Payment issues: Visit Settings
- Delivery problems: Track your order
- Account help: Profile settings

💬 **I Can Help With**:
- Understanding platform features
- How to place orders
- Menu and chef information
- Navigation assistance

What specific issue can I help you with?`
      };
    }

    // Greetings
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
      return {
        message: `Hello! 👋 Welcome to ChefSync!

I'm here to help you navigate our platform and answer your questions. 

**I can assist you with**:
- 🍽️ Ordering food and browsing menus
- 👨‍🍳 Finding the perfect chef for your taste
- 🚚 Delivery and order tracking
- 🎉 Bulk orders for events
- ⚙️ Account and settings
- 📱 Platform features

What would you like to know about ChefSync?

*Note: I'm currently running in offline mode. For complex queries, please contact our support team.*`
      };
    }

    // Default response
    return {
      message: `I'd be happy to help! Here's what I can assist you with:

**Popular Topics**:
🍽️ **Ordering Food** - How to browse menus and place orders
👨‍🍳 **Chef Profiles** - Finding and choosing chefs
🚚 **Delivery** - Tracking and delivery information
🎉 **Bulk Orders** - Catering for events
👤 **Account** - Profile and settings management
💳 **Payments** - Payment methods and pricing

**Quick Links**:
- Browse the **Menu** page for available dishes
- Check **Orders** to track your deliveries
- Visit **Profile** to manage your account
- Explore **Bulk Orders** for events

Please ask me about any of these topics, or let me know what specific information you need!

*Note: I'm currently running in offline mode. For complex queries, please contact our support team via the Contact page.*`
    };
  }

  resetChat() {
    if (this.model) {
      this.chat = this.model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: this.PLATFORM_CONTEXT }],
          },
          {
            role: "model",
            parts: [{ text: "I understand. I'm ready to assist ChefSync customers. How can I help?" }],
          },
        ],
      });
    }
  }

  isAvailable(): boolean {
    return this.genAI !== null && this.chat !== null;
  }
}

export const aiChatService = new AIChatService();

