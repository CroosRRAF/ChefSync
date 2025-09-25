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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import {
  fetchCuisines,
  fetchFood,
  fetchFoodCategories,
  fetchFoods,
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
    name: '',
    description: '',
    category: '',
    cuisine: '',
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    is_available: true,
    preparation_time: '',
    calories_per_serving: '',
    allergens: ''
  });
  const [cuisineFormData, setCuisineFormData] = useState({
    name: '',
    description: '',
    image: null as File | null
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    cuisine: '',
    image: null as File | null
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

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "foods":
          const foodData = await fetchFoods({
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

  const handleAddNew = () => {
    setEditItem(null);
    setFormErrors({});
    
    // Reset form data
    setFoodFormData({
      name: '',
      description: '',
      category: '',
      cuisine: '',
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      is_available: true,
      preparation_time: '',
      calories_per_serving: '',
      allergens: ''
    });
    setCuisineFormData({
      name: '',
      description: '',
      image: null
    });
    setCategoryFormData({
      name: '',
      description: '',
      cuisine: '',
      image: null
    });
    
    switch (activeTab) {
      case "foods":
        setShowFoodForm(true);
        break;
      case "cuisines":
        setShowCuisineForm(true);
        break;
      case "categories":
        setShowCategoryForm(true);
        break;
    }
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    switch (activeTab) {
      case "foods":
        setFoodFormData({
          name: item.name || '',
          description: item.description || '',
          category: item.food_category?.id?.toString() || '',
          cuisine: item.food_category?.cuisine?.id?.toString() || '',
          is_vegetarian: item.is_vegetarian || false,
          is_vegan: item.is_vegan || false,
          is_gluten_free: item.is_gluten_free || false,
          is_available: item.is_available !== false,
          preparation_time: item.preparation_time?.toString() || '',
          calories_per_serving: item.calories_per_serving?.toString() || '',
          allergens: Array.isArray(item.allergens) ? item.allergens.join(', ') : (item.allergens || '')
        });
        setShowFoodForm(true);
        break;
      case "cuisines":
        setCuisineFormData({
          name: item.name || '',
          description: item.description || '',
          image: null
        });
        setShowCuisineForm(true);
        break;
      case "categories":
        setCategoryFormData({
          name: item.name || '',
          description: item.description || '',
          cuisine: item.cuisine?.id?.toString() || '',
          image: null
        });
        setShowCategoryForm(true);
        break;
    }
  };

  const validateFoodForm = () => {
    const errors: any = {};
    
    if (!foodFormData.name.trim()) {
      errors.name = 'Food name is required';
    }
    if (!foodFormData.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!foodFormData.category) {
      errors.category = 'Category is required';
    }
    if (!foodFormData.cuisine) {
      errors.cuisine = 'Cuisine is required';
    }
    if (foodFormData.preparation_time && isNaN(Number(foodFormData.preparation_time))) {
      errors.preparation_time = 'Preparation time must be a number';
    }
    if (foodFormData.calories_per_serving && isNaN(Number(foodFormData.calories_per_serving))) {
      errors.calories_per_serving = 'Calories must be a number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCuisineForm = () => {
    const errors: any = {};
    
    if (!cuisineFormData.name.trim()) {
      errors.name = 'Cuisine name is required';
    }
    if (!cuisineFormData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCategoryForm = () => {
    const errors: any = {};
    
    if (!categoryFormData.name.trim()) {
      errors.name = 'Category name is required';
    }
    if (!categoryFormData.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!categoryFormData.cuisine) {
      errors.cuisine = 'Cuisine is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (activeTab === 'foods' && validateFoodForm()) {
        // Handle food form submission
        const formData = new FormData();
        Object.entries(foodFormData).forEach(([key, value]) => {
          if (value !== null && value !== '') {
            formData.append(key, value.toString());
          }
        });
        
        if (editItem) {
          // Update existing food
          await fetch(`/api/food/foods/${editItem.id}/`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
          });
        } else {
          // Create new food
          await fetch('/api/food/foods/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
          });
        }
        
        toast({
          title: "Success",
          description: `Food item ${editItem ? 'updated' : 'created'} successfully`,
        });
      } else if (activeTab === 'cuisines' && validateCuisineForm()) {
        // Handle cuisine form submission
        const formData = new FormData();
        Object.entries(cuisineFormData).forEach(([key, value]) => {
          if (value !== null && value !== '') {
            formData.append(key, value.toString());
          }
        });
        
        if (editItem) {
          await fetch(`/api/food/cuisines/${editItem.id}/`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
          });
        } else {
          await fetch('/api/food/cuisines/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
          });
        }
        
        toast({
          title: "Success",
          description: `Cuisine ${editItem ? 'updated' : 'created'} successfully`,
        });
      } else if (activeTab === 'categories' && validateCategoryForm()) {
        // Handle category form submission
        const formData = new FormData();
        Object.entries(categoryFormData).forEach(([key, value]) => {
          if (value !== null && value !== '') {
            formData.append(key, value.toString());
          }
        });
        
        if (editItem) {
          await fetch(`/api/food/categories/${editItem.id}/`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
          });
        } else {
          await fetch('/api/food/categories/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
          });
        }
        
        toast({
          title: "Success",
          description: `Category ${editItem ? 'updated' : 'created'} successfully`,
        });
      }
      
      // Reset forms and close dialogs
      setShowFoodForm(false);
      setShowCuisineForm(false);
      setShowCategoryForm(false);
      setEditItem(null);
      setFormErrors({});
      setFoodFormData({
        name: '',
        description: '',
        category: '',
        cuisine: '',
        is_vegetarian: false,
        is_vegan: false,
        is_gluten_free: false,
        is_available: true,
        preparation_time: '',
        calories_per_serving: '',
        allergens: ''
      });
      setCuisineFormData({
        name: '',
        description: '',
        image: null
      });
      setCategoryFormData({
        name: '',
        description: '',
        cuisine: '',
        image: null
      });
      loadData();
    } catch (error) {
      console.error('Form submission error:', error);
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
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="link"
                        className="p-0"
                        onClick={() => handleFoodDetail(food)}
                      >
                        {food.name}
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="flex justify-between space-x-4">
                        {food.images && food.images.length > 0 ? (
                          <div className="w-16 h-16 rounded-md overflow-hidden">
                            <img
                              src={food.images[0].image}
                              alt={food.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                        <div className="space-y-1 flex-1">
                          <h4 className="text-sm font-semibold">{food.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {food.description || "No description available"}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {food.is_vegetarian && (
                              <Badge
                                variant="outline"
                                className="text-green-600 bg-green-50"
                              >
                                Vegetarian
                              </Badge>
                            )}
                            {food.is_vegan && (
                              <Badge
                                variant="outline"
                                className="text-green-700 bg-green-50"
                              >
                                Vegan
                              </Badge>
                            )}
                            {food.is_gluten_free && (
                              <Badge
                                variant="outline"
                                className="text-amber-600 bg-amber-50"
                              >
                                Gluten-Free
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="text-muted-foreground">Category:</div>
                        <div>{food.category_name || "Uncategorized"}</div>

                        <div className="text-muted-foreground">Cuisine:</div>
                        <div>{food.cuisine_name || "N/A"}</div>

                        <div className="text-muted-foreground">Prep Time:</div>
                        <div>{food.preparation_time} mins</div>

                        <div className="text-muted-foreground">Rating:</div>
                        <div>
                          {typeof food.rating_average === "number"
                            ? food.rating_average.toFixed(1)
                            : parseFloat(String(food.rating_average)).toFixed(
                                1
                              )}{" "}
                          ⭐ ({food.total_reviews} reviews)
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => handleFoodDetail(food)}
                      >
                        View Details
                      </Button>
                    </HoverCardContent>
                  </HoverCard>
                </TableCell>
                <TableCell>{food.category_name || "Uncategorized"}</TableCell>
                <TableCell>{food.cuisine_name || "N/A"}</TableCell>
                <TableCell>
                  <Badge
                    variant={food.is_available ? "default" : "destructive"}
                  >
                    {food.is_available ? "Available" : "Unavailable"}
                  </Badge>
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
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="link"
                        className="p-0"
                        onClick={() => handleCuisineDetail(cuisine)}
                      >
                        {cuisine.name}
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="flex justify-between space-x-4">
                        {cuisine.image ? (
                          <div className="w-16 h-16 rounded-md overflow-hidden">
                            <img
                              src={cuisine.image}
                              alt={cuisine.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                        <div className="space-y-1 flex-1">
                          <h4 className="text-sm font-semibold">
                            {cuisine.name}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {cuisine.description || "No description available"}
                          </p>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="text-muted-foreground">Status:</div>
                        <div>
                          <Badge
                            variant={
                              cuisine.is_active ? "default" : "destructive"
                            }
                            className="text-xs"
                          >
                            {cuisine.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="text-muted-foreground">Sort Order:</div>
                        <div>{cuisine.sort_order}</div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => handleCuisineDetail(cuisine)}
                      >
                        View Details
                      </Button>
                    </HoverCardContent>
                  </HoverCard>
                </TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {cuisine.description || "No description"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={cuisine.is_active ? "default" : "destructive"}
                  >
                    {cuisine.is_active ? "Active" : "Inactive"}
                  </Badge>
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
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="link"
                        className="p-0"
                        onClick={() => handleCategoryDetail(category)}
                      >
                        {category.name}
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="flex justify-between space-x-4">
                        {category.image ? (
                          <div className="w-16 h-16 rounded-md overflow-hidden">
                            <img
                              src={category.image}
                              alt={category.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                        <div className="space-y-1 flex-1">
                          <h4 className="text-sm font-semibold">
                            {category.name}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {category.description || "No description available"}
                          </p>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="text-muted-foreground">Cuisine:</div>
                        <div>{category.cuisine_name || "N/A"}</div>

                        <div className="text-muted-foreground">Status:</div>
                        <div>
                          <Badge
                            variant={
                              category.is_active ? "default" : "destructive"
                            }
                            className="text-xs"
                          >
                            {category.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="text-muted-foreground">Sort Order:</div>
                        <div>{category.sort_order}</div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => handleCategoryDetail(category)}
                      >
                        View Details
                      </Button>
                    </HoverCardContent>
                  </HoverCard>
                </TableCell>
                <TableCell>{category.cuisine_name || "N/A"}</TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {category.description || "No description"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={category.is_active ? "default" : "destructive"}
                  >
                    {category.is_active ? "Active" : "Inactive"}
                  </Badge>
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
            Fill in the details to {editItem ? "update" : "create"} a food item. Note: Chefs will set their own prices for this food item.
          </DialogDescription>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="food-name">Food Name *</Label>
                <Input
                  id="food-name"
                  value={foodFormData.name}
                  onChange={(e) => setFoodFormData({...foodFormData, name: e.target.value})}
                  placeholder="Enter food name"
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="food-category">Category *</Label>
                <Select 
                  value={foodFormData.category} 
                  onValueChange={(value) => setFoodFormData({...foodFormData, category: value})}
                >
                  <SelectTrigger className={formErrors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && <p className="text-sm text-red-500">{formErrors.category}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="food-description">Description *</Label>
              <Textarea
                id="food-description"
                value={foodFormData.description}
                onChange={(e) => setFoodFormData({...foodFormData, description: e.target.value})}
                placeholder="Describe the food item"
                className={formErrors.description ? "border-red-500" : ""}
                rows={3}
              />
              {formErrors.description && <p className="text-sm text-red-500">{formErrors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="food-cuisine">Cuisine *</Label>
                <Select 
                  value={foodFormData.cuisine} 
                  onValueChange={(value) => setFoodFormData({...foodFormData, cuisine: value})}
                >
                  <SelectTrigger className={formErrors.cuisine ? "border-red-500" : ""}>
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
                {formErrors.cuisine && <p className="text-sm text-red-500">{formErrors.cuisine}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preparation-time">Preparation Time (minutes)</Label>
                <Input
                  id="preparation-time"
                  type="number"
                  value={foodFormData.preparation_time}
                  onChange={(e) => setFoodFormData({...foodFormData, preparation_time: e.target.value})}
                  placeholder="e.g., 30"
                  className={formErrors.preparation_time ? "border-red-500" : ""}
                />
                {formErrors.preparation_time && <p className="text-sm text-red-500">{formErrors.preparation_time}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories per Serving</Label>
                <Input
                  id="calories"
                  type="number"
                  value={foodFormData.calories_per_serving}
                  onChange={(e) => setFoodFormData({...foodFormData, calories_per_serving: e.target.value})}
                  placeholder="e.g., 250"
                  className={formErrors.calories_per_serving ? "border-red-500" : ""}
                />
                {formErrors.calories_per_serving && <p className="text-sm text-red-500">{formErrors.calories_per_serving}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergens">Allergens</Label>
                <Input
                  id="allergens"
                  value={foodFormData.allergens}
                  onChange={(e) => setFoodFormData({...foodFormData, allergens: e.target.value})}
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
                    onCheckedChange={(checked) => setFoodFormData({...foodFormData, is_vegetarian: !!checked})}
                  />
                  <Label htmlFor="vegetarian">Vegetarian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vegan"
                    checked={foodFormData.is_vegan}
                    onCheckedChange={(checked) => setFoodFormData({...foodFormData, is_vegan: !!checked})}
                  />
                  <Label htmlFor="vegan">Vegan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gluten-free"
                    checked={foodFormData.is_gluten_free}
                    onCheckedChange={(checked) => setFoodFormData({...foodFormData, is_gluten_free: !!checked})}
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
                onCheckedChange={(checked) => setFoodFormData({...foodFormData, is_available: !!checked})}
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
              ) : (
                editItem ? "Update Food Item" : "Create Food Item"
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
                onChange={(e) => setCuisineFormData({...cuisineFormData, name: e.target.value})}
                placeholder="e.g., Italian, Chinese, Mexican"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuisine-description">Description *</Label>
              <Textarea
                id="cuisine-description"
                value={cuisineFormData.description}
                onChange={(e) => setCuisineFormData({...cuisineFormData, description: e.target.value})}
                placeholder="Describe the cuisine style and characteristics"
                className={formErrors.description ? "border-red-500" : ""}
                rows={4}
              />
              {formErrors.description && <p className="text-sm text-red-500">{formErrors.description}</p>}
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
                    setCuisineFormData({...cuisineFormData, image: file});
                  }
                }}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500">Upload an image representing this cuisine (optional)</p>
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
              ) : (
                editItem ? "Update Cuisine" : "Create Cuisine"
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
            Fill in the details to {editItem ? "update" : "create"} a food category
          </DialogDescription>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                placeholder="e.g., Appetizers, Main Course, Desserts"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Description *</Label>
              <Textarea
                id="category-description"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                placeholder="Describe the category and what types of food it includes"
                className={formErrors.description ? "border-red-500" : ""}
                rows={4}
              />
              {formErrors.description && <p className="text-sm text-red-500">{formErrors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-cuisine">Cuisine *</Label>
              <Select 
                value={categoryFormData.cuisine} 
                onValueChange={(value) => setCategoryFormData({...categoryFormData, cuisine: value})}
              >
                <SelectTrigger className={formErrors.cuisine ? "border-red-500" : ""}>
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
              {formErrors.cuisine && <p className="text-sm text-red-500">{formErrors.cuisine}</p>}
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
                    setCategoryFormData({...categoryFormData, image: file});
                  }
                }}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500">Upload an image representing this category (optional)</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  {editItem ? "Updating..." : "Creating..."}
                </>
              ) : (
                editItem ? "Update Category" : "Create Category"
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
