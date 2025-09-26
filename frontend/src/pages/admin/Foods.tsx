import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuLabel,
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
import {
  createAdminFood,
  fetchAdminFoods,
  fetchCuisines,
  fetchFood,
  fetchFoodCategories,
  updateAdminFood,
} from "@/services/foodService";
import { Cuisine, Food, FoodCategory } from "@/types/food";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Info,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const FoodManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("foods");
  const [foods, setFoods] = useState<Food[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [showCuisineForm, setShowCuisineForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  // Form states
  const [foodFormData, setFoodFormData] = useState({
    name: "",
    description: "",
    category: "",
    cuisine: "",
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    is_available: true,
    preparation_time: "",
    calories_per_serving: "",
    allergens: "",
  });
  const [cuisineFormData, setCuisineFormData] = useState({
    name: "",
    description: "",
    image: null as File | null,
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    cuisine: "",
    image: null as File | null,
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview and detail view states
  const [showFoodDetail, setShowFoodDetail] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [foodDetailLoading, setFoodDetailLoading] = useState(false);
  const [foodDetails, setFoodDetails] = useState<Food | null>(null);

  // Cuisine and category preview states
  const [showCuisineDetail, setShowCuisineDetail] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine | null>(null);
  const [showCategoryDetail, setShowCategoryDetail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(
    null
  );

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [activeTab, currentPage, searchTerm]);

  // Update form data when categories/cuisines are loaded and we're editing
  useEffect(() => {
    if (
      editItem &&
      activeTab === "foods" &&
      categories.length > 0 &&
      cuisines.length > 0
    ) {
      // Enhanced category ID detection with multiple fallback methods
      let categoryId = "";

      // Method 1: Direct category field
      if (editItem.category) {
        categoryId = editItem.category.toString();
      }
      // Method 2: Via food_category object
      else if (editItem.food_category?.id) {
        categoryId = editItem.food_category.id.toString();
      }
      // Method 3: Find by category name
      else if (editItem.category_name) {
        const foundCategory = categories.find(
          (cat) => cat.name === editItem.category_name
        );
        if (foundCategory) {
          categoryId = foundCategory.id.toString();
        }
      }

      // Enhanced cuisine ID detection with multiple fallback methods
      let cuisineId = "";

      // Method 1: Via category relationship
      if (categoryId) {
        const categoryObj = categories.find(
          (cat) => cat.id.toString() === categoryId
        );
        if (categoryObj?.cuisine) {
          cuisineId = categoryObj.cuisine.toString();
        }
      }

      // Method 2: Via food_category.cuisine
      if (!cuisineId && editItem.food_category?.cuisine) {
        if (
          typeof editItem.food_category.cuisine === "object" &&
          editItem.food_category.cuisine.id
        ) {
          cuisineId = editItem.food_category.cuisine.id.toString();
        } else {
          cuisineId = editItem.food_category.cuisine.toString();
        }
      }

      // Method 3: Find by cuisine name
      if (!cuisineId && editItem.cuisine_name) {
        const foundCuisine = cuisines.find(
          (cuisine) => cuisine.name === editItem.cuisine_name
        );
        if (foundCuisine) {
          cuisineId = foundCuisine.id.toString();
        }
      }

      console.log("Form data update - editItem:", editItem);
      console.log(
        "Form data update - categoryId:",
        categoryId,
        "cuisineId:",
        cuisineId
      );
      console.log(
        "Form data update - categories available:",
        categories.length
      );

      // Re-populate form data with proper values now that categories/cuisines are loaded
      const formData = {
        name: editItem.name || "",
        description: editItem.description || "",
        category: categoryId,
        cuisine: cuisineId,
        is_vegetarian: editItem.is_vegetarian || false,
        is_vegan: editItem.is_vegan || false,
        is_gluten_free: editItem.is_gluten_free || false,
        is_available: editItem.is_available !== false,
        preparation_time: editItem.preparation_time?.toString() || "",
        calories_per_serving: editItem.calories_per_serving?.toString() || "",
        allergens: Array.isArray(editItem.allergens)
          ? editItem.allergens.join(", ")
          : editItem.allergens || "",
      };

      console.log(
        "Updating form data after categories/cuisines loaded:",
        formData
      );
      setFoodFormData(formData);
    }
  }, [categories, cuisines, editItem, activeTab]);

  // Filter categories based on selected cuisine
  const filteredCategories = categories.filter(
    (category) =>
      !foodFormData.cuisine ||
      category.cuisine?.toString() === foodFormData.cuisine
  );

  // Handle cuisine change - clear category if it doesn't belong to new cuisine
  const handleCuisineChange = (cuisineId: string) => {
    const newCuisine = cuisines.find((c) => c.id.toString() === cuisineId);
    const currentCategory = categories.find(
      (c) => c.id.toString() === foodFormData.category
    );

    // If current category doesn't belong to the new cuisine, clear it
    if (currentCategory && currentCategory.cuisine?.toString() !== cuisineId) {
      setFoodFormData({
        ...foodFormData,
        cuisine: cuisineId,
        category: "", // Clear category if it doesn't belong to new cuisine
      });
    } else {
      setFoodFormData({
        ...foodFormData,
        cuisine: cuisineId,
      });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "foods":
          const foodData = await fetchAdminFoods({
            page: currentPage,
            search: searchTerm,
          });
          setFoods(foodData.results || []);
          setTotalPages(Math.ceil(foodData.count / 10));
          break;
        case "cuisines":
          const cuisineData = await fetchCuisines({
            page: currentPage,
            search: searchTerm,
          });
          setCuisines(cuisineData.results || []);
          setTotalPages(Math.ceil(cuisineData.count / 10));
          break;
        case "categories":
          const categoryData = await fetchFoodCategories({
            page: currentPage,
            search: searchTerm,
          });
          setCategories(categoryData.results || []);
          setTotalPages(Math.ceil(categoryData.count / 10));
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesAndCuisines = async () => {
    try {
      // Load categories if not already loaded
      if (categories.length === 0) {
        const categoryData = await fetchFoodCategories({ page: 1, search: "" });
        setCategories(categoryData.results || []);
      }

      // Load cuisines if not already loaded
      if (cuisines.length === 0) {
        const cuisineData = await fetchCuisines({ page: 1, search: "" });
        setCuisines(cuisineData.results || []);
      }
    } catch (error) {
      console.error("Error loading categories and cuisines:", error);
      toast({
        title: "Error",
        description:
          "Failed to load categories and cuisines. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddNew = () => {
    setEditItem(null);
    setFormErrors({});

    // Reset form data
    setFoodFormData({
      name: "",
      description: "",
      category: "",
      cuisine: "",
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      is_available: true,
      preparation_time: "",
      calories_per_serving: "",
      allergens: "",
    });
    setCuisineFormData({
      name: "",
      description: "",
      image: null,
    });
    setCategoryFormData({
      name: "",
      description: "",
      cuisine: "",
      image: null,
    });

    switch (activeTab) {
      case "foods":
        // Always load categories and cuisines when creating new food items
        loadCategoriesAndCuisines().then(() => {
          setShowFoodForm(true);
        });
        break;
      case "cuisines":
        setShowCuisineForm(true);
        break;
      case "categories":
        // Load cuisines for category creation
        if (cuisines.length === 0) {
          fetchCuisines({ page: 1, search: "" }).then((data) => {
            setCuisines(data.results || []);
            setShowCategoryForm(true);
          });
        } else {
          setShowCategoryForm(true);
        }
        break;
    }
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setFormErrors({}); // Clear any existing errors

    switch (activeTab) {
      case "foods":
        // Load categories and cuisines if not already loaded, then set form data
        if (categories.length === 0 || cuisines.length === 0) {
          // Load data first, then form will be populated via useEffect
          loadCategoriesAndCuisines().then(() => {
            setShowFoodForm(true);
          });
        } else {
          // Data is already loaded, set form data immediately
          console.log("🔍 DEBUG: Editing food item:", item);
          console.log("🔍 DEBUG: Available categories:", categories);
          console.log("🔍 DEBUG: Available cuisines:", cuisines);

          // Try multiple ways to get category ID
          let categoryId = "";

          // Method 1: Direct category field (number)
          if (item.category) {
            categoryId = item.category.toString();
            console.log("🔍 Found category ID via item.category:", categoryId);
          }

          // Method 2: Via food_category object
          else if (item.food_category?.id) {
            categoryId = item.food_category.id.toString();
            console.log(
              "🔍 Found category ID via item.food_category.id:",
              categoryId
            );
          }

          // Method 3: Find category by name
          else if (item.category_name) {
            const foundCategory = categories.find(
              (cat) => cat.name === item.category_name
            );
            if (foundCategory) {
              categoryId = foundCategory.id.toString();
              console.log(
                "🔍 Found category ID via name matching:",
                categoryId,
                "for name:",
                item.category_name
              );
            }
          }

          // Try multiple ways to get cuisine ID
          let cuisineId = "";

          // Method 1: Find cuisine via category relationship
          if (categoryId) {
            const categoryObj = categories.find(
              (cat) => cat.id.toString() === categoryId
            );
            if (categoryObj?.cuisine) {
              cuisineId = categoryObj.cuisine.toString();
              console.log(
                "🔍 Found cuisine ID via category relationship:",
                cuisineId
              );
            }
          }

          // Method 2: Via food_category.cuisine
          if (!cuisineId && item.food_category?.cuisine) {
            if (
              typeof item.food_category.cuisine === "object" &&
              item.food_category.cuisine.id
            ) {
              cuisineId = item.food_category.cuisine.id.toString();
            } else {
              cuisineId = item.food_category.cuisine.toString();
            }
            console.log(
              "🔍 Found cuisine ID via item.food_category.cuisine:",
              cuisineId
            );
          }

          // Method 3: Find cuisine by name
          if (!cuisineId && item.cuisine_name) {
            const foundCuisine = cuisines.find(
              (cuisine) => cuisine.name === item.cuisine_name
            );
            if (foundCuisine) {
              cuisineId = foundCuisine.id.toString();
              console.log(
                "🔍 Found cuisine ID via name matching:",
                cuisineId,
                "for name:",
                item.cuisine_name
              );
            }
          }

          const formData = {
            name: item.name || "",
            description: item.description || "",
            category: categoryId,
            cuisine: cuisineId,
            is_vegetarian: item.is_vegetarian || false,
            is_vegan: item.is_vegan || false,
            is_gluten_free: item.is_gluten_free || false,
            is_available: item.is_available !== false,
            preparation_time: item.preparation_time?.toString() || "",
            calories_per_serving: item.calories_per_serving?.toString() || "",
            allergens: Array.isArray(item.allergens)
              ? item.allergens.join(", ")
              : item.allergens || "",
          };

          console.log("✅ Final form data being set:", formData);
          console.log(
            "📊 Form will show - Category:",
            categoryId
              ? categories.find((c) => c.id.toString() === categoryId)?.name
              : "NOT FOUND"
          );
          console.log(
            "📊 Form will show - Cuisine:",
            cuisineId
              ? cuisines.find((c) => c.id.toString() === cuisineId)?.name
              : "NOT FOUND"
          );

          setFoodFormData(formData);
          setShowFoodForm(true);
        }
        break;
      case "cuisines":
        setCuisineFormData({
          name: item.name || "",
          description: item.description || "",
          image: null,
        });
        setShowCuisineForm(true);
        break;
      case "categories":
        setCategoryFormData({
          name: item.name || "",
          description: item.description || "",
          cuisine: item.cuisine?.id?.toString() || "",
          image: null,
        });
        setShowCategoryForm(true);
        break;
    }
  };

  const validateFoodForm = () => {
    const errors: any = {};

    if (!foodFormData.name.trim()) {
      errors.name = "Food name is required";
    }
    if (!foodFormData.description.trim()) {
      errors.description = "Description is required";
    }

    // Always validate category and cuisine for both new and existing items
    if (!foodFormData.category) {
      errors.category = "Category is required";
    }
    if (!foodFormData.cuisine) {
      errors.cuisine = "Cuisine is required";
    }

    if (
      foodFormData.preparation_time &&
      isNaN(Number(foodFormData.preparation_time))
    ) {
      errors.preparation_time = "Preparation time must be a number";
    }
    if (
      foodFormData.calories_per_serving &&
      isNaN(Number(foodFormData.calories_per_serving))
    ) {
      errors.calories_per_serving = "Calories must be a number";
    }

    console.log("Validation errors:", errors);
    console.log("Form data being validated:", foodFormData);

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCuisineForm = () => {
    const errors: any = {};

    if (!cuisineFormData.name.trim()) {
      errors.name = "Cuisine name is required";
    }
    if (!cuisineFormData.description.trim()) {
      errors.description = "Description is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCategoryForm = () => {
    const errors: any = {};

    if (!categoryFormData.name.trim()) {
      errors.name = "Category name is required";
    }
    if (!categoryFormData.description.trim()) {
      errors.description = "Description is required";
    }
    if (!categoryFormData.cuisine) {
      errors.cuisine = "Cuisine is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (activeTab === "foods" && validateFoodForm()) {
        // Handle food form submission
        const foodData = {
          name: foodFormData.name,
          description: foodFormData.description,
          food_category: parseInt(foodFormData.category),
          is_vegetarian: foodFormData.is_vegetarian,
          is_vegan: foodFormData.is_vegan,
          is_gluten_free: foodFormData.is_gluten_free,
          is_available: foodFormData.is_available,
          preparation_time: foodFormData.preparation_time
            ? parseInt(foodFormData.preparation_time)
            : null,
          calories_per_serving: foodFormData.calories_per_serving
            ? parseInt(foodFormData.calories_per_serving)
            : null,
          allergens: foodFormData.allergens
            ? foodFormData.allergens.split(",").map((a) => a.trim())
            : [],
        };

        let result;
        if (editItem) {
          // Update existing food using admin service
          result = await updateAdminFood(editItem.id, foodData);
        } else {
          // Create new food using admin service
          result = await createAdminFood(foodData);
        }

        toast({
          title: "Success",
          description: `Food item ${
            editItem ? "updated" : "created"
          } successfully`,
        });

        // Reset form and close dialog
        setShowFoodForm(false);
        setEditItem(null);
        setFormErrors({});
        setFoodFormData({
          name: "",
          description: "",
          category: "",
          cuisine: "",
          is_vegetarian: false,
          is_vegan: false,
          is_gluten_free: false,
          is_available: true,
          preparation_time: "",
          calories_per_serving: "",
          allergens: "",
        });
        loadData();
      } else if (activeTab === "cuisines" && validateCuisineForm()) {
        // Handle cuisine form submission
        const cuisineData = {
          name: cuisineFormData.name,
          description: cuisineFormData.description,
        };

        let response;
        if (editItem) {
          response = await fetch(`/api/food/cuisines/${editItem.id}/`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(cuisineData),
          });
        } else {
          response = await fetch("/api/food/cuisines/", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(cuisineData),
          });
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to save cuisine");
        }

        toast({
          title: "Success",
          description: `Cuisine ${
            editItem ? "updated" : "created"
          } successfully`,
        });

        // Reset form and close dialog
        setShowCuisineForm(false);
        setEditItem(null);
        setFormErrors({});
        setCuisineFormData({
          name: "",
          description: "",
          image: null,
        });
        loadData();
      } else if (activeTab === "categories" && validateCategoryForm()) {
        // Handle category form submission
        const categoryData = {
          name: categoryFormData.name,
          description: categoryFormData.description,
          cuisine: parseInt(categoryFormData.cuisine),
        };

        let response;
        if (editItem) {
          response = await fetch(`/api/food/categories/${editItem.id}/`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(categoryData),
          });
        } else {
          response = await fetch("/api/food/categories/", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(categoryData),
          });
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to save category");
        }

        toast({
          title: "Success",
          description: `Category ${
            editItem ? "updated" : "created"
          } successfully`,
        });

        // Reset form and close dialog
        setShowCategoryForm(false);
        setEditItem(null);
        setFormErrors({});
        setCategoryFormData({
          name: "",
          description: "",
          cuisine: "",
          image: null,
        });
        loadData();
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Quick action functions for toggling availability
  const toggleFoodAvailability = async (food: Food) => {
    try {
      const newStatus = !food.is_available;
      await updateAdminFood(food.id, { is_available: newStatus });

      // Update the local foods array
      setFoods((prevFoods) =>
        prevFoods.map((f) =>
          f.id === food.id ? { ...f, is_available: newStatus } : f
        )
      );

      toast({
        title: "Success",
        description: `${food.name} is now ${
          newStatus ? "available" : "unavailable"
        }`,
      });
    } catch (error) {
      console.error("Error toggling food availability:", error);
      toast({
        title: "Error",
        description: "Failed to update food availability",
        variant: "destructive",
      });
    }
  };

  const toggleCuisineAvailability = async (cuisine: Cuisine) => {
    try {
      const newStatus = !cuisine.is_active;
      const response = await fetch(`/api/food/cuisines/${cuisine.id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update cuisine");
      }

      // Update the local cuisines array
      setCuisines((prevCuisines) =>
        prevCuisines.map((c) =>
          c.id === cuisine.id ? { ...c, is_active: newStatus } : c
        )
      );

      toast({
        title: "Success",
        description: `${cuisine.name} is now ${
          newStatus ? "active" : "inactive"
        }`,
      });
    } catch (error) {
      console.error("Error toggling cuisine availability:", error);
      toast({
        title: "Error",
        description: "Failed to update cuisine status",
        variant: "destructive",
      });
    }
  };

  const toggleCategoryAvailability = async (category: FoodCategory) => {
    try {
      const newStatus = !category.is_active;
      const response = await fetch(`/api/food/categories/${category.id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      // Update the local categories array
      setCategories((prevCategories) =>
        prevCategories.map((c) =>
          c.id === category.id ? { ...c, is_active: newStatus } : c
        )
      );

      toast({
        title: "Success",
        description: `${category.name} is now ${
          newStatus ? "active" : "inactive"
        }`,
      });
    } catch (error) {
      console.error("Error toggling category availability:", error);
      toast({
        title: "Error",
        description: "Failed to update category status",
        variant: "destructive",
      });
    }
  };

  // Handle food detail view
  const handleFoodDetail = async (food: Food) => {
    try {
      setSelectedFood(food);
      setFoodDetailLoading(true);
      setShowFoodDetail(true);
      setFoodDetails(null); // Reset details while loading

      const details = await fetchFood(food.id);
      setFoodDetails(details);
    } catch (err) {
      console.error("Failed to fetch food details:", err);
      toast({
        title: "Error",
        description: "Failed to fetch food details",
        variant: "destructive",
      });
      setFoodDetails(null); // Ensure foodDetails is null on error
    } finally {
      setFoodDetailLoading(false);
    }
  };

  // Handle cuisine detail view
  const handleCuisineDetail = (cuisine: Cuisine) => {
    setSelectedCuisine(cuisine);
    setShowCuisineDetail(true);
  };

  // Handle category detail view
  const handleCategoryDetail = (category: FoodCategory) => {
    setSelectedCategory(category);
    setShowCategoryDetail(true);
  };

  const renderFoodsTable = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox />
            </TableHead>
            <TableHead className="min-w-[150px]">
              <div className="flex items-center space-x-1">
                <span>Name</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Cuisine</TableHead>
            <TableHead>
              <div className="flex items-center space-x-1">
                <span>Status</span>
                <ChevronDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                <span className="mt-2 block">Loading data...</span>
              </TableCell>
            </TableRow>
          ) : foods.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <p className="text-muted-foreground">No food items found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleAddNew}
                >
                  Add your first food item
                </Button>
              </TableCell>
            </TableRow>
          ) : (
            foods.map((food) => (
              <TableRow key={food.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => handleFoodDetail(food)}
                  >
                    {food.name}
                  </Button>
                </TableCell>
                <TableCell>{food.category_name || "Uncategorized"}</TableCell>
                <TableCell>{food.cuisine_name || "N/A"}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={food.is_available ? "default" : "destructive"}
                    >
                      {food.is_available ? "Available" : "Unavailable"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFoodAvailability(food)}
                      className="h-6 px-2 text-xs"
                    >
                      {food.is_available ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFoodDetail(food)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(food)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleFoodDetail(food)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            // Delete functionality will be implemented
                            toast({
                              title: "Confirm deletion",
                              description: `Are you sure you want to delete ${food.name}?`,
                            });
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderCuisinesTable = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox />
            </TableHead>
            <TableHead className="min-w-[200px]">
              <div className="flex items-center space-x-1">
                <span>Name</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                <span className="mt-2 block">Loading data...</span>
              </TableCell>
            </TableRow>
          ) : cuisines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <p className="text-muted-foreground">No cuisines found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleAddNew}
                >
                  Add your first cuisine
                </Button>
              </TableCell>
            </TableRow>
          ) : (
            cuisines.map((cuisine) => (
              <TableRow key={cuisine.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => handleCuisineDetail(cuisine)}
                  >
                    {cuisine.name}
                  </Button>
                </TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {cuisine.description || "No description"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={cuisine.is_active ? "default" : "destructive"}
                    >
                      {cuisine.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCuisineAvailability(cuisine)}
                      className="h-6 px-2 text-xs"
                    >
                      {cuisine.is_active ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCuisineDetail(cuisine)}
                      title="View Cuisine Details"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(cuisine)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCuisineDetail(cuisine)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            // Delete functionality
                            toast({
                              title: "Confirm deletion",
                              description: `Are you sure you want to delete ${cuisine.name}?`,
                            });
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderCategoriesTable = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox />
            </TableHead>
            <TableHead className="min-w-[200px]">
              <div className="flex items-center space-x-1">
                <span>Name</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>Cuisine</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                <span className="mt-2 block">Loading data...</span>
              </TableCell>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <p className="text-muted-foreground">No categories found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleAddNew}
                >
                  Add your first category
                </Button>
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => handleCategoryDetail(category)}
                  >
                    {category.name}
                  </Button>
                </TableCell>
                <TableCell>{category.cuisine_name || "N/A"}</TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {category.description || "No description"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={category.is_active ? "default" : "destructive"}
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCategoryAvailability(category)}
                      className="h-6 px-2 text-xs"
                    >
                      {category.is_active ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCategoryDetail(category)}
                      title="View Category Details"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(category)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCategoryDetail(category)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            // Delete functionality
                            toast({
                              title: "Confirm deletion",
                              description: `Are you sure you want to delete ${category.name}?`,
                            });
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Food Management</h2>
          <p className="text-muted-foreground">
            Manage cuisines, categories, and food items in your restaurant
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <TabsList className="mb-4 md:mb-0">
            <TabsTrigger value="foods">Food Items</TabsTrigger>
            <TabsTrigger value="cuisines">Cuisines</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
          </div>
        </div>

        <TabsContent value="foods" className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle>Food Items</CardTitle>
              <CardDescription>
                Manage all food items available in your restaurant
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">{renderFoodsTable()}</CardContent>
            <CardFooter className="flex items-center justify-between p-4">
              <div className="text-sm text-muted-foreground">
                {foods.length > 0 &&
                  `Showing ${foods.length} of ${
                    foods.length * totalPages
                  } items`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    currentPage > 1 && setCurrentPage(currentPage - 1)
                  }
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    currentPage < totalPages && setCurrentPage(currentPage + 1)
                  }
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="cuisines" className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle>Cuisines</CardTitle>
              <CardDescription>
                Manage different types of cuisines
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">{renderCuisinesTable()}</CardContent>
            <CardFooter className="flex items-center justify-between p-4">
              <div className="text-sm text-muted-foreground">
                {cuisines.length > 0 &&
                  `Showing ${cuisines.length} of ${
                    cuisines.length * totalPages
                  } items`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    currentPage > 1 && setCurrentPage(currentPage - 1)
                  }
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    currentPage < totalPages && setCurrentPage(currentPage + 1)
                  }
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle>Food Categories</CardTitle>
              <CardDescription>
                Manage food categories within cuisines
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">{renderCategoriesTable()}</CardContent>
            <CardFooter className="flex items-center justify-between p-4">
              <div className="text-sm text-muted-foreground">
                {categories.length > 0 &&
                  `Showing ${categories.length} of ${
                    categories.length * totalPages
                  } items`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    currentPage > 1 && setCurrentPage(currentPage - 1)
                  }
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    currentPage < totalPages && setCurrentPage(currentPage + 1)
                  }
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Food Form Dialog */}
      <Dialog open={showFoodForm} onOpenChange={setShowFoodForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogTitle>
            {editItem ? "Edit Food Item" : "Add New Food Item"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details to {editItem ? "update" : "create"} a food item.
            Note: Chefs will set their own prices for this food item.
          </DialogDescription>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="food-name">Food Name *</Label>
                <Input
                  id="food-name"
                  value={foodFormData.name}
                  onChange={(e) =>
                    setFoodFormData({ ...foodFormData, name: e.target.value })
                  }
                  placeholder="Enter food name"
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="food-category">Category *</Label>
                <Select
                  value={foodFormData.category}
                  onValueChange={(value) =>
                    setFoodFormData({ ...foodFormData, category: value })
                  }
                >
                  <SelectTrigger
                    className={formErrors.category ? "border-red-500" : ""}
                  >
                    <SelectValue
                      placeholder={
                        foodFormData.category
                          ? categories.find(
                              (c) => c.id.toString() === foodFormData.category
                            )?.name || "Select category"
                          : "Select category"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p className="text-sm text-red-500">{formErrors.category}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="food-description">Description *</Label>
              <Textarea
                id="food-description"
                value={foodFormData.description}
                onChange={(e) =>
                  setFoodFormData({
                    ...foodFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the food item"
                className={formErrors.description ? "border-red-500" : ""}
                rows={3}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="food-cuisine">Cuisine *</Label>
                <Select
                  value={foodFormData.cuisine}
                  onValueChange={handleCuisineChange}
                >
                  <SelectTrigger
                    className={formErrors.cuisine ? "border-red-500" : ""}
                  >
                    <SelectValue
                      placeholder={
                        foodFormData.cuisine
                          ? cuisines.find(
                              (c) => c.id.toString() === foodFormData.cuisine
                            )?.name || "Select cuisine"
                          : "Select cuisine"
                      }
                    />
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
                {formErrors.cuisine && (
                  <p className="text-sm text-red-500">{formErrors.cuisine}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preparation-time">
                  Preparation Time (minutes)
                </Label>
                <Input
                  id="preparation-time"
                  type="number"
                  value={foodFormData.preparation_time}
                  onChange={(e) =>
                    setFoodFormData({
                      ...foodFormData,
                      preparation_time: e.target.value,
                    })
                  }
                  placeholder="e.g., 30"
                  className={
                    formErrors.preparation_time ? "border-red-500" : ""
                  }
                />
                {formErrors.preparation_time && (
                  <p className="text-sm text-red-500">
                    {formErrors.preparation_time}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories per Serving</Label>
                <Input
                  id="calories"
                  type="number"
                  value={foodFormData.calories_per_serving}
                  onChange={(e) =>
                    setFoodFormData({
                      ...foodFormData,
                      calories_per_serving: e.target.value,
                    })
                  }
                  placeholder="e.g., 250"
                  className={
                    formErrors.calories_per_serving ? "border-red-500" : ""
                  }
                />
                {formErrors.calories_per_serving && (
                  <p className="text-sm text-red-500">
                    {formErrors.calories_per_serving}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergens">Allergens</Label>
                <Input
                  id="allergens"
                  value={foodFormData.allergens}
                  onChange={(e) =>
                    setFoodFormData({
                      ...foodFormData,
                      allergens: e.target.value,
                    })
                  }
                  placeholder="e.g., Nuts, Dairy, Gluten"
                />
              </div>
            </div>

            {/* Dietary Information */}
            <div className="space-y-4">
              <Label>Dietary Information</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vegetarian"
                    checked={foodFormData.is_vegetarian}
                    onCheckedChange={(checked) =>
                      setFoodFormData({
                        ...foodFormData,
                        is_vegetarian: !!checked,
                      })
                    }
                  />
                  <Label htmlFor="vegetarian">Vegetarian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vegan"
                    checked={foodFormData.is_vegan}
                    onCheckedChange={(checked) =>
                      setFoodFormData({ ...foodFormData, is_vegan: !!checked })
                    }
                  />
                  <Label htmlFor="vegan">Vegan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gluten-free"
                    checked={foodFormData.is_gluten_free}
                    onCheckedChange={(checked) =>
                      setFoodFormData({
                        ...foodFormData,
                        is_gluten_free: !!checked,
                      })
                    }
                  />
                  <Label htmlFor="gluten-free">Gluten Free</Label>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="available"
                checked={foodFormData.is_available}
                onCheckedChange={(checked) =>
                  setFoodFormData({ ...foodFormData, is_available: !!checked })
                }
              />
              <Label htmlFor="available">Available for ordering</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFoodForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  {editItem ? "Updating..." : "Creating..."}
                </>
              ) : editItem ? (
                "Update Food Item"
              ) : (
                "Create Food Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cuisine Form Dialog */}
      <Dialog open={showCuisineForm} onOpenChange={setShowCuisineForm}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>
            {editItem ? "Edit Cuisine" : "Add New Cuisine"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details to {editItem ? "update" : "create"} a cuisine
          </DialogDescription>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cuisine-name">Cuisine Name *</Label>
              <Input
                id="cuisine-name"
                value={cuisineFormData.name}
                onChange={(e) =>
                  setCuisineFormData({
                    ...cuisineFormData,
                    name: e.target.value,
                  })
                }
                placeholder="e.g., Italian, Chinese, Mexican"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuisine-description">Description *</Label>
              <Textarea
                id="cuisine-description"
                value={cuisineFormData.description}
                onChange={(e) =>
                  setCuisineFormData({
                    ...cuisineFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the cuisine style and characteristics"
                className={formErrors.description ? "border-red-500" : ""}
                rows={4}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500">{formErrors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuisine-image">Cuisine Image</Label>
              <Input
                id="cuisine-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCuisineFormData({ ...cuisineFormData, image: file });
                  }
                }}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500">
                Upload an image representing this cuisine (optional)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCuisineForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  {editItem ? "Updating..." : "Creating..."}
                </>
              ) : editItem ? (
                "Update Cuisine"
              ) : (
                "Create Cuisine"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Form Dialog */}
      <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>
            {editItem ? "Edit Category" : "Add New Category"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details to {editItem ? "update" : "create"} a food
            category
          </DialogDescription>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    name: e.target.value,
                  })
                }
                placeholder="e.g., Appetizers, Main Course, Desserts"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Description *</Label>
              <Textarea
                id="category-description"
                value={categoryFormData.description}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the category and what types of food it includes"
                className={formErrors.description ? "border-red-500" : ""}
                rows={4}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500">{formErrors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-cuisine">Cuisine *</Label>
              <Select
                value={categoryFormData.cuisine}
                onValueChange={(value) =>
                  setCategoryFormData({ ...categoryFormData, cuisine: value })
                }
              >
                <SelectTrigger
                  className={formErrors.cuisine ? "border-red-500" : ""}
                >
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
              {formErrors.cuisine && (
                <p className="text-sm text-red-500">{formErrors.cuisine}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-image">Category Image</Label>
              <Input
                id="category-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCategoryFormData({ ...categoryFormData, image: file });
                  }
                }}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500">
                Upload an image representing this category (optional)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCategoryForm(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  {editItem ? "Updating..." : "Creating..."}
                </>
              ) : editItem ? (
                "Update Category"
              ) : (
                "Create Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Food Detail Dialog */}
      <Dialog open={showFoodDetail} onOpenChange={setShowFoodDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {foodDetailLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <span>{selectedFood?.name || "Food Details"}</span>
              )}
            </DialogTitle>
            <DialogDescription>
              Detailed information about this food item
            </DialogDescription>
          </DialogHeader>

          {foodDetailLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading food details...</span>
            </div>
          ) : foodDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Food Images */}
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">Images</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {foodDetails.images && foodDetails.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {foodDetails.images.map((image, index) => (
                          <div
                            key={index}
                            className={`relative rounded-md overflow-hidden ${
                              index === 0 ? "col-span-2 h-48" : "h-24"
                            }`}
                          >
                            <img
                              src={image.image}
                              alt={`${foodDetails.name} image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {image.is_primary && (
                              <Badge
                                variant="default"
                                className="absolute top-2 right-2"
                              >
                                Primary
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-md">
                        <p className="text-gray-500">No images available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-y-3">
                        <div className="text-sm font-medium">Price:</div>
                        <div>
                          $
                          {typeof foodDetails.price === "number"
                            ? foodDetails.price.toFixed(2)
                            : parseFloat(foodDetails.price).toFixed(2)}
                        </div>

                        <div className="text-sm font-medium">Category:</div>
                        <div>
                          {foodDetails.category_name || "Uncategorized"}
                        </div>

                        <div className="text-sm font-medium">Cuisine:</div>
                        <div>{foodDetails.cuisine_name || "N/A"}</div>

                        <div className="text-sm font-medium">
                          Preparation Time:
                        </div>
                        <div>{foodDetails.preparation_time} mins</div>

                        <div className="text-sm font-medium">Availability:</div>
                        <div>
                          <Badge
                            variant={
                              foodDetails.is_available
                                ? "default"
                                : "destructive"
                            }
                          >
                            {foodDetails.is_available
                              ? "Available"
                              : "Unavailable"}
                          </Badge>
                        </div>

                        <div className="text-sm font-medium">Featured:</div>
                        <div>
                          <Badge
                            variant={
                              foodDetails.is_featured ? "default" : "outline"
                            }
                          >
                            {foodDetails.is_featured
                              ? "Featured"
                              : "Not Featured"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">
                        Dietary Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {foodDetails.is_vegetarian && (
                          <Badge
                            variant="outline"
                            className="text-green-600 bg-green-50"
                          >
                            Vegetarian
                          </Badge>
                        )}
                        {foodDetails.is_vegan && (
                          <Badge
                            variant="outline"
                            className="text-green-700 bg-green-50"
                          >
                            Vegan
                          </Badge>
                        )}
                        {foodDetails.is_gluten_free && (
                          <Badge
                            variant="outline"
                            className="text-amber-600 bg-amber-50"
                          >
                            Gluten-Free
                          </Badge>
                        )}
                      </div>

                      {foodDetails.spice_level && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">
                            Spice Level:
                          </p>
                          <Badge
                            variant="outline"
                            className={`
                            ${
                              foodDetails.spice_level === "mild"
                                ? "text-green-600 bg-green-50"
                                : foodDetails.spice_level === "medium"
                                ? "text-yellow-600 bg-yellow-50"
                                : foodDetails.spice_level === "hot"
                                ? "text-orange-600 bg-orange-50"
                                : "text-red-600 bg-red-50"
                            }
                          `}
                          >
                            {foodDetails.spice_level.replace("_", " ")}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Description */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm">
                    {foodDetails.description || "No description available."}
                  </p>
                </CardContent>
              </Card>

              {/* Ingredients and Allergens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">Ingredients</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {foodDetails.ingredients &&
                    foodDetails.ingredients.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {foodDetails.ingredients.map((ingredient, index) => (
                          <li key={index} className="text-sm">
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No ingredients listed.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">Allergens</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {foodDetails.allergens &&
                    foodDetails.allergens.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {foodDetails.allergens.map((allergen, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-red-600 bg-red-50"
                          >
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No allergens listed.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Ratings and Orders */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {typeof foodDetails.rating_average === "number"
                          ? foodDetails.rating_average.toFixed(1)
                          : "0.0"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Average Rating
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {foodDetails.total_reviews}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Reviews
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {foodDetails.total_orders}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Orders
                      </div>
                    </div>
                    {foodDetails.calories_per_serving && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">
                          {foodDetails.calories_per_serving}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Calories/Serving
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No food details available</p>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => handleEdit(selectedFood)}>
              Edit Food Item
            </Button>
            <Button onClick={() => setShowFoodDetail(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cuisine Detail Dialog */}
      <Dialog open={showCuisineDetail} onOpenChange={setShowCuisineDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {selectedCuisine ? (
                <>
                  <span>{selectedCuisine.name}</span>
                  <Badge
                    variant={
                      selectedCuisine.is_active ? "default" : "destructive"
                    }
                  >
                    {selectedCuisine.is_active ? "Active" : "Inactive"}
                  </Badge>
                </>
              ) : (
                "Cuisine Details"
              )}
            </DialogTitle>
            <DialogDescription>
              Detailed information about this cuisine
            </DialogDescription>
          </DialogHeader>

          {selectedCuisine && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cuisine Image */}
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">Image</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {selectedCuisine.image ? (
                      <div className="relative rounded-md overflow-hidden h-48">
                        <img
                          src={selectedCuisine.image}
                          alt={selectedCuisine.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-md">
                        <p className="text-gray-500">No image available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm font-medium">Name:</div>
                        <div className="text-sm">{selectedCuisine.name}</div>

                        <div className="text-sm font-medium">Status:</div>
                        <div>
                          <Badge
                            variant={
                              selectedCuisine.is_active
                                ? "default"
                                : "destructive"
                            }
                          >
                            {selectedCuisine.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="text-sm font-medium">Sort Order:</div>
                        <div className="text-sm">
                          {selectedCuisine.sort_order || "N/A"}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Description:
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedCuisine.description ||
                            "No description available"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => handleEdit(selectedCuisine)}
            >
              Edit Cuisine
            </Button>
            <Button onClick={() => setShowCuisineDetail(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Detail Dialog */}
      <Dialog open={showCategoryDetail} onOpenChange={setShowCategoryDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {selectedCategory ? (
                <>
                  <span>{selectedCategory.name}</span>
                  <Badge
                    variant={
                      selectedCategory.is_active ? "default" : "destructive"
                    }
                  >
                    {selectedCategory.is_active ? "Active" : "Inactive"}
                  </Badge>
                </>
              ) : (
                "Category Details"
              )}
            </DialogTitle>
            <DialogDescription>
              Detailed information about this category
            </DialogDescription>
          </DialogHeader>

          {selectedCategory && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Image */}
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">Image</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {selectedCategory.image ? (
                      <div className="relative rounded-md overflow-hidden h-48">
                        <img
                          src={selectedCategory.image}
                          alt={selectedCategory.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-md">
                        <p className="text-gray-500">No image available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm font-medium">Name:</div>
                        <div className="text-sm">{selectedCategory.name}</div>

                        <div className="text-sm font-medium">Cuisine:</div>
                        <div className="text-sm">
                          {selectedCategory.cuisine_name || "N/A"}
                        </div>

                        <div className="text-sm font-medium">Status:</div>
                        <div>
                          <Badge
                            variant={
                              selectedCategory.is_active
                                ? "default"
                                : "destructive"
                            }
                          >
                            {selectedCategory.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="text-sm font-medium">Sort Order:</div>
                        <div className="text-sm">
                          {selectedCategory.sort_order || "N/A"}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          Description:
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedCategory.description ||
                            "No description available"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => handleEdit(selectedCategory)}
            >
              Edit Category
            </Button>
            <Button onClick={() => setShowCategoryDetail(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodManagement;
