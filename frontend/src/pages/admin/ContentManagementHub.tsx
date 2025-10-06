import React, { useCallback, useEffect, useState } from "react";
import { createOptimizedClickHandler } from "@/utils/performanceOptimizer";

// Import shared components
import { 
  AnimatedStats,
  GlassCard,
  GradientButton,
  DataTable 
} from "@/components/admin/shared";
import type { Column } from "@/components/admin/shared/tables/DataTable";
import DynamicForm from "@/components/admin/shared/forms/DynamicForm";
import { ActionModal } from "@/components/admin/shared/modals";
import { StatsWidget as StatsCard } from "@/components/admin/shared/widgets/index";

// Import UI components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

// Import icons
import {
  AlertCircle,
  CheckCircle,
  ChefHat,
  Clock,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  ImageIcon,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Star,
  Tag,
  Trash2,
  TrendingUp,
  Utensils,
  Users,
  XCircle,
} from "lucide-react";

// Import services
import { adminService } from "@/services/adminService";
import { 
  fetchFoods, 
  fetchFoodCategories, 
  fetchCuisines,
  deleteFood
} from "@/services/foodService";
import {
  type Cuisine,
  type Food,
  type FoodCategory,
  type FoodFilterParams,
} from "@/types/food";
import {
  referralService,
  type ReferralStats,
  type ReferralToken,
} from "@/services/referralService";
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

