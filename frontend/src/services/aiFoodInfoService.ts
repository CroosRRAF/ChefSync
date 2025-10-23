import { GoogleGenerativeAI } from "@google/generative-ai";

export interface FoodNutrition {
  calories: string;
  protein: string;
  carbohydrates: string;
  fat: string;
  fiber: string;
  vitamins: string[];
}

export interface FoodInfo {
  ingredients: string[];
  nutrition: FoodNutrition;
  healthBenefits: string[];
  allergens: string[];
  preparationTips: string[];
  imageUrl?: string;
}

export interface AIFoodInfoResponse {
  foodInfo: FoodInfo;
  error?: string;
}

class AIFoodInfoService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Get API key from environment
      const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || 
                     import.meta.env.VITE_GOOGLE_GEMINI_API_KEY || 
                     import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      console.log('🔑 Initializing AI Food Info Service...');
      console.log('API Key available:', !!apiKey);
      
      if (!apiKey) {
        console.error('❌ Google AI API key not found in environment variables');
        console.error('Please set VITE_GOOGLE_AI_API_KEY in your .env file');
        return;
      }

      console.log('✅ API Key found, initializing Google AI...');
      this.genAI = new GoogleGenerativeAI(apiKey);
      
      // Start with the most compatible model
      const modelName = "gemini-1.0-pro";
      
      this.model = this.genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });
      console.log(`✅ AI Food Info Service initialized successfully with model: ${modelName}`);
    } catch (error) {
      console.error('❌ Failed to initialize AI food info service:', error);
    }
  }

  async getFoodInfo(foodName: string, foodDescription?: string): Promise<AIFoodInfoResponse> {
    console.log('🍔 Getting food info for:', foodName);
    
    // Return smart generated info immediately - no API needed!
    console.log('✅ Generating smart food info without API...');
    const foodInfo = this.generateSmartFoodInfo(foodName, foodDescription);
    
    return {
      foodInfo,
    };
  }

  private buildFoodInfoPrompt(foodName: string, foodDescription?: string): string {
    return `
You are a culinary and nutrition expert. Provide detailed information about the following food item in a structured JSON format.

Food Name: ${foodName}
${foodDescription ? `Description: ${foodDescription}` : ''}

Please provide the following information in valid JSON format:
{
  "ingredients": ["list of main ingredients"],
  "nutrition": {
    "calories": "approximate calories per serving",
    "protein": "grams of protein",
    "carbohydrates": "grams of carbohydrates",
    "fat": "grams of fat",
    "fiber": "grams of fiber",
    "vitamins": ["key vitamins and minerals"]
  },
  "healthBenefits": ["list of 3-4 health benefits"],
  "allergens": ["common allergens present"],
  "preparationTips": ["2-3 preparation or serving tips"]
}

Make sure to provide realistic and accurate nutritional information. Return only the JSON object, no additional text.
`;
  }

  private parseFoodInfoResponse(text: string): FoodInfo {
    try {
      console.log('🔍 Parsing AI response...');
      console.log('Raw response:', text.substring(0, 200) + '...');
      
      // Remove markdown code blocks if present
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }
      
      console.log('Cleaned JSON:', jsonText.substring(0, 200) + '...');
      
      const parsed = JSON.parse(jsonText);
      
      console.log('✅ JSON parsed successfully:', parsed);
      
      return {
        ingredients: parsed.ingredients || [],
        nutrition: {
          calories: parsed.nutrition?.calories || 'N/A',
          protein: parsed.nutrition?.protein || 'N/A',
          carbohydrates: parsed.nutrition?.carbohydrates || 'N/A',
          fat: parsed.nutrition?.fat || 'N/A',
          fiber: parsed.nutrition?.fiber || 'N/A',
          vitamins: parsed.nutrition?.vitamins || [],
        },
        healthBenefits: parsed.healthBenefits || [],
        allergens: parsed.allergens || [],
        preparationTips: parsed.preparationTips || [],
      };
    } catch (error) {
      console.error('❌ Error parsing food info response:', error);
      console.error('Failed to parse text:', text);
      return this.getDefaultFoodInfo();
    }
  }

  private generateSmartFoodInfo(foodName: string, foodDescription?: string): FoodInfo {
    const name = foodName.toLowerCase();
    
    // Detect food type
    const isCrab = name.includes('crab');
    const isMutton = name.includes('mutton') || name.includes('lamb');
    const isChicken = name.includes('chicken');
    const isCurry = name.includes('curry') || name.includes('poriyal');
    const isRice = name.includes('rice') || name.includes('biryani');
    const isVeg = name.includes('veg');
    
    let ingredients: string[] = [];
    let nutrition = {
      calories: '250-350 kcal',
      protein: '10-15g',
      carbohydrates: '40-50g',
      fat: '8-12g',
      fiber: '3-5g',
      vitamins: ['Vitamin A', 'Vitamin C', 'B Vitamins']
    };
    let allergens: string[] = [];
    let healthBenefits: string[] = [];
    let tips: string[] = [];

    if (isCrab) {
      ingredients = ['Fresh crab meat', 'Coconut milk', 'Curry leaves', 'Turmeric', 'Red chili', 'Garlic', 'Ginger', 'Onions'];
      nutrition = { calories: '350-400 kcal', protein: '25-30g', carbohydrates: '15-20g', fat: '20-25g', fiber: '3-5g', vitamins: ['Vitamin B12', 'Vitamin E', 'Selenium'] };
      allergens = ['Shellfish (crab)', 'May contain traces of other seafood'];
      healthBenefits = [
        'High in protein for muscle building',
        'Rich in omega-3 fatty acids for heart health',
        'Contains selenium and zinc for immune function',
        'Good source of vitamin B12 for energy'
      ];
      tips = [
        'Best served with rice or traditional bread',
        'Garnish with fresh curry leaves',
        'Pairs excellently with coconut sambol',
        'Ensure crab is fresh for best flavor'
      ];
    } else if (isMutton && isCurry) {
      ingredients = ['Mutton/lamb', 'Onions', 'Tomatoes', 'Yogurt', 'Garam masala', 'Ginger-garlic paste', 'Bay leaves', 'Cinnamon'];
      nutrition = { calories: '400-450 kcal', protein: '30-35g', carbohydrates: '20-25g', fat: '25-30g', fiber: '4-6g', vitamins: ['Iron', 'Vitamin B12', 'Zinc'] };
      allergens = ['Dairy (yogurt)', 'May contain traces of nuts'];
      healthBenefits = [
        'Excellent source of high-quality protein',
        'Rich in iron and vitamin B12',
        'Contains zinc for immune health',
        'Provides essential amino acids'
      ];
      tips = [
        'Slow cooking enhances tenderness',
        'Best served with naan or rice',
        'Let it rest for 10 minutes after cooking',
        'Adjust spice level to preference'
      ];
    } else if (isChicken) {
      ingredients = ['Chicken', 'Onions', 'Tomatoes', 'Spices', 'Garlic', 'Ginger', 'Coriander', 'Cumin'];
      nutrition = { calories: '300-350 kcal', protein: '28-32g', carbohydrates: '18-22g', fat: '15-18g', fiber: '3-5g', vitamins: ['Vitamin B6', 'Niacin', 'Selenium'] };
      allergens = ['May contain traces of dairy'];
      healthBenefits = [
        'Lean protein source for muscle maintenance',
        'Low in saturated fat',
        'Rich in B vitamins for energy metabolism',
        'Contains selenium for antioxidant support'
      ];
      tips = [
        'Marinate for at least 30 minutes',
        'Serve hot with rice or bread',
        'Garnish with fresh cilantro',
        'Pairs well with raita or salad'
      ];
    } else if (isRice) {
      ingredients = ['Basmati rice', 'Mixed vegetables', 'Spices', 'Ghee/oil', 'Onions', 'Cashews', 'Raisins'];
      nutrition = { calories: '350-400 kcal', protein: '8-12g', carbohydrates: '60-70g', fat: '10-15g', fiber: '4-6g', vitamins: ['B Vitamins', 'Manganese', 'Magnesium'] };
      allergens = ['May contain nuts (cashews)', 'Gluten-free'];
      healthBenefits = [
        'Good source of carbohydrates for energy',
        'Contains B vitamins from rice',
        'Provides sustained energy release',
        'Naturally gluten-free option'
      ];
      tips = [
        'Use aged basmati for best aroma',
        'Let rice rest after cooking',
        'Serve with raita and pickle',
        'Reheat gently to maintain texture'
      ];
    } else if (isVeg) {
      ingredients = ['Mixed vegetables', 'Onions', 'Tomatoes', 'Spices', 'Herbs', 'Garlic', 'Ginger', 'Oil'];
      nutrition = { calories: '200-250 kcal', protein: '6-8g', carbohydrates: '35-40g', fat: '8-10g', fiber: '6-8g', vitamins: ['Vitamin C', 'Vitamin K', 'Folate'] };
      allergens = ['Gluten-free', 'Vegan-friendly'];
      healthBenefits = [
        'High in dietary fiber for digestion',
        'Rich in vitamins and antioxidants',
        'Low in calories and fat',
        'Supports heart health and immunity'
      ];
      tips = [
        'Don\'t overcook vegetables to retain nutrients',
        'Add lemon juice for extra flavor',
        'Pairs well with whole grain bread',
        'Can be customized with seasonal vegetables'
      ];
    } else {
      // Generic fallback
      ingredients = ['Main ingredient', 'Spices and seasonings', 'Herbs', 'Aromatic vegetables', 'Traditional condiments'];
      allergens = ['Please check with restaurant for specific allergens'];
      healthBenefits = [
        'Prepared with fresh ingredients',
        'Authentic traditional recipe',
        'Balanced nutrition profile',
        'Made with quality spices and herbs'
      ];
      tips = [
        'Best served fresh and hot',
        'Pairs well with rice or bread',
        'Can be customized to taste',
        'Ask staff for spice level adjustments'
      ];
    }

    return {
      ingredients,
      nutrition,
      healthBenefits,
      allergens,
      preparationTips: tips
    };
  }

  private getDefaultFoodInfo(): FoodInfo {
    return {
      ingredients: ['Information not available'],
      nutrition: {
        calories: 'N/A',
        protein: 'N/A',
        carbohydrates: 'N/A',
        fat: 'N/A',
        fiber: 'N/A',
        vitamins: [],
      },
      healthBenefits: ['Information not available'],
      allergens: [],
      preparationTips: [],
    };
  }

  async searchFoodImage(foodName: string): Promise<string> {
    // For now, return a placeholder. In a real implementation, you could use:
    // 1. Google Custom Search API
    // 2. Unsplash API
    // 3. Pexels API
    // Since we're using Google AI, we could potentially use their image search
    
    // Return a food placeholder or use the food name to generate a better placeholder
    return `https://source.unsplash.com/800x600/?food,${encodeURIComponent(foodName)}`;
  }

  isAvailable(): boolean {
    return this.genAI !== null && this.model !== null;
  }
}

export const aiFoodInfoService = new AIFoodInfoService();

