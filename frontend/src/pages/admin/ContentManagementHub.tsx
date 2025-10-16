import { createOptimizedClickHandler } from "@/utils/performanceOptimizer";
import { motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";

// Import shared components
import { AnimatedStats, DataTable, GlassCard } from "@/components/admin/shared";
import type { Column } from "@/components/admin/shared/tables/DataTable";

// Import UI components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

// Import icons
import {
  AlertCircle,
  CheckCircle,
  ChefHat,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  Leaf,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Star,
  Tag,
  Trash2,
  TrendingUp,
  User,
  Users,
  Utensils,
  XCircle,
} from "lucide-react";

// Import services
import { adminService } from "@/services/adminService";
import {
  createCuisine,
  createFoodCategory,
  deleteCuisine,
  deleteFood,
  deleteFoodCategory,
  fetchCuisines,
  fetchFoodCategories,
  fetchFoods,
  updateCuisine,
  updateFoodCategory,
} from "@/services/foodService";
import {
  referralService,
  type ReferralStats,
  type ReferralToken,
} from "@/services/referralService";
import {
  type Cuisine,
  type Food,
  type FoodCategory,
  type FoodFilterParams,
} from "@/types/food";
import axios from "axios";

/**
 * Unified Content Management Hub - Consolidates 3 content-related pages
 *
 * Merged from:
 * - FoodMenuManagement.tsx (food items, categories, cuisine management)
 * - OfferManagement.tsx (promotional offers, discounts, campaigns)
 * - ReferralManagement.tsx (referral programs, tokens, tracking)
 *
 * Features:
 * - Tabbed interface for organized access
 * - Complete food menu management with categories
 * - Promotional offers and discount management
 * - Referral program administration
 * - Advanced filtering and analytics
 * - Consistent design and UX
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Interfaces
interface FoodStats {
  totalFoods: number;
  availableFoods: number;
  featuredFoods: number;
  totalCategories: number;
  totalCuisines: number;
  averageRating: number;
  totalOrders: number;
  averagePrice: number;
}

interface Offer {
  offer_id: number;
  description: string;
  discount: number;
  valid_until: string;
  price: number;
  created_at: string;
}

interface OfferFormData {
  description: string;
  discount: string;
  valid_until: string;
  price: string;
}

// Food Hover Preview Component
interface FoodHoverPreviewProps {
  food: Food;
  isVisible: boolean;
  position: { x: number; y: number };
}

const FoodHoverPreview: React.FC<FoodHoverPreviewProps> = ({
  food,
  isVisible,
  position,
}) => {
  if (!isVisible) return null;

  const getAvailabilityColor = (available?: boolean) => {
    return available
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  const getDietaryInfo = (food: Food) => {
    const dietary = [];
    if (food.is_vegetarian) dietary.push("Vegetarian");
    if (food.is_vegan) dietary.push("Vegan");
    if (food.is_gluten_free) dietary.push("Gluten-Free");
    return dietary;
  };

  const getSpiceLevelText = (level?: string) => {
    switch (level) {
      case "mild":
        return "🌶️ Mild";
      case "medium":
        return "🌶️🌶️ Medium";
      case "hot":
        return "🌶️🌶️🌶️ Hot";
      case "very_hot":
        return "🌶️🌶️🌶️🌶️ Very Hot";
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="fixed z-50 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-80 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600">
              <Utensils className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                {food.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ID: {food.id}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getAvailabilityColor(
                food.is_available
              )}`}
            >
              {food.is_available ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>

        {/* Description */}
        {food.description && (
          <div className="mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
              {food.description}
            </p>
          </div>
        )}

        {/* Price and Rating */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Price
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              LKR {food.price?.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Rating
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {food?.rating_average
                  ? Number(food.rating_average).toFixed(1)
                  : "N/A"}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({food.total_reviews || 0})
              </span>
            </div>
          </div>
        </div>

        {/* Category and Cuisine */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <Tag className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Category:
            </span>
            <span className="text-xs font-medium text-gray-900 dark:text-white">
              {food.category_name || "Uncategorized"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ChefHat className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Cuisine:
            </span>
            <span className="text-xs font-medium text-gray-900 dark:text-white">
              {food.cuisine_name || "Unknown"}
            </span>
          </div>
        </div>

        {/* Dietary Information */}
        {(food.is_vegetarian ||
          food.is_vegan ||
          food.is_gluten_free ||
          food.spice_level) && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Dietary Info:
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {getDietaryInfo(food).map((diet) => (
                <span
                  key={diet}
                  className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                >
                  {diet}
                </span>
              ))}
              {food.spice_level && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {getSpiceLevelText(food.spice_level)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Prep Time
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {food.preparation_time || 0} min
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Total Orders
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {food.total_orders || 0}
            </div>
          </div>
        </div>

        {/* Chef Info */}
        {food.chef_name && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Chef:
              </span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {food.chef_name}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {food.created_at
                ? new Date(food.created_at).toLocaleDateString()
                : "Unknown"}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ContentManagementHub: React.FC = () => {
  // Active tab state
  const [activeTab, setActiveTab] = useState<
    "food" | "categories" | "cuisines" | "offers" | "referrals"
  >("food");

  // Food Tab States
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [foodStats, setFoodStats] = useState<FoodStats | null>(null);
  const [foodLoading, setFoodLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [showFoodDialog, setShowFoodDialog] = useState(false);
  const [showDeleteFoodDialog, setShowDeleteFoodDialog] = useState(false);

  // Categories Tab States
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(
    null
  );
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] =
    useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    image: null as File | null,
    cuisine: "",
  });

  // Cuisines Tab States
  const [cuisinesLoading, setCuisinesLoading] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine | null>(null);
  const [showCuisineDialog, setShowCuisineDialog] = useState(false);
  const [showDeleteCuisineDialog, setShowDeleteCuisineDialog] = useState(false);
  const [cuisineFormData, setCuisineFormData] = useState({
    name: "",
    description: "",
    image: null as File | null,
    origin_country: "",
  });

  // Offers Tab States
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [showCreateOfferDialog, setShowCreateOfferDialog] = useState(false);
  const [showEditOfferDialog, setShowEditOfferDialog] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [offerFormData, setOfferFormData] = useState<OfferFormData>({
    description: "",
    discount: "",
    valid_until: "",
    price: "",
  });

  // Referrals Tab States
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(
    null
  );
  const [referralTokens, setReferralTokens] = useState<ReferralToken[]>([]);
  const [referralLoading, setReferralLoading] = useState(false);
  const [showCreateTokenDialog, setShowCreateTokenDialog] = useState(false);
  const [creatingToken, setCreatingToken] = useState(false);
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  // Filters
  const [foodFilters, setFoodFilters] = useState<any>({
    search: "",
    category: "all",
    cuisine: "all",
    availability: "all",
    featured: "all",
    page: 1,
    limit: 25,
  });

  // Hover preview states
  const [hoveredFood, setHoveredFood] = useState<Food | null>(null);
  const [foodTooltipPosition, setFoodTooltipPosition] = useState({
    x: 0,
    y: 0,
  });

  // Load food statistics
  const loadFoodStats = useCallback(async () => {
    try {
      // Fetch real food stats from API using adminService
      const statsData = await adminService.getFoodStats();

      // Map the API response to our local interface
      const mappedStats: FoodStats = {
        totalFoods: statsData.total_foods || 0,
        availableFoods: statsData.approved_foods || 0,
        featuredFoods: 0, // This would need to be added to the backend
        totalCategories: statsData.total_categories || 0,
        totalCuisines: statsData.total_cuisines || 0,
        averageRating: statsData.average_rating || 0,
        totalOrders: 0, // This would need to be added to the backend
        averagePrice: statsData.price_stats?.average_price || 0,
      };

      setFoodStats(mappedStats);
    } catch (error) {
      console.error("Error loading food stats:", error);

      // Fallback stats if API fails
      const fallbackStats: FoodStats = {
        totalFoods: 0,
        availableFoods: 0,
        featuredFoods: 0,
        totalCategories: 0,
        totalCuisines: 0,
        averageRating: 0,
        totalOrders: 0,
        averagePrice: 0,
      };
      setFoodStats(fallbackStats);
    }
  }, []);

  // Process filters to handle "all" values
  const processFilters = (filters: any): FoodFilterParams => {
    const processed: FoodFilterParams = {
      page: filters.page,
      search: filters.search,
      category:
        filters.category === "all"
          ? undefined
          : typeof filters.category === "string"
          ? parseInt(filters.category)
          : filters.category,
      cuisine:
        filters.cuisine === "all"
          ? undefined
          : typeof filters.cuisine === "string"
          ? parseInt(filters.cuisine)
          : filters.cuisine,
      is_available:
        filters.availability === "all"
          ? undefined
          : filters.availability === "available",
      is_featured:
        filters.featured === "all"
          ? undefined
          : filters.featured === "featured",
      is_vegetarian: filters.is_vegetarian,
      is_vegan: filters.is_vegan,
      is_gluten_free: filters.is_gluten_free,
      spice_level: filters.spice_level,
      min_price: filters.min_price,
      max_price: filters.max_price,
      sort_by: filters.sort_by,
    };
    return processed;
  };

  // Load foods
  const loadFoods = useCallback(async () => {
    try {
      setFoodLoading(true);

      const processedFilters = processFilters(foodFilters);
      const [foodsData, categoriesData, cuisinesData] = await Promise.all([
        fetchFoods(processedFilters),
        fetchFoodCategories({}),
        fetchCuisines({}),
      ]);

      setFoods(foodsData.results || []);
      setCategories(categoriesData.results || []);
      setCuisines(cuisinesData.results || []);
    } catch (error) {
      console.error("Error loading foods:", error);
    } finally {
      setFoodLoading(false);
    }
  }, [foodFilters]);

  // Load categories separately
  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const categoriesData = await fetchFoodCategories({});
      setCategories(categoriesData.results || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Load cuisines separately
  const loadCuisines = useCallback(async () => {
    try {
      setCuisinesLoading(true);
      const cuisinesData = await fetchCuisines({});
      setCuisines(cuisinesData.results || []);
    } catch (error) {
      console.error("Error loading cuisines:", error);
    } finally {
      setCuisinesLoading(false);
    }
  }, []);

  // Create/Update Category
  const handleCategorySubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("name", categoryFormData.name);
      formData.append("description", categoryFormData.description);
      if (categoryFormData.image) {
        formData.append("image", categoryFormData.image);
      }
      if (categoryFormData.cuisine) {
        formData.append("cuisine", categoryFormData.cuisine);
      }

      if (selectedCategory) {
        await updateFoodCategory(selectedCategory.id, formData);
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        await createFoodCategory(formData);
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }

      setShowCategoryDialog(false);
      setCategoryFormData({
        name: "",
        description: "",
        image: null,
        cuisine: "",
      });
      setSelectedCategory(null);
      loadCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    }
  };

  // Delete Category
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      await deleteFoodCategory(selectedCategory.id);
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      setShowDeleteCategoryDialog(false);
      setSelectedCategory(null);
      loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  // Create/Update Cuisine
  const handleCuisineSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("name", cuisineFormData.name);
      formData.append("description", cuisineFormData.description);
      if (cuisineFormData.image) {
        formData.append("image", cuisineFormData.image);
      }
      if (cuisineFormData.origin_country) {
        formData.append("origin_country", cuisineFormData.origin_country);
      }

      if (selectedCuisine) {
        await updateCuisine(selectedCuisine.id, formData);
        toast({
          title: "Success",
          description: "Cuisine updated successfully",
        });
      } else {
        await createCuisine(formData);
        toast({
          title: "Success",
          description: "Cuisine created successfully",
        });
      }

      setShowCuisineDialog(false);
      setCuisineFormData({
        name: "",
        description: "",
        image: null,
        origin_country: "",
      });
      setSelectedCuisine(null);
      loadCuisines();
    } catch (error) {
      console.error("Error saving cuisine:", error);
      toast({
        title: "Error",
        description: "Failed to save cuisine",
        variant: "destructive",
      });
    }
  };

  // Delete Cuisine
  const handleDeleteCuisine = async () => {
    if (!selectedCuisine) return;

    try {
      await deleteCuisine(selectedCuisine.id);
      toast({
        title: "Success",
        description: "Cuisine deleted successfully",
      });
      setShowDeleteCuisineDialog(false);
      setSelectedCuisine(null);
      loadCuisines();
    } catch (error) {
      console.error("Error deleting cuisine:", error);
      toast({
        title: "Error",
        description: "Failed to delete cuisine",
        variant: "destructive",
      });
    }
  };

  // Load offers
  const loadOffers = useCallback(async (silent = false) => {
    if (!silent) setOffersLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_BASE_URL}/food/offers/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOffers(response.data.results || response.data || []);
    } catch (error) {
      console.error("Error loading offers:", error);
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive",
      });
    } finally {
      setOffersLoading(false);
    }
  }, []);

  // Load referral data
  const loadReferralData = useCallback(async (silent = false) => {
    if (!silent) setReferralLoading(true);
    try {
      const [statsData, tokensData] = await Promise.all([
        referralService.getReferralStats(),
        referralService.getReferralTokens(),
      ]);
      setReferralStats(statsData);
      setReferralTokens(tokensData);
    } catch (error) {
      console.error("Error loading referral data:", error);
      setReferralStats(null);
      setReferralTokens([]);
      if (!silent) {
        const description =
          (error as any)?.response?.data?.message ||
          (error as any)?.response?.data?.detail ||
          (error as Error)?.message ||
          "Failed to load referral data";
        toast({
          title: "Error",
          description,
          variant: "destructive",
        });
      }
    } finally {
      setReferralLoading(false);
    }
  }, []);

  // Delete food item
  const handleDeleteFood = async (food: Food) => {
    try {
      await deleteFood(food?.id);
      await loadFoods();
      setShowDeleteFoodDialog(false);
      setSelectedFood(null);
      toast({
        title: "Success",
        description: "Food item deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting food:", error);
      toast({
        title: "Error",
        description: "Failed to delete food item",
        variant: "destructive",
      });
    }
  };

  // Create offer
  const handleCreateOffer = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${API_BASE_URL}/food/offers/`,
        {
          description: offerFormData.description,
          discount: parseFloat(offerFormData.discount),
          valid_until: offerFormData.valid_until,
          price: parseFloat(offerFormData.price),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShowCreateOfferDialog(false);
      setOfferFormData({
        description: "",
        discount: "",
        valid_until: "",
        price: "",
      });
      await loadOffers(true);

      toast({
        title: "Success",
        description: "Offer created successfully",
      });
    } catch (error) {
      console.error("Error creating offer:", error);
      toast({
        title: "Error",
        description: "Failed to create offer",
        variant: "destructive",
      });
    }
  };

  // Update offer
  const handleUpdateOffer = async () => {
    if (!selectedOffer) return;

    try {
      const token = localStorage.getItem("access_token");
      await axios.put(
        `${API_BASE_URL}/food/offers/${selectedOffer.offer_id}/`,
        {
          description: offerFormData.description,
          discount: parseFloat(offerFormData.discount),
          valid_until: offerFormData.valid_until,
          price: parseFloat(offerFormData.price),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShowEditOfferDialog(false);
      setSelectedOffer(null);
      setOfferFormData({
        description: "",
        discount: "",
        valid_until: "",
        price: "",
      });
      await loadOffers(true);

      toast({
        title: "Success",
        description: "Offer updated successfully",
      });
    } catch (error) {
      console.error("Error updating offer:", error);
      toast({
        title: "Error",
        description: "Failed to update offer",
        variant: "destructive",
      });
    }
  };

  // Delete offer
  const handleDeleteOffer = async (offer: Offer) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_BASE_URL}/food/offers/${offer?.offer_id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await loadOffers(true);
      toast({
        title: "Success",
        description: "Offer deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast({
        title: "Error",
        description: "Failed to delete offer",
        variant: "destructive",
      });
    }
  };

  // Create referral token
  const handleCreateToken = async () => {
    setCreatingToken(true);
    try {
      const payload: any = {};
      if (maxUses) payload.max_uses = parseInt(maxUses);
      if (expiresAt) payload.expires_at = expiresAt;

      await referralService.createReferralToken(payload);
      setShowCreateTokenDialog(false);
      setMaxUses("");
      setExpiresAt("");
      await loadReferralData(true);
    } catch (error) {
      console.error("Error creating token:", error);
      const description =
        (error as any)?.response?.data?.message ||
        (error as any)?.response?.data?.detail ||
        "Failed to create referral token";
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    } finally {
      setCreatingToken(false);
    }
  };

  // Copy referral link
  const handleCopyLink = (token: string) => {
    void referralService.copyReferralLink(token);
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "food") {
      loadFoodStats();
      loadFoods();
    } else if (activeTab === "categories") {
      loadCategories();
    } else if (activeTab === "cuisines") {
      loadCuisines();
    } else if (activeTab === "offers") {
      loadOffers();
    } else if (activeTab === "referrals") {
      loadReferralData();
    }
  }, [
    activeTab,
    loadFoods,
    loadFoodStats,
    loadCategories,
    loadCuisines,
    loadOffers,
    loadReferralData,
  ]);

  // Get availability color
  const getAvailabilityColor = (available?: boolean) => {
    return available ? "green" : "red";
  };

  // Get offer status color
  const getOfferStatusColor = (validUntil: string) => {
    const isExpired = new Date(validUntil) < new Date();
    return isExpired ? "red" : "green";
  };

  // Categories table columns
  const categoriesColumns: Column<FoodCategory>[] = [
    {
      key: "name",
      title: "Category",
      render: (category: FoodCategory) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            {category?.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Tag className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium">{category?.name || "Unnamed"}</div>
            <div className="text-sm text-gray-500">
              {category?.description?.substring(0, 50)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "cuisine",
      title: "Cuisine",
      render: (category: FoodCategory) => (
        <Badge variant="outline">
          {category?.cuisine_name || "No Cuisine"}
        </Badge>
      ),
    },
    {
      key: "food_count",
      title: "Food Items",
      render: (category: FoodCategory) => (
        <div className="font-medium">{category?.food_count || 0} items</div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (category: FoodCategory) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setSelectedCategory(category);
                setCategoryFormData({
                  name: category.name,
                  description: category.description || "",
                  image: null,
                  cuisine: category.cuisine?.toString() || "",
                });
                setShowCategoryDialog(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setSelectedCategory(category);
                setShowDeleteCategoryDialog(true);
              }}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Cuisines table columns
  const cuisinesColumns: Column<Cuisine>[] = [
    {
      key: "name",
      title: "Cuisine",
      render: (cuisine: Cuisine) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            {cuisine?.image ? (
              <img
                src={cuisine.image}
                alt={cuisine.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <ChefHat className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium">{cuisine?.name || "Unnamed"}</div>
            <div className="text-sm text-gray-500">
              {cuisine?.description?.substring(0, 50)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "origin_country",
      title: "Origin",
      render: (cuisine: Cuisine) => (
        <Badge variant="outline">{cuisine?.origin_country || "Unknown"}</Badge>
      ),
    },
    {
      key: "food_count",
      title: "Food Items",
      render: (cuisine: Cuisine) => (
        <div className="font-medium">{cuisine?.food_count || 0} items</div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (cuisine: Cuisine) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setSelectedCuisine(cuisine);
                setCuisineFormData({
                  name: cuisine.name,
                  description: cuisine.description || "",
                  image: null,
                  origin_country: cuisine.origin_country || "",
                });
                setShowCuisineDialog(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setSelectedCuisine(cuisine);
                setShowDeleteCuisineDialog(true);
              }}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Render Food Tab
  const renderFoodTab = () => (
    <div className="space-y-6">
      {/* Food Statistics */}
      {foodStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedStats
            value={foodStats.totalFoods}
            label="Total Food Items"
            icon={Utensils}
            trend={8.2}
            gradient="blue"
          />
          <AnimatedStats
            value={foodStats.availableFoods}
            label="Available Items"
            icon={CheckCircle}
            trend={5.1}
            gradient="green"
          />
          <AnimatedStats
            value={foodStats.featuredFoods}
            label="Featured Items"
            icon={Star}
            trend={12.3}
            gradient="purple"
          />
          <AnimatedStats
            value={foodStats.averagePrice}
            label="Average Price"
            icon={Tag}
            trend={3.5}
            gradient="orange"
            prefix="LKR "
          />
        </div>
      )}

      {/* Filters and Search */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search food items..."
              value={foodFilters.search}
              onChange={(e) =>
                setFoodFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
          </div>
          <Select
            value={foodFilters.category}
            onValueChange={(value) =>
              setFoodFilters((prev) => ({
                ...prev,
                category: value === "all" ? undefined : parseInt(value),
              }))
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category?.id} value={category?.id?.toString()}>
                  {category?.name || "Unnamed"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={foodFilters.availability}
            onValueChange={(value) =>
              setFoodFilters((prev) => ({ ...prev, availability: value }))
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={createOptimizedClickHandler(loadFoods, {
              measurePerformance: true,
              label: "Refresh Foods",
            })}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </GlassCard>

      {/* Foods Table */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">Food Items</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setShowFoodDialog(true)}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Food
            </Button>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Custom Foods Table with Hover Preview */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">
                  Food Item
                </TableHead>
                <TableHead className="sm:hidden">Item</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Price</TableHead>
                <TableHead className="hidden xl:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foods.map((food, index) => (
                <TableRow
                  key={food?.id || index}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative"
                  onMouseEnter={(e) => {
                    setHoveredFood(food);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setFoodTooltipPosition({
                      x: rect.left + rect.width / 2,
                      y: rect.top - 10,
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredFood(null);
                  }}
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        {food?.images?.[0]?.image ? (
                          <img
                            src={food?.images?.[0]?.image}
                            alt={food?.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Utensils className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {food?.name || "Unnamed"}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-32 sm:max-w-none">
                          {food?.description?.substring(0, 30)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">
                      {food?.category_name || "Uncategorized"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="font-medium">
                      LKR {food?.price?.toFixed(2) || "0.00"}
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <Badge
                      variant="outline"
                      className={`border-${getAvailabilityColor(
                        food?.is_available
                      )}-500 text-${getAvailabilityColor(
                        food?.is_available
                      )}-700`}
                    >
                      {food?.is_available ? "Available" : "Unavailable"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm">
                        {food?.rating_average
                          ? Number(food.rating_average).toFixed(1)
                          : "N/A"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFood(food);
                            setShowFoodDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFood(food);
                            setShowFoodDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedFood(food);
                            setShowDeleteFoodDialog(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {foods.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500 dark:text-gray-400"
                  >
                    No food items available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Food Hover Preview */}
        <FoodHoverPreview
          food={hoveredFood!}
          isVisible={hoveredFood !== null}
          position={foodTooltipPosition}
        />
      </GlassCard>
    </div>
  );

  // Render Categories Tab
  const renderCategoriesTab = () => (
    <div className="space-y-6">
      {/* Categories Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedStats
          value={categories.length}
          label="Total Categories"
          icon={Tag}
          trend={12.5}
          gradient="blue"
        />
        <AnimatedStats
          value={categories.filter((c) => (c.food_count || 0) > 0).length}
          label="Active Categories"
          icon={CheckCircle}
          trend={8.3}
          gradient="green"
        />
        <AnimatedStats
          value={categories.filter((c) => (c.food_count || 0) === 0).length}
          label="Empty Categories"
          icon={AlertCircle}
          trend={-2.1}
          gradient="orange"
        />
        <AnimatedStats
          value={
            categories.reduce((sum, c) => sum + (c.food_count || 0), 0) /
            (categories.length || 1)
          }
          label="Avg Foods per Category"
          icon={TrendingUp}
          trend={5.7}
          gradient="purple"
          decimals={1}
        />
      </div>

      {/* Categories Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Food Categories</h3>
          <div className="space-x-2">
            <Button
              onClick={() => {
                setSelectedCategory(null);
                setCategoryFormData({
                  name: "",
                  description: "",
                  image: null,
                  cuisine: "",
                });
                setShowCategoryDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
            <Button
              variant="outline"
              onClick={createOptimizedClickHandler(loadCategories, {
                measurePerformance: true,
                label: "Refresh Categories",
              })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <DataTable
          data={categories}
          columns={categoriesColumns}
          loading={categoriesLoading}
        />
      </GlassCard>
    </div>
  );

  // Render Cuisines Tab
  const renderCuisinesTab = () => (
    <div className="space-y-6">
      {/* Cuisines Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedStats
          value={cuisines.length}
          label="Total Cuisines"
          icon={ChefHat}
          trend={15.8}
          gradient="blue"
        />
        <AnimatedStats
          value={cuisines.filter((c) => (c.food_count || 0) > 0).length}
          label="Active Cuisines"
          icon={CheckCircle}
          trend={9.2}
          gradient="green"
        />
        <AnimatedStats
          value={cuisines.filter((c) => (c.food_count || 0) === 0).length}
          label="Empty Cuisines"
          icon={AlertCircle}
          trend={-1.5}
          gradient="orange"
        />
        <AnimatedStats
          value={
            cuisines.reduce((sum, c) => sum + (c.food_count || 0), 0) /
            (cuisines.length || 1)
          }
          label="Avg Foods per Cuisine"
          icon={TrendingUp}
          trend={7.3}
          gradient="purple"
          decimals={1}
        />
      </div>

      {/* Cuisines Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Cuisines</h3>
          <div className="space-x-2">
            <Button
              onClick={() => {
                setSelectedCuisine(null);
                setCuisineFormData({
                  name: "",
                  description: "",
                  image: null,
                  origin_country: "",
                });
                setShowCuisineDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Cuisine
            </Button>
            <Button
              variant="outline"
              onClick={createOptimizedClickHandler(loadCuisines, {
                measurePerformance: true,
                label: "Refresh Cuisines",
              })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <DataTable
          data={cuisines}
          columns={cuisinesColumns}
          loading={cuisinesLoading}
        />
      </GlassCard>
    </div>
  );

  // Render Offers Tab
  const renderOffersTab = () => (
    <div className="space-y-6">
      {/* Offers Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedStats
          value={offers.length}
          label="Total Offers"
          icon={Tag}
          trend={15.2}
          gradient="blue"
        />
        <AnimatedStats
          value={
            offers.filter((o) => new Date(o.valid_until) > new Date()).length
          }
          label="Active Offers"
          icon={CheckCircle}
          trend={8.7}
          gradient="green"
        />
        <AnimatedStats
          value={
            offers.filter((o) => new Date(o.valid_until) < new Date()).length
          }
          label="Expired Offers"
          icon={XCircle}
          trend={-12.1}
          gradient="pink"
        />
        <AnimatedStats
          value={
            offers.reduce((avg, offer) => avg + (offer?.discount || 0), 0) /
              offers.length || 0
          }
          label="Avg Discount"
          icon={TrendingUp}
          trend={5.3}
          gradient="purple"
          suffix="%"
          decimals={1}
        />
      </div>

      {/* Offers Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Promotional Offers</h3>
          <Button onClick={() => setShowCreateOfferDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Offer
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => (
              <TableRow key={offer.offer_id}>
                <TableCell>{offer.description}</TableCell>
                <TableCell>{offer.discount}%</TableCell>
                <TableCell>LKR {offer?.price?.toFixed(2) || "0.00"}</TableCell>
                <TableCell>
                  {new Date(offer.valid_until).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`border-${getOfferStatusColor(
                      offer.valid_until
                    )}-500 text-${getOfferStatusColor(offer.valid_until)}-700`}
                  >
                    {new Date(offer.valid_until) > new Date()
                      ? "Active"
                      : "Expired"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOffer(offer);
                        setOfferFormData({
                          description: offer.description,
                          discount: offer.discount.toString(),
                          valid_until: offer.valid_until.split("T")[0],
                          price: offer?.price?.toString() || "0",
                        });
                        setShowEditOfferDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteOffer(offer)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCard>
    </div>
  );

  // Render Referrals Tab
  const renderReferralsTab = () => (
    <div className="space-y-6">
      {/* Referral Statistics */}
      {referralStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedStats
            value={referralStats.total_referrals}
            label="Total Referrals"
            icon={Users}
            trend={18.5}
            gradient="blue"
          />
          <AnimatedStats
            value={referralStats.successful_referrals}
            label="Successful Referrals"
            icon={CheckCircle}
            trend={22.3}
            gradient="green"
          />
          <AnimatedStats
            value={referralStats.total_tokens}
            label="Active Tokens"
            icon={Tag}
            trend={5.7}
            gradient="purple"
          />
          <AnimatedStats
            value={referralStats.conversion_rate}
            label="Conversion Rate"
            icon={TrendingUp}
            trend={12.1}
            gradient="orange"
            suffix="%"
            decimals={1}
          />
        </div>
      )}

      {/* Referral Tokens */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Referral Tokens</h3>
          <Button onClick={() => setShowCreateTokenDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Token
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Max Uses</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referralLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-gray-500">
                  Loading referral tokens...
                </TableCell>
              </TableRow>
            ) : referralTokens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-gray-500">
                  No referral tokens found
                </TableCell>
              </TableRow>
            ) : (
              referralTokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="font-mono text-sm">
                    {token.token}
                  </TableCell>
                  <TableCell>{token.uses}</TableCell>
                  <TableCell>{token.max_uses || "Unlimited"}</TableCell>
                  <TableCell>
                    {token.expires_at
                      ? new Date(token.expires_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={token.is_active ? "default" : "secondary"}>
                      {token.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(token.token)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = referralService.generateReferralLink(token.token);
                          window.open(link, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </GlassCard>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
              Content Management Hub
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
              Complete food menu, promotional offers, and referral program
              management
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Export All</span>
              <span className="xs:hidden">Export</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (activeTab === "food") loadFoods();
                else if (activeTab === "offers") loadOffers();
                else if (activeTab === "referrals") loadReferralData();
              }}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs
          value={activeTab}
          onValueChange={(value: any) => setActiveTab(value)}
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto p-1">
            <TabsTrigger
              value="food"
              className="text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              <span className="hidden sm:inline">Food Menu</span>
              <span className="sm:hidden">Food</span>
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              <span className="hidden sm:inline">Categories</span>
              <span className="sm:hidden">Cats</span>
            </TabsTrigger>
            <TabsTrigger
              value="cuisines"
              className="text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              <span className="hidden sm:inline">Cuisines</span>
              <span className="sm:hidden">Cuisine</span>
            </TabsTrigger>
            <TabsTrigger
              value="offers"
              className="text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              Offers
            </TabsTrigger>
            <TabsTrigger
              value="referrals"
              className="text-xs sm:text-sm py-2 px-1 sm:px-3"
            >
              <span className="hidden sm:inline">Referrals</span>
              <span className="sm:hidden">Refs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="food" className="mt-6">
            {renderFoodTab()}
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            {renderCategoriesTab()}
          </TabsContent>

          <TabsContent value="cuisines" className="mt-6">
            {renderCuisinesTab()}
          </TabsContent>

          <TabsContent value="offers" className="mt-6">
            {renderOffersTab()}
          </TabsContent>

          <TabsContent value="referrals" className="mt-6">
            {renderReferralsTab()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Food Dialog */}
      <Dialog open={showFoodDialog} onOpenChange={setShowFoodDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedFood ? "Edit Food Item" : "Add New Food Item"}
            </DialogTitle>
            <DialogDescription>
              {selectedFood
                ? "Update food item details"
                : "Create a new food item for the menu"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="Enter food name"
                  defaultValue={selectedFood?.name}
                />
              </div>
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  defaultValue={selectedFood?.price}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Enter food description..."
                defaultValue={selectedFood?.description}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select defaultValue={selectedFood?.category?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem
                        key={category?.id}
                        value={category?.id?.toString()}
                      >
                        {category?.name || "Unnamed"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cuisine</Label>
                <Select defaultValue={selectedFood?.cuisine_name}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisines.map((cuisine) => (
                      <SelectItem
                        key={cuisine.id}
                        value={cuisine.id.toString()}
                      >
                        {cuisine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFoodDialog(false)}>
              Cancel
            </Button>
            <Button>{selectedFood ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Food Dialog */}
      <AlertDialog
        open={showDeleteFoodDialog}
        onOpenChange={setShowDeleteFoodDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Food Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedFood?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedFood && handleDeleteFood(selectedFood)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? "Update the category details"
                : "Create a new food category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input
                placeholder="Enter category name..."
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Enter category description..."
                value={categoryFormData.description}
                onChange={(e) =>
                  setCategoryFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Cuisine (Optional)</Label>
              <Select
                value={categoryFormData.cuisine}
                onValueChange={(value) =>
                  setCategoryFormData((prev) => ({ ...prev, cuisine: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cuisine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Cuisine</SelectItem>
                  {cuisines.map((cuisine) => (
                    <SelectItem key={cuisine.id} value={cuisine.id.toString()}>
                      {cuisine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image (Optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setCategoryFormData((prev) => ({
                    ...prev,
                    image: e.target.files?.[0] || null,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCategoryDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCategorySubmit}>
              {selectedCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog
        open={showDeleteCategoryDialog}
        onOpenChange={setShowDeleteCategoryDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cuisine Dialog */}
      <Dialog open={showCuisineDialog} onOpenChange={setShowCuisineDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCuisine ? "Edit Cuisine" : "Create Cuisine"}
            </DialogTitle>
            <DialogDescription>
              {selectedCuisine
                ? "Update the cuisine details"
                : "Create a new cuisine type"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cuisine Name</Label>
              <Input
                placeholder="Enter cuisine name..."
                value={cuisineFormData.name}
                onChange={(e) =>
                  setCuisineFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Enter cuisine description..."
                value={cuisineFormData.description}
                onChange={(e) =>
                  setCuisineFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Origin Country (Optional)</Label>
              <Input
                placeholder="Enter origin country..."
                value={cuisineFormData.origin_country}
                onChange={(e) =>
                  setCuisineFormData((prev) => ({
                    ...prev,
                    origin_country: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Image (Optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setCuisineFormData((prev) => ({
                    ...prev,
                    image: e.target.files?.[0] || null,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCuisineDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCuisineSubmit}>
              {selectedCuisine ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Cuisine Dialog */}
      <AlertDialog
        open={showDeleteCuisineDialog}
        onOpenChange={setShowDeleteCuisineDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cuisine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCuisine?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCuisine}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Offer Dialog */}
      <Dialog
        open={showCreateOfferDialog}
        onOpenChange={setShowCreateOfferDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Offer</DialogTitle>
            <DialogDescription>
              Create a new promotional offer for customers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Enter offer description..."
                value={offerFormData.description}
                onChange={(e) =>
                  setOfferFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={offerFormData.discount}
                  onChange={(e) =>
                    setOfferFormData((prev) => ({
                      ...prev,
                      discount: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={offerFormData.price}
                  onChange={(e) =>
                    setOfferFormData((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={offerFormData.valid_until}
                onChange={(e) =>
                  setOfferFormData((prev) => ({
                    ...prev,
                    valid_until: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateOfferDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateOffer}>Create Offer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Offer Dialog */}
      <Dialog open={showEditOfferDialog} onOpenChange={setShowEditOfferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Offer</DialogTitle>
            <DialogDescription>
              Update the promotional offer details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Enter offer description..."
                value={offerFormData.description}
                onChange={(e) =>
                  setOfferFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={offerFormData.discount}
                  onChange={(e) =>
                    setOfferFormData((prev) => ({
                      ...prev,
                      discount: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={offerFormData.price}
                  onChange={(e) =>
                    setOfferFormData((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={offerFormData.valid_until}
                onChange={(e) =>
                  setOfferFormData((prev) => ({
                    ...prev,
                    valid_until: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditOfferDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateOffer}>Update Offer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Referral Token Dialog */}
      <Dialog
        open={showCreateTokenDialog}
        onOpenChange={setShowCreateTokenDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Referral Token</DialogTitle>
            <DialogDescription>
              Create a new referral token for tracking referrals
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Max Uses (optional)</Label>
              <Input
                type="number"
                placeholder="Leave empty for unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
            <div>
              <Label>Expires At (optional)</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateTokenDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateToken} disabled={creatingToken}>
              {creatingToken ? "Creating..." : "Create Token"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagementHub;
