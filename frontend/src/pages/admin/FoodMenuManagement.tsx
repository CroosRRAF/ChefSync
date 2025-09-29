import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  ChefHat,
  Clock,
  Download,
  Edit,
  Eye,
  ImageIcon,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Star,
  Tag,
  Trash2,
  Utensils,
  XCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Import shared components
import DynamicForm from "@/components/admin/shared/forms/DynamicForm";
import { ActionModal } from "@/components/admin/shared/modals";
import DataTable from "@/components/admin/shared/tables/DataTable";
import { StatsWidget as StatsCard } from "@/components/admin/shared/widgets/index";

// Import food service and types
import foodService, {
  type Cuisine,
  type Food,
  type FoodCategory,
  type FoodFilterParams,
} from "@/services/foodService";

/**
 * Food & Menu Management Page
 *
 * Features:
 * - Food items CRUD operations with real API integration
 * - Category management (create, edit, organize)
 * - Cuisine management and organization
 * - Inventory tracking and availability management
 * - Price management and bulk updates
 * - Nutritional information management
 * - Advanced filtering and search capabilities
 * - Bulk operations for efficiency
 */

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

const FoodMenuManagement: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<
    "foods" | "categories" | "cuisines"
  >("foods");
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Food management states
  const [selectedFoods, setSelectedFoods] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cuisineFilter, setCuisineFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");

  // Modal states
  const [showCreateFoodModal, setShowCreateFoodModal] = useState(false);
  const [showEditFoodModal, setShowEditFoodModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showCreateCuisineModal, setShowCreateCuisineModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    Food | FoodCategory | Cuisine | null
  >(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);

  // Statistics
  const [foodStats, setFoodStats] = useState<FoodStats>({
    totalFoods: 0,
    availableFoods: 0,
    featuredFoods: 0,
    totalCategories: 0,
    totalCuisines: 0,
    averageRating: 0,
    totalOrders: 0,
    averagePrice: 0,
  });

  // Calculate statistics
  const calculateStats = useCallback(
    (
      foodsList: Food[],
      categoriesList: FoodCategory[],
      cuisinesList: Cuisine[]
    ) => {
      const availableFoods = foodsList.filter((food) => food.is_available);
      const featuredFoods = foodsList.filter((food) => food.is_featured);
      const totalRating = foodsList.reduce(
        (sum, food) => sum + food.rating_average,
        0
      );
      const totalOrders = foodsList.reduce(
        (sum, food) => sum + food.total_orders,
        0
      );
      const totalPrice = foodsList.reduce((sum, food) => sum + food.price, 0);

      return {
        totalFoods: foodsList.length,
        availableFoods: availableFoods.length,
        featuredFoods: featuredFoods.length,
        totalCategories: categoriesList.length,
        totalCuisines: cuisinesList.length,
        averageRating:
          foodsList.length > 0 ? totalRating / foodsList.length : 0,
        totalOrders,
        averagePrice: foodsList.length > 0 ? totalPrice / foodsList.length : 0,
      };
    },
    []
  );

  // Load data based on active tab
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: FoodFilterParams = {
        page: currentPage,
        search: searchTerm || undefined,
        category:
          categoryFilter !== "all" ? parseInt(categoryFilter) : undefined,
        cuisine: cuisineFilter !== "all" ? parseInt(cuisineFilter) : undefined,
        is_available:
          availabilityFilter !== "all"
            ? availabilityFilter === "available"
            : undefined,
      };

      switch (activeTab) {
        case "foods": {
          const [foodData, categoriesData, cuisinesData] = await Promise.all([
            foodService.fetchFoods(params),
            foodService.fetchFoodCategories({}),
            foodService.fetchCuisines({}),
          ]);

          setFoods(foodData.results || []);
          setCategories(categoriesData.results || []);
          setCuisines(cuisinesData.results || []);
          setTotalPages(Math.ceil(foodData.count / itemsPerPage));
          setTotalItems(foodData.count);
          setFoodStats(
            calculateStats(
              foodData.results || [],
              categoriesData.results || [],
              cuisinesData.results || []
            )
          );
          break;
        }
        case "categories": {
          const categoryData = await foodService.fetchFoodCategories({
            page: currentPage,
            search: searchTerm || undefined,
          });
          setCategories(categoryData.results || []);
          setTotalPages(Math.ceil(categoryData.count / itemsPerPage));
          setTotalItems(categoryData.count);
          break;
        }
        case "cuisines": {
          const cuisineData = await foodService.fetchCuisines({
            page: currentPage,
            search: searchTerm || undefined,
          });
          setCuisines(cuisineData.results || []);
          setTotalPages(Math.ceil(cuisineData.count / itemsPerPage));
          setTotalItems(cuisineData.count);
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    currentPage,
    searchTerm,
    categoryFilter,
    cuisineFilter,
    availabilityFilter,
    itemsPerPage,
    calculateStats,
  ]);

  // Load data when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page when changing tabs or filters
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    searchTerm,
    categoryFilter,
    cuisineFilter,
    availabilityFilter,
  ]);

  // Food table columns
  const foodColumns = [
    {
      key: "name",
      label: "Food Item",
      render: (food: Food) => (
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
            {food.images && food.images.length > 0 ? (
              <img
                src={food.images[0].thumbnail || food.images[0].image}
                alt={food.name}
                className="h-12 w-12 object-cover rounded-lg"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {food.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {food.category_name}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (food: Food) => (
        <div className="text-sm">
          <div className="font-medium">${food.price}</div>
          {food.original_price && food.original_price !== food.price && (
            <div className="text-gray-500 line-through">
              ${food.original_price}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (food: Food) => (
        <div className="flex flex-col space-y-1">
          <Badge variant={food.is_available ? "default" : "secondary"}>
            {food.is_available ? "Available" : "Unavailable"}
          </Badge>
          {food.is_featured && (
            <Badge variant="outline" className="text-yellow-600">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "stats",
      label: "Stats",
      render: (food: Food) => (
        <div className="text-sm">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span>{food.rating_average.toFixed(1)}</span>
            <span className="text-gray-500 ml-1">({food.total_reviews})</span>
          </div>
          <div className="text-gray-500">{food.total_orders} orders</div>
        </div>
      ),
    },
    {
      key: "details",
      label: "Details",
      render: (food: Food) => (
        <div className="text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3" />
            <span>{food.preparation_time}min</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {food.is_vegetarian && (
              <Badge variant="outline" className="text-green-600 text-xs">
                Veg
              </Badge>
            )}
            {food.is_vegan && (
              <Badge variant="outline" className="text-green-700 text-xs">
                Vegan
              </Badge>
            )}
            {food.is_gluten_free && (
              <Badge variant="outline" className="text-blue-600 text-xs">
                GF
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (food: Food) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewItem(food)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditFood(food)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Food
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleToggleAvailability(food)}
              className={food.is_available ? "text-red-600" : "text-green-600"}
            >
              {food.is_available ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark Unavailable
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Available
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteFood(food)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Food
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Category table columns
  const categoryColumns = [
    {
      key: "name",
      label: "Category",
      render: (category: FoodCategory) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="h-10 w-10 object-cover rounded-lg"
              />
            ) : (
              <Tag className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {category.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {category.cuisine_name}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (category: FoodCategory) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {category.description || "No description"}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (category: FoodCategory) => (
        <Badge variant={category.is_active ? "default" : "secondary"}>
          {category.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (category: FoodCategory) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewItem(category)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditCategory(category)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Category
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteCategory(category)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Cuisine table columns
  const cuisineColumns = [
    {
      key: "name",
      label: "Cuisine",
      render: (cuisine: Cuisine) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
            {cuisine.image ? (
              <img
                src={cuisine.image}
                alt={cuisine.name}
                className="h-10 w-10 object-cover rounded-lg"
              />
            ) : (
              <ChefHat className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {cuisine.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (cuisine: Cuisine) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {cuisine.description || "No description"}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (cuisine: Cuisine) => (
        <Badge variant={cuisine.is_active ? "default" : "secondary"}>
          {cuisine.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (cuisine: Cuisine) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewItem(cuisine)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditCuisine(cuisine)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Cuisine
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteCuisine(cuisine)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Cuisine
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Event handlers
  const handleCreateFood = () => {
    setSelectedItem(null);
    setShowCreateFoodModal(true);
  };

  const handleEditFood = (food: Food) => {
    setSelectedItem(food);
    setShowEditFoodModal(true);
  };

  const handleViewItem = (item: Food | FoodCategory | Cuisine) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleEditCategory = (category: FoodCategory) => {
    setSelectedItem(category);
    setShowCreateCategoryModal(true);
  };

  const handleEditCuisine = (cuisine: Cuisine) => {
    setSelectedItem(cuisine);
    setShowCreateCuisineModal(true);
  };

  const handleToggleAvailability = async (food: Food) => {
    try {
      await foodService.bulkUpdateFoodAvailability(
        [food.id],
        !food.is_available
      );
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update availability"
      );
    }
  };

  const handleDeleteFood = async (food: Food) => {
    if (
      !confirm(
        `Are you sure you want to delete "${food.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await foodService.deleteFood(food.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete food");
    }
  };

  const handleDeleteCategory = async (category: FoodCategory) => {
    if (
      !confirm(
        `Are you sure you want to delete "${category.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await foodService.deleteFoodCategory(category.id);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete category"
      );
    }
  };

  const handleDeleteCuisine = async (cuisine: Cuisine) => {
    if (
      !confirm(
        `Are you sure you want to delete "${cuisine.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await foodService.deleteCuisine(cuisine.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete cuisine");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedFoods.length === 0) return;

    try {
      switch (action) {
        case "available":
          await foodService.bulkUpdateFoodAvailability(selectedFoods, true);
          break;
        case "unavailable":
          await foodService.bulkUpdateFoodAvailability(selectedFoods, false);
          break;
        case "delete":
          if (
            !confirm(
              `Are you sure you want to delete ${selectedFoods.length} food items? This action cannot be undone.`
            )
          ) {
            return;
          }
          await foodService.bulkDeleteFoods(selectedFoods);
          break;
      }

      setSelectedFoods([]);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${action} foods`
      );
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      const formData = new FormData();

      // Add form fields to FormData
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) {
          if (Array.isArray(data[key])) {
            formData.append(key, JSON.stringify(data[key]));
          } else {
            formData.append(key, data[key]);
          }
        }
      });

      if (activeTab === "foods") {
        if (selectedItem && "price" in selectedItem) {
          // Update existing food
          await foodService.updateFood(selectedItem.id, formData);
        } else {
          // Create new food
          await foodService.createFood(formData);
        }
      } else if (activeTab === "categories") {
        if (selectedItem && "cuisine" in selectedItem) {
          // Update existing category
          await foodService.updateFoodCategory(selectedItem.id, formData);
        } else {
          // Create new category
          await foodService.createFoodCategory(formData);
        }
      } else if (activeTab === "cuisines") {
        if (selectedItem && "sort_order" in selectedItem) {
          // Update existing cuisine
          await foodService.updateCuisine(selectedItem.id, formData);
        } else {
          // Create new cuisine
          await foodService.createCuisine(formData);
        }
      }

      // Close modals and refresh data
      setShowCreateFoodModal(false);
      setShowEditFoodModal(false);
      setShowCreateCategoryModal(false);
      setShowCreateCuisineModal(false);
      setSelectedItem(null);

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item");
    }
  };

  // Form field configurations
  const foodFormFields = [
    {
      name: "name",
      label: "Food Name",
      type: "text",
      placeholder: "Enter food name",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Describe the food item",
      required: true,
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: categories.map((cat) => ({
        label: cat.name,
        value: cat.id.toString(),
      })),
      required: true,
    },
    {
      name: "price",
      label: "Price",
      type: "number",
      placeholder: "0.00",
      required: true,
    },
    {
      name: "preparation_time",
      label: "Preparation Time (minutes)",
      type: "number",
      placeholder: "30",
      required: true,
    },
    {
      name: "is_available",
      label: "Available",
      type: "switch",
      defaultValue: true,
    },
    {
      name: "is_featured",
      label: "Featured",
      type: "switch",
      defaultValue: false,
    },
    {
      name: "is_vegetarian",
      label: "Vegetarian",
      type: "switch",
      defaultValue: false,
    },
    {
      name: "is_vegan",
      label: "Vegan",
      type: "switch",
      defaultValue: false,
    },
    {
      name: "is_gluten_free",
      label: "Gluten Free",
      type: "switch",
      defaultValue: false,
    },
  ];

  const categoryFormFields = [
    {
      name: "name",
      label: "Category Name",
      type: "text",
      placeholder: "Enter category name",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Describe the category",
    },
    {
      name: "cuisine",
      label: "Cuisine",
      type: "select",
      options: cuisines.map((cuisine) => ({
        label: cuisine.name,
        value: cuisine.id.toString(),
      })),
      required: true,
    },
    {
      name: "is_active",
      label: "Active",
      type: "switch",
      defaultValue: true,
    },
  ];

  const cuisineFormFields = [
    {
      name: "name",
      label: "Cuisine Name",
      type: "text",
      placeholder: "Enter cuisine name",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Describe the cuisine",
    },
    {
      name: "is_active",
      label: "Active",
      type: "switch",
      defaultValue: true,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 text-sm underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Food & Menu Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage food items, categories, cuisines, and inventory across your
            platform
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Foods"
          value={foodStats.totalFoods}
          subtitle={`${foodStats.availableFoods} available`}
          icon={Utensils}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Categories"
          value={foodStats.totalCategories}
          subtitle="food categories"
          icon={Tag}
          trend={{ value: 3, isPositive: true }}
        />
        <StatsCard
          title="Average Rating"
          value={foodStats.averageRating.toFixed(1)}
          subtitle="customer rating"
          icon={Star}
          trend={{ value: 0.2, isPositive: true }}
        />
        <StatsCard
          title="Total Orders"
          value={foodStats.totalOrders}
          subtitle="all time orders"
          icon={Package}
          trend={{ value: 25, isPositive: true }}
        />
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Food Management</CardTitle>
            <div className="flex items-center space-x-2">
              {activeTab === "foods" && (
                <Button onClick={handleCreateFood}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Food
                </Button>
              )}
              {activeTab === "categories" && (
                <Button onClick={() => setShowCreateCategoryModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              )}
              {activeTab === "cuisines" && (
                <Button onClick={() => setShowCreateCuisineModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cuisine
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "foods" | "categories" | "cuisines")
            }
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="foods">
                Food Items ({foodStats.totalFoods})
              </TabsTrigger>
              <TabsTrigger value="categories">
                Categories ({foodStats.totalCategories})
              </TabsTrigger>
              <TabsTrigger value="cuisines">
                Cuisines ({foodStats.totalCuisines})
              </TabsTrigger>
            </TabsList>

            {/* Foods Tab */}
            <TabsContent value="foods" className="space-y-4">
              {/* Food Filters */}
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Search foods..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={availabilityFilter}
                  onValueChange={setAvailabilityFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DataTable
                data={foods}
                columns={foodColumns}
                loading={loading}
                selectable
                selectedRows={selectedFoods}
                onSelectionChange={setSelectedFoods}
                pagination={{
                  currentPage,
                  totalPages,
                  onPageChange: setCurrentPage,
                }}
                bulkActions={[
                  {
                    label: "Mark Available",
                    action: () => handleBulkAction("available"),
                    icon: CheckCircle,
                  },
                  {
                    label: "Mark Unavailable",
                    action: () => handleBulkAction("unavailable"),
                    icon: XCircle,
                  },
                  {
                    label: "Delete Selected",
                    action: () => handleBulkAction("delete"),
                    icon: Trash2,
                    variant: "destructive",
                  },
                ]}
              />
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-4">
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>

              <DataTable
                data={categories}
                columns={categoryColumns}
                loading={loading}
                pagination={{
                  currentPage,
                  totalPages,
                  onPageChange: setCurrentPage,
                }}
              />
            </TabsContent>

            {/* Cuisines Tab */}
            <TabsContent value="cuisines" className="space-y-4">
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Search cuisines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>

              <DataTable
                data={cuisines}
                columns={cuisineColumns}
                loading={loading}
                pagination={{
                  currentPage,
                  totalPages,
                  onPageChange: setCurrentPage,
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create/Edit Food Modal */}
      <ActionModal
        open={showCreateFoodModal || showEditFoodModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateFoodModal(false);
            setShowEditFoodModal(false);
            setSelectedItem(null);
          }
        }}
        title={selectedItem ? "Edit Food Item" : "Create Food Item"}
        description={
          selectedItem
            ? "Update food item details"
            : "Add a new food item to your menu"
        }
      >
        <DynamicForm
          fields={foodFormFields}
          initialValues={
            selectedItem && "price" in selectedItem ? selectedItem : undefined
          }
          onSubmit={handleFormSubmit}
          submitLabel={selectedItem ? "Update Food" : "Create Food"}
          cancelLabel="Cancel"
          onCancel={() => {
            setShowCreateFoodModal(false);
            setShowEditFoodModal(false);
            setSelectedItem(null);
          }}
        />
      </ActionModal>

      {/* Create/Edit Category Modal */}
      <ActionModal
        open={showCreateCategoryModal}
        onOpenChange={setShowCreateCategoryModal}
        title={
          selectedItem && "cuisine" in selectedItem
            ? "Edit Category"
            : "Create Category"
        }
        description={
          selectedItem ? "Update category details" : "Add a new food category"
        }
      >
        <DynamicForm
          fields={categoryFormFields}
          initialValues={
            selectedItem && "cuisine" in selectedItem ? selectedItem : undefined
          }
          onSubmit={handleFormSubmit}
          submitLabel={selectedItem ? "Update Category" : "Create Category"}
          cancelLabel="Cancel"
          onCancel={() => {
            setShowCreateCategoryModal(false);
            setSelectedItem(null);
          }}
        />
      </ActionModal>

      {/* Create/Edit Cuisine Modal */}
      <ActionModal
        open={showCreateCuisineModal}
        onOpenChange={setShowCreateCuisineModal}
        title={
          selectedItem && "sort_order" in selectedItem
            ? "Edit Cuisine"
            : "Create Cuisine"
        }
        description={
          selectedItem ? "Update cuisine details" : "Add a new cuisine type"
        }
      >
        <DynamicForm
          fields={cuisineFormFields}
          initialValues={
            selectedItem && "sort_order" in selectedItem
              ? selectedItem
              : undefined
          }
          onSubmit={handleFormSubmit}
          submitLabel={selectedItem ? "Update Cuisine" : "Create Cuisine"}
          cancelLabel="Cancel"
          onCancel={() => {
            setShowCreateCuisineModal(false);
            setSelectedItem(null);
          }}
        />
      </ActionModal>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedItem && "price" in selectedItem
                ? "Food Details"
                : selectedItem && "cuisine" in selectedItem
                ? "Category Details"
                : "Cuisine Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-gray-600">{selectedItem.name}</p>
                </div>
                {selectedItem.description && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-gray-600">
                      {selectedItem.description}
                    </p>
                  </div>
                )}
                {"price" in selectedItem && (
                  <>
                    <div>
                      <Label className="text-sm font-medium">Price</Label>
                      <p className="text-sm text-gray-600">
                        ${selectedItem.price}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Preparation Time
                      </Label>
                      <p className="text-sm text-gray-600">
                        {selectedItem.preparation_time} minutes
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Rating</Label>
                      <p className="text-sm text-gray-600">
                        {selectedItem.rating_average.toFixed(1)} (
                        {selectedItem.total_reviews} reviews)
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Total Orders
                      </Label>
                      <p className="text-sm text-gray-600">
                        {selectedItem.total_orders}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodMenuManagement;
