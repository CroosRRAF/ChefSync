import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, X, Leaf, AlertTriangle, Lightbulb, Apple, Info } from 'lucide-react';
import { aiFoodInfoService, FoodInfo } from '@/services/aiFoodInfoService';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FoodInfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  foodName: string;
  foodDescription?: string;
  foodImage?: string;
}

const FoodInfoPopup: React.FC<FoodInfoPopupProps> = ({
  isOpen,
  onClose,
  foodName,
  foodDescription,
  foodImage,
}) => {
  const [loading, setLoading] = useState(true);
  const [foodInfo, setFoodInfo] = useState<FoodInfo | null>(null);
  const [aiImage, setAiImage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && foodName) {
      loadFoodInfo();
    }
  }, [isOpen, foodName]);

  const loadFoodInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 FoodInfoPopup: Loading info for:', foodName);
      
      // Get food information from AI
      const response = await aiFoodInfoService.getFoodInfo(foodName, foodDescription);
      
      console.log('📦 FoodInfoPopup: Received response:', response);
      
      if (response.error) {
        console.error('⚠️ FoodInfoPopup: AI returned error:', response.error);
        setError(response.error);
      } else {
        console.log('✅ FoodInfoPopup: Successfully loaded food info');
        setError(null);
      }
      
      setFoodInfo(response.foodInfo);

      // Get food image
      const imageUrl = foodImage || await aiFoodInfoService.searchFoodImage(foodName);
      setAiImage(imageUrl);
      
      console.log('🖼️ FoodInfoPopup: Image URL:', imageUrl);
    } catch (error: any) {
      console.error('❌ FoodInfoPopup: Error loading food info:', error);
      const errorMsg = `Failed to load food information: ${error.message}`;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 bg-white dark:bg-gray-900">
        {/* Header with AI Badge */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 animate-pulse" />
              <DialogTitle className="text-2xl font-bold">AI Food Insights</DialogTitle>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <DialogDescription className="text-white/90 text-lg">
            {foodName}
          </DialogDescription>
        </div>

        {/* Main Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
          {/* Error Alert */}
          {error && !loading && (
            <div className="p-6">
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-lg font-bold">🔐 API Configuration Needed</AlertTitle>
                <AlertDescription className="mt-3 space-y-3">
                  {error.includes('403') || error.includes('SERVICE_DISABLED') ? (
                    <>
                      <p className="font-semibold text-base">Google AI API is not enabled for your project</p>
                      <div className="bg-black/10 rounded-lg p-4 space-y-3">
                        <p className="font-semibold text-sm">✅ Quick Fix (30 seconds):</p>
                        <ol className="list-decimal list-inside space-y-2 text-sm ml-2">
                          <li>
                            Visit <a 
                              href="https://aistudio.google.com/app/apikey" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="underline font-semibold text-blue-600 hover:text-blue-800"
                            >
                              Google AI Studio
                            </a>
                          </li>
                          <li>Click <strong>"Create API Key"</strong></li>
                          <li>Select <strong>"Create API key in new project"</strong> (this auto-enables the API!)</li>
                          <li>Copy the new API key</li>
                          <li>
                            Update your <code className="bg-black/20 px-1.5 py-0.5 rounded text-xs font-mono">frontend/.env</code> file:
                            <div className="mt-2 bg-black/20 p-2 rounded text-xs font-mono">
                              VITE_GOOGLE_AI_API_KEY=AIzaSy...
                            </div>
                          </li>
                          <li>Restart the dev server and refresh this page</li>
                        </ol>
                        
                        <div className="border-t border-black/20 pt-3 mt-3">
                          <p className="font-semibold text-sm mb-2">📖 Alternative: Enable in existing project</p>
                          <p className="text-xs">
                            If you want to keep your current key, enable the API at:{' '}
                            <a 
                              href="https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=857512631644" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="underline text-blue-600 hover:text-blue-800 break-all"
                            >
                              Google Cloud Console
                            </a>
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm">{error}</p>
                      <div className="text-sm mt-3 p-3 bg-black/10 rounded">
                        <p className="font-semibold mb-2">To enable AI Food Insights:</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                          <li>Get a free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                          <li>Add to your <code className="bg-black/20 px-1 rounded">.env</code> file: <code className="bg-black/20 px-1 rounded">VITE_GOOGLE_AI_API_KEY=your_key_here</code></li>
                          <li>Restart the development server</li>
                          <li>Check browser console for detailed debugging info</li>
                        </ol>
                      </div>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {loading ? (
            // Loading State
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ) : foodInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Left Column - Image and Basic Info */}
              <div className="space-y-4">
                {/* AI Generated/Searched Image */}
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={aiImage}
                    alt={foodName}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/food-placeholder.jpg';
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-purple-500 text-white flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI Enhanced
                    </Badge>
                  </div>
                </div>

                {/* Nutrition Facts Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Apple className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Nutrition Facts
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Calories</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{foodInfo.nutrition.calories}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Protein</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{foodInfo.nutrition.protein}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Carbohydrates</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{foodInfo.nutrition.carbohydrates}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fat</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{foodInfo.nutrition.fat}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-700">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fiber</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{foodInfo.nutrition.fiber}</span>
                    </div>
                    
                    {foodInfo.nutrition.vitamins.length > 0 && (
                      <div className="pt-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                          Key Vitamins & Minerals
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {foodInfo.nutrition.vitamins.map((vitamin, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-white dark:bg-gray-800">
                              {vitamin}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Detailed Information */}
              <div className="space-y-4">
                {/* Ingredients */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Leaf className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Main Ingredients
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {foodInfo.ingredients.map((ingredient, index) => (
                      <Badge key={index} className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Health Benefits */}
                {foodInfo.healthBenefits.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Health Benefits
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {foodInfo.healthBenefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Allergens */}
                {foodInfo.allergens.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border border-red-200 dark:border-red-700">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Allergen Information
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {foodInfo.allergens.map((allergen, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preparation Tips */}
                {foodInfo.preparationTips.length > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="h-5 w-5 text-purple-500" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Tips & Suggestions
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {foodInfo.preparationTips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <span className="text-purple-500 mt-1">💡</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No information available
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Sparkles className="h-4 w-4" />
            <span>Powered by Google AI • Information may vary based on preparation</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FoodInfoPopup;

