import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { aiFoodInfoService, FoodInfo } from "@/services/aiFoodInfoService";
import { AlertTriangle, Apple, Info, Leaf, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";

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
  const [aiImage, setAiImage] = useState<string>("");
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
      console.log("🚀 FoodInfoPopup: Loading info for:", foodName);

      // Get food information from AI
      const response = await aiFoodInfoService.getFoodInfo(
        foodName,
        foodDescription
      );

      console.log("📦 FoodInfoPopup: Received response:", response);

      if (response.error) {
        console.error("⚠️ FoodInfoPopup: AI returned error:", response.error);
        setError(response.error);
      } else {
        console.log("✅ FoodInfoPopup: Successfully loaded food info");
        setError(null);
      }

      setFoodInfo(response.foodInfo);

      // Get food image
      const imageUrl =
        foodImage || (await aiFoodInfoService.searchFoodImage(foodName));
      setAiImage(imageUrl);

      console.log("🖼️ FoodInfoPopup: Image URL:", imageUrl);
    } catch (error: any) {
      console.error("❌ FoodInfoPopup: Error loading food info:", error);
      const errorMsg = `Failed to load food information: ${error.message}`;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-900 dark:to-orange-950/30">
        {/* Compact Header */}
        <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white p-3 sm:p-4 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_50%)]"></div>
          </div>

          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight truncate">
                {foodName}
              </DialogTitle>
              <DialogDescription className="text-white/90 text-xs sm:text-sm hidden sm:block">
                AI Powered Insights
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="p-3 sm:p-4">
          {/* Error Alert */}
          {error && !loading && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-lg font-bold">
                🔐 API Configuration Needed
              </AlertTitle>
              <AlertDescription className="mt-3 space-y-3">
                {error.includes("403") || error.includes("SERVICE_DISABLED") ? (
                  <>
                    <p className="font-semibold text-base">
                      Google AI API is not enabled for your project
                    </p>
                    <div className="bg-black/10 rounded-lg p-4 space-y-3">
                      <p className="font-semibold text-sm">
                        ✅ Quick Fix (30 seconds):
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-sm ml-2">
                        <li>
                          Visit{" "}
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Google AI Studio
                          </a>
                        </li>
                        <li>
                          Click <strong>"Create API Key"</strong>
                        </li>
                        <li>
                          Select{" "}
                          <strong>"Create API key in new project"</strong> (this
                          auto-enables the API!)
                        </li>
                        <li>Copy the new API key</li>
                        <li>
                          Update your{" "}
                          <code className="bg-black/20 px-1.5 py-0.5 rounded text-xs font-mono">
                            frontend/.env
                          </code>{" "}
                          file:
                          <div className="mt-2 bg-black/20 p-2 rounded text-xs font-mono">
                            VITE_GOOGLE_AI_API_KEY=AIzaSy...
                          </div>
                        </li>
                        <li>Restart the dev server and refresh this page</li>
                      </ol>

                      <div className="border-t border-black/20 pt-3 mt-3">
                        <p className="font-semibold text-sm mb-2">
                          📖 Alternative: Enable in existing project
                        </p>
                        <p className="text-xs">
                          If you want to keep your current key, enable the API
                          at:{" "}
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
                      <p className="font-semibold mb-2">
                        To enable AI Food Insights:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>
                          Get a free API key from{" "}
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Google AI Studio
                          </a>
                        </li>
                        <li>
                          Add to your{" "}
                          <code className="bg-black/20 px-1 rounded">.env</code>{" "}
                          file:{" "}
                          <code className="bg-black/20 px-1 rounded">
                            VITE_GOOGLE_AI_API_KEY=your_key_here
                          </code>
                        </li>
                        <li>Restart the development server</li>
                        <li>
                          Check browser console for detailed debugging info
                        </li>
                      </ol>
                    </div>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          {loading ? (
            // Compact Loading State
            <div className="space-y-3 animate-pulse">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Skeleton className="h-48 sm:h-56 w-full sm:w-1/3 rounded-xl" />
                <div className="flex-1 space-y-2 sm:space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ) : foodInfo ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Left Column - Hero Image */}
              <div className="lg:col-span-1 space-y-3">
                <div className="relative rounded-xl overflow-hidden shadow-lg group">
                  <img
                    src={aiImage}
                    alt={foodName}
                    className="w-full h-48 sm:h-56 object-cover transform group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/food-placeholder.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <Badge className="bg-white/90 backdrop-blur-sm text-gray-900 flex items-center gap-1.5 px-2 py-1 text-xs">
                      <Sparkles className="h-3 w-3 text-orange-500" />
                      <span className="font-semibold">AI Enhanced</span>
                    </Badge>
                  </div>
                </div>

                {/* Allergens Alert */}
                {foodInfo.allergens.length > 0 && (
                  <div className="bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-xl p-3 border-2 border-red-300 dark:border-red-700 shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        Allergen Alert
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {foodInfo.allergens.map((allergen, index) => (
                        <Badge
                          key={index}
                          variant="destructive"
                          className="text-xs font-semibold"
                        >
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Middle Column - Nutrition & Ingredients */}
              <div className="lg:col-span-1 space-y-3">
                {/* Nutrition Facts Card */}
                <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-teal-900/20 rounded-xl p-3 sm:p-4 border-2 border-emerald-300 dark:border-emerald-700 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Apple className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      Nutrition Facts
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
                      <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Calories
                      </span>
                      <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {foodInfo.nutrition.calories}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
                      <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Protein
                      </span>
                      <span className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
                        {foodInfo.nutrition.protein}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
                      <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Carbs
                      </span>
                      <span className="text-sm sm:text-base font-bold text-orange-600 dark:text-orange-400">
                        {foodInfo.nutrition.carbohydrates}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
                      <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Fat
                      </span>
                      <span className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400">
                        {foodInfo.nutrition.fat}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
                      <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Fiber
                      </span>
                      <span className="text-sm sm:text-base font-bold text-green-600 dark:text-green-400">
                        {foodInfo.nutrition.fiber}
                      </span>
                    </div>

                    {foodInfo.nutrition.vitamins.length > 0 && (
                      <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5 uppercase tracking-wide">
                          Key Vitamins & Minerals
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {foodInfo.nutrition.vitamins.map((vitamin, index) => (
                            <Badge
                              key={index}
                              className="text-xs bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700"
                            >
                              {vitamin}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ingredients */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3 sm:p-4 border-2 border-amber-300 dark:border-amber-700 shadow-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Leaf className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      Ingredients
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {foodInfo.ingredients.map((ingredient, index) => (
                      <Badge
                        key={index}
                        className="bg-white dark:bg-gray-800 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 px-2 py-0.5 text-xs font-semibold"
                      >
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Health Benefits */}
              <div className="lg:col-span-1">
                {foodInfo.healthBenefits.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 border-2 border-blue-300 dark:border-blue-700 shadow-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                        Health Benefits
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {foodInfo.healthBenefits.map((benefit, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 bg-white/70 dark:bg-gray-800/70 rounded-lg backdrop-blur-sm"
                        >
                          <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs font-bold">
                              {index + 1}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Info className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                No information available
              </p>
            </div>
          )}
        </div>

        {/* Compact Footer */}
        <div className="bg-gradient-to-r from-gray-50 via-orange-50 to-gray-50 dark:from-gray-800 dark:via-orange-950/30 dark:to-gray-800 border-t border-orange-200 dark:border-orange-800 p-2 sm:p-3">
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                Powered by Google AI
              </span>
            </div>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Information may vary
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FoodInfoPopup;