const ContentManagementHub: React.FC = () => {
  // Active tab state
  const [activeTab, setActiveTab] = useState<
    "food" | "offers" | "referrals"
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
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
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
      category: filters.category === "all" ? undefined : (typeof filters.category === "string" ? parseInt(filters.category) : filters.category),
      cuisine: filters.cuisine === "all" ? undefined : (typeof filters.cuisine === "string" ? parseInt(filters.cuisine) : filters.cuisine),
      is_available: filters.availability === "all" ? undefined : filters.availability === "available",
      is_featured: filters.featured === "all" ? undefined : filters.featured === "featured",
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
      loadReferralData(true);
      
      toast({
        title: "Success",
        description: "Referral token created successfully",
      });
    } catch (error) {
      console.error("Error creating token:", error);
      toast({
        title: "Error",
        description: "Failed to create referral token",
        variant: "destructive",
      });
    } finally {
      setCreatingToken(false);
    }
  };

  // Copy referral link
  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/register?ref=${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied",
      description: "Referral link copied to clipboard",
    });
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "food") {
      loadFoodStats();
      loadFoods();
    } else if (activeTab === "offers") {
      loadOffers();
    } else if (activeTab === "referrals") {
      loadReferralData();
    }
  }, [activeTab, loadFoods, loadFoodStats, loadOffers, loadReferralData]);

  // Get availability color
  const getAvailabilityColor = (available?: boolean) => {
    return available ? "green" : "red";
  };

  // Get offer status color
  const getOfferStatusColor = (validUntil: string) => {
    const isExpired = new Date(validUntil) < new Date();
    return isExpired ? "red" : "green";
  };

  // Food table columns
  const foodColumns: Column<Food>[] = [
    {
      key: "name",
      title: "Food Item",
      render: (food: Food) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            {food?.images?.[0]?.image ? (
              <img src={food?.images?.[0]?.image} alt={food?.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Utensils className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium">{food?.name || "Unnamed"}</div>
            <div className="text-sm text-gray-500">{food?.description?.substring(0, 50)}...</div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      title: "Category",
      render: (food: Food) => (
        <Badge variant="outline">
          {food?.category_name || "Uncategorized"}
        </Badge>
      ),
    },
    {
      key: "price",
      title: "Price",
      render: (food: Food) => (
        <div className="font-medium">
          LKR {food?.price?.toFixed(2) || "0.00"}
        </div>
      ),
    },
    {
      key: "availability",
      title: "Status",
      render: (food: Food) => (
        <Badge 
          variant="outline" 
          className={`border-${getAvailabilityColor(food?.is_available)}-500 text-${getAvailabilityColor(food?.is_available)}-700`}
        >
          {food?.is_available ? "Available" : "Unavailable"}
        </Badge>
      ),
    },
    {
      key: "rating",
      title: "Rating",
      render: (food: Food) => (
        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <span className="text-sm">{food?.rating_average?.toFixed(1) || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (food: Food) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              setSelectedFood(food);
              setShowFoodDialog(true);
            }}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setSelectedFood(food);
              setShowFoodDialog(true);
            }}>
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
              onChange={(e) => setFoodFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <Select 
            value={foodFilters.category} 
            onValueChange={(value) => setFoodFilters(prev => ({ ...prev, category: value === "all" ? undefined : parseInt(value) }))}
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
            onValueChange={(value) => setFoodFilters(prev => ({ ...prev, availability: value }))}
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
          <Button onClick={createOptimizedClickHandler(loadFoods, { measurePerformance: true, label: 'Refresh Foods' })} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </GlassCard>

      {/* Foods Table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Food Items</h3>
          <div className="space-x-2">
            <Button onClick={() => setShowFoodDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Food
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <DataTable
          data={foods}
          columns={foodColumns}
          loading={foodLoading}
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
          value={offers.filter(o => new Date(o.valid_until) > new Date()).length}
          label="Active Offers"
          icon={CheckCircle}
          trend={8.7}
          gradient="green"
        />
        <AnimatedStats
          value={offers.filter(o => new Date(o.valid_until) < new Date()).length}
          label="Expired Offers"
          icon={XCircle}
          trend={-12.1}
          gradient="pink"
        />
        <AnimatedStats
          value={offers.reduce((avg, offer) => avg + (offer?.discount || 0), 0) / offers.length || 0}
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
                <TableCell>{new Date(offer.valid_until).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline"
                    className={`border-${getOfferStatusColor(offer.valid_until)}-500 text-${getOfferStatusColor(offer.valid_until)}-700`}
                  >
                    {new Date(offer.valid_until) > new Date() ? "Active" : "Expired"}
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
                          valid_until: offer.valid_until.split('T')[0],
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
            {referralTokens.map((token) => (
              <TableRow key={token.id}>
                <TableCell className="font-mono text-sm">{token.token}</TableCell>
                <TableCell>{token.uses}</TableCell>
                <TableCell>{token.max_uses || "Unlimited"}</TableCell>
                <TableCell>
                  {token.expires_at ? new Date(token.expires_at).toLocaleDateString() : "Never"}
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
                        const link = `${window.location.origin}/register?ref=${token.token}`;
                        window.open(link, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
            Content Management Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Complete food menu, promotional offers, and referral program management
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button onClick={() => {
            if (activeTab === "food") loadFoods();
            else if (activeTab === "offers") loadOffers();
            else if (activeTab === "referrals") loadReferralData();
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="food">Food Menu</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="food" className="mt-6">
          {renderFoodTab()}
        </TabsContent>
        
        <TabsContent value="offers" className="mt-6">
          {renderOffersTab()}
        </TabsContent>
        
        <TabsContent value="referrals" className="mt-6">
          {renderReferralsTab()}
        </TabsContent>
      </Tabs>

      {/* Food Dialog */}
      <Dialog open={showFoodDialog} onOpenChange={setShowFoodDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedFood ? "Edit Food Item" : "Add New Food Item"}
            </DialogTitle>
            <DialogDescription>
              {selectedFood ? "Update food item details" : "Create a new food item for the menu"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input placeholder="Enter food name" defaultValue={selectedFood?.name} />
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
                      <SelectItem key={category?.id} value={category?.id?.toString()}>
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
                      <SelectItem key={cuisine.id} value={cuisine.id.toString()}>
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
            <Button>
              {selectedFood ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Food Dialog */}
      <AlertDialog open={showDeleteFoodDialog} onOpenChange={setShowDeleteFoodDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Food Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedFood?.name}"? This action cannot be undone.
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

      {/* Create Offer Dialog */}
      <Dialog open={showCreateOfferDialog} onOpenChange={setShowCreateOfferDialog}>
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
                onChange={(e) => setOfferFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={offerFormData.discount}
                  onChange={(e) => setOfferFormData(prev => ({ ...prev, discount: e.target.value }))}
                />
              </div>
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={offerFormData.price}
                  onChange={(e) => setOfferFormData(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={offerFormData.valid_until}
                onChange={(e) => setOfferFormData(prev => ({ ...prev, valid_until: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateOfferDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOffer}>
              Create Offer
            </Button>
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
                onChange={(e) => setOfferFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={offerFormData.discount}
                  onChange={(e) => setOfferFormData(prev => ({ ...prev, discount: e.target.value }))}
                />
              </div>
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={offerFormData.price}
                  onChange={(e) => setOfferFormData(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={offerFormData.valid_until}
                onChange={(e) => setOfferFormData(prev => ({ ...prev, valid_until: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditOfferDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOffer}>
              Update Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Referral Token Dialog */}
      <Dialog open={showCreateTokenDialog} onOpenChange={setShowCreateTokenDialog}>
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
            <Button variant="outline" onClick={() => setShowCreateTokenDialog(false)}>
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
